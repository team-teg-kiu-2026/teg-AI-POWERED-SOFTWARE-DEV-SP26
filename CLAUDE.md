# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**NutriSmart** — an AI-powered nutrition assistant for university students. Users log meals (text or photo), define their fridge/pantry inventory, and receive real-time nutrient analysis and correction suggestions using their available foods.

**Course:** CS-AI-2025, Building AI-Powered Applications, Spring 2026, Kutaisi International University  
**Team:** Tekla Kilasonia (Frontend/UI/Testing) · Giorgi Papidze (Backend/AI/Database)

## Development Setup

Copy `.env.example` to `.env` and populate the keys before running anything.

**Frontend (Next.js 15, React 19, TypeScript):**
```bash
cd frontend
npm install
npm run dev      # dev server
npm run build    # production build
npm run lint
npm test         # Jest
```

**Backend (Flask, Python 3.10+):**
```bash
cd backend
pip install -r requirements.txt
python app.py
```

Lab scaffold examples use FastAPI instead of Flask. To run a lab scaffold:
```bash
cd Lab-5/examples/fastapi-scaffold
uvicorn main:app --reload
```

Inspect MCP servers with:
```bash
npx @modelcontextprotocol/inspector
```

## Architecture

```
Next.js (Vercel) ──HTTP──> Flask (Render) ──OpenRouter──> Gemini 3 Flash (primary)
                                                       └──> GPT-4o (fallback)
                           Flask ──────────────────────> Supabase (PostgreSQL, EU)
```

- **Frontend:** `frontend/` — Next.js with SSR, handles all routing and UI
- **Backend:** `backend/` — Flask API, owns all AI calls and DB interactions
- **AI Gateway:** OpenRouter (`OPENROUTER_API_KEY`) unifies Gemini and GPT-4o under one API
- **Database:** Supabase — stores user food logs, inventory, preferences, nutrition history (30-day auto-delete)
- **Multimodal:** Vision (food photo recognition) + TTS/STT via OpenAI audio APIs

## Key Design Decisions

- **No direct AI calls from frontend** — all LLM interactions go through the Flask backend
- **Fallback chain:** Gemini 3 Flash → GPT-4o (configured in OpenRouter or manually)
- **No PII in API calls** — nutrition data is anonymized before leaving the backend
- **Episode logging:** AI calls are logged in JSON-lines format for tracing and cost tracking
- **Prompt injection defense:** Input validation + strict system prompt on all user-facing AI endpoints

## Repo Structure

The `Lab-1/` through `Lab-9/` directories are **course curriculum artifacts**, not the application source. Each contains:
- `examples/` — working scaffolds (FastAPI, Next.js, MCP servers, LangGraph)
- `guides/`, `homework/`, `templates/`, `resources/` — instructional materials

The actual application lives (or will live) in `frontend/` and `backend/`. The `docs/design-review/` folder contains the full system design document and architecture diagram.

## Production Targets

- Frontend deployed to **Vercel**
- Backend deployed to **Render**
- Git tags mark checkpoint completions: `lab5-working-endpoint`, `lab6-streaming`, etc.
- All changes go through pull requests with peer review before merging to `main`
