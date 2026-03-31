import json
import logging
from services.openai_client import call_openai

logger = logging.getLogger(__name__)

VALID_INTENTS = {"coding", "research", "creative", "analytical", "general"}
VALID_DOMAINS = {"medical", "legal", "code", "research", "creative", "analytical", "general"}


async def classify_intent(prompt: str) -> dict:
    """
    Classify user query into intent + domain using GPT-4o-mini in JSON mode.
    Returns {"intent": str, "domain": str}

    intent  — the query's reasoning style (how to evaluate)
    domain  — the subject-matter area (which weight preset + prompt framing to apply)
    These often differ: "what is the lethal dose of aspirin?" → intent=research, domain=medical
    """
    system = "You classify user queries. Return ONLY valid JSON, no other text."
    p = f"""Classify this query into an intent (reasoning style) AND a domain (subject area).

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
"Explain Newton's laws" → intent=research, domain=research

Query: {prompt[:500]}"""

    try:
        result = await call_openai(p, model="gpt-4o-mini", system=system, json_mode=True, max_tokens=150)
        parsed = json.loads(result)
        intent = parsed.get("intent", "general")
        domain = parsed.get("domain", "general")
        intent = intent if intent in VALID_INTENTS else "general"
        domain = domain if domain in VALID_DOMAINS else "general"
        logger.info("classify_intent: intent=%s domain=%s", intent, domain)
        return {"intent": intent, "domain": domain}
    except Exception as exc:
        logger.error("classify_intent: failed — %s", exc, exc_info=True)
        return {"intent": "general", "domain": "general"}
