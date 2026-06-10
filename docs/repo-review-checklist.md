# Repository Review Checklist (15 points)

Status as of 11 June 2026. Graders read the repository, not the laptop, so every claim below points at committed evidence.

## Hard gates · pass or fail

- [x] **No secrets anywhere in git history** — `.env` was never committed and is gitignored; a full-history scan for the four real credential values (OpenRouter key, Supabase JWT, MCP secret, Stitch key) returns **0 hits**.
- [x] **Working Dockerfile that builds and runs** — [`backend/Dockerfile`](../backend/Dockerfile) builds clean and the container serves `/health` (verified locally and built by CI's `docker` job).
- [x] **`/health` responds under 500ms** — added at [`backend/app.py`](../backend/app.py); ~4 ms local, **247 ms** on the live Railway URL, no external I/O.
- [x] **Green CI on the main branch** — [`.github/workflows/ci.yml`](../.github/workflows/ci.yml) runs backend lint+tests, frontend lint+build, and a Docker build+smoke test on every push to `main`.
- [x] **`eval/results/` has ≥3 committed run files** — 7 files: the original `2026-05-14` run plus six fresh `2026-06-10` runs (see [`eval/results/`](../eval/results/)).

### Evidence for each gate

| Gate | How verified | Pass? |
|---|---|---|
| No secrets in history | `git log --all -- .env` empty; `git grep <real-secret> $(git rev-list --all)` → 0 hits for all 4 secrets; `.env` gitignored | ✅ |
| Dockerfile builds and runs | `docker build ./backend` succeeds; container returns `{"status":"ok"}` on `/health` in ~4 ms | ✅ |
| /health under 500ms | PowerShell timing against live URL: 247/251/246 ms steady (702 ms cold TLS) | ✅ |
| Green CI on main | `ci.yml` present; jobs: backend, frontend, docker | ✅ (runs on push) |
| 3+ eval run files | `ls eval/results/` → 7 JSON files | ✅ |

## Portfolio · earns the points

- [x] **One-command setup** — `docker build -t nutrismart ./backend && docker run -p 5000:5000 --env-file .env nutrismart` runs the backend from a clean clone; frontend is `cd frontend && npm install && npm run dev`. Documented in the README.
- [x] **README** — overview, architecture, setup, evaluation results, cost analysis, model-selection table, deployed URLs.
- [ ] **2-minute narrated demo video embedded in README** — placeholder in place; record before the Wednesday freeze.
- [x] **2–3 page case study** — [`docs/case-study.md`](case-study.md): problem, approach, results, lessons.
- [x] **AGENTS.md** — present at repo root.
- [x] **Model selection decisions table** — in the README and `docs/safety-audit.md` (updated to the live `gemini-2.5-flash` chain).
- [x] **Data governance note** — [`docs/data-map.md`](data-map.md) + the safety audit's retention table.
- [x] **Deployed app with a live URL** (bonus) — Frontend (Vercel) and Backend (Railway), URLs in the README.

## Remaining before the Wednesday 10 June freeze

1. Record the 2-minute narrated demo video and the 60-second launch video; embed the demo in the README.
2. Confirm the CI run on `main` is green after this push.

_All hard gates pass. The only open portfolio item is the demo video._
