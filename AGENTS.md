# AGENTS.md

## Project Overview

**NutriSmart** is an AI-powered nutrition assistant for university students. Users register an account, define their fridge/pantry inventory, log meals (text or photo), and get real-time nutrient analysis plus correction suggestions that use ingredients they already have at home. The app plans weekly meals via AI, auto-generates shopping lists, and tracks cross-day imbalance detection backed by a personalized profile.

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

- **Naming:** kebab-case routes (`/log`, `/coach`, `/calendar`), snake_case Python, camelCase TypeScript, `font-headline` (Manrope) for headings + `font-body`/`font-label` (Inter) elsewhere.
- **Branching:** all changes via PRs to `main`; the other team member reviews before merge (see `TEAM-CONTRACT.md`).
- **Testing:** Pytest for backend (`tests/`), Jest for frontend (`frontend/`). Run `python -m pytest` and `npm test`.
- **Design system:** Vitality Framework — primary `#176a21`, secondary `#006666`, tertiary `#a83206`, `0.75rem` `rounded-xl` default. Tokens live in `frontend/tailwind.config.ts`; component classes in `frontend/app/globals.css` (`.card-soft`, `.btn-primary`, `.btn-soft`, `.input-soft`).
- **API centralization:** All backend calls go through `frontend/lib/api.ts` — never duplicate fetch logic in page files.
- **Auth:** `frontend/lib/auth.tsx` provides `AuthProvider`, `useAuth()`, and `useUserId()`. All pages use `useUserId()` instead of hardcoded user IDs.
- **Comments:** minimal — explain *why* not *what*. Don't repeat what the code says.

## Important Files

- `backend/app.py` — Flask API endpoints (analyze, chat, profile, plan, meal-plans, shopping-list, inventory, history, auth, export, user/data)
- `backend/ai.py` — OpenRouter calls (env-driven chain: `gemini-2.5-flash` primary → `gpt-4o` → `llama-3.3-70b` fallback), prompt-injection defenses (`_wrap_untrusted`/`_filter_output`), plan_day, plan_week, generate_shopping_list, timeout + exponential backoff, episode-logged
- `backend/db.py` — Supabase helpers; all queries filter by `user_id`. Tables: inventory, meal_logs, user_profiles, meal_plans, shopping_items
- `backend/mcp_server.py` — MCP server (`search_food_database`, `log_meal_intake`) with HMAC auth + Pydantic validation
- `backend/episode_logger.py` — `logs/episode-log.jsonl` writer; never logs raw meal text
- `backend/schema.sql` — authoritative Supabase schema (5 tables)
- `frontend/lib/api.ts` — typed backend client (single source of truth for ALL API calls)
- `frontend/lib/auth.tsx` — AuthProvider context, useAuth(), useUserId()
- `frontend/app/_chrome.tsx` — shared TopBar + 5-item BottomNav
- `frontend/app/globals.css` + `tailwind.config.ts` — design tokens
- `docs/design-review/DESIGN-REVIEW.md` — Lab 3 spec, what we promised
- `docs/data-map.md` — GDPR / retention contract
- `docs/safety-audit.md` — Lab 8 audit, agent architecture, eval results
- `.env.example` — required environment variables (never commit `.env`)

## Routes

| Route | Page | Description |
|-------|------|-------------|
| `/` | Dashboard | Calorie ring, macro bars, today's meals, AI insight |
| `/log` | Log Meal | Photo scan or text entry, AI nutrient analysis, save to history |
| `/inventory` | Pantry | CRUD fridge/pantry items with icon tiles |
| `/history` | History | Date-filtered meal log with macro consistency bars |
| `/coach` | AI Coach | Chat with AI nutrition coach |
| `/plan` | Day Plan | AI-generated single-day meal plan |
| `/calendar` | Calendar | 7-day week view, AI weekly plan, manual meal entry |
| `/shopping` | Shopping | Auto-generated shopping list from weekly plan |
| `/settings` | Settings | Profile targets, diet/goals, about you, GDPR export/delete, logout |
| `/login` | Login | Email/password login |
| `/register` | Register | Email/password signup |

## What Not to Touch Without Team Discussion

- `backend/schema.sql` + any Supabase migration — keep the file authoritative; coordinate before applying.
- `docs/design-review/DESIGN-REVIEW.md` and `docs/safety-audit.md` — graded submissions; only edit with both members present.
- `.env*` — secrets. Never commit `.env`; update `.env.example` only when adding a new required variable.
- Anything under `Lab-1/` … `Lab-9/` — course curriculum artifacts, not our app code.

## Current Focus

Full feature set implemented:
- Auth (login/register) with Supabase
- Weekly AI meal calendar with manual entry
- Auto-generated shopping list (compares plan vs inventory)
- Profile-aware AI analysis, planning, and coaching
- GDPR export/delete
- Centralized API client and auth context

Next planned: voice meal logging (TTS/STT), meal image generation on calendar, rate limiting, tighter RLS policies.
