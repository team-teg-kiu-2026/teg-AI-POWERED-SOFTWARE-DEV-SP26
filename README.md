# NutriSmart

An AI-powered nutrition assistant that helps university students maintain balanced daily nutrition without manual tracking.

## What It Does

NutriSmart lets users log meals via text or photo, and tell the AI what ingredients they have in their fridge and pantry. The AI analyzes nutrient intake, detects imbalances (e.g., too much sugar, missing protein), and suggests corrections using foods the user actually has at home.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js |
| Backend | Flask (Python) |
| AI Model | Gemini 3 Flash (via OpenRouter) |
| Fallback AI | GPT-4o (via OpenRouter) |
| Database | Supabase (PostgreSQL) |
| Hosting | Vercel (frontend) + Render (backend) |

## Getting Started

1. Clone the repo
2. Copy `.env.example` to `.env` and fill in your API keys
3. Install dependencies:
   - Frontend: `cd frontend && npm install`
   - Backend: `cd backend && pip install -r requirements.txt`
4. Run the app:
   - Frontend: `cd frontend && npm run dev`
   - Backend: `cd backend && python app.py`

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
| Meal analysis (text) | `google/gemini-flash-1.5` via OpenRouter | Low latency, cost-effective for structured JSON output | `gemini-2.5-flash`: higher quality but 4× cost |
| Meal analysis (image) | `google/gemini-flash-1.5` via OpenRouter | Multimodal support at low cost | `openai/gpt-4o`: better vision but 50× cost |
| Fallback (all calls) | `openai/gpt-4o` via OpenRouter | Reliable fallback; different provider reduces correlated failures | `claude-sonnet-4-5`: comparable but not yet tested |
| LLM-as-judge (eval) | `google/gemini-flash-1.5` | Fast, cheap, sufficient for pass/fail verdicts | `openai/gpt-4o`: more accurate but adds eval cost |

## Course

CS-AI-2025 — Building AI-Powered Applications | Spring 2026
Kutaisi International University
