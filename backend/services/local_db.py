"""
Local SQLite store — primary persistence layer.
Used as the main store when Supabase is unavailable (table missing, quota, etc.).
All writes go here first; Supabase is attempted as a secondary best-effort sync.
"""
import asyncio
import json
import logging
import os
import sqlite3
import uuid
from datetime import datetime, timezone
from pathlib import Path

logger = logging.getLogger(__name__)

_DB_PATH = Path(__file__).parent.parent / "data" / "evaluations.db"


def _get_conn() -> sqlite3.Connection:
    _DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(str(_DB_PATH), check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.execute("""
        CREATE TABLE IF NOT EXISTS evaluations (
            id              TEXT PRIMARY KEY,
            created_at      TEXT NOT NULL,
            prompt          TEXT,
            domain          TEXT,
            intent          TEXT,
            best_model      TEXT,
            best_score      REAL,
            score_breakdown TEXT,
            best_response   TEXT,
            all_responses   TEXT,
            is_benchmark    INTEGER DEFAULT 0
        )
    """)
    conn.commit()
    return conn


# ── Sync helpers (run via asyncio.to_thread) ──────────────────────────────────

def _save_sync(record: dict) -> None:
    conn = _get_conn()
    try:
        conn.execute("""
            INSERT OR REPLACE INTO evaluations
            (id, created_at, prompt, domain, intent, best_model, best_score,
             score_breakdown, best_response, all_responses, is_benchmark)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            record.get("id") or str(uuid.uuid4()),
            record.get("created_at") or datetime.now(timezone.utc).isoformat(),
            record.get("prompt"),
            record.get("domain"),
            record.get("intent"),
            record.get("best_model"),
            record.get("best_score"),
            json.dumps(record.get("score_breakdown")),
            record.get("best_response", ""),
            json.dumps(record.get("all_responses")),
            int(record.get("is_benchmark", 0)),
        ))
        conn.commit()
        logger.debug("local_db: saved evaluation id=%s", record.get("id"))
    finally:
        conn.close()


def _get_sync(
    limit: int = 500,
    offset: int = 0,
    domain: str | None = None,
    search: str | None = None,
) -> list[dict]:
    conn = _get_conn()
    try:
        q = "SELECT * FROM evaluations"
        params: list = []
        conds: list[str] = []
        if domain and domain not in ("all", ""):
            conds.append("domain = ?")
            params.append(domain)
        if search:
            conds.append("prompt LIKE ?")
            params.append(f"%{search}%")
        if conds:
            q += " WHERE " + " AND ".join(conds)
        q += " ORDER BY created_at DESC LIMIT ? OFFSET ?"
        params.extend([limit, offset])

        rows = conn.execute(q, params).fetchall()
        result = []
        for row in rows:
            d = dict(row)
            for field in ("score_breakdown", "all_responses"):
                raw = d.get(field)
                if raw:
                    try:
                        d[field] = json.loads(raw)
                    except Exception:
                        pass
            result.append(d)
        return result
    finally:
        conn.close()


# ── Async API ──────────────────────────────────────────────────────────────────

async def save_local(record: dict) -> None:
    await asyncio.to_thread(_save_sync, record)


async def get_local(
    limit: int = 500,
    offset: int = 0,
    domain: str | None = None,
    search: str | None = None,
) -> list[dict]:
    return await asyncio.to_thread(_get_sync, limit, offset, domain, search)
