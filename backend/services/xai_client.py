import httpx
import os
import logging

logger = logging.getLogger(__name__)

# xAI's API is OpenAI-compatible — same request shape, different base URL and key.
_XAI_URL = "https://api.x.ai/v1/chat/completions"


def _headers() -> dict:
    return {
        "Authorization": f"Bearer {os.getenv('XAI_API_KEY')}",
        "Content-Type": "application/json",
    }


async def call_grok(
    prompt: str,
    model: str = "grok-2-latest",
    system: str = "You are a helpful assistant.",
    json_mode: bool = False,
    max_tokens: int = 1500,
) -> str:
    """
    Call xAI Grok via its OpenAI-compatible API.
    Set json_mode=True for structured JSON output (intent, claims, evaluation).
    Used as the judge/evaluator to avoid self-preference bias
    (Grok evaluates GPT and Gemini responses, not its own).
    """
    body = {
        "model": model,
        "messages": [
            {"role": "system", "content": system},
            {"role": "user", "content": prompt},
        ],
        "max_tokens": max_tokens,
        "temperature": 0.3,
    }
    if json_mode:
        body["response_format"] = {"type": "json_object"}

    async with httpx.AsyncClient(timeout=45) as client:
        response = await client.post(_XAI_URL, headers=_headers(), json=body)

        if response.status_code != 200:
            logger.error(
                "xAI API error %d — body: %s",
                response.status_code,
                response.text[:500],
            )
        response.raise_for_status()

        content = response.json()["choices"][0]["message"]["content"]
        logger.debug("xAI response: model=%s chars=%d", model, len(content))
        return content
