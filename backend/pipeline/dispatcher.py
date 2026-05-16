"""
Parallel model dispatcher.
Generators: GPT-4o-mini (OpenAI) · Gemini 2.5 Flash (Google) · Llama-3.3-70b (Groq)
Judge/meta:  GPT-4o — evaluator, scoring (different tier = no self-preference bias)
"""
import asyncio
import logging
from services.openai_client import call_openai
from services.gemini_client import call_gemini
from services.groq_client import call_groq, GROQ_QUALITY_MODEL

logger = logging.getLogger(__name__)

MODELS = ["gpt", "gemini", "groq"]


def select_models(intent: str) -> list[str]:
    return MODELS


async def _call_model(name: str, prompt: str) -> dict:
    try:
        if name == "gpt":
            text = await call_openai(prompt, model="gpt-4o-mini", max_tokens=1500)
        elif name == "gemini":
            text = await call_gemini(prompt)
        elif name == "groq":
            text = await call_groq(prompt, model=GROQ_QUALITY_MODEL, max_tokens=1500)
        else:
            return {"text": None, "error": f"Unknown model: {name}"}
        return {"text": text, "error": None}
    except Exception as e:
        logger.error("_call_model %s failed: %s", name, e)
        return {"text": None, "error": str(e)}


async def dispatch_to_models(prompt: str, models: list[str]) -> dict:
    tasks = [_call_model(name, prompt) for name in models]
    results = await asyncio.gather(*tasks)
    return dict(zip(models, results))
