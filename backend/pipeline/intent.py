import json
import logging
from services.openai_client import call_openai
from services.groq_client import call_groq, GROQ_FAST_MODEL

logger = logging.getLogger(__name__)

VALID_INTENTS = {"coding", "research", "creative", "analytical", "general"}
VALID_DOMAINS = {"medical", "legal", "code", "research", "creative", "analytical", "general"}

_SYSTEM = "You classify user queries. Return ONLY valid JSON, no other text."
_PROMPT_TMPL = """Classify this query into an intent (reasoning style) AND a domain (subject area).

Return JSON with exactly this structure:
{{"intent": "...", "domain": "...", "reasoning": "one sentence"}}

INTENT OPTIONS (reasoning style — pick one):
- "coding"     — involves writing, debugging, or explaining code / algorithms
- "research"   — requires factual, encyclopedic, or academic knowledge
- "creative"   — open-ended, generative, brainstorming, storytelling
- "analytical" — math, logic, data analysis, statistics, structured reasoning
- "general"    — everything else

DOMAIN OPTIONS (subject matter — pick one):
- "medical"    — symptoms, medications, diagnoses, health conditions, anatomy
- "legal"      — laws, rights, contracts, regulations, court cases, jurisdiction
- "code"       — programming languages, software, frameworks, debugging, algorithms
- "research"   — science, history, academic topics, encyclopedic facts
- "creative"   — writing, art, brainstorming, stories
- "analytical" — math, statistics, data, economic analysis
- "general"    — does not fit any specific domain above

EXAMPLES:
"What are the symptoms of diabetes?" → intent=research, domain=medical
"Is it legal to record a phone call?" → intent=research, domain=legal
"Write a Python web scraper" → intent=coding, domain=code
"What is 2+2?" → intent=analytical, domain=general
"Write me a poem about rain" → intent=creative, domain=creative

Query: {prompt}"""


def _parse(result: str) -> dict:
    parsed = json.loads(result)
    intent = parsed.get("intent", "general")
    domain = parsed.get("domain", "general")
    return {
        "intent": intent if intent in VALID_INTENTS else "general",
        "domain": domain if domain in VALID_DOMAINS else "general",
    }


async def classify_intent(prompt: str) -> dict:
    p = _PROMPT_TMPL.format(prompt=prompt[:500])
    for caller, kwargs in [
        (call_openai, {"model": "gpt-4o-mini", "system": _SYSTEM, "json_mode": True, "max_tokens": 150}),
        (call_groq,   {"model": GROQ_FAST_MODEL, "system": _SYSTEM, "json_mode": True, "max_tokens": 150}),
    ]:
        try:
            result = await caller(p, **kwargs)
            parsed = _parse(result)
            logger.info("classify_intent: intent=%s domain=%s", parsed["intent"], parsed["domain"])
            return parsed
        except Exception as exc:
            logger.warning("classify_intent %s failed: %s", caller.__name__, exc)
    return {"intent": "general", "domain": "general"}
