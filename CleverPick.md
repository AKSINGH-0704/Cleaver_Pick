# CleverPick — Complete Project Documentation

> **Version:** 1.0.0 · **Stack:** FastAPI + React 18 · **Status:** Active Development

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Why CleverPick Exists](#2-why-cleverpick-exists)
3. [System Architecture](#3-system-architecture)
4. [Technology Stack](#4-technology-stack)
5. [External APIs & Services](#5-external-apis--services)
6. [Backend — Deep Dive](#6-backend--deep-dive)
7. [The 6-Stage Evaluation Pipeline](#7-the-6-stage-evaluation-pipeline)
8. [Persistence Layer](#8-persistence-layer)
9. [Frontend — Deep Dive](#9-frontend--deep-dive)
10. [API Reference](#10-api-reference)
11. [Environment Variables](#11-environment-variables)
12. [Data Flow — End-to-End Example](#12-data-flow--end-to-end-example)
13. [Design Decisions & Architecture Rationale](#13-design-decisions--architecture-rationale)
14. [Known Limitations](#14-known-limitations)
15. [Running the Project](#15-running-the-project)
16. [Project Statistics](#16-project-statistics)

---

## 1. Project Overview

**CleverPick** is a full-stack LLM Reliability Evaluation Platform. It takes a user's natural language query, dispatches it simultaneously to multiple AI models, then runs a rigorous 6-stage automated pipeline to score, fact-check, and rank each model's response — producing a single "Most Reliable Answer" with full transparency into how that verdict was reached.

The core output is the **R Score** (Reliability Score), a composite metric (0–1) built from four independently computed dimensions:

| Symbol | Dimension | What It Measures |
|--------|-----------|-----------------|
| **A** | Agreement | How semantically similar are GPT and Gemini's responses to each other? |
| **V** | Verification | How many factual claims in the response are confirmed by Wikipedia? |
| **E** | Evaluation | What score does the GPT-4o judge assign for accuracy, relevance, completeness, clarity? |
| **C** | Consistency | How well does the response align with prior conversation turns? |

---

## 2. Why CleverPick Exists

### The Problem

AI models hallucinate. They sound confident whether they're right or wrong. A single model's self-assessment is worthless — the model that fabricated a claim will give that claim a high confidence score too. Users have no principled way to know when to trust an AI response.

### The Solution

CleverPick treats reliability as a multi-signal, multi-model problem:

- **Agreement** catches divergence: if two independent models give contradictory answers, one of them is wrong — or both are uncertain
- **Verification** grounds claims in real-world evidence (Wikipedia), not model confidence
- **Evaluation** uses a more capable judge model (GPT-4o) scoring the response against an explicit rubric — like a human reviewer would
- **Consistency** detects drift: if the model contradicts what it said two turns ago, that's a reliability signal

No single signal is definitive. CleverPick's composite R Score is more robust than any individual metric.

### The Target User

Researchers, students, and professionals who use AI for high-stakes queries — medical, legal, research, and technical topics — where hallucination has real consequences.

---

## 3. System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        USER'S BROWSER                               │
│                                                                     │
│  React 18 + Vite + Tailwind CSS + Framer Motion                     │
│  ┌──────────┐ ┌───────────┐ ┌─────────┐ ┌──────────┐              │
│  │ ChatPage │ │ Dashboard │ │ History │ │Benchmark │              │
│  └──────────┘ └───────────┘ └─────────┘ └──────────┘              │
│       │                                                             │
│  Server-Sent Events (SSE) streaming ←──────────────────────────┐   │
│  Regular fetch() for history/dashboard/benchmark ←──────────── │   │
└───────────────────────────────────────────────────────────────────┘
                              │ HTTP/SSE
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     FASTAPI BACKEND (port 8000)                     │
│                                                                     │
│  ┌────────────┐  ┌─────────┐  ┌───────────┐  ┌──────────────────┐ │
│  │ /evaluate  │  │/history │  │/dashboard │  │  /benchmark      │ │
│  │  (SSE)     │  │         │  │           │  │    (SSE)         │ │
│  └─────┬──────┘  └────┬────┘  └─────┬─────┘  └────────┬─────────┘ │
│        │              │             │                  │           │
│        ▼              ▼             ▼                  ▼           │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                  6-STAGE PIPELINE                            │  │
│  │                                                              │  │
│  │  Stage 0   Stage 1   Stage 2   Stage 3   Stage 4  Stage 5/6 │  │
│  │  Intent → Dispatch → Agree → Verify → Evaluate → Score      │  │
│  └──────────────────────────────────────────────────────────────┘  │
│        │                                                           │
│        ▼                                                           │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │                     SERVICES LAYER                             │ │
│  │  openai_client  │  gemini_client  │  wikipedia_client         │ │
│  │  hf_embeddings  │  local_db       │  supabase_client          │ │
│  └────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
          │                    │                    │
          ▼                    ▼                    ▼
   ┌─────────────┐    ┌──────────────┐    ┌──────────────────┐
   │  OpenAI API │    │ Gemini API   │    │  Wikipedia REST  │
   │  GPT-4o-mini│    │ 2.5 Flash    │    │  API (public)    │
   │  GPT-4o     │    │              │    │                  │
   │  Embeddings │    │              │    │                  │
   └─────────────┘    └──────────────┘    └──────────────────┘
          │
          ▼
   ┌─────────────────────────────────┐
   │         STORAGE LAYER           │
   │                                 │
   │  Primary:  SQLite               │
   │  (backend/data/evaluations.db)  │
   │                                 │
   │  Secondary: Supabase            │
   │  (PostgreSQL, best-effort sync) │
   └─────────────────────────────────┘
```

---

## 4. Technology Stack

### Backend

| Category | Technology | Version | Purpose |
|----------|-----------|---------|---------|
| Framework | FastAPI | 0.115.0 | REST API + SSE endpoints |
| Server | uvicorn | latest | ASGI server, binds `0.0.0.0:8000` |
| HTTP Client | httpx | latest | Async calls to OpenAI, Gemini, Wikipedia |
| ML / Math | scikit-learn + numpy | latest | Cosine similarity for embeddings |
| Retry Logic | tenacity | latest | Exponential backoff for embedding calls |
| SSE | sse-starlette | latest | Server-Sent Events streaming |
| Database | sqlite3 (stdlib) | — | Primary local persistence |
| Cloud DB | supabase-py | latest | Secondary cloud persistence |
| Env Config | python-dotenv | latest | Load `.env` file at startup |
| Language | Python | 3.13+ | Runtime |

### Frontend

| Category | Technology | Version | Purpose |
|----------|-----------|---------|---------|
| Framework | React | 18.3.1 | Component model |
| Build Tool | Vite | 5.4.2 | Dev server, HMR, bundling |
| Styling | Tailwind CSS | 3.4.10 | Utility-first CSS |
| Animation | Framer Motion | 11.3.0 | Page transitions, gauge animations, SSE reveal |
| Charts | Recharts | 2.12.7 | Bar charts, line charts for dashboard |
| Icons | Lucide React | 0.441.0 | Icon library |
| Routing | React Router DOM | 6.26.0 | Client-side SPA routing |
| Markdown | React Markdown | 10.1.0 | Render model responses as formatted markdown |
| Font | JetBrains Mono, Space Mono | — | Monospace UI aesthetic |

---

## 5. External APIs & Services

### 5.1 OpenAI

**Used in:** `backend/services/openai_client.py`, `backend/services/hf_embeddings.py`

**Models used:**

| Model | Where Used | Why This Model |
|-------|-----------|----------------|
| `gpt-4o-mini` | Stage 0 (intent classification), Stage 1 (generator), Stage 3 (claim extraction), Stage 5 (insight generation), Benchmark answers | Fast and cheap for high-volume calls |
| `gpt-4o` | Stage 4 (LLM judge) | Higher capability for nuanced rubric scoring; avoids self-preference vs gpt-4o-mini |
| `text-embedding-3-small` | Stage 2 (agreement), Stage 3 (verification similarity) | 1536-dim embeddings; balance of quality and cost |

**Call pattern:** All calls use `httpx.AsyncClient` with a 30-second timeout. JSON mode is used for structured outputs (claims extraction, rubric scoring).

**Key file locations:**
- `backend/services/openai_client.py` — `call_openai(prompt, model, system, json_mode, max_tokens)`
- `backend/services/hf_embeddings.py` — `get_embeddings(texts: list[str]) → list[list[float]]`

---

### 5.2 Google Gemini

**Used in:** `backend/services/gemini_client.py`

**Model:** `gemini-2.5-flash` — accessed via Google's Generative Language REST API

**Why Gemini:** Provides a second independent generator alongside GPT-4o-mini. Having two different models from different providers reduces correlated errors — a factual error in one model is less likely to appear in the other, making the Agreement score meaningful.

**Configuration:**
- Endpoint: `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent`
- `thinkingBudget: 0` — disables chain-of-thought for faster generation
- 45-second timeout (Gemini can be slower than OpenAI)

**Key file:** `backend/services/gemini_client.py` — `call_gemini(prompt, system, max_tokens)`

---

### 5.3 xAI (Grok-2)

**Used in:** `backend/services/xai_client.py`

**Status: Integrated but NOT active in the pipeline.**

Grok-2 was evaluated as a potential third generator but was excluded from the active dispatch list. The reason is the non-negotiable pipeline design rule: **the judge model must never appear in the generator list**. Since the evaluation judge (Stage 4) uses GPT-4o, using Grok as a generator is theoretically fine — but the xAI client exists for future use. The `dispatcher.py` explicitly omits it with a comment explaining this.

**Key file:** `backend/services/xai_client.py` — `call_grok(prompt, system, max_tokens)`

---

### 5.4 Wikipedia REST API

**Used in:** `backend/services/wikipedia_client.py` (called from `pipeline/verification.py`)

**Endpoint:** `https://en.wikipedia.org/api/rest_v1/page/summary/{title}`

**Purpose:** Ground-truth fact-checking. For each factual claim extracted from a model's response, CleverPick searches Wikipedia and computes semantic similarity between the claim and the Wikipedia article content.

**Why Wikipedia:** Free, comprehensive, programmatically accessible, and peer-reviewed enough to serve as a reliable reference for mainstream factual claims. Limitations are acknowledged — it's not authoritative for highly specialized or cutting-edge topics.

**Timeout:** 10 seconds per request. Per-claim isolation ensures one failed lookup doesn't fail the entire verification stage.

---

### 5.5 Supabase

**Used in:** `backend/services/supabase_client.py`

**What it is:** Supabase is a hosted PostgreSQL database with a REST API. It provides cloud persistence so evaluation history is accessible across devices and deployments.

**Architecture role:** Secondary storage. CleverPick uses a dual-write pattern:
1. Every evaluation is ALWAYS written to local SQLite first (guaranteed success)
2. Supabase write is attempted as best-effort — failures are logged but don't break the pipeline
3. History reads try Supabase first; if empty or error, fall back to SQLite

**Why this pattern:** The Supabase `evaluations` table may not exist in all deployments (first-time users, free tier limits). SQLite ensures the app always works, even without Supabase configured.

**Required table schema:**
```sql
CREATE TABLE public.evaluations (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  prompt        TEXT,
  domain        TEXT,
  intent        TEXT,
  best_model    TEXT,
  best_score    FLOAT8,
  score_breakdown JSONB,
  claims        JSONB,
  all_responses JSONB
);

ALTER TABLE public.evaluations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon read"    ON public.evaluations FOR SELECT USING (true);
CREATE POLICY "service write" ON public.evaluations FOR INSERT WITH CHECK (true);

CREATE INDEX idx_eval_created ON evaluations(created_at DESC);
CREATE INDEX idx_eval_domain  ON evaluations(domain);
CREATE INDEX idx_eval_model   ON evaluations(best_model);
```

**Auth keys:**
- Reads use `SUPABASE_ANON_KEY`
- Writes use `SUPABASE_SERVICE_KEY` (bypasses RLS for writes)

---

## 6. Backend — Deep Dive

### 6.1 Entry Point

**File:** `backend/start.py`

```python
import uvicorn
if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
```

- Binds to `0.0.0.0` (all interfaces) so it's reachable from IPv4, IPv6, and all local adapters
- `reload=True` watches for file changes during development
- Port 8000 is locked permanently — no accidental port drift

---

### 6.2 Application Bootstrap

**File:** `backend/main.py`

Critical ordering at startup:
```python
from dotenv import load_dotenv
load_dotenv()   # ← MUST be first — before any service imports
                #   otherwise os.getenv("GEMINI_API_KEY") is None at module load time
from fastapi import FastAPI
from routers import evaluate, history, benchmark, health, dashboard
```

CORS is configured to allow all local development ports across IPv4 and IPv6:
```
Allowed origins:
  Production:  https://cleverpick.vercel.app
  IPv4 local:  http://localhost:5173-5178, http://127.0.0.1:5173-5178
  IPv6 local:  http://[::1]:5173-5178
  Legacy:      localhost:3000, 127.0.0.1:3000, [::1]:3000
```

IPv6 entries (`[::1]`) are required because Vite on Windows typically binds to the IPv6 loopback, causing browser requests to carry `Origin: http://[::1]:5173`. Without these entries, CORS preflight fails silently.

---

### 6.3 Directory Structure — Full

```
backend/
├── main.py                      # FastAPI app, CORS, router registration
├── start.py                     # Uvicorn entry: host=0.0.0.0, port=8000
├── requirements.txt             # All pip dependencies
├── .env                         # API keys (not committed)
│
├── routers/
│   ├── evaluate.py              # POST /api/evaluate  — SSE pipeline
│   ├── history.py               # GET  /api/history, /api/analytics
│   ├── dashboard.py             # GET  /api/dashboard — aggregated stats
│   ├── benchmark.py             # POST /api/benchmark — TruthfulQA SSE
│   └── health.py                # GET  /api/health
│
├── services/
│   ├── openai_client.py         # call_openai(prompt, model, system, json_mode, max_tokens)
│   ├── gemini_client.py         # call_gemini(prompt, system, max_tokens)
│   ├── xai_client.py            # call_grok(prompt, system, max_tokens)  [unused]
│   ├── wikipedia_client.py      # search_wikipedia(query) → {title, extract, url}
│   ├── hf_embeddings.py         # get_embeddings(texts) → list of float vectors
│   ├── supabase_client.py       # save_evaluation(), get_history(), get_analytics_full()
│   └── local_db.py              # SQLite: save_local(), get_local()
│
├── pipeline/
│   ├── intent.py                # classify_intent(prompt) → {intent, domain}
│   ├── prompt_optimizer.py      # optimize_prompt(prompt, domain) → str
│   ├── dispatcher.py            # dispatch_all(prompt) → {gpt:{text,error}, gemini:{...}}
│   ├── agreement.py             # compute_agreement(responses) → {score, pairwise, matrix}
│   ├── verification.py          # run_verification(response) → {score, claims, ...}
│   │                            # + is_time_sensitive(prompt) → (bool, disclaimer)
│   ├── evaluator.py             # evaluate_response(prompt, response, model) → {score, breakdown}
│   ├── consistency.py           # compute_consistency(prompt, response, history) → {score, drift}
│   ├── insight_generator.py     # generate_model_insight(model, scores, ...) → str
│   └── scorer.py                # compute_r_score(A, V, E, C, domain) → {R, label, color, ...}
│
└── data/
    ├── evaluations.db           # SQLite database file
    └── truthfulqa_50.json       # 50-question TruthfulQA benchmark dataset
```

---

## 7. The 6-Stage Evaluation Pipeline

Every call to `POST /api/evaluate` runs this pipeline. Results are streamed to the browser via SSE so the UI can show live progress at each stage.

---

### Stage 0 — Intent & Domain Classification

**File:** `backend/pipeline/intent.py`
**Model:** `gpt-4o-mini` (JSON mode)
**SSE Progress:** 5% → 10%

Classifies the user's prompt into two orthogonal dimensions:

**Intent** (how the model should reason):

| Intent | Description |
|--------|-------------|
| `coding` | Programming, algorithms, frameworks |
| `research` | Factual, encyclopedic, academic |
| `creative` | Storytelling, brainstorming, writing |
| `analytical` | Math, logic, structured reasoning |
| `general` | Everything else |

**Domain** (subject matter, determines scoring weights):

| Domain | Description | Weight Profile |
|--------|-------------|----------------|
| `medical` | Health, anatomy, medications | V-heavy: A=0.20, V=0.45, E=0.25, C=0.10 |
| `legal` | Laws, contracts, regulations | V-heavy: A=0.20, V=0.45, E=0.25, C=0.10 |
| `code` | Programming, frameworks | E-heavy: A=0.25, V=0.15, E=0.40, C=0.20 |
| `research` | Science, history, academics | A-heavy: A=0.40, V=0.25, E=0.25, C=0.10 |
| `creative` | Writing, art, storytelling | E-heavy: A=0.25, V=0.20, E=0.40, C=0.15 |
| `analytical` | Math, statistics, logic | A-heavy: A=0.40, V=0.25, E=0.25, C=0.10 |
| `general` | Miscellaneous | Balanced: A=0.35, V=0.30, E=0.25, C=0.10 |

**User override:** The UI allows manual domain selection. When manually set, the domain_source field reads `"manually set"` vs `"auto-detected"`.

---

### Stage 0 (Concurrent) — Time-Sensitivity Detection

**File:** `backend/pipeline/verification.py` — `is_time_sensitive(prompt)`

Before any API calls, the prompt is scanned with regex patterns to detect time-sensitive queries. No I/O, runs instantly.

**Patterns detected:**
- `current(ly)?`, `right now`, `today`, `this week/month/year`
- `recently`, `latest`, `newest`, `most recent`
- `who is the (current|new) president/CEO/prime minister`
- `what is the current price/rate/value of`
- Years 2025–2029, references to "the 2030s"

**Output:** `(bool, disclaimer_string)` — if `True`, the frontend shows an amber warning bar in the result card.

**Disclaimer text:** *"This query may involve recent events beyond the models' training data. Scores reflect consistency with available knowledge sources, not real-time accuracy."*

---

### Stage 0 (Concurrent) — Prompt Optimization

**File:** `backend/pipeline/prompt_optimizer.py`

Wraps the raw user prompt in a domain-specific system framing before sending to generators. This primes the model to answer in the style appropriate to the domain.

| Domain | Template Summary |
|--------|-----------------|
| `medical` | "You are a medical information assistant. Provide evidence-based information... include caveats about consulting healthcare professionals." |
| `legal` | "You are a legal information assistant. Reference specific laws, precedents... advise consulting a qualified attorney." |
| `research` | "You are a research assistant. Distinguish between established consensus, emerging evidence, and ongoing scholarly debates." |
| `code` | "You are an expert programmer. Provide clean, well-commented code with complexity analysis and edge cases." |
| `analytical` | "You are an analytical assistant. Apply step-by-step reasoning, state assumptions explicitly." |
| `creative` | "You are a creative writing assistant. Provide imaginative, original content with vivid language." |
| `general` | No wrapping — prompt sent as-is. |

---

### Stage 1 — Model Dispatch

**File:** `backend/pipeline/dispatcher.py`
**SSE Progress:** 15% → 30%

Both models are called **simultaneously** via `asyncio.gather()`:

```python
responses = await asyncio.gather(
    call_openai(optimized_prompt, model="gpt-4o-mini", max_tokens=1500),
    call_gemini(optimized_prompt, max_tokens=1500),
    return_exceptions=True
)
```

Failed calls set `error` field but don't abort the pipeline — a single-model result is valid (though Agreement score will be 0).

**Active generators:**
- `gpt` → GPT-4o-mini (OpenAI, `backend/services/openai_client.py`)
- `gemini` → Gemini 2.5 Flash (Google, `backend/services/gemini_client.py`)

---

### Stage 2 — Agreement (Cross-Model Semantic Similarity)

**File:** `backend/pipeline/agreement.py`
**SSE Progress:** 35% → 45%

Measures how similar the two models' responses are at a semantic level — not just word overlap, but meaning.

**Process:**
1. Truncate each response to 1500 chars (embedding model has context limits)
2. Call `get_embeddings([gpt_response, gemini_response])` → two 1536-dim vectors
3. Compute cosine similarity matrix
4. Extract pairwise similarity scores

**Formula:**
```
A_score = mean(all pairwise cosine similarities)
```

For 2 models: `A_score = cosine_similarity(emb_gpt, emb_gemini)`

**Output:**
```json
{
  "score": 0.82,
  "pairwise": {"gpt vs gemini": 0.82},
  "matrix": [[1.0, 0.82], [0.82, 1.0]],
  "model_names": ["gpt", "gemini"]
}
```

**Interpretation:**
- High agreement (>0.75): models broadly agree → higher confidence in both answers
- Low agreement (<0.50): models diverge significantly → at least one may be wrong

---

### Stage 3 — Verification (Wikipedia Fact-Checking)

**File:** `backend/pipeline/verification.py`
**SSE Progress:** 50% → 65%

**Sub-stage 3a: Claim Extraction**
- GPT-4o-mini (JSON mode) extracts up to 5 atomic factual claims from the response
- Filters out opinions, hedges, and subjective statements
- Input: response text (max 2000 chars)
- Output: `{"claims": ["Claim 1...", "Claim 2...", ...]}`

**Sub-stage 3b: Wikipedia Lookup**
- For each claim: search Wikipedia REST API
- Returns: article title, intro extract (max 800 chars), URL
- Each claim is isolated — one lookup failure doesn't cascade

**Sub-stage 3c: Semantic Similarity Scoring**
- Embed all claims + Wikipedia extracts in a single batch call (cost-efficient)
- Compute cosine similarity for each claim-article pair

**Thresholds:**

| Similarity | Status | Score |
|------------|--------|-------|
| ≥ 0.45 | `verified` | 1.0 |
| 0.25 – 0.44 | `partial` | 0.5 |
| < 0.25 | `not_found` | 0.25 |

**V Score Formula:**
```
V = (verified × 1.0 + partial × 0.5 + not_found × 0.25) / total_claims
```

**Output:**
```json
{
  "score": 0.75,
  "claims": [
    {
      "claim": "Einstein won the Nobel Prize in 1921",
      "status": "verified",
      "source": "Nobel Prize in Physics",
      "url": "https://en.wikipedia.org/wiki/Nobel_Prize_in_Physics",
      "similarity": 0.81
    }
  ],
  "total": 3,
  "verified": 2,
  "partial": 1,
  "not_found": 0
}
```

---

### Stage 4 — Evaluation (LLM Judge Scoring)

**File:** `backend/pipeline/evaluator.py`
**SSE Progress:** 70% → 80%
**Judge Model:** `gpt-4o` (NOT gpt-4o-mini)

An independent, more capable judge model scores each response against a strict rubric. GPT-4o is used specifically because it is more capable than the generators (GPT-4o-mini, Gemini), reducing the chance of self-preference bias.

**Rubric (0–10 per dimension):**

| Dimension | 9–10 | 6–8 | 3–5 | 0–2 |
|-----------|------|-----|-----|-----|
| **Accuracy** | All facts precise and verifiable | Mostly accurate, minor imprecisions | Contains notable errors | Largely fabricated |
| **Relevance** | Direct, complete answer | Mostly relevant, minor tangents | Partially addresses question | Off-topic |
| **Completeness** | Comprehensive coverage | Good coverage, some gaps | Partial treatment | Superficial |
| **Clarity** | Excellent structure, readable | Generally clear | Somewhat confusing | Incoherent |

**E Score Formula:**
```
E = (accuracy + relevance + completeness + clarity) / 40.0
```

**Output:**
```json
{
  "score": 0.80,
  "breakdown": {
    "accuracy": 8,
    "relevance": 8,
    "completeness": 7,
    "clarity": 8
  },
  "justification": "Strong factual accuracy with clear structure. Minor gaps in completeness.",
  "evaluator_model": "gpt-4o"
}
```

---

### Stage 5 — Consistency (Context Drift Detection)

**File:** `backend/pipeline/consistency.py`
**SSE Progress:** 85%

Measures how consistent the current response is with what the model said in previous conversation turns. Prevents rewarding models that contradict themselves across a multi-turn conversation.

**Process:**
1. Extract the last 3 assistant turns from `conversation_history`
2. Embed current response + past responses
3. Compute cosine similarity between current and each historical response
4. Average the similarities

**Formula:**
```
C_score = mean(cosine_similarities_with_history)
drift    = 1.0 - C_score
```

**Output:**
```json
{
  "score": 0.88,
  "drift": 0.12,
  "turns": 3
}
```

If no conversation history exists, `C_score = 1.0` (no drift possible for a first turn).

---

### Stage 5 (Concurrent) — Model Insights

**File:** `backend/pipeline/insight_generator.py`

Generates a one-sentence human-readable performance summary for each model, using GPT-4o-mini. The insight is shown in the UI under each model's name.

**Example outputs:**
- *"Strong in relevance (8/10) with perfect cross-model agreement, but fact verification rate suggests minor hallucinations."*
- *"Excellent Wikipedia claim support (V=0.90) but diverges significantly from GPT's response."*

---

### Stage 6 — Composite R Score

**File:** `backend/pipeline/scorer.py`
**SSE Progress:** 90% → 100%

Computes the final Reliability Score for each model using the domain-specific weight profile.

**Default Weights (general domain):**
```
R = 0.35×A + 0.30×V + 0.25×E + 0.10×C
```

**Domain-specific weight overrides:**

| Domain | A | V | E | C | Rationale |
|--------|---|---|---|---|-----------|
| `general` | 0.35 | 0.30 | 0.25 | 0.10 | Balanced |
| `medical` | 0.20 | 0.45 | 0.25 | 0.10 | Facts critical; errors dangerous |
| `legal` | 0.20 | 0.45 | 0.25 | 0.10 | Facts critical; errors costly |
| `research` | 0.40 | 0.25 | 0.25 | 0.10 | Agreement between sources matters |
| `code` | 0.25 | 0.15 | 0.40 | 0.20 | Quality judge matters most; consistency in multi-turn coding |
| `creative` | 0.25 | 0.20 | 0.40 | 0.15 | Evaluation quality over factual grounding |
| `analytical` | 0.40 | 0.25 | 0.25 | 0.10 | Cross-model agreement on logic matters |

**Reliability Labels:**

| R Score | Label | Color |
|---------|-------|-------|
| ≥ 0.75 | High Reliability | `#06D6A0` (green) |
| 0.50 – 0.74 | Moderate | `#FFB627` (amber) |
| < 0.50 | Low — Flagged for Review | `#EF476F` (red) |

---

## 8. Persistence Layer

### 8.1 SQLite (Primary)

**File:** `backend/services/local_db.py`
**Database path:** `backend/data/evaluations.db`

All writes go here first. Uses `asyncio.to_thread()` to run synchronous sqlite3 calls without blocking the async event loop.

**Schema:**
```sql
CREATE TABLE IF NOT EXISTS evaluations (
    id              TEXT PRIMARY KEY,       -- UUID string
    created_at      TEXT NOT NULL,          -- ISO 8601 timestamp
    prompt          TEXT,
    domain          TEXT,
    intent          TEXT,
    best_model      TEXT,
    best_score      REAL,
    score_breakdown TEXT,                   -- JSON string
    best_response   TEXT,
    all_responses   TEXT,                   -- JSON string
    is_benchmark    INTEGER DEFAULT 0       -- 0=eval, 1=benchmark run
)
```

**Key functions:**
- `save_local(record: dict) → None` — insert or ignore duplicate IDs
- `get_local(limit, offset, domain, search) → list[dict]` — supports filtering and full-text search

### 8.2 Supabase (Secondary)

**File:** `backend/services/supabase_client.py`

**Dual-write pattern:**
```python
async def save_evaluation(record):
    await save_local(record)          # Always succeeds
    try:
        await supabase_insert(record)  # Best-effort
    except Exception as e:
        logger.warning("Supabase write failed: %s", e)  # Non-fatal
```

**Read fallback pattern:**
```python
async def get_history(limit, domain, search):
    try:
        results = await supabase_select(limit, domain, search)
        if results:
            return results
    except Exception:
        pass
    return await get_local(limit, 0, domain, search)  # Fallback
```

---

## 9. Frontend — Deep Dive

### 9.1 Pages

**`frontend/src/pages/ChatPage.jsx`**
The main evaluation interface. Contains the prompt input, domain selector, and the SSE streaming result display. Hosts `WinnerReveal`, `ModelCompare`, `PipelineProgress` components.

**`frontend/src/pages/DashboardPage.jsx`**
Aggregated reliability metrics dashboard. Shows:
- 4 KPI stat cards (Total Evaluations, Avg R Score, Most Reliable Model, Top Domain) with count-up animations
- Model Win Counts bar chart (Recharts `BarChart` + `Cell` per bar)
- R Score Over Time line chart
- Domain Leaderboard
- Recent Evaluations list

Re-fetches data on every mount so navigating back always shows fresh data.

**`frontend/src/pages/HistoryPage.jsx`**
Searchable, filterable list of all past evaluations. Features:
- Full-text search bar filtering prompts client-side
- Domain filter pills (7 domains + "all")
- Each entry is an expandable card showing A/V/E/C score breakdown with mini progress bars
- Best response rendered as formatted markdown via ReactMarkdown
- Relative timestamps ("just now", "5m ago", "yesterday")

**`frontend/src/pages/BenchmarkPage.jsx`**
TruthfulQA Benchmark runner. Features:
- Question count selector: 5 / 10 / 25 / 50
- SSE streaming: progress bar + live results appear one by one
- Abort (Stop) button via AbortController
- Summary stats: Questions Run, Avg V Score, Hallucinations, Claims Verified
- Verdict: "CleverPick detected hallucinations in X% of adversarial TruthfulQA questions"
- localStorage caching — previous run is shown on load; "Re-run" button replaces "Run"

**`frontend/src/pages/SettingsPage.jsx`**
Custom weight sliders (A/V/E/C), model toggles, and Supabase setup SQL.

---

### 9.2 Key Components

**`WinnerReveal.jsx`**
The main result card, shown after evaluation completes. Contains:
- Animated trophy icon (spring animation)
- Winner model name + color dot
- `ScoreGauge` — animated arc showing R score
- Prompt analysis strip (intent, domain, weight breakdown)
- Amber time-sensitivity banner (if `time_sensitive: true`)
- `ScoreBreakdown` — A/V/E/C grid
- `ClaimsReport` — verified/partial/not_found claims list
- Full best response in formatted markdown

**`ScoreGauge.jsx`**
SVG arc gauge showing R score 0–100. Animates on mount using Framer Motion's `useMotionValue` + `animate()`.

**`ScoreBreakdown.jsx`**
Grid of 4 tiles (A, V, E, C), each showing the score as a percentage with a colored mini progress bar. Triggered by `useInView` for entrance animation.

**`ClaimsReport.jsx`** + **`ClaimRow.jsx`**
Expandable claims list. Each row shows the claim text, status icon (✓ / △ / ✗), similarity percentage, and Wikipedia source link.

**`HeatmapGrid.jsx`**
Cosine similarity heatmap visualization for the agreement matrix. Color-mapped from red (0.0) to green (1.0).

**`ModelCompare.jsx`**
Side-by-side comparison of all model results. Winner gets 60% width, others share 40%.

**`PipelineProgress.jsx`**
Real-time stage progress display during evaluation. Shows current stage name, progress bar, and stage message from SSE `progress` events.

**`StatCard.jsx`**
Animated KPI tile used in DashboardPage. Numeric values count up from 0 using Framer Motion when scrolled into view. Supports `textValue` prop for non-numeric displays.

**`DomainLeaderboard.jsx`**
Table showing per-domain top model, win rate bar, average R score, and total evaluations. Rows animate in with staggered slide-up.

**`Navbar.jsx`**
Navigation header with resilient API health indicator:
- 5-second AbortController timeout per check
- 2-consecutive-failure threshold before showing "api down"
- Polls every 10 seconds
- Green pulse dot when healthy

---

### 9.3 Hooks & Utilities

**`frontend/src/hooks/useSSE.js`**
Custom hook that opens a fetch stream to `/api/evaluate`, parses SSE events (`event: TYPE\ndata: JSON`), and dispatches to handlers for `progress`, `result`, and `error` event types.

**`frontend/src/utils/api.js`**
```javascript
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
```
Single source of truth for the backend URL. The environment variable is set at build time via Vite.

**`frontend/src/utils/colors.js`**
Central color-mapping functions:

```javascript
// R score → hex color
scoreColor(score):
  ≥ 0.75 → #06D6A0 (green)
  ≥ 0.50 → #FFB627 (amber)
  <  0.50 → #EF476F (red)

// Verification status → hex color
statusColor(status):
  "verified"  → #06D6A0
  "partial"   → #FFB627
  "not_found" → #EF476F

// Model identifier → brand color
MODEL_COLORS:
  gpt:    #10A37F  (OpenAI green)
  gemini: #4285F4  (Google blue)

// Model identifier → display label
MODEL_LABELS:
  gpt:    "GPT-4o-mini"
  gemini: "Gemini 2.5 Flash"
```

---

### 9.4 Design System

**Theme:** Observatory dark — deep space aesthetic, data-dense but readable.

| Variable | Value | Used For |
|----------|-------|---------|
| Background | `#04060B` | Page background |
| Surface | `#0B0E14` | Card backgrounds |
| Primary text | `#F1F5F9` | Headings, important values |
| Secondary text | `#94A3B8` | Body copy, labels |
| Muted | `#475569` | Timestamps, metadata |
| Accent green | `#06D6A0` | Success, health, high scores |
| Accent amber | `#FFB627` | Warning, medium scores |
| Accent red | `#EF476F` | Error, low scores, hallucinations |
| Purple | `#7B61FF` | Brand color, UI accents |

**Glass card pattern:**
```css
background: rgba(255, 255, 255, 0.05);
border: 1px solid rgba(255, 255, 255, 0.06);
border-radius: 0.75rem;
backdrop-filter: blur(10px);
```

**Fonts:** JetBrains Mono (headings, scores, monospace UI), Space Mono (labels), system sans-serif (body).

---

## 10. API Reference

### `POST /api/evaluate`
**Streaming:** Server-Sent Events
**Content-Type:** application/json

**Request:**
```json
{
  "prompt": "Is aspirin safe for daily use?",
  "domain": "auto",
  "conversation_history": [],
  "custom_weights": null
}
```

**SSE Events:**

| Event | Payload |
|-------|---------|
| `progress` | `{stage, message, progress}` |
| `result` | Full result object (see below) |
| `error` | `{message}` |

**Result object (key fields):**
```json
{
  "best_model": "gpt",
  "best_response": "...",
  "best_score": {
    "R": 0.794,
    "label": "High Reliability",
    "color": "#06D6A0",
    "components": {
      "agreement":    {"value": 0.82, "weight": 0.20},
      "verification": {"value": 0.75, "weight": 0.45},
      "evaluation":   {"value": 0.80, "weight": 0.25},
      "consistency":  {"value": 0.88, "weight": 0.10}
    },
    "domain": "medical"
  },
  "all_models": [...],
  "intent": "research",
  "detected_domain": "medical",
  "applied_domain": "medical",
  "domain_source": "auto-detected",
  "optimized_prompt": "You are a medical information assistant. ...",
  "optimization_applied": true,
  "time_sensitive": false,
  "time_sensitive_disclaimer": ""
}
```

---

### `GET /api/history`

**Query params:** `limit` (default 50), `offset` (default 0), `domain` (optional), `search` (optional)

**Response:**
```json
{
  "evaluations": [
    {
      "id": "uuid",
      "created_at": "2026-03-31T09:22:19Z",
      "prompt": "...",
      "domain": "medical",
      "intent": "research",
      "best_model": "gpt",
      "best_score": 0.794,
      "score_breakdown": {...},
      "best_response": "...",
      "all_responses": {...}
    }
  ],
  "count": 1
}
```

---

### `GET /api/dashboard`

**Response:**
```json
{
  "total": 42,
  "avg_r": 0.681,
  "top_model": "gemini",
  "top_model_label": "Gemini 2.5 Flash",
  "top_domain": "research",
  "win_counts": {"gpt": 18, "gemini": 24},
  "domain_counts": {"research": 15, "general": 12},
  "leaderboard": [
    {
      "domain": "research",
      "top_model": "gemini",
      "top_model_label": "Gemini 2.5 Flash",
      "win_rate": 73.3,
      "avg_r": 0.721,
      "total": 15,
      "limited_data": false,
      "model_wins": {"gemini": 11, "gpt": 4}
    }
  ],
  "score_history": [
    {"n": 1, "score": 72.1, "domain": "research", "model": "gemini"}
  ],
  "recent_evaluations": [...]
}
```

---

### `POST /api/benchmark?count=10`
**Streaming:** Server-Sent Events

**SSE Events:**

| Event | Payload |
|-------|---------|
| `progress` | `{index, total, question, progress}` |
| `result` | `{index, question, category, answer, v_score, verified, partial, not_found, claims}` |
| `summary` | `{total, avg_v_score, hallucination_count, hallucination_rate, total_verified, total_claims}` |

The benchmark uses **GPT-4o-mini** for answers (with **Gemini fallback** when OpenAI is unreachable). It runs verification only — no agreement, evaluation, or consistency stages — to minimize API cost.

---

### `GET /api/health`

```json
{"status": "ok", "service": "CleverPick API", "version": "1.0.0"}
```

---

## 11. Environment Variables

### Backend — `backend/.env`

| Variable | Service | Used For |
|----------|---------|---------|
| `OPENAI_API_KEY` | OpenAI | GPT-4o-mini (generator), GPT-4o (judge), text-embedding-3-small |
| `GEMINI_API_KEY` | Google AI Studio | Gemini 2.5 Flash (generator) |
| `XAI_API_KEY` | xAI | Grok-2 (imported but currently unused) |
| `SUPABASE_URL` | Supabase | PostgreSQL endpoint (e.g. `https://xxxx.supabase.co`) |
| `SUPABASE_ANON_KEY` | Supabase | Read-only JWT for history queries |
| `SUPABASE_SERVICE_KEY` | Supabase | Service role JWT for evaluation writes |

**Critical:** `load_dotenv()` must be called at the top of `main.py` before any service imports, otherwise module-level `os.getenv()` calls return `None`.

### Frontend — `frontend/.env`

| Variable | Value | Purpose |
|----------|-------|---------|
| `VITE_API_URL` | `http://localhost:8000` | Backend base URL used by all fetch calls |

---

## 12. Data Flow — End-to-End Example

**Prompt:** *"Is aspirin safe for daily use?"*
**Domain:** auto-detected as `medical`

```
Browser (ChatPage)
  │
  │  POST /api/evaluate
  │  {prompt: "Is aspirin safe for daily use?", domain: "auto"}
  │
  ▼
evaluate.py router
  │
  ├── is_time_sensitive("Is aspirin safe for daily use?")
  │     → (False, "")  — no time-sensitive patterns matched
  │
  ├── Stage 0: classify_intent(prompt)
  │     → gpt-4o-mini (JSON mode)
  │     → {intent: "research", domain: "medical"}
  │     → SSE: progress(stage=0, 10%)
  │
  ├── optimize_prompt(prompt, domain="medical")
  │     → "You are a medical information assistant. Provide evidence-based
  │         information... Question: Is aspirin safe for daily use?"
  │
  ├── Stage 1: dispatch_all(optimized_prompt)
  │     → asyncio.gather(call_openai(...), call_gemini(...))
  │     → {gpt: {text: "...", error: null}, gemini: {text: "...", error: null}}
  │     → SSE: progress(stage=1, 30%)
  │
  ├── Stage 2: compute_agreement({gpt_text, gemini_text})
  │     → get_embeddings([gpt_text[:1500], gemini_text[:1500]])
  │     → cosine_similarity → 0.82
  │     → SSE: progress(stage=2, 45%)
  │
  ├── Stage 3: run_verification(gpt_text), run_verification(gemini_text)
  │     → [parallel via asyncio.gather]
  │     → extract_claims → 3 claims per model
  │     → search_wikipedia × 3 → {title, extract, url}
  │     → get_embeddings(claims + wiki_extracts)
  │     → cosine_similarity per pair
  │     → gpt: V=0.75 (2 verified, 1 partial)
  │     → gemini: V=0.68 (1 verified, 1 partial, 1 not_found)
  │     → SSE: progress(stage=3, 65%)
  │
  ├── Stage 4: evaluate_response(prompt, gpt_text, "gpt")
  │            evaluate_response(prompt, gemini_text, "gemini")
  │     → [parallel via asyncio.gather]
  │     → gpt-4o judge (JSON mode)
  │     → gpt:    {accuracy:8, relevance:8, completeness:7, clarity:8} → E=0.775
  │     → gemini: {accuracy:7, relevance:8, completeness:7, clarity:7} → E=0.725
  │     → SSE: progress(stage=4, 80%)
  │
  ├── Stage 5: compute_consistency(response, history=[])
  │            generate_model_insight(model, scores, ...)
  │     → C=1.0 (no history → no drift)
  │     → insights: "Strong agreement with peer model, solid fact verification..."
  │     → SSE: progress(stage=5, 85%)
  │
  ├── Stage 6: compute_r_score(A=0.82, V=0.75, E=0.775, C=1.0, domain="medical")
  │     → weights = {A:0.20, V:0.45, E:0.25, C:0.10}
  │     → R_gpt = 0.20×0.82 + 0.45×0.75 + 0.25×0.775 + 0.10×1.0 = 0.798
  │             → "High Reliability" (#06D6A0)
  │     → R_gemini = 0.20×0.82 + 0.45×0.68 + 0.25×0.725 + 0.10×1.0 = 0.743
  │             → "High Reliability" (#06D6A0)
  │     → winner: gpt (0.798 > 0.743)
  │     → SSE: progress(stage=6, 90%)
  │
  ├── save_local({prompt, domain:"medical", best_model:"gpt", best_score:0.798, ...})
  │     → SQLite write (guaranteed)
  ├── supabase_insert(record)
  │     → best-effort (failures logged, non-fatal)
  │
  └── SSE: result({best_model:"gpt", best_score:{R:0.798,...}, all_models:[...],
                   time_sensitive:false, ...})

Browser (WinnerReveal component)
  │
  ├── Trophy icon animates in (spring)
  ├── "GPT-4o-mini" + green dot displayed
  ├── ScoreGauge arc animates to 79.8
  ├── ScoreBreakdown grid: A=82, V=75, E=78, C=100
  ├── ClaimsReport: 2 verified ✓, 1 partial △
  └── Best response rendered as formatted markdown
```

---

## 13. Design Decisions & Architecture Rationale

### 13.1 Why Two Generators (GPT + Gemini)?

A single model's self-assessment is circular — it cannot reliably judge the accuracy of its own output. By using two different models from different providers (OpenAI and Google), we get independent perspectives. High agreement between the two increases confidence; divergence is itself a reliability signal.

### 13.2 Why Is the Judge Model Different from the Generators?

GPT-4o (Stage 4 judge) is deliberately distinct from GPT-4o-mini (Stage 1 generator). Using the same model as both generator and judge would introduce self-preference bias — the model would systematically score its own outputs higher. The judge is a separate, more capable model evaluating all generators equally.

### 13.3 Why Wikipedia for Verification?

Wikipedia is:
- Free and programmatically accessible
- Comprehensive enough for mainstream factual claims
- Peer-reviewed to a meaningful degree
- Stable (unlikely to be rate-limited for reasonable use)

Its limitations are acknowledged in the codebase. For highly specialized domains (cutting-edge research, niche legal questions), Wikipedia coverage is incomplete and V scores should be interpreted with caution.

### 13.4 Why SQLite as Primary + Supabase as Secondary?

Pure Supabase dependency creates fragility: the table may not exist, the network may be unavailable, the anon key may expire. SQLite always succeeds and keeps data local. The dual-write pattern means CleverPick works fully offline and syncs to the cloud when possible — never the other way around.

### 13.5 Why Server-Sent Events (SSE) Instead of WebSockets?

The evaluation pipeline is unidirectional — server pushes progress events to the client with no need for client messages mid-stream. SSE is simpler than WebSockets for this pattern: it runs over standard HTTP, works through proxies, and auto-reconnects natively. The `sse-starlette` library makes the FastAPI implementation trivial.

### 13.6 Why Domain-Specific Weights?

A uniform weight profile treats "code" and "medical" equally. But they're not equal:
- Medical queries demand rigorous fact verification (V gets 45% weight) because errors can cause harm
- Code queries care more about quality and structure (E gets 40% weight); code doesn't need Wikipedia-verifiable facts
- Research queries value cross-model agreement (A gets 40% weight) because consensus across independent sources matters for academic credibility

The weight system encodes domain expertise into the scoring formula itself.

---

## 14. Known Limitations

| Limitation | Impact | Notes |
|------------|--------|-------|
| OpenAI API network dependency | GPT calls fail if OpenAI is unreachable. Benchmark falls back to Gemini; main pipeline runs Gemini-only | Network-level issue, not code |
| Single-model agreement score | When only 1 model responds, A=0.0 (needs 2+ for comparison) | Agreement is mathematically undefined for 1 model |
| Wikipedia coverage | V scores are unreliable for niche, cutting-edge, or highly specialized topics | Wikipedia is broad but not deep |
| Conversation history | Stored in frontend memory only; refreshing the page clears history | No server-side session persistence |
| Grok-2 unused | xAI client exists but Grok is not in active dispatch | Designed in but excluded for self-preference reasons |
| Embedding model fixed | `text-embedding-3-small` hardcoded — no option to swap | Future: configurable embedding model |
| Benchmark is lightweight | Uses only answer generation + V-score; skips Agreement, Evaluation, Consistency | Designed to conserve API credits |
| No authentication | API endpoints are open; anyone on the network can read history | Suitable for local/trusted network use only |

---

## 15. Running the Project

### Prerequisites

- Python 3.13+
- Node.js 18+
- API keys for OpenAI and Google Gemini

### Backend

```bash
cd backend

# Install dependencies
pip install -r requirements.txt

# Create .env file with your API keys (see Section 11)
# Then start:
python start.py
# → Runs on http://0.0.0.0:8000
# → Auto-reloads on file changes
```

Verify: `curl http://localhost:8000/api/health`

### Frontend

```bash
cd frontend

# Install dependencies
npm install

# Create frontend/.env:
# VITE_API_URL=http://localhost:8000

# Start dev server:
npm run dev
# → Typically runs on http://localhost:5173
```

### Production Build

```bash
cd frontend
npm run build    # Outputs to frontend/dist/
npm run preview  # Preview the built app
```

For production backend: set `reload=False` in `start.py` and consider running behind nginx or a process manager like gunicorn.

### Local URLs (Development)

| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| Backend | http://localhost:8000 |
| Health check | http://localhost:8000/api/health |
| Dashboard data | http://localhost:8000/api/dashboard |
| History data | http://localhost:8000/api/history |

---

## 16. Project Statistics

| Metric | Value |
|--------|-------|
| Backend Python modules | ~20 files |
| Frontend JSX/JS modules | ~24 files |
| API endpoints | 6 |
| Pipeline stages | 6 (+ 2 concurrent sub-stages) |
| Supported domains | 7 |
| Active generator models | 2 (GPT-4o-mini, Gemini 2.5 Flash) |
| Judge model | 1 (GPT-4o) |
| Embedding model | 1 (text-embedding-3-small, 1536-dim) |
| External APIs | 4 (OpenAI, Gemini, xAI, Wikipedia) |
| Database layers | 2 (SQLite primary, Supabase secondary) |
| Benchmark dataset | 50 TruthfulQA questions |
| Frontend framework | React 18 + Vite |
| Styling | Tailwind CSS (utility-first) |
| Animation library | Framer Motion |
| Charting library | Recharts |
| Real-time protocol | Server-Sent Events (SSE) |

---

*CleverPick — because knowing which AI to trust matters.*
