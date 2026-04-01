import json
import re
import asyncio
import logging
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
from services.openai_client import call_openai
from services.hf_embeddings import get_embeddings
from services.wikipedia_client import search_wikipedia

logger = logging.getLogger(__name__)

# ── Time-sensitivity detection ────────────────────────────────────────────────

_TIME_PATTERNS = [
    r'\bcurrent(ly)?\b',
    r'\bright now\b',
    r'\btoday\b',
    r'\bthis (week|month|year)\b',
    r'\brecently\b',
    r'\blatest\b',
    r'who (is|are) (the )?(current |now )?(president|prime minister|ceo|chancellor|king|queen|leader|head|director|secretary|governor|mayor)',
    r'what is the (current |latest )?(price|rate|value|status|stock|score|ranking)',
    r'who (won|leads|runs|owns|controls|holds) (the |a )?',
    r'\b202[5-9]\b',
    r'\b203\d\b',
    # Sports records, titles, and championships — change frequently
    r'\b\d+[\s-]time\b',                                         # "17-time", "17 time"
    r'\b(world |wwe |ufc |nba |nfl |nhl |mlb |ipl )?(champion|championship|title|belt|record)\b',
    r'\b(how many|total|number of)\b.{0,40}\b(titles|championships|wins|belts|reigns|medals|trophies)\b',
    r'\b(current|reigning|defending) (champion|titleholder|record holder)\b',
    r'\b(wrestlemania|summerslam|royal rumble|survivor series)\b', # WWE PPV events
    r'\b(super bowl|world series|nba finals|stanley cup|champions league final)\b',
    r'\b(world record|all.?time record|record holder|most (titles|wins|championships))\b',
    r'\b(standings|leaderboard|rankings|top (player|team|scorer))\b',
    r'\b(season|roster|transfer|signed|traded|drafted)\b',        # Ongoing sports context
    r'\b(box office|grossed|earned|revenue).*(202[4-9]|latest|recent|now)\b',
    r'\b(alive|still (alive|active|playing|competing|working))\b',# "is X still alive/active"
]

_TIME_DISCLAIMER = (
    "This query may involve recent events or records that have changed after the models\u2019 "
    "training data cutoff (October 2023). The AI models may not reflect the latest real-world "
    "updates. Scores reflect internal consistency and knowledge up to that cutoff, not current accuracy."
)


def is_time_sensitive(prompt: str) -> tuple[bool, str]:
    """Returns (is_sensitive, disclaimer_text). Pure — no I/O."""
    lower = prompt.lower()
    for pat in _TIME_PATTERNS:
        if re.search(pat, lower):
            return True, _TIME_DISCLAIMER
    return False, ""


async def extract_claims(text: str) -> list[str]:
    """Use GPT-4o-mini in JSON mode to extract verifiable factual claims."""
    system = "You extract factual claims from text. Return ONLY valid JSON, no other text."
    prompt = f"""Extract specific, verifiable factual claims from this text.
Return a JSON object: {{"claims": ["claim 1", "claim 2", ...]}}
Rules:
- Each claim must be a single, atomic, checkable statement
- Focus on dates, names, numbers, events, cause-effect relationships
- Ignore opinions, hedging, subjective or evaluative statements
- Maximum 5 claims

Text: {text[:2000]}"""

    try:
        result = await call_openai(prompt, model="gpt-4o-mini", system=system, json_mode=True, max_tokens=300)
        parsed = json.loads(result)
        claims = parsed.get("claims", [])
        if not isinstance(claims, list):
            logger.warning("extract_claims: 'claims' field is not a list, got %s", type(claims))
            return []
        return [c for c in claims if isinstance(c, str) and c.strip()][:5]
    except json.JSONDecodeError as exc:
        logger.warning("extract_claims: JSON parse failed — %s", exc)
        return []
    except Exception as exc:
        logger.error("extract_claims: OpenAI call failed — %s", exc, exc_info=True)
        return []


async def _safe_search_wikipedia(claim: str) -> dict | None:
    """Wikipedia search with per-claim exception isolation."""
    try:
        return await search_wikipedia(claim)
    except Exception as exc:
        logger.warning("Wikipedia search failed for claim '%s': %s", claim[:60], exc)
        return None


async def run_verification(response_text: str) -> dict:
    """
    Full verification pipeline:
    1. Extract claims via LLM (JSON mode)
    2. Search Wikipedia for each claim
    3. Compute semantic similarity between claim and wiki content
    4. Score: Verified (1.0), Partial (0.5), Not Found (0.25)
    """
    # Step 1 — extract claims
    try:
        claims = await extract_claims(response_text)
    except Exception as exc:
        logger.error("run_verification: extract_claims raised — %s", exc, exc_info=True)
        claims = []

    if not claims:
        logger.info("run_verification: no claims extracted — returning default score 0.5")
        return {"score": 0.5, "claims": [], "total": 0,
                "verified": 0, "partial": 0, "not_found": 0}

    logger.info("run_verification: %d claims to verify", len(claims))

    # Step 2 — Wikipedia lookup (each failure isolated)
    wiki_results = await asyncio.gather(
        *[_safe_search_wikipedia(claim) for claim in claims]
    )

    # Step 3 — build embedding batch (only claims that have wiki content)
    all_texts: list[str] = []
    pair_indices: list[int] = []
    for i, (claim, wiki) in enumerate(zip(claims, wiki_results)):
        if wiki and isinstance(wiki, dict) and wiki.get("content"):
            all_texts.extend([claim, wiki["content"]])
            pair_indices.append(i)

    embeddings: list[list[float]] = []
    if all_texts:
        try:
            embeddings = await get_embeddings(all_texts)
            if len(embeddings) != len(all_texts):
                logger.warning(
                    "run_verification: expected %d embeddings, got %d — skipping similarity",
                    len(all_texts), len(embeddings),
                )
                embeddings = []
                pair_indices = []
        except Exception as exc:
            logger.error("run_verification: get_embeddings failed — %s", exc, exc_info=True)
            embeddings = []
            pair_indices = []

    # Step 4 — score each claim
    verified_claims = []
    emb_idx = 0
    for i, (claim, wiki) in enumerate(zip(claims, wiki_results)):
        sim = 0.0
        status = "not_found"

        if wiki and isinstance(wiki, dict) and wiki.get("content") and i in pair_indices and embeddings:
            try:
                claim_emb = np.array(embeddings[emb_idx]).reshape(1, -1)
                wiki_emb  = np.array(embeddings[emb_idx + 1]).reshape(1, -1)
                emb_idx += 2
                sim = float(cosine_similarity(claim_emb, wiki_emb)[0][0])

                if sim > 0.45:
                    status = "verified"
                elif sim > 0.25:
                    status = "partial"
                else:
                    status = "not_found"
            except Exception as exc:
                logger.warning("run_verification: cosine_similarity failed for claim %d — %s", i, exc)
                emb_idx += 2

        source_title = wiki.get("title") if wiki and isinstance(wiki, dict) else None
        source_url   = wiki.get("url")   if wiki and isinstance(wiki, dict) else None

        verified_claims.append({
            "claim":      claim,
            "status":     status,
            "source":     source_title,
            "url":        source_url,
            "similarity": round(sim, 3),
        })

    total         = len(verified_claims)
    verified_cnt  = sum(1 for c in verified_claims if c["status"] == "verified")
    partial_cnt   = sum(1 for c in verified_claims if c["status"] == "partial")
    not_found_cnt = total - verified_cnt - partial_cnt

    v_score = (
        verified_cnt  * 1.0 +
        partial_cnt   * 0.5 +
        not_found_cnt * 0.25
    ) / total if total > 0 else 0.5

    logger.info(
        "run_verification: score=%.4f verified=%d partial=%d not_found=%d",
        v_score, verified_cnt, partial_cnt, not_found_cnt,
    )

    return {
        "score":     round(v_score, 4),
        "claims":    verified_claims,
        "total":     total,
        "verified":  verified_cnt,
        "partial":   partial_cnt,
        "not_found": not_found_cnt,
    }
