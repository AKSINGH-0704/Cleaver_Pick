"""
Embeddings via OpenAI text-embedding-3-small.
Replaces the original HuggingFace SBERT implementation.
Public interface is identical: get_embeddings(texts) -> list[list[float]]
All callers (agreement.py, verification.py, consistency.py) import this
function unchanged.
"""
import httpx
import os
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type

_EMBED_URL = "https://api.openai.com/v1/embeddings"
_MODEL = "text-embedding-3-small"


class EmbeddingRateLimitError(Exception):
    pass


def _headers() -> dict:
    return {
        "Authorization": f"Bearer {os.getenv('OPENAI_API_KEY')}",
        "Content-Type": "application/json",
    }


@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=2, max=10),
    retry=retry_if_exception_type(EmbeddingRateLimitError),
)
async def get_embeddings(texts: list[str]) -> list[list[float]]:
    """
    Batch embed all texts in a single API call.
    - text-embedding-3-small: 1536-dim, fast, cheap
    - Returns list of float vectors, order matches input order
    - Retries up to 3× on 429 with exponential backoff
    """
    async with httpx.AsyncClient(timeout=30) as client:
        response = await client.post(
            _EMBED_URL,
            headers=_headers(),
            json={"input": texts, "model": _MODEL},
        )
        if response.status_code == 429:
            raise EmbeddingRateLimitError("OpenAI embeddings rate limited (429)")
        response.raise_for_status()
        data = response.json()
        # Sort by index to guarantee order matches input
        items = sorted(data["data"], key=lambda x: x["index"])
        return [item["embedding"] for item in items]
