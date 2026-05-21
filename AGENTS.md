# AGENTS.md

## Project Overview

**NutriSmart** is an AI-powered nutrition assistant for university students. Users define their fridge/pantry inventory, log meals (text or photo), and get real-time nutrient analysis plus correction suggestions that use ingredients they already have at home. The differentiator over generic calorie trackers is cross-day imbalance detection backed by a personalized profile.

## Development Setup

Copy `.env.example` to `.env` and fill in real values. Required keys: `OPENROUTER_API_KEY`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `NEXT_PUBLIC_API_URL`, `MCP_SECRET_KEY`.

```bash
# Backend (Flask, Python 3.10+)
cd backend
pip install -r requirements.txt
python app.py            # http://localhost:5000

# Frontend (Next.js 15)
cd frontend
npm install
npm run dev              # http://localhost:3000
```

Windows note: `pip-system-certs` (in `backend/requirements.txt`) is needed when an AV product (e.g. Norton) MITMs HTTPS, so Python's TLS goes through the system trust store.

## Key Conventions

- **Naming:** kebab-case routes (`/log`, `/coach`), snake_case Python, camelCase TypeScript, `font-headline` (Manrope) for headings + `font-body`/`font-label` (Inter) elsewhere.
- **Branching:** all changes via PRs to `main`; the other team member reviews before merge (see `TEAM-CONTRACT.md`).
- **Testing:** Pytest for backend (`tests/`), Jest for frontend (`frontend/`). Run `python -m pytest` and `npm test`.
- **Design system:** Vitality Framework — primary `#176a21`, secondary `#006666`, tertiary `#a83206`, `0.75rem` `rounded-xl` default. Tokens live in `frontend/tailwind.config.ts`; component classes in `frontend/app/globals.css` (`.card-soft`, `.btn-primary`, `.btn-soft`, `.input-soft`).
- **Comments:** minimal — explain *why* not *what*. Don't repeat what the code says.

## Important Files

- `backend/app.py` — Flask API endpoints (analyze, profile, plan, inventory, history, export, user/data)
- `backend/ai.py` — OpenRouter calls (Gemini 3 Flash primary, GPT-4o fallback), timeout + exponential backoff, episode-logged
- `backend/db.py` — Supabase helpers; all queries filter by `user_id`
- `backend/mcp_server.py` — MCP server (`search_food_database`, `log_meal_intake`) with HMAC auth + Pydantic validation
- `backend/episode_logger.py` — `logs/episode-log.jsonl` writer; never logs raw meal text
- `backend/schema.sql` — authoritative Supabase schema (inventory, meal_logs, user_profiles)
- `frontend/app/_chrome.tsx` — shared TopBar + 5-item BottomNav
- `frontend/app/globals.css` + `tailwind.config.ts` — design tokens
- `frontend/lib/api.ts` — typed backend client (single source of truth)
- `docs/design-review/DESIGN-REVIEW.md` — Lab 3 spec, what we promised
- `docs/data-map.md` — GDPR / retention contract
- `docs/safety-audit.md` — Lab 8 audit, agent architecture, eval results
- `.env.example` — required environment variables (never commit `.env`)

## What Not to Touch Without Team Discussion

- `backend/schema.sql` + any Supabase migration — keep the file authoritative; coordinate before applying.
- `docs/design-review/DESIGN-REVIEW.md` and `docs/safety-audit.md` — graded submissions; only edit with both members present.
- `.env*` — secrets. Never commit `.env`; update `.env.example` only when adding a new required variable.
- Anything under `Lab-1/` … `Lab-9/` — course curriculum artifacts, not our app code.

## Current Focus

Post Lab 8 (Safety + Eval audit submitted at commit `bc11e96`). Now extending the product surface to match the Design Review's full feature list:
- `/coach` AI chat (live)
- `/plan` AI meal planner (live)
- `/settings` profile + GDPR (live)
- Dashboard reads from `/api/profile` so calorie/macro targets are personalized.
- Cross-day imbalance context now passed into `/api/analyze` server-side.

Next planned: real Supabase auth (replace hardcoded `demo-user`), voice meal logging (TTS/STT), generated meal-image previews on `/plan`.
