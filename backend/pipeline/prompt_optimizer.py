"""
Domain-aware prompt optimization.
Wraps the user's raw prompt with subject-matter framing before sending to LLMs.
Different domains produce different system contexts, leading to genuinely different responses.
"""

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
    # general → no wrapping (pass through as-is)
    "general": None,
}

# Short human-readable description shown in the UI
DOMAIN_DESCRIPTIONS: dict[str, str] = {
    "medical":    "Evidence-based medical framing with healthcare caveats",
    "legal":      "Legal framing with law/precedent references and jurisdiction notes",
    "research":   "Academic framing distinguishing facts from ongoing debates",
    "code":       "Expert programmer framing with complexity analysis",
    "coding":     "Expert programmer framing with complexity analysis",
    "analytical": "Systematic step-by-step analytical framing",
    "creative":   "Creative assistant framing with expressive language",
    "general":    "No optimization — prompt sent as-is",
}


def optimize_prompt(raw_prompt: str, domain: str) -> tuple[str, str | None]:
    """
    Returns (optimized_prompt, template_used).

    optimized_prompt — the final prompt that should be sent to LLMs.
    template_used    — the raw template string (None for 'general', no wrapping applied).
    """
    template = DOMAIN_TEMPLATES.get(domain)
    if not template:
        return raw_prompt, None
    return template.format(prompt=raw_prompt), template


def get_domain_description(domain: str) -> str:
    return DOMAIN_DESCRIPTIONS.get(domain, "No optimization — prompt sent as-is")
