import httpx
import os

_OPENAI_URL = "https://api.openai.com/v1/chat/completions"


def _headers() -> dict:
    return {
        "Authorization": f"Bearer {os.getenv('OPENAI_API_KEY')}",
        "Content-Type": "application/json",
    }


async def call_openai(
    prompt: str,
    model: str = "gpt-4o-mini",
    system: str = "You are a helpful assistant.",
    json_mode: bool = False,
    max_tokens: int = 1500,
) -> str:
    """Call OpenAI Chat Completions API."""
    body = {
        "model": model,
        "messages": [
            {"role": "system", "content": system},
            {"role": "user", "content": prompt},
        ],
        "max_tokens": max_tokens,
        "temperature": 0.7,
    }
    if json_mode:
        body["response_format"] = {"type": "json_object"}

    async with httpx.AsyncClient(timeout=30) as client:
        response = await client.post(_OPENAI_URL, headers=_headers(), json=body)
        response.raise_for_status()
        return response.json()["choices"][0]["message"]["content"]
