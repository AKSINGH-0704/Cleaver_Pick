import logging
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
from services.hf_embeddings import get_embeddings

logger = logging.getLogger(__name__)


async def compute_consistency(prompt: str, response: str, history: list) -> dict:
    """
    Compute consistency of current response vs conversation history.
    Uses batch embeddings — 1 API call for all texts.
    Returns score = avg cosine similarity; drift = 1 - score.
    """
    if not history:
        return {"score": 1.0, "drift": 0.0, "turns": 0}

    # Collect last 3 assistant turns from history
    past_responses = []
    for turn in reversed(history):
        if isinstance(turn, dict) and turn.get("assistant"):
            past_responses.append(turn["assistant"][:1500])
        if len(past_responses) >= 3:
            break

    if not past_responses:
        return {"score": 1.0, "drift": 0.0, "turns": 0}

    texts = [response[:1500]] + past_responses

    try:
        embeddings = await get_embeddings(texts)
        emb_array = np.array(embeddings)

        if emb_array.shape[0] != len(texts):
            logger.warning(
                "compute_consistency: embedding count mismatch — expected %d, got %d",
                len(texts), emb_array.shape[0],
            )
            return {"score": 1.0, "drift": 0.0, "turns": len(past_responses)}

        current    = emb_array[0:1]
        historical = emb_array[1:]
        sims       = cosine_similarity(current, historical)[0]
        avg_sim    = float(np.mean(sims))
        drift      = 1.0 - avg_sim

        logger.info("compute_consistency: score=%.4f drift=%.4f turns=%d", avg_sim, drift, len(past_responses))
        return {
            "score": round(avg_sim, 4),
            "drift": round(drift,   4),
            "turns": len(past_responses),
        }
    except Exception as exc:
        logger.error("compute_consistency: failed — %s", exc, exc_info=True)
        return {"score": 1.0, "drift": 0.0, "turns": len(past_responses)}
