"""
orchestrator.py — Single execution brain for the CleverPick evaluation pipeline.

evaluate.py calls run_pipeline() and nothing else.
All stage orchestration, error handling, and SSE event emission lives here.
This file is a stub — it will be filled in during Batch 3.
"""

import asyncio
import json
import logging
from typing import AsyncGenerator

logger = logging.getLogger(__name__)


class PipelineContext:
    """Carries all state through the pipeline. Passed between stages."""

    def __init__(
        self,
        prompt: str,
        domain: str,
        history: list,
        session_id: str,
        custom_weights: dict | None,
        pipeline_depth: str = "full",
    ):
        self.prompt = prompt
        self.domain = domain
        self.history = history
        self.session_id = session_id
        self.custom_weights = custom_weights
        self.pipeline_depth = pipeline_depth

        # Results filled in by each stage
        self.intent_result = None
        self.responses = {}
        self.agreement_result = None
        self.verification_results = {}
        self.evaluation_results = {}
        self.consistency_results = {}
        self.model_scores = []
        self.best = None
        self.narrative = ""
        self.is_contested = False
        self.contest_reason = ""
        self.warnings = []


async def run_pipeline(ctx: PipelineContext) -> AsyncGenerator[dict, None]:
    """
    Main pipeline orchestrator. Yields SSE event dicts.
    Each stage is wrapped in try/except with fallback.
    This function will be filled in during Batch 3.
    """
    # Stub — yields a single placeholder event
    yield {
        "event": "progress",
        "data": json.dumps({"stage": 0, "message": "Pipeline stub", "progress": 5}),
    }
