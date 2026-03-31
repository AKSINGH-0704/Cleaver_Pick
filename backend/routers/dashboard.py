import logging
from fastapi import APIRouter
from services.supabase_client import get_analytics_full
from services.local_db import get_local

router = APIRouter()
logger = logging.getLogger(__name__)

MODEL_LABELS = {"gpt": "GPT-4o-mini", "gemini": "Gemini 2.5 Flash"}


@router.get("/dashboard")
async def get_dashboard():
    """Aggregate stats from all evaluations. Reads from Supabase or local SQLite fallback."""
    try:
        rows = await get_analytics_full(limit=500)
    except Exception as exc:
        logger.error("dashboard: get_analytics_full failed — %s", exc)
        rows = []

    # If Supabase returned nothing, use local store
    if not rows:
        try:
            local = await get_local(limit=500)
            rows = [
                {
                    "id":         r.get("id"),
                    "created_at": r.get("created_at"),
                    "prompt":     r.get("prompt"),
                    "domain":     r.get("domain"),
                    "intent":     r.get("intent"),
                    "best_model": r.get("best_model"),
                    "best_score": r.get("best_score"),
                }
                for r in local
            ]
        except Exception as exc:
            logger.error("dashboard: local_db fallback failed — %s", exc)
            rows = []

    if not rows:
        return {
            "total": 0, "avg_r": 0,
            "top_model": None, "top_model_label": None,
            "top_domain": None,
            "win_counts": {}, "domain_counts": {},
            "leaderboard": [], "score_history": [],
            "recent_evaluations": [],
        }

    total = len(rows)
    avg_r = sum(r.get("best_score") or 0 for r in rows) / total

    # Model win counts
    win_counts: dict[str, int] = {}
    for r in rows:
        m = r.get("best_model")
        if m:
            win_counts[m] = win_counts.get(m, 0) + 1

    top_model = max(win_counts, key=win_counts.get) if win_counts else None

    # Domain distribution
    domain_counts: dict[str, int] = {}
    for r in rows:
        d = r.get("domain") or "general"
        domain_counts[d] = domain_counts.get(d, 0) + 1

    top_domain = max(domain_counts, key=domain_counts.get) if domain_counts else None

    # Domain leaderboard
    domain_data: dict[str, dict] = {}
    for r in rows:
        d = r.get("domain") or "general"
        if d not in domain_data:
            domain_data[d] = {"models": {}, "scores": [], "total": 0}
        domain_data[d]["total"] += 1
        score = r.get("best_score") or 0
        domain_data[d]["scores"].append(score)
        m = r.get("best_model")
        if m:
            domain_data[d]["models"][m] = domain_data[d]["models"].get(m, 0) + 1

    leaderboard = []
    for domain, data in sorted(domain_data.items(), key=lambda x: -x[1]["total"]):
        top_m = max(data["models"], key=data["models"].get) if data["models"] else None
        total_d = data["total"]
        win_rate = round(data["models"].get(top_m, 0) / total_d * 100, 1) if top_m else 0
        avg_r_d  = round(sum(data["scores"]) / len(data["scores"]), 4) if data["scores"] else 0
        leaderboard.append({
            "domain":          domain,
            "top_model":       top_m,
            "top_model_label": MODEL_LABELS.get(top_m, top_m) if top_m else None,
            "win_rate":        win_rate,
            "avg_r":           avg_r_d,
            "total":           total_d,
            "limited_data":    total_d < 3,
            "model_wins":      data["models"],
        })

    # Score history (oldest first, last 30)
    score_history = [
        {
            "n":      i + 1,
            "score":  round((r.get("best_score") or 0) * 100, 1),
            "domain": r.get("domain"),
            "model":  r.get("best_model"),
        }
        for i, r in enumerate(reversed(rows[:30]))
    ]

    # Recent evaluations (last 10, newest first)
    recent_evaluations = [
        {
            "prompt":     (r.get("prompt") or "")[:80],
            "best_model": r.get("best_model"),
            "best_score": r.get("best_score"),
            "domain":     r.get("domain"),
            "created_at": r.get("created_at"),
        }
        for r in rows[:10]
    ]

    return {
        "total":               total,
        "avg_r":               round(avg_r, 4),
        "top_model":           top_model,
        "top_model_label":     MODEL_LABELS.get(top_model, top_model) if top_model else None,
        "top_domain":          top_domain,
        "win_counts":          win_counts,
        "domain_counts":       domain_counts,
        "leaderboard":         leaderboard,
        "score_history":       score_history,
        "recent_evaluations":  recent_evaluations,
    }
