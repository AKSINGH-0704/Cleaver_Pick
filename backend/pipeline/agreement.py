import logging
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
from services.hf_embeddings import get_embeddings

logger = logging.getLogger(__name__)


async def compute_agreement(responses: dict) -> dict:
    """
    Compute cross-model semantic agreement.
    - Encodes full responses (NOT sentence-level chunking)
    - One API call for all responses
    - Returns pairwise similarity matrix + aggregate score
    """
    valid = {k: v for k, v in responses.items() if v.get("text")}
    if len(valid) < 2:
        logger.warning("compute_agreement: fewer than 2 valid responses — returning score 0.0")
        return {"score": 0.0, "pairwise": {}, "matrix": [], "model_names": list(valid.keys())}

    names = list(valid.keys())
    texts = [valid[n]["text"][:1500] for n in names]

    embeddings = await get_embeddings(texts)
    emb_array  = np.array(embeddings)

    if emb_array.shape[0] != len(names):
        logger.error(
            "compute_agreement: embedding count mismatch — expected %d, got %d",
            len(names), emb_array.shape[0],
        )
        return {"score": 0.0, "pairwise": {}, "matrix": [], "model_names": names}

    sim_matrix = cosine_similarity(emb_array)

    pairwise = {}
    for i in range(len(names)):
        for j in range(i + 1, len(names)):
            pairwise[f"{names[i]} vs {names[j]}"] = round(float(sim_matrix[i][j]), 4)

    avg_score = round(float(np.mean(list(pairwise.values()))), 4) if pairwise else 0.0
    logger.info("compute_agreement: score=%.4f pairs=%s", avg_score, pairwise)

    return {
        "score":       avg_score,
        "pairwise":    pairwise,
        "matrix":      sim_matrix.tolist(),
        "model_names": names,
    }
