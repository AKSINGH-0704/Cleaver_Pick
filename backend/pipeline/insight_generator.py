"""
Model insight generator — GPT-4o-mini primary, Groq fallback.
"""
import logging
from services.openai_client import call_openai
from services.groq_client import call_groq, GROQ_FAST_MODEL

logger = logging.getLogger(__name__)

MODEL_DISPLAY = {
    "gpt":    "GPT-4o-mini",
    "gemini": "Gemini 2.5 Flash",
    "groq":   "Llama 3.3 70B",
}

_SYSTEM = "You write precise one-sentence performance analyses for AI model evaluations. No preamble."


async def generate_model_insight(
    model_key: str,
    domain: str,
    eval_breakdown: dict,
    agreement_score: float,
    verification_score: float,
) -> str:
    display_name = MODEL_DISPLAY.get(model_key, model_key)
    accuracy     = eval_breakdown.get("accuracy",     5)
    relevance    = eval_breakdown.get("relevance",    5)
    completeness = eval_breakdown.get("completeness", 5)
    clarity      = eval_breakdown.get("clarity",      5)

    prompt = (
        f"In exactly one sentence (max 25 words), describe the key strength or weakness of {display_name}'s "
        f"response to a {domain} query based on these scores — "
        f"accuracy: {accuracy}/10, relevance: {relevance}/10, completeness: {completeness}/10, "
        f"clarity: {clarity}/10, cross-model agreement: {agreement_score:.0%}, "
        f"fact verification rate: {verification_score:.0%}. "
        f"Be specific and analytical. Do not mention the model's name."
    )

    for caller, kwargs in [
        (call_openai, {"model": "gpt-4o-mini",  "system": _SYSTEM, "max_tokens": 60}),
        (call_groq,   {"model": GROQ_FAST_MODEL, "system": _SYSTEM, "max_tokens": 60}),
    ]:
        try:
            insight = await caller(prompt, **kwargs)
            insight = insight.strip().strip('"').strip("'")
            if not insight.endswith('.'):
                insight += '.'
            logger.info("insight for %s: %s", model_key, insight[:80])
            return insight
        except Exception as exc:
            logger.warning("insight_generator %s failed for %s: %s", caller.__name__, model_key, exc)

    return f"Scored {accuracy}/10 accuracy with {verification_score:.0%} fact verification rate."
