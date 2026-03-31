import json
import logging
from services.openai_client import call_openai

logger = logging.getLogger(__name__)

# GPT-4o acts as the independent judge.
# Generators use gpt-4o-mini + gemini — judge uses gpt-4o (different capability tier).
# This preserves model-separation to minimise self-preference bias.

RUBRIC_SYSTEM = """You are an expert AI response evaluator.
You MUST return a JSON object with exactly this structure:
{"accuracy": N, "relevance": N, "completeness": N, "clarity": N, "justification": "..."}
Each score is an integer from 0 to 10. The justification is max 50 words."""

RUBRIC_CRITERIA = """Score this response on four dimensions (0-10 each):

ACCURACY (0-10): Are facts correct? Any fabrications?
  9-10: All facts precise and verifiable
  6-8: Mostly accurate, minor imprecisions
  3-5: Contains notable errors
  0-2: Largely fabricated

RELEVANCE (0-10): Does it answer what was asked?
  9-10: Direct, complete answer
  6-8: Mostly relevant, minor tangents
  3-5: Partially addresses question
  0-2: Off-topic

COMPLETENESS (0-10): All aspects covered?
  9-10: Comprehensive
  6-8: Good coverage, some gaps
  3-5: Partial
  0-2: Superficial

CLARITY (0-10): Well-written and clear?
  9-10: Excellent structure and readability
  6-8: Generally clear
  3-5: Somewhat confusing
  0-2: Incoherent"""

_DEFAULT_RESULT = {
    "score": 0.5,
    "breakdown": {"accuracy": 5, "relevance": 5, "completeness": 5, "clarity": 5},
    "justification": "Evaluation failed — using default score.",
    "evaluator_model": "gpt-4o",
}


async def evaluate_response(prompt: str, response: str, model_name: str) -> dict:
    """
    Score a response using GPT-4o as judge.
    - Uses JSON mode (guaranteed valid JSON output)
    - Uses gpt-4o (different tier from gpt-4o-mini generators) to reduce self-preference bias
    """
    eval_prompt = f"""{RUBRIC_CRITERIA}

ORIGINAL PROMPT: {prompt[:500]}

RESPONSE FROM {model_name}:
{response[:2000]}"""

    try:
        result = await call_openai(
            eval_prompt,
            model="gpt-4o",
            system=RUBRIC_SYSTEM,
            json_mode=True,
            max_tokens=300,
        )
    except Exception as exc:
        logger.error("evaluate_response: OpenAI call failed for %s — %s", model_name, exc, exc_info=True)
        return _DEFAULT_RESULT

    try:
        scores = json.loads(result)
        e_score = (
            scores.get("accuracy",     5) +
            scores.get("relevance",    5) +
            scores.get("completeness", 5) +
            scores.get("clarity",      5)
        ) / 40.0

        out = {
            "score": round(e_score, 4),
            "breakdown": {
                "accuracy":     scores.get("accuracy",     5),
                "relevance":    scores.get("relevance",    5),
                "completeness": scores.get("completeness", 5),
                "clarity":      scores.get("clarity",      5),
            },
            "justification":   scores.get("justification", ""),
            "evaluator_model": "gpt-4o",
        }
        logger.info("evaluate_response: %s score=%.4f", model_name, e_score)
        return out
    except (json.JSONDecodeError, TypeError, KeyError) as exc:
        logger.warning("evaluate_response: JSON parse failed for %s — %s", model_name, exc)
        return _DEFAULT_RESULT
