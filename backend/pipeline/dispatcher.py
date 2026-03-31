"""
Parallel model dispatcher.
Generators: GPT-4o-mini (OpenAI) · Gemini 2.0 Flash (Google)
Judge/meta:  Grok-2 (xAI) — evaluator, intent, claim extraction ONLY.

Grok-2 must NOT appear here. The non-negotiable rule is:
the judge model must never be in the generator list (self-preference bias).
"""
import asyncio
from services.openai_client import call_openai
from services.gemini_client import call_gemini

MODELS = ["gpt", "gemini"]


def select_models(intent: str) -> list[str]:
    """Always dispatch to both generators regardless of intent."""
    return MODELS


async def _call_model(name: str, prompt: str) -> dict:
    try:
        if name == "gpt":
            text = await call_openai(prompt, model="gpt-4o-mini", max_tokens=1500)
        elif name == "gemini":
            text = await call_gemini(prompt)
        else:
            return {"text": None, "error": f"Unknown model: {name}"}
        return {"text": text, "error": None}
    except Exception as e:
        return {"text": None, "error": str(e)}


async def dispatch_to_models(prompt: str, models: list[str]) -> dict:
    """Call all models concurrently via asyncio.gather."""
    tasks = [_call_model(name, prompt) for name in models]
    results = await asyncio.gather(*tasks)
    return dict(zip(models, results))
