import logging
from fastapi import APIRouter
from sse_starlette.sse import EventSourceResponse
from models.schemas import EvaluateRequest
from pipeline.intent import classify_intent
from pipeline.prompt_optimizer import optimize_prompt, get_domain_description, DOMAIN_TEMPLATES
from pipeline.dispatcher import dispatch_to_models, select_models
from pipeline.agreement import compute_agreement
from pipeline.verification import run_verification, is_time_sensitive
from pipeline.evaluator import evaluate_response
from pipeline.consistency import compute_consistency
from pipeline.insight_generator import generate_model_insight
from pipeline.scorer import compute_composite, DOMAIN_PRESETS, DEFAULT_WEIGHTS
from services.supabase_client import save_evaluation
import json
import asyncio

router = APIRouter()
logger = logging.getLogger(__name__)


def sse_event(stage: int, message: str, progress: int):
    return {"event": "progress",
            "data": json.dumps({"stage": stage, "message": message, "progress": progress})}


@router.post("/evaluate")
async def evaluate(request: EvaluateRequest):
    async def pipeline():
        raw_prompt = request.prompt
        requested_domain = (request.domain or "auto").strip().lower()
        history = request.conversation_history or []

        # ── Stage 0: Intent + domain classification ──────────────────────────
        yield sse_event(0, "Classifying intent and domain...", 5)
        try:
            classification = await classify_intent(raw_prompt)
            intent          = classification["intent"]
            detected_domain = classification["domain"]
            logger.info("Stage 0 — intent=%s detected_domain=%s", intent, detected_domain)
        except Exception as exc:
            logger.error("Stage 0 (intent) failed: %s", exc, exc_info=True)
            intent = "general"
            detected_domain = "general"

        # Resolve applied domain: "auto" → use classifier; anything else → honour the override
        if requested_domain in ("auto", "", "none"):
            applied_domain = detected_domain
            domain_source  = "auto-detected"
        else:
            applied_domain = requested_domain
            domain_source  = "manually set"

        yield sse_event(0, f"Intent: {intent} · Domain: {applied_domain} ({domain_source})", 10)

        # Time-sensitivity check (pure, no I/O)
        time_sensitive, time_disclaimer = is_time_sensitive(raw_prompt)

        # ── Prompt optimisation ──────────────────────────────────────────────
        optimized_prompt, template_used = optimize_prompt(raw_prompt, applied_domain)
        optimization_applied = template_used is not None
        logger.info(
            "Prompt optimisation: domain=%s applied=%s optimized_len=%d",
            applied_domain, optimization_applied, len(optimized_prompt),
        )

        # Domain weights
        domain_weights = request.custom_weights or DOMAIN_PRESETS.get(applied_domain, DEFAULT_WEIGHTS)

        # ── Stage 1: Dispatch (send optimised prompt to models) ──────────────
        models = select_models(intent)
        yield sse_event(1, f"Querying {len(models)} models in parallel...", 15)
        try:
            responses = await dispatch_to_models(optimized_prompt, models)
            valid = {k: v for k, v in responses.items() if v.get("text")}
            logger.info("Stage 1 — valid responses: %s", list(valid.keys()))
        except Exception as exc:
            logger.error("Stage 1 (dispatch) failed: %s", exc, exc_info=True)
            yield {"event": "error", "data": json.dumps({"message": f"Model dispatch failed: {exc}"})}
            return

        if not valid:
            yield {"event": "error", "data": json.dumps({"message": "All model calls failed"})}
            return

        yield sse_event(1, f"Received {len(valid)} responses", 30)

        # ── Stage 2: Agreement ───────────────────────────────────────────────
        yield sse_event(2, "Computing semantic agreement...", 35)
        try:
            agreement = await compute_agreement(valid)
            logger.info("Stage 2 — agreement score: %.4f", agreement["score"])
        except Exception as exc:
            logger.error("Stage 2 (agreement) failed: %s", exc, exc_info=True)
            agreement = {"score": 0.0, "pairwise": {}, "matrix": [], "model_names": list(valid.keys())}
        yield sse_event(2, f"Agreement score: {agreement['score']:.2f}", 45)

        # ── Stage 3: Verification ────────────────────────────────────────────
        yield sse_event(3, "Extracting and verifying claims...", 50)
        v_results = {}
        for name, resp in valid.items():
            try:
                v_results[name] = await run_verification(resp["text"])
                logger.info("Stage 3 — verified %s: score=%.4f", name, v_results[name]["score"])
            except Exception as exc:
                logger.error("Stage 3 (verification) failed for %s: %s", name, exc, exc_info=True)
                v_results[name] = {"score": 0.5, "claims": [], "total": 0,
                                   "verified": 0, "partial": 0, "not_found": 0}
        yield sse_event(3, "Claims verified against Wikipedia", 65)

        # ── Stage 4: Evaluation ──────────────────────────────────────────────
        yield sse_event(4, "LLM judge scoring responses...", 70)
        e_results = {}
        _DEFAULT_E = {
            "score": 0.5,
            "breakdown": {"accuracy": 5, "relevance": 5, "completeness": 5, "clarity": 5},
            "justification": "Evaluation failed — using default score.",
            "evaluator_model": "gpt-4o",
        }
        try:
            e_tasks = [evaluate_response(raw_prompt, valid[n]["text"], n) for n in valid]
            e_list  = await asyncio.gather(*e_tasks, return_exceptions=True)
            for name, result in zip(valid.keys(), e_list):
                if isinstance(result, Exception):
                    logger.error("Stage 4 failed for %s: %s", name, result)
                    e_results[name] = _DEFAULT_E
                else:
                    e_results[name] = result
                    logger.info("Stage 4 — evaluated %s: score=%.4f", name, result["score"])
        except Exception as exc:
            logger.error("Stage 4 (evaluation) failed entirely: %s", exc, exc_info=True)
            for name in valid:
                e_results[name] = _DEFAULT_E
        yield sse_event(4, "Evaluation complete", 80)

        # ── Stage 5: Consistency + Insights (concurrent) ────────────────────
        yield sse_event(5, "Generating insights & checking consistency...", 85)

        c_tasks = [
            compute_consistency(raw_prompt, valid[n]["text"], history)
            for n in valid
        ]
        insight_tasks = [
            generate_model_insight(
                model_key=name,
                domain=applied_domain,
                eval_breakdown=e_results[name].get("breakdown", {}),
                agreement_score=agreement["score"],
                verification_score=v_results[name]["score"],
            )
            for name in valid
        ]

        try:
            c_list, i_list = await asyncio.gather(
                asyncio.gather(*c_tasks, return_exceptions=True),
                asyncio.gather(*insight_tasks, return_exceptions=True),
            )
        except Exception as exc:
            logger.error("Stage 5 gather failed: %s", exc, exc_info=True)
            c_list  = [{"score": 1.0, "drift": 0.0, "turns": 0}] * len(valid)
            i_list  = [""] * len(valid)

        c_results = {}
        model_insights = {}
        for name, c_res, i_res in zip(valid.keys(), c_list, i_list):
            c_results[name] = c_res if not isinstance(c_res, Exception) else {"score": 1.0, "drift": 0.0, "turns": 0}
            model_insights[name] = i_res if not isinstance(i_res, Exception) else ""
            logger.info("Stage 5 — consistency %s: %.4f  insight: %s", name, c_results[name]["score"], str(i_res)[:60])

        # ── Stage 6: Scoring ─────────────────────────────────────────────────
        yield sse_event(6, "Computing reliability scores...", 90)
        model_scores = []
        try:
            for name in valid:
                composite = compute_composite(
                    A=agreement["score"],
                    V=v_results[name]["score"],
                    E=e_results[name]["score"],
                    C=c_results[name]["score"],
                    domain=applied_domain,
                    custom_weights=request.custom_weights,
                )
                model_scores.append({
                    "model":        name,
                    "response":     valid[name]["text"],
                    "composite":    composite,
                    "agreement":    agreement,
                    "verification": v_results[name],
                    "evaluation":   e_results[name],
                    "consistency":  c_results[name],
                    "insight":      model_insights.get(name, ""),
                })
                logger.info("Stage 6 — %s: R=%.4f", name, composite["R"])
        except Exception as exc:
            logger.error("Stage 6 (scoring) failed: %s", exc, exc_info=True)
            yield {"event": "error", "data": json.dumps({"message": f"Scoring failed: {exc}"})}
            return

        model_scores.sort(key=lambda x: x["composite"]["R"], reverse=True)
        best = model_scores[0]
        logger.info("Pipeline complete — winner: %s (R=%.4f)", best["model"], best["composite"]["R"])

        # ── Persist ──────────────────────────────────────────────────────────
        try:
            await save_evaluation(raw_prompt, applied_domain, intent, model_scores, best["model"])
        except Exception as exc:
            logger.error("Supabase save failed (non-fatal): %s", exc, exc_info=True)

        yield {"event": "result", "data": json.dumps({
            "best_model":    best["model"],
            "best_response": best["response"],
            "best_score":    best["composite"],
            "all_models":    model_scores,
            "agreement_matrix": agreement,
            "intent":        intent,
            # Domain fields
            "detected_domain":   detected_domain,
            "applied_domain":    applied_domain,
            "domain_source":     domain_source,
            "domain":            applied_domain,   # kept for backwards compat
            # Prompt optimisation fields
            "optimized_prompt":          optimized_prompt,
            "optimization_applied":      optimization_applied,
            "optimization_description":  get_domain_description(applied_domain),
            "domain_weights":            domain_weights,
            "model_insights":            model_insights,
            # Time-sensitivity
            "time_sensitive":            time_sensitive,
            "time_sensitive_disclaimer": time_disclaimer,
        })}

    return EventSourceResponse(pipeline())
