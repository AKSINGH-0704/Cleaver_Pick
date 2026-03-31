from pydantic import BaseModel
from typing import Optional

class EvaluateRequest(BaseModel):
    prompt: str
    domain: Optional[str] = "auto"
    conversation_history: Optional[list] = []
    custom_weights: Optional[dict] = None

class BenchmarkRequest(BaseModel):
    count: int = 10
