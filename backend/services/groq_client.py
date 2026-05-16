import httpx
import os
import logging

logger = logging.getLogger(__name__)

_GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"

# Model tiers:
# Fast (intent, optimization, claims): llama-3.1-8b-instant
# Quality (generation, evaluation, insights): llama-3.3-70b-versatile
GROQ_FAST_MODEL = "llama-3.1-8b-instant"
GROQ_QUALITY_MODEL = "llama-3.3-70b-versatile"


def _headers() -> dict:
    return {
        "Authorization": f"Bearer {os.getenv('GROQ_API_KEY')}",
        "Content-Type": "application/json",
    }


async def call_groq(
    prompt: str,
    model: str = GROQ_QUALITY_MODEL,
    system: str = "You are a helpful assistant.",
    json_mode: bool = False,
    max_tokens: int = 1500,
) -> str:
    """Call Groq's OpenAI-compatible API (Llama 3, Mixtral, etc.)."""
    # Groq requires the word "json" in the system prompt when using json_object mode
    effective_system = (system + " Respond with valid JSON only.") if json_mode else system
    body = {
        "model": model,
        "messages": [
            {"role": "system", "content": effective_system},
            {"role": "user", "content": prompt},
        ],
        "max_tokens": max_tokens,
        "temperature": 0.3,
    }
    if json_mode:
        body["response_format"] = {"type": "json_object"}

    async with httpx.AsyncClient(timeout=45) as client:
        response = await client.post(_GROQ_URL, headers=_headers(), json=body)

        if response.status_code != 200:
            logger.error(
                "Groq API error %d — body: %s",
                response.status_code,
                response.text[:500],
            )
        response.raise_for_status()

        content = response.json()["choices"][0]["message"]["content"]
        logger.debug("Groq response: model=%s chars=%d", model, len(content))
        return content
