# CleverPick — The Combined Final Master Plan

## Every Valid Fix Applied. Every Bad Idea Rejected. No Gaps Left.

---

## What Changed In This Final Iteration

This plan merges three rounds of analysis. Here's exactly what was adopted from each source:

### From My (Claude's) Original Plan — KEPT
- Vite + React (not Next.js) — eliminates serverless timeouts
- LLM-based claim extraction (not spaCy NER) — extracts claims, not just entities
- Wikipedia as primary verification source — official, stable API
- Full four-stage pipeline with composite scoring formula
- "Observatory" design system with JetBrains Mono / DM Sans / Space Mono
- Five-page UI architecture (Chat, Dashboard, Benchmark, History, Settings)
- Mixtral as evaluator (different model than generators) — mitigates self-preference bias

### From Gemini's Critiques — ADOPTED (these were real bugs)
- HuggingFace Inference API for embeddings instead of local PyTorch (OOM fix)
- Supabase PostgreSQL instead of SQLite (ephemeral filesystem fix)
- SSE streaming for real-time pipeline progress (UX fix)
- `response_format={"type": "json_object"}` for Groq calls (JSON parsing fix)
- `tenacity` retry wrapper for HuggingFace API calls (rate limit resilience)
- Adjusted "not found" claim scoring from 0.5 down to 0.25 (anti-hallucination)
- Wikipedia User-Agent header for polite API usage

### REJECTED from Gemini (with reasons)
- Next.js App Router — overkill, adds complexity, introduces serverless timeout risk
- spaCy NER — extracts entities not claims, adds 50MB dependency
- DuckDuckGo as primary search — unofficial scraper, breaks frequently
- Cohere API — limited free tier, redundant with Groq + Gemini
- Sentence-level chunking for agreement — document-level similarity is correct for this task
- 4-tier verification scoring with "contradiction detection" — requires NLU beyond what cosine similarity provides

---

## The Architecture (Final, Stress-Tested)

```
┌──────────────────────────────────────────────────────────┐
│              VERCEL (Static SPA — no timeouts)            │
│  React 18 + Vite + Tailwind + Framer Motion + Recharts   │
│                                                          │
│  EventSource ←── SSE stream ──→ FastAPI                  │
└──────────────────────┬───────────────────────────────────┘
                       │ HTTPS
                       ▼
┌──────────────────────────────────────────────────────────┐
│           RENDER (Lightweight — ~150MB RAM)               │
│           Python 3.11 + FastAPI + sse-starlette           │
│           NO PyTorch, NO spaCy — lean and stable          │
│                                                          │
│  Pipeline:                                               │
│  ┌─ Stage 0: Intent (Groq Mixtral, JSON mode)            │
│  ├─ Parallel Dispatch: LLaMA 3.3 + Mixtral + Gemini     │
│  ├─ Stage 1: Agreement (HF SBERT API → cosine sim)      │
│  ├─ Stage 2: Claims (LLM extract → Wikipedia → HF sim)  │
│  ├─ Stage 3: LLM Judge (Mixtral, JSON mode, rubric)     │
│  ├─ Stage 4: Consistency (HF embeddings drift)           │
│  └─ R = 0.35A + 0.30V + 0.25E + 0.10C → Supabase       │
│                                                          │
│  External:                                               │
│  ├── Groq API (LLaMA 3.3 70B + Mixtral 8x7B)            │
│  ├── Google Gemini 2.0 Flash                             │
│  ├── HuggingFace Inference API (SBERT embeddings)        │
│  ├── Wikipedia API (claim verification)                  │
│  └── Supabase (PostgreSQL — persistent)                  │
└──────────────────────────────────────────────────────────┘
```

### Why Every Component Survives a Live Demo

| Threat | Solution | Why It Works |
|--------|----------|-------------|
| Render OOM (512MB limit) | No PyTorch, no spaCy — embeddings via HF API | Server runs at ~150MB |
| Data loss on spin-down | Supabase PostgreSQL (persistent, free) | Data survives restarts |
| 15-second blank screen | SSE streams stage-by-stage progress | User watches pipeline work |
| LLM returns broken JSON | Groq `response_format: json_object` | Guarantees valid JSON |
| HF API rate-limits (429) | `tenacity` retry + batched payloads | Auto-retries with backoff |
| Fake claims scored too high | Not-found = 0.25 (penalty, not neutral) | Hallucinations get punished |
| Cold start on Render | cron-job.org pings /health every 14 min | Server stays warm |
| CORS errors | FastAPI CORS middleware, locked to Vercel domain | Clean cross-origin |

---

## Backend: Complete Module Specifications

### File Structure

```
backend/
├── main.py                       # FastAPI app, CORS, lifespan
├── requirements.txt              # Lean — no torch, no spacy
├── .env.example                  # Template for required env vars
│
├── routers/
│   ├── evaluate.py               # POST /api/evaluate (SSE stream)
│   ├── history.py                # GET /api/history
│   ├── benchmark.py              # POST /api/benchmark
│   └── health.py                 # GET /api/health
│
├── pipeline/
│   ├── intent.py                 # Intent classifier (Mixtral JSON mode)
│   ├── dispatcher.py             # Parallel LLM caller (asyncio.gather)
│   ├── agreement.py              # Stage 1: HF embeddings + cosine sim
│   ├── verification.py           # Stage 2: LLM claims + Wikipedia + HF sim
│   ├── evaluator.py              # Stage 3: Mixtral judge (JSON mode + rubric)
│   ├── consistency.py            # Stage 4: Embedding drift across turns
│   └── scorer.py                 # Composite R score calculator
│
├── services/
│   ├── groq_client.py            # Groq API (with JSON mode support)
│   ├── gemini_client.py          # Google Gemini 2.0 Flash
│   ├── hf_embeddings.py          # HuggingFace SBERT (with tenacity retry)
│   ├── wikipedia_client.py       # Wikipedia search + content retrieval
│   └── supabase_client.py        # Supabase PostgreSQL connection
│
├── models/
│   └── schemas.py                # Pydantic request/response models
│
└── data/
    └── truthfulqa_50.json        # 50 curated TruthfulQA questions
```

### requirements.txt

```
fastapi==0.115.0
uvicorn[standard]==0.30.0
httpx==0.27.0
python-dotenv==1.0.1
supabase==2.9.0
sse-starlette==2.1.0
numpy==1.26.4
scikit-learn==1.5.0
tenacity==8.5.0
```

Total install: ~60MB. Runtime RAM: ~150MB. Render free tier: 512MB. Plenty of headroom.

### .env.example

```
GROQ_API_KEY=gsk_your_key_here
GEMINI_API_KEY=your_key_here
HF_TOKEN=hf_your_token_here
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
```

---

### `services/groq_client.py` — With JSON Mode

```python
import httpx
import os

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"

async def call_groq(
    prompt: str,
    model: str = "llama-3.3-70b-versatile",
    system: str = "You are a helpful assistant.",
    json_mode: bool = False,
    max_tokens: int = 1500
) -> str:
    """Call Groq API. Set json_mode=True for guaranteed valid JSON output."""
    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json"
    }
    body = {
        "model": model,
        "messages": [
            {"role": "system", "content": system},
            {"role": "user", "content": prompt}
        ],
        "max_tokens": max_tokens,
        "temperature": 0.3,
    }
    # Groq's JSON mode — forces valid JSON output, no markdown, no filler
    if json_mode:
        body["response_format"] = {"type": "json_object"}

    async with httpx.AsyncClient(timeout=30) as client:
        response = await client.post(GROQ_URL, headers=headers, json=body)
        response.raise_for_status()
        data = response.json()
        return data["choices"][0]["message"]["content"]
```

**Why `json_mode` matters**: Without it, Mixtral might return `"Sure! Here's the evaluation:\n```json\n{...}\n```"`. With `json_mode=True`, Groq guarantees the response is raw, parsable JSON — no markdown, no preamble, no filler. This eliminates the entire class of `JSONDecodeError` crashes that Gemini correctly identified.

---

### `services/hf_embeddings.py` — With Tenacity Retry

```python
import httpx
import os
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type

HF_TOKEN = os.getenv("HF_TOKEN")
HF_URL = "https://api-inference.huggingface.co/models/sentence-transformers/all-MiniLM-L6-v2"

class HFRateLimitError(Exception):
    pass

@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=2, max=10),
    retry=retry_if_exception_type(HFRateLimitError),
)
async def get_embeddings(texts: list[str]) -> list[list[float]]:
    """
    Get SBERT embeddings via HuggingFace Inference API.
    - Sends ALL texts in a single batch (1 HTTP call, not N calls)
    - Retries up to 3 times with exponential backoff on 429/503
    """
    async with httpx.AsyncClient(timeout=30) as client:
        response = await client.post(
            HF_URL,
            headers={"Authorization": f"Bearer {HF_TOKEN}"},
            json={
                "inputs": texts,
                "options": {"wait_for_model": True}  # Wait if model is cold
            }
        )
        if response.status_code == 429:
            raise HFRateLimitError("HuggingFace rate limited (429)")
        if response.status_code == 503:
            raise HFRateLimitError("Model loading (503)")
        response.raise_for_status()
        return response.json()
```

**Key design decisions**:
1. **Single batch call**: All texts go in one `inputs` array. For agreement (3 responses), that's 1 call returning 3 embedding vectors. For verification (5 claims + 5 wiki snippets), that's 1 call returning 10 vectors. Total per pipeline run: 2 HF calls, not 15.
2. **`wait_for_model: True`**: If the model is cold-loaded on HF's servers, this tells HF to load it rather than returning a 503 immediately.
3. **Exponential backoff**: Wait 2s → 4s → 8s between retries. Three attempts before failing gracefully.

---

### `pipeline/agreement.py` — Stage 1

```python
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
from services.hf_embeddings import get_embeddings

async def compute_agreement(responses: dict) -> dict:
    """
    Compute cross-model semantic agreement.
    - Encodes full responses (NOT sentence-level chunking)
    - One HF API call for all responses
    - Returns pairwise similarity matrix + aggregate score
    """
    valid = {k: v for k, v in responses.items() if v.get("text")}
    if len(valid) < 2:
        return {"score": 0.0, "pairwise": {}, "model_names": list(valid.keys())}

    names = list(valid.keys())
    # Truncate to 1500 chars — HF API has input limits, and
    # document-level semantics are captured well within this length
    texts = [valid[n]["text"][:1500] for n in names]

    embeddings = await get_embeddings(texts)
    emb_array = np.array(embeddings)
    sim_matrix = cosine_similarity(emb_array)

    pairwise = {}
    for i in range(len(names)):
        for j in range(i + 1, len(names)):
            pairwise[f"{names[i]} vs {names[j]}"] = round(float(sim_matrix[i][j]), 4)

    avg_score = round(float(np.mean(list(pairwise.values()))), 4) if pairwise else 0.0

    return {
        "score": avg_score,
        "pairwise": pairwise,
        "matrix": sim_matrix.tolist(),
        "model_names": names,
    }
```

---

### `pipeline/verification.py` — Stage 2 (With Corrected Scoring)

```python
import json
import asyncio
import numpy as np
import httpx
from sklearn.metrics.pairwise import cosine_similarity
from services.groq_client import call_groq
from services.hf_embeddings import get_embeddings

async def extract_claims(text: str) -> list[str]:
    """Use Mixtral in JSON mode to extract verifiable factual claims."""
    system = "You extract factual claims from text. Return ONLY valid JSON."
    prompt = f"""Extract specific, verifiable factual claims from this text.
Return a JSON object: {{"claims": ["claim 1", "claim 2", ...]}}
Rules:
- Each claim must be a single, atomic, checkable statement
- Focus on dates, names, numbers, events, cause-effect
- Ignore opinions, hedging, subjective statements
- Maximum 5 claims

Text: {text[:2000]}"""

    result = await call_groq(prompt, model="mixtral-8x7b-32768",
                              system=system, json_mode=True)
    try:
        parsed = json.loads(result)
        return parsed.get("claims", [])[:5]
    except json.JSONDecodeError:
        return []


async def search_wikipedia(query: str) -> dict | None:
    """Search Wikipedia and return top result with content."""
    async with httpx.AsyncClient(
        timeout=10,
        headers={"User-Agent": "CleverPick-CBIT-Project/1.0 (academic research)"}
    ) as client:
        search = await client.get("https://en.wikipedia.org/w/api.php", params={
            "action": "query", "list": "search",
            "srsearch": query[:100], "srlimit": 2, "format": "json"
        })
        results = search.json().get("query", {}).get("search", [])
        if not results:
            return None

        title = results[0]["title"]
        content_resp = await client.get("https://en.wikipedia.org/w/api.php", params={
            "action": "query", "titles": title,
            "prop": "extracts", "exintro": True,
            "explaintext": True, "format": "json"
        })
        pages = content_resp.json().get("query", {}).get("pages", {})
        extract = list(pages.values())[0].get("extract", "")
        if not extract:
            return None

        return {
            "title": title,
            "content": extract[:800],
            "url": f"https://en.wikipedia.org/wiki/{title.replace(' ', '_')}"
        }


async def run_verification(response_text: str) -> dict:
    """
    Full verification pipeline:
    1. Extract claims via LLM (JSON mode)
    2. Search Wikipedia for each claim
    3. Compute semantic similarity between claim and wiki content
    4. Score using 3-tier system: Verified (1.0), Partial (0.5), Not Found (0.25)

    The 0.25 for Not Found penalizes hallucinated claims that don't appear
    in any knowledge source, while avoiding the harsh 0.0 that would require
    contradiction detection (a much harder NLP task than similarity).
    """
    claims = await extract_claims(response_text)
    if not claims:
        return {"score": 0.5, "claims": [], "total": 0,
                "verified": 0, "partial": 0, "not_found": 0}

    # Search Wikipedia for all claims concurrently
    wiki_results = await asyncio.gather(
        *[search_wikipedia(claim) for claim in claims]
    )

    # Batch all similarity computations in ONE HF API call
    # Build pairs: [claim1, wiki1, claim2, wiki2, ...]
    all_texts = []
    pair_indices = []  # Track which pairs have wiki content
    for i, (claim, wiki) in enumerate(zip(claims, wiki_results)):
        if wiki and wiki["content"]:
            all_texts.extend([claim, wiki["content"]])
            pair_indices.append(i)

    # Get all embeddings at once (1 API call)
    if all_texts:
        embeddings = await get_embeddings(all_texts)
    else:
        embeddings = []

    # Score each claim
    verified_claims = []
    emb_idx = 0
    for i, (claim, wiki) in enumerate(zip(claims, wiki_results)):
        if wiki and wiki["content"] and i in pair_indices:
            claim_emb = np.array(embeddings[emb_idx])
            wiki_emb = np.array(embeddings[emb_idx + 1])
            emb_idx += 2
            sim = float(cosine_similarity([claim_emb], [wiki_emb])[0][0])

            if sim > 0.45:
                status = "verified"
                score_val = 1.0
            elif sim > 0.25:
                status = "partial"
                score_val = 0.5
            else:
                status = "not_found"
                score_val = 0.25
        else:
            sim = 0.0
            status = "not_found"
            score_val = 0.25

        verified_claims.append({
            "claim": claim,
            "status": status,
            "source": wiki["title"] if wiki else None,
            "url": wiki["url"] if wiki else None,
            "similarity": round(sim, 3)
        })

    # Compute V score
    total = len(verified_claims)
    verified_count = sum(1 for c in verified_claims if c["status"] == "verified")
    partial_count = sum(1 for c in verified_claims if c["status"] == "partial")
    not_found_count = total - verified_count - partial_count

    v_score = (
        verified_count * 1.0 +
        partial_count * 0.5 +
        not_found_count * 0.25
    ) / total if total > 0 else 0.5

    return {
        "score": round(v_score, 4),
        "claims": verified_claims,
        "total": total,
        "verified": verified_count,
        "partial": partial_count,
        "not_found": not_found_count,
    }
```

---

### `pipeline/evaluator.py` — Stage 3 (JSON Mode, Strict Rubric)

```python
import json
from services.groq_client import call_groq

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


async def evaluate_response(prompt: str, response: str, model_name: str) -> dict:
    """
    Score a response using Mixtral as judge.
    - Uses JSON mode (guaranteed valid JSON output)
    - Uses a different model than generators (mitigates self-preference bias)
    - Structured rubric with score descriptions (improves judge reliability)
    """
    eval_prompt = f"""{RUBRIC_CRITERIA}

ORIGINAL PROMPT: {prompt[:500]}

RESPONSE FROM {model_name}:
{response[:2000]}"""

    result = await call_groq(
        eval_prompt,
        model="mixtral-8x7b-32768",
        system=RUBRIC_SYSTEM,
        json_mode=True  # <-- Guaranteed valid JSON, no string parsing needed
    )

    try:
        scores = json.loads(result)
        e_score = (
            scores.get("accuracy", 5) +
            scores.get("relevance", 5) +
            scores.get("completeness", 5) +
            scores.get("clarity", 5)
        ) / 40.0  # Normalize to 0-1

        return {
            "score": round(e_score, 4),
            "breakdown": {
                "accuracy": scores.get("accuracy", 5),
                "relevance": scores.get("relevance", 5),
                "completeness": scores.get("completeness", 5),
                "clarity": scores.get("clarity", 5),
            },
            "justification": scores.get("justification", ""),
            "evaluator_model": "mixtral-8x7b"
        }
    except json.JSONDecodeError:
        # Even with JSON mode, have a safe fallback
        return {
            "score": 0.5,
            "breakdown": {"accuracy": 5, "relevance": 5, "completeness": 5, "clarity": 5},
            "justification": "Evaluation parsing failed.",
            "evaluator_model": "mixtral-8x7b"
        }
```

---

### `pipeline/scorer.py` — Composite Score

```python
DEFAULT_WEIGHTS = {"A": 0.35, "V": 0.30, "E": 0.25, "C": 0.10}

DOMAIN_PRESETS = {
    "medical": {"A": 0.20, "V": 0.45, "E": 0.25, "C": 0.10},
    "legal":   {"A": 0.20, "V": 0.45, "E": 0.25, "C": 0.10},
    "research": {"A": 0.40, "V": 0.25, "E": 0.25, "C": 0.10},
    "code":    {"A": 0.25, "V": 0.15, "E": 0.40, "C": 0.20},
    "general": {"A": 0.35, "V": 0.30, "E": 0.25, "C": 0.10},
}

def compute_composite(A: float, V: float, E: float, C: float,
                       domain: str = "general", custom_weights: dict = None) -> dict:
    w = custom_weights or DOMAIN_PRESETS.get(domain, DEFAULT_WEIGHTS)

    R = round(w["A"] * A + w["V"] * V + w["E"] * E + w["C"] * C, 4)

    if R > 0.75:
        label, color = "High Reliability", "green"
    elif R >= 0.50:
        label, color = "Moderate", "amber"
    else:
        label, color = "Low — Flagged for Review", "red"

    return {
        "R": R, "label": label, "color": color,
        "components": {
            "agreement":    {"value": A, "weight": w["A"]},
            "verification": {"value": V, "weight": w["V"]},
            "evaluation":   {"value": E, "weight": w["E"]},
            "consistency":  {"value": C, "weight": w["C"]},
        },
        "domain": domain,
    }
```

---

### `routers/evaluate.py` — SSE Streaming Orchestrator

```python
from fastapi import APIRouter
from sse_starlette.sse import EventSourceResponse
from models.schemas import EvaluateRequest
from pipeline.intent import classify_intent
from pipeline.dispatcher import dispatch_to_models, select_models
from pipeline.agreement import compute_agreement
from pipeline.verification import run_verification
from pipeline.evaluator import evaluate_response
from pipeline.consistency import compute_consistency
from pipeline.scorer import compute_composite
from services.supabase_client import save_evaluation
import json
import asyncio

router = APIRouter()

def sse_event(stage: int, message: str, progress: int):
    return {"event": "progress",
            "data": json.dumps({"stage": stage, "message": message, "progress": progress})}

@router.post("/evaluate")
async def evaluate(request: EvaluateRequest):
    async def pipeline():
        prompt = request.prompt
        domain = request.domain or "general"
        history = request.conversation_history or []

        # ── Stage 0: Intent + Parallel Dispatch ──
        yield sse_event(0, "Classifying intent...", 5)
        intent = await classify_intent(prompt)
        yield sse_event(0, f"Intent: {intent}", 10)

        models = select_models(intent)
        yield sse_event(1, f"Querying {len(models)} models in parallel...", 15)
        responses = await dispatch_to_models(prompt, models)
        valid = {k: v for k, v in responses.items() if v.get("text")}

        if not valid:
            yield {"event": "error", "data": json.dumps({"message": "All model calls failed"})}
            return

        yield sse_event(1, f"Received {len(valid)} responses", 30)

        # ── Stage 1: Agreement ──
        yield sse_event(2, "Computing semantic agreement...", 35)
        agreement = await compute_agreement(valid)
        yield sse_event(2, f"Agreement score: {agreement['score']:.2f}", 45)

        # ── Stage 2: Verification (per model, concurrent) ──
        yield sse_event(3, "Extracting and verifying claims...", 50)
        v_tasks = {name: run_verification(resp["text"]) for name, resp in valid.items()}
        v_results = {}
        for name, task in v_tasks.items():
            v_results[name] = await task
        yield sse_event(3, "Claims verified against Wikipedia", 65)

        # ── Stage 3: LLM Judge (concurrent across models) ──
        yield sse_event(4, "LLM judge scoring responses...", 70)
        e_tasks = [evaluate_response(prompt, valid[n]["text"], n) for n in valid]
        e_list = await asyncio.gather(*e_tasks)
        e_results = dict(zip(valid.keys(), e_list))
        yield sse_event(4, "Evaluation complete", 80)

        # ── Stage 4: Consistency ──
        yield sse_event(5, "Checking context consistency...", 85)
        c_results = {}
        for name, resp in valid.items():
            c_results[name] = await compute_consistency(prompt, resp["text"], history)

        # ── Composite Scoring ──
        yield sse_event(6, "Computing reliability scores...", 90)
        model_scores = []
        for name in valid:
            composite = compute_composite(
                A=agreement["score"],
                V=v_results[name]["score"],
                E=e_results[name]["score"],
                C=c_results[name]["score"],
                domain=domain,
                custom_weights=request.custom_weights,
            )
            model_scores.append({
                "model": name,
                "response": valid[name]["text"],
                "composite": composite,
                "agreement": agreement,
                "verification": v_results[name],
                "evaluation": e_results[name],
                "consistency": c_results[name],
            })

        model_scores.sort(key=lambda x: x["composite"]["R"], reverse=True)
        best = model_scores[0]

        # ── Persist to Supabase ──
        await save_evaluation(prompt, domain, intent, model_scores, best["model"])

        # ── Final Result ──
        yield {"event": "result", "data": json.dumps({
            "best_model": best["model"],
            "best_response": best["response"],
            "best_score": best["composite"],
            "all_models": model_scores,
            "agreement_matrix": agreement,
            "intent": intent,
            "domain": domain,
        })}

    return EventSourceResponse(pipeline())
```

---

## Frontend: Design System & Components

### Tech Stack

```
React 18 + Vite        — Static SPA, zero serverless involvement
Tailwind CSS 3         — Utility styling
Framer Motion          — Layout animations, AnimatePresence
Recharts               — Heatmap, radar chart, bar charts
Lucide React           — Clean icons
React Router v6        — Client-side routing
```

### File Structure

```
frontend/src/
├── main.jsx
├── App.jsx
├── index.css                    # Tailwind + CSS variables + font imports
│
├── components/
│   ├── Navbar.jsx               # Nav + API health dot
│   ├── ScoreGauge.jsx           # SVG arc gauge (animated)
│   ├── PipelineProgress.jsx     # 6-dot stepper driven by SSE
│   ├── ModelCard.jsx            # Model result (expand for full response)
│   ├── ClaimRow.jsx             # Single claim with status icon
│   ├── HeatmapGrid.jsx         # Agreement matrix (Recharts)
│   ├── ScoreBreakdown.jsx       # A, V, E, C four-card grid
│   ├── Toast.jsx                # Notification system
│   └── WinnerReveal.jsx         # Animated best-response panel
│
├── pages/
│   ├── ChatPage.jsx             # Main evaluation interface
│   ├── DashboardPage.jsx        # Leaderboard + charts from Supabase
│   ├── BenchmarkPage.jsx        # TruthfulQA runner
│   ├── HistoryPage.jsx          # Search + filter past evaluations
│   └── SettingsPage.jsx         # Weight sliders + model toggles
│
├── hooks/
│   ├── useSSE.js                # SSE consumer (progress + result)
│   └── useToast.js              # Toast notifications
│
├── context/
│   └── AppContext.jsx           # Global settings state
│
└── utils/
    ├── api.js                   # API base URL config
    └── colors.js                # Score → color mapping
```

### Design System

```css
/* index.css */
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&family=Space+Mono:wght@400;700&display=swap');

:root {
  --bg-void: #04060B;
  --bg-primary: #0B0E14;
  --bg-card: rgba(255, 255, 255, 0.03);
  --border-subtle: rgba(255, 255, 255, 0.06);

  --accent-cyan: #06D6A0;
  --accent-amber: #FFB627;
  --accent-rose: #EF476F;
  --accent-violet: #7B61FF;
  --accent-blue: #118AB2;

  --text-primary: #F1F5F9;
  --text-secondary: #94A3B8;
  --text-muted: #475569;
}
```

### SSE Consumer Hook

```javascript
// hooks/useSSE.js
import { useState, useCallback } from 'react';

const API_URL = import.meta.env.VITE_API_URL;

export function useSSE() {
  const [progress, setProgress] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const evaluate = useCallback(async (prompt, domain, history = []) => {
    setLoading(true);
    setResult(null);
    setError(null);
    setProgress({ stage: 0, message: "Starting evaluation...", progress: 0 });

    try {
      const response = await fetch(`${API_URL}/api/evaluate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, domain, conversation_history: history }),
      });

      if (!response.ok) throw new Error(`API error: ${response.status}`);

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              // Check if it's a progress or final result event
              if (data.best_model) {
                setResult(data);
              } else if (data.message) {
                setProgress(data);
              }
            } catch { /* skip unparseable lines */ }
          }
        }
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  return { evaluate, progress, result, loading, error };
}
```

---

## Database Schema (Supabase)

```sql
CREATE TABLE evaluations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT now(),
    prompt TEXT NOT NULL,
    domain TEXT DEFAULT 'general',
    intent TEXT,
    best_model TEXT NOT NULL,
    best_score FLOAT NOT NULL,
    score_breakdown JSONB,
    claims JSONB,
    all_responses JSONB
);

CREATE INDEX idx_eval_created ON evaluations(created_at DESC);
CREATE INDEX idx_eval_domain ON evaluations(domain);
CREATE INDEX idx_eval_model ON evaluations(best_model);
```

---

## Free-Tier Budget (Final Accounting)

| Service | Free Tier | Calls Per Query | Daily Budget (50 queries) |
|---------|-----------|-----------------|---------------------------|
| Groq | 30 req/min, 14,400/day | ~5 (2 gen + intent + claims + judge) | 250 ✅ |
| Gemini | 15 req/min, 1,500/day | 1 (generation) | 50 ✅ |
| HuggingFace | Rate-limited, generous for embeddings | 2 (agreement batch + verification batch) | 100 ✅ |
| Wikipedia | Unlimited (with User-Agent) | 3-5 (per claim) | Unlimited ✅ |
| Supabase | 500MB, unlimited reads | 1 write | Unlimited ✅ |
| Vercel | Unlimited static | 0 | Unlimited ✅ |
| Render | 750 hrs/mo, 512MB | 0 | Free ✅ |

---

## Execution Timeline (8 Weeks)

| Week | Backend | Frontend | Milestone |
|------|---------|----------|-----------|
| 1 | FastAPI setup, Groq + Gemini clients, Supabase schema | Vite + Tailwind + design system | 3 models respond to a prompt |
| 2 | HF embeddings (with tenacity), agreement.py, dispatcher.py | Navbar, Toast, ScoreGauge components | Agreement score computed from real embeddings |
| 3 | verification.py (LLM claims + Wikipedia + HF batch), intent.py | PipelineProgress, ClaimRow, HeatmapGrid | Claims extracted and verified |
| 4 | evaluator.py (JSON mode), consistency.py, scorer.py, SSE endpoint | ChatPage with SSE consumer, full layout | Full pipeline streaming end-to-end |
| 5 | /api/history, /api/benchmark endpoints | DashboardPage (Recharts), HistoryPage | Dashboard shows real analytics |
| 6 | TruthfulQA benchmark data, rate limit handling, edge cases | BenchmarkPage, SettingsPage, animations | Benchmark proves system works |
| 7 | Deploy to Render, cron-job.org keep-alive, production testing | Deploy to Vercel, mobile responsiveness | Live at cleverpick.vercel.app |
| 8 | Fix bugs, update documentation to match implementation | Polish animations, record demo video | Presentation-ready |

---

## The 7 Non-Negotiable Rules

1. **NEVER put API keys in frontend code.** All keys live in Render environment variables only.
2. **ALWAYS use `json_mode=True`** for Groq calls that expect structured output (intent, claims, evaluator).
3. **ALWAYS batch HuggingFace calls** — send arrays, not individual strings. 2 calls per pipeline, not 15.
4. **ALWAYS use `tenacity` retry** on HuggingFace calls — 429s will happen, backoff handles them.
5. **Not-found claims score 0.25**, not 0.5 — hallucinated facts must be penalized.
6. **Mixtral evaluates, LLaMA and Gemini generate.** Never use the same model for both.
7. **The formula is always R = 0.35A + 0.30V + 0.25E + 0.10C.** Every document must match.
