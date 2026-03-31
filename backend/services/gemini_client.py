import httpx
import os
import logging

logger = logging.getLogger(__name__)

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
# gemini-2.5-flash: free tier, thinking disabled for fast generation
GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent"


async def call_gemini(prompt: str, system: str = "You are a helpful assistant.", max_tokens: int = 1500) -> str:
    """Call Google Gemini 2.5 Flash via REST API."""
    async with httpx.AsyncClient(timeout=45) as client:
        response = await client.post(
            GEMINI_URL,
            params={"key": GEMINI_API_KEY},
            json={
                "contents": [
                    {"role": "user", "parts": [{"text": prompt}]}
                ],
                "systemInstruction": {"parts": [{"text": system}]},
                "generationConfig": {
                    "maxOutputTokens": max_tokens,
                    "temperature": 0.7,
                    "thinkingConfig": {"thinkingBudget": 0},
                }
            }
        )

        if response.status_code != 200:
            logger.error(
                "Gemini API error %d — body: %s",
                response.status_code,
                response.text[:500],
            )
        response.raise_for_status()

        data = response.json()
        candidates = data.get("candidates", [])
        if not candidates:
            raise ValueError(f"Gemini returned no candidates. Response keys: {list(data.keys())}")

        content = candidates[0].get("content", {})
        parts = content.get("parts", [])
        if not parts:
            finish = candidates[0].get("finishReason", "unknown")
            raise ValueError(f"Gemini returned empty parts (finishReason={finish}). Candidate: {candidates[0]}")

        text = parts[0].get("text", "")
        logger.info("Gemini response: %d chars", len(text))
        return text
