# NutriSmart

An AI-powered nutrition assistant that helps university students maintain balanced daily nutrition without manual tracking.

## What It Does

NutriSmart lets users log meals via text or photo, and tell the AI what ingredients they have in their fridge and pantry. The AI analyzes nutrient intake, detects imbalances (e.g., too much sugar, missing protein), and suggests corrections using foods the user actually has at home.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js |
| Backend | Flask (Python), gunicorn + gthread workers |
| AI Model | Gemini 2.5 Flash (via OpenRouter) |
| Fallback AI | GPT-4o → Llama 3.3 70B (via OpenRouter) |
| Database | Supabase (PostgreSQL, EU) |
| Hosting | Vercel (frontend) + Railway (backend) |

## Live Demo

- **App (Vercel):** https://frontend-eight-jet-41.vercel.app
- **API (Railway):** https://nutrismart-production-2965.up.railway.app — health check at [`/health`](https://nutrismart-production-2965.up.railway.app/health)
- **Demo video:** _2-minute narrated walkthrough — to be embedded here before Demo Day._ -
-  google drive link: https://drive.google.com/file/d/1eX8ZZZP85G4L7hpQPVwmOQyoqsr1wn-8/view?usp=drive_link

## Getting Started

1. Clone the repo
2. Copy `.env.example` to `.env` and fill in your API keys
3. Install dependencies:
   - Frontend: `cd frontend && npm install`
   - Backend: `cd backend && pip install -r requirements.txt`
4. Run the app:
   - Frontend: `cd frontend && npm run dev`
   - Backend: `cd backend && python app.py`

### One-command backend (Docker)

From a clean clone, with `.env` filled in:

```bash
docker build -t nutrismart ./backend
docker run -p 5000:5000 --env-file .env nutrismart
# verify:  curl http://localhost:5000/health
```

## Project Structure

```
├── frontend/          ← Next.js application
├── backend/           ← Flask API server
├── docs/
│   └── design-review/ ← Design Review document and architecture diagram
├── tests/             ← Test files
├── TEAM-CONTRACT.md   ← Team agreement
├── AGENTS.md          ← AI agent configuration
├── .env.example       ← Environment variable template
└── .gitignore
```

## Team TEG

| Name | Role |
|------|------|
| Tekla Kilasonia | Frontend, UI/UX, testing |
| Giorgi Papidze | Backend, AI integration, database |

## Agent Architecture

**Pattern: Orchestrator / Specialist**

NutriSmart uses an orchestrator that routes each user request through three specialist functions in sequence. The pattern was chosen because meal analysis always follows the same fixed pipeline (receive → analyse → suggest → optionally log), but each step can fail independently and needs its own retry budget.

```
Orchestrator
  ├── nutrition_analyzer  (calls Gemini / GPT-4o via OpenRouter)
  ├── inventory_checker   (reads Supabase inventory table)
  └── meal_logger         (writes to Supabase meal_logs table)
```

### AgentState

```python
from dataclasses import dataclass, field
from typing import Optional

@dataclass
class AgentState:
    session_id:       str                    # unique per request
    user_id:          str                    # identifies the user's data partition
    user_request:     str                    # raw meal text or image path
    messages:         list[dict]             # conversation history (OpenAI format)
    inventory:        list[str]              # user's available ingredients (loaded at start)
    today_history:    list[dict]             # meals already logged today (for context)
    analysis_result:  Optional[dict]         # AI output: nutrients, imbalances, suggestions
    current_step:     str                    # "analyze" | "validate" | "log" | "done"
    approval_required: bool                  # True for irreversible actions
    approved:         bool                   # user explicitly confirmed action
    retry_count:      int                    # attempts on current step
    timeout_ms:       int = 30000            # per-LLM-call timeout
    last_error:       Optional[str] = None   # last exception message
    final_response:   Optional[dict] = None  # delivered to frontend
```

### Irreversible Action Map

| Irreversible Action | Risk | Checkpoint / Guard |
|---|---|---|
| `meal_logger.write()` — appends a meal log entry | Permanent record; affects daily nutrition totals | Requires `approved=True`; user must click "Save to log" in UI before this step executes |
| `database.delete_user_data()` — GDPR deletion | Cannot be undone; erases all history and inventory | Requires explicit confirmation dialog in UI; endpoint called only after user types "DELETE" to confirm |
| `inventory_checker.update()` — overwrites inventory | Could silently clear items if wrong data sent | Validation against Pydantic schema before any write; dry-run diff shown to user first |

### Model Selection Decisions

| Call Location | Current Model | Reason for Choice | Alternative Considered |
|---|---|---|---|
| Meal analysis (text) | `google/gemini-2.5-flash` via OpenRouter | Low latency, cost-effective for structured JSON output | `gpt-4o`: higher quality but ~50× cost |
| Meal analysis (image) | `google/gemini-2.5-flash` via OpenRouter | Multimodal support at low cost | `openai/gpt-4o`: better vision but far pricier |
| Fallback tier 2 | `openai/gpt-4o` via OpenRouter | Reliable cross-provider fallback; reduces correlated failures | `claude-sonnet-4-5`: comparable |
| Fallback tier 3 (OSS) | `meta-llama/llama-3.3-70b-instruct` via OpenRouter | Open-source last resort if both hosted tiers fail | `qwen-2.5-72b`: comparable |
| LLM-as-judge (eval) | `google/gemini-2.5-flash` | Fast, cheap, sufficient for pass/fail verdicts | `openai/gpt-4o`: more accurate but adds eval cost |

> The model chain is env-configurable (`PRIMARY_MODEL`, `SECONDARY_MODEL`, `OSS_FALLBACK`) so a deprecated slug can be swapped without a code change. The previous primary, `google/gemini-flash-1.5`, was deprecated to a 404 on OpenRouter and replaced with `google/gemini-2.5-flash`.

## Operations & Hardening

**Health & deploy.** `GET /health` does no external I/O and reports the active model chain (~4 ms local, ~250 ms live). Railway builds [`backend/Dockerfile`](backend/Dockerfile) and gates deploys on `/health`. CI ([`.github/workflows/ci.yml`](.github/workflows/ci.yml)) runs backend lint + tests, frontend lint + build, and a Docker build + smoke test on every push to `main`.

**Resilience.** Every model call has a 30 s timeout and bounded retries, then falls through the env-configurable chain `gemini-2.5-flash → gpt-4o → llama-3.3-70b`. The backend runs gunicorn with threaded (`gthread`) workers because it is I/O-bound on OpenRouter — this took load throughput from 0.73 → 3.94 req/s and `/health` p50 from 21 s → 5 ms (see [`load/load-test-report.md`](load/load-test-report.md)).

**Security.** User messages and inventory text are fenced as untrusted data; the system prompt forbids prompt/secret disclosure, role changes, and cross-user access; an output filter redacts leaked keys or prompt echoes. All four red-team attacks held — see [`docs/safety-audit.md`](docs/safety-audit.md). Offline unit tests: [`tests/test_prompt_injection.py`](tests/test_prompt_injection.py).

**Evaluation & cost.** Golden-set score **7–8/10** ([`eval/results/`](eval/results/), runner [`eval/run_eval.py`](eval/run_eval.py)); both refusal tests pass. Testing cost ≈ $0.13; projected steady-state ≈ $1–2/month on the primary model.

**More:** [case study](docs/case-study.md) · [Demo Day fix list](docs/demo-day-fix-list.md) · [Repository Review checklist](docs/repo-review-checklist.md)

## Course

CS-AI-2025 — Building AI-Powered Applications | Spring 2026
Kutaisi International University
