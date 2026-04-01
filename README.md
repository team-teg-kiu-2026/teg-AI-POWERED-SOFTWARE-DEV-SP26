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

## Course

CS-AI-2025 — Building AI-Powered Applications | Spring 2026
Kutaisi International University
