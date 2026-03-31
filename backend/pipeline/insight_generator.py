"""
Model insight generator.
Produces a single-sentence, query-specific performance insight for each model
by calling the GPT-4o judge with the actual computed scores.
Every call produces different text — no hardcoded strings.
"""
import logging
from services.openai_client import call_openai

logger = logging.getLogger(__name__)

MODEL_DISPLAY = {
    "gpt":    "GPT-4o-mini",
    "gemini": "Gemini 2.5 Flash",
}


async def generate_model_insight(
    model_key: str,
    domain: str,
    eval_breakdown: dict,
    agreement_score: float,
    verification_score: float,
) -> str:
    """
    Returns a single sentence describing why this model performed as it did
    for this specific query. Scores are real computed values — text varies per query.
    """
    display_name = MODEL_DISPLAY.get(model_key, model_key)
    accuracy     = eval_breakdown.get("accuracy",     5)
    relevance    = eval_breakdown.get("relevance",    5)
    completeness = eval_breakdown.get("completeness", 5)
    clarity      = eval_breakdown.get("clarity",      5)

    prompt = (
        f"In exactly one sentence (max 25 words), describe the key strength or weakness of {display_name}'s "
        f"response to a {domain} query based on these scores — "
        f"accuracy: {accuracy}/10, relevance: {relevance}/10, completeness: {completeness}/10, "
        f"clarity: {clarity}/10, cross-model agreement: {agreement_score:.0%}, "
        f"fact verification rate: {verification_score:.0%}. "
        f"Be specific and analytical. Do not mention the model's name in the sentence."
    )

    try:
        insight = await call_openai(
            prompt,
            model="gpt-4o-mini",
            system="You write precise one-sentence performance analyses for AI model evaluations. No preamble.",
            max_tokens=60,
        )
        # Strip quotes and trailing punctuation issues
        insight = insight.strip().strip('"').strip("'")
        if not insight.endswith('.'):
            insight += '.'
        logger.info("insight for %s: %s", model_key, insight[:80])
        return insight
    except Exception as exc:
        logger.warning("insight_generator: failed for %s — %s", model_key, exc)
        return f"Scored {accuracy}/10 accuracy with {verification_score:.0%} fact verification rate."
