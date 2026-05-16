"""
fallbacks.py — Global fault tolerance layer for CleverPick.

Every pipeline stage imports its fallback from here.
If a stage fails, it returns the appropriate fallback value.
The pipeline NEVER crashes due to a subsystem failure.
"""

import logging

logger = logging.getLogger(__name__)


def fallback_intent() -> dict:
    return {
        "intent": "general",
        "domain": "general",
        "pipeline_depth": "full",
        "depth_reason": "Fallback — intent classification unavailable.",
        "_fallback": True,
    }


def fallback_agreement() -> dict:
    return {
        "score": 0.5,
        "per_model": {},
        "pairwise": {},
        "matrix": [],
        "model_names": [],
        "_fallback": True,
    }


def fallback_verification(domain: str = "general") -> dict:
    return {
        "score": 0.5,
        "claims": [],
        "total": 0,
        "verified": 0,
        "partial": 0,
        "not_found": 0,
        "method": "fallback",
        "domain": domain,
        "_fallback": True,
    }


def fallback_evaluation() -> dict:
    return {
        "score": 0.5,
        "breakdown": {"accuracy": 5, "relevance": 5, "completeness": 5, "clarity": 5},
        "justification": "Evaluation unavailable.",
        "evaluator_model": "fallback",
        "_fallback": True,
    }


def fallback_consistency() -> dict:
    return {
        "score": 1.0,
        "drift": 0.0,
        "turns": 0,
        "_fallback": True,
    }


def fallback_r_score(domain: str = "general") -> dict:
    return {
        "R": 0.5,
        "raw_R": 0.5,
        "label": "Moderate",
        "color": "amber",
        "components": {},
        "circuit_breakers": [],
        "confidence_interval": {"half_interval": 0.20, "confidence_level": "low", "display": "± 0.20"},
        "domain": domain,
        "_fallback": True,
    }


def fallback_narrative() -> str:
    return "Evaluation complete. Review the score breakdown below for details."


def log_fallback(stage: str, error: Exception) -> None:
    logger.warning(
        "FALLBACK ACTIVATED — stage=%s error=%s: %s",
        stage, type(error).__name__, str(error),
        exc_info=True,
    )
