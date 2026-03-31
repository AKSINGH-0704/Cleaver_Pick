"""
Supabase client + local SQLite fallback.
- Every evaluation write goes to local_db first (always reliable).
- Supabase is attempted as a secondary sync (best-effort).
- Reads: try Supabase → fall back to local_db if empty or unavailable.
"""
import logging
import os

from supabase import create_client, Client
from services.local_db import save_local, get_local

logger = logging.getLogger(__name__)

_read_client: Client | None = None
_write_client: Client | None = None


def _get_read_client() -> Client | None:
    global _read_client
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_ANON_KEY")
    if _read_client is None and url and key:
        _read_client = create_client(url, key)
    return _read_client


def _get_write_client() -> Client | None:
    global _write_client
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_KEY") or os.getenv("SUPABASE_ANON_KEY")
    if _write_client is None and url and key:
        _write_client = create_client(url, key)
    return _write_client


async def save_evaluation(
    prompt: str,
    domain: str,
    intent: str,
    model_scores: list,
    best_model: str,
) -> None:
    best = next((m for m in model_scores if m["model"] == best_model), model_scores[0])

    local_record = {
        "prompt":         prompt,
        "domain":         domain,
        "intent":         intent,
        "best_model":     best_model,
        "best_score":     best["composite"]["R"],
        "score_breakdown": best["composite"]["components"],
        "best_response":  best.get("response", ""),
        "all_responses":  {
            m["model"]: {"text": m.get("response", ""), "composite": m["composite"]}
            for m in model_scores
        },
    }

    # Always save locally first
    await save_local(local_record)
    logger.info("save_evaluation: persisted to local_db")

    # Also try Supabase (best-effort)
    client = _get_write_client()
    if client:
        try:
            sb_record = {k: v for k, v in local_record.items()
                         if k not in ("best_response",)}
            client.table("evaluations").insert(sb_record).execute()
            logger.info("save_evaluation: synced to Supabase")
        except Exception as exc:
            logger.warning("save_evaluation: Supabase sync failed (non-fatal) — %s", exc)


async def get_history(limit: int = 20, offset: int = 0,
                      domain: str | None = None, search: str | None = None) -> list:
    # Try Supabase
    client = _get_read_client()
    if client:
        try:
            q = (
                client.table("evaluations")
                .select("id, created_at, prompt, domain, intent, best_model, best_score, score_breakdown, all_responses")
                .order("created_at", desc=True)
                .range(offset, offset + limit - 1)
            )
            result = q.execute()
            rows = result.data or []
            if rows:
                # Extract best_response from all_responses JSON
                for row in rows:
                    all_resp = row.pop("all_responses", None) or {}
                    bm = row.get("best_model", "")
                    br = all_resp.get(bm, {})
                    row["best_response"] = br.get("text", "") if isinstance(br, dict) else ""
                return rows
        except Exception as exc:
            logger.warning("get_history: Supabase read failed — %s", exc)

    # Fall back to local_db
    rows = await get_local(limit=limit, offset=offset, domain=domain, search=search)
    # Ensure best_response is included
    for row in rows:
        if "best_response" not in row:
            all_resp = row.get("all_responses") or {}
            bm = row.get("best_model", "")
            br = all_resp.get(bm, {}) if isinstance(all_resp, dict) else {}
            row["best_response"] = br.get("text", "") if isinstance(br, dict) else ""
    return rows


async def get_analytics() -> list:
    client = _get_read_client()
    if client:
        try:
            result = (
                client.table("evaluations")
                .select("best_model, best_score, domain, created_at")
                .order("created_at", desc=True)
                .limit(100)
                .execute()
            )
            if result.data:
                return result.data
        except Exception as exc:
            logger.warning("get_analytics: Supabase read failed — %s", exc)

    rows = await get_local(limit=100)
    return [{"best_model": r.get("best_model"), "best_score": r.get("best_score"),
             "domain": r.get("domain"), "created_at": r.get("created_at")} for r in rows]


async def get_analytics_full(limit: int = 500) -> list:
    client = _get_read_client()
    if client:
        try:
            result = (
                client.table("evaluations")
                .select("id, created_at, prompt, domain, intent, best_model, best_score")
                .order("created_at", desc=True)
                .limit(limit)
                .execute()
            )
            if result.data:
                return result.data
        except Exception as exc:
            logger.warning("get_analytics_full: Supabase read failed — %s", exc)

    rows = await get_local(limit=limit)
    return [{"id": r.get("id"), "created_at": r.get("created_at"),
             "prompt": r.get("prompt"), "domain": r.get("domain"),
             "intent": r.get("intent"), "best_model": r.get("best_model"),
             "best_score": r.get("best_score")} for r in rows]
