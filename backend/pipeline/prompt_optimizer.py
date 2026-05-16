"""
AI-powered prompt optimization.
Fixes spelling, grammar, shortens verbose prompts, and adds domain framing.
"""
import json
import logging
from services.openai_client import call_openai
from services.groq_client import call_groq, GROQ_FAST_MODEL

logger = logging.getLogger(__name__)

DOMAIN_TEMPLATES: dict[str, str | None] = {
    "medical": (
        "You are a medical information assistant. "
        "Provide evidence-based information, cite relevant medical concepts or guidelines where applicable, "
        "and include appropriate caveats about consulting qualified healthcare professionals. "
        "Question: {prompt}"
    ),
    "legal": (
        "You are a legal information assistant. "
        "Reference specific laws, legal principles, precedents, or regulations where applicable. "
        "Note any jurisdiction-specific limitations and advise consulting a qualified attorney for personal legal matters. "
        "Question: {prompt}"
    ),
    "research": (
        "You are a research assistant. "
        "Provide well-sourced, academically rigorous information. "
        "Clearly distinguish between established consensus, emerging evidence, and ongoing scholarly debates. "
        "Question: {prompt}"
    ),
    "code": (
        "You are an expert programmer. "
        "Provide clean, well-commented code with clear explanations of the approach taken. "
        "Address edge cases, time/space complexity, and any language-specific best practices. "
        "Task: {prompt}"
    ),
    "coding": (
        "You are an expert programmer. "
        "Provide clean, well-commented code with clear explanations of the approach taken. "
        "Address edge cases, time/space complexity, and any language-specific best practices. "
        "Task: {prompt}"
    ),
    "analytical": (
        "You are an analytical assistant. "
        "Apply systematic, step-by-step reasoning. "
        "Show your work, state assumptions explicitly, and provide quantitative analysis where applicable. "
        "Question: {prompt}"
    ),
    "creative": (
        "You are a creative writing assistant. "
        "Provide imaginative, original, and engaging content. "
        "Be expressive, use vivid language, and bring genuine creative flair to your response. "
        "Request: {prompt}"
    ),
    "general": None,
}

DOMAIN_DESCRIPTIONS: dict[str, str] = {
    "medical":    "Evidence-based medical framing with healthcare caveats",
    "legal":      "Legal framing with law/precedent references and jurisdiction notes",
    "research":   "Academic framing distinguishing facts from ongoing debates",
    "code":       "Expert programmer framing with complexity analysis",
    "coding":     "Expert programmer framing with complexity analysis",
    "analytical": "Systematic step-by-step analytical framing",
    "creative":   "Creative assistant framing with expressive language",
    "general":    "AI-cleaned and optimized prompt",
}

_OPTIMIZE_SYSTEM = "You are a prompt optimization expert. Fix and improve user prompts. Return ONLY the optimized prompt text, nothing else."

_OPTIMIZE_INSTRUCTION = """Fix this prompt by:
1. Correcting all spelling mistakes and typos
2. Fixing grammar errors
3. Making it concise — remove redundant words, keep the core intent
4. Making it clear and specific

Rules:
- Return ONLY the improved prompt text
- Do NOT add explanations, prefixes like "Here is:", or quotation marks
- Preserve the original intent and meaning
- If the prompt has gibberish/random characters, interpret the surrounding context and remove them

Original prompt:
{prompt}"""


async def ai_clean_prompt(raw_prompt: str) -> str:
    """Spell-correct, shorten, and clarify the prompt. Falls back to Groq."""
    instruction = _OPTIMIZE_INSTRUCTION.format(prompt=raw_prompt)
    for caller, kwargs in [
        (call_openai, {"model": "gpt-4o-mini", "system": _OPTIMIZE_SYSTEM, "max_tokens": 300}),
        (call_groq,   {"model": GROQ_FAST_MODEL, "system": _OPTIMIZE_SYSTEM, "max_tokens": 300}),
    ]:
        try:
            result = await caller(instruction, **kwargs)
            cleaned = result.strip().strip('"').strip("'")
            logger.info("Prompt optimized: %d → %d chars", len(raw_prompt), len(cleaned))
            return cleaned
        except Exception as exc:
            logger.warning("ai_clean_prompt %s failed: %s", caller.__name__, exc)
    return raw_prompt


async def optimize_prompt(raw_prompt: str, domain: str) -> tuple[str, str | None, str]:
    """
    Returns (optimized_prompt, template_used, ai_cleaned_prompt).
    First AI-cleans the prompt (spell-fix, shorten), then applies domain framing.
    ai_cleaned_prompt is always the spell-fixed/shortened version for display.
    """
    cleaned = await ai_clean_prompt(raw_prompt)
    template = DOMAIN_TEMPLATES.get(domain)
    if not template:
        return cleaned, None, cleaned
    return template.format(prompt=cleaned), template, cleaned


def get_domain_description(domain: str) -> str:
    return DOMAIN_DESCRIPTIONS.get(domain, "AI-cleaned and optimized prompt")


_VARIANTS_SYSTEM = (
    "You are a prompt engineering expert. Given a user question, generate exactly 3 "
    "differently-styled optimized versions tailored to the specified domain.\n\n"
    "Return ONLY valid JSON — no markdown, no code blocks, no extra text:\n"
    '{"structured": "...", "analytical": "...", "concise": "..."}\n\n'
    "Definitions:\n"
    "- structured: Comprehensive prompt asking for well-organized, in-depth coverage with clear context\n"
    "- analytical: Systematic step-by-step numbered breakdown prompt\n"
    "- concise: Single focused sentence capturing only the core ask"
)


async def generate_prompt_variants(raw_prompt: str, domain: str) -> list[dict]:
    """Return [STRUCTURED, ANALYTICAL, CONCISE] prompt variants via GPT-4o-mini (Groq fallback)."""
    cleaned = await ai_clean_prompt(raw_prompt)
    instruction = f"Domain: {domain}\nQuestion: {cleaned}"

    for caller, kwargs in [
        (call_openai, {"model": "gpt-4o-mini", "system": _VARIANTS_SYSTEM, "max_tokens": 600}),
        (call_groq,   {"model": GROQ_FAST_MODEL, "system": _VARIANTS_SYSTEM, "max_tokens": 600}),
    ]:
        try:
            raw = await caller(instruction, **kwargs)
            text = raw.strip()
            if "```" in text:
                text = text.split("```")[1]
                if text.startswith("json"):
                    text = text[4:]
                text = text.strip()
            data = json.loads(text)
            return [
                {"style": "STRUCTURED", "prompt": data["structured"]},
                {"style": "ANALYTICAL", "prompt": data["analytical"]},
                {"style": "CONCISE",    "prompt": data["concise"]},
            ]
        except Exception as exc:
            logger.warning("generate_prompt_variants %s failed: %s", caller.__name__, exc)

    # Fallback: construct basic variants from cleaned prompt
    return [
        {"style": "STRUCTURED", "prompt": f"Provide a comprehensive, well-organized explanation of: {cleaned}"},
        {"style": "ANALYTICAL", "prompt": f"Analyze step by step — define the topic, explore key aspects, and draw conclusions for: {cleaned}"},
        {"style": "CONCISE",    "prompt": cleaned},
    ]
