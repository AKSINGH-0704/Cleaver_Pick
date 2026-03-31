from fastapi import APIRouter
from services.supabase_client import get_history, get_analytics
from services.local_db import get_local

router = APIRouter()


@router.get("/history")
async def history(
    limit: int = 50,
    offset: int = 0,
    domain: str | None = None,
    search: str | None = None,
):
    rows = await get_history(limit=limit, offset=offset, domain=domain, search=search)

    # Fall back to local store if Supabase returned nothing
    if not rows:
        local = await get_local(limit=limit, offset=offset, domain=domain, search=search)
        rows = [
            {
                "id":              r.get("id"),
                "created_at":      r.get("created_at"),
                "prompt":          r.get("prompt"),
                "domain":          r.get("domain"),
                "intent":          r.get("intent"),
                "best_model":      r.get("best_model"),
                "best_score":      r.get("best_score"),
                "score_breakdown": r.get("score_breakdown"),
                "best_response":   r.get("best_response", ""),
            }
            for r in local
        ]

    return {"evaluations": rows, "count": len(rows)}


@router.get("/analytics")
async def analytics():
    data = await get_analytics()
    return {"data": data}
