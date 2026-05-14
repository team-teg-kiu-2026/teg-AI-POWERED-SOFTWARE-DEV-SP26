# Lab 9 Quickstart

**The Safety Audit deadline has been extended to Thursday 21 May at 23:59.**
Lab 9 is your primary build session. Use the full two hours.

---

## Before You Arrive (Thursday Evening / Friday Morning)

### 1 — Read the Safety Audit Brief

Open `SAFETY-AUDIT-BRIEF.md` in the Lab 8 folder on GitHub. Read all six evidence areas and the point breakdown. Understand what you need to produce before Thursday 21 May.

### 2 — Draft Your Golden Set Questions

Before the lab, draft at least 5 of your 10 golden questions in `eval/golden_set.json`. Use the composition rule from the Week 11 lecture: 3 factual, 2 reasoning, 2 edge case, 2 refusal, 1 format. You do not need all 10 perfect before the session — the first 30 minutes of the lab are for writing and reviewing them with the instructor.

### 3 — Confirm Your App Runs Locally

```bash
cd backend && uvicorn main:app --reload
curl http://localhost:8000/api/ai/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "test", "conversation_history": []}'
```

If this does not return a response, fix it before the lab. The golden set runner calls this endpoint for every question.

### 4 — Confirm Your OpenRouter Key Is Set

```bash
echo $OPENROUTER_API_KEY
```

If it is empty: `export OPENROUTER_API_KEY=your_key_here`. The async golden set runner calls the judge model through OpenRouter.

---

## The Morning Of (Friday 15 May)

Arrive 5 minutes before your group starts. Open three things immediately:

1. Your terminal with the app running (`uvicorn main:app --reload`)
2. `eval/golden_set.json` open in your editor — you will be writing questions
3. `starter-code/eval/async_golden_set.py` from the Lab 9 folder — this is your runner

---

## Session Playbook

```
Minutes 0–5:   Arrival and setup
Minutes 5–10:  Instructor opens — session goals, golden set composition reminder
Minutes 10–30: Write and finalise your 10 golden questions — instructor circulates
Minutes 30–50: Run async_golden_set.py — debug with instructor support
Minutes 50–70: Commit results, begin docs/safety-audit.md — complete Areas 1, 2, 4, 5
Minutes 70–80: Whole room golden set commit window
Minutes 80–95: Metrics script (Target 1) and model selection review (Target 2)
Minutes 95–105: Part 2 continued or open Lab 8 gap work
Minutes 105–110: Commit lab9-hardening tag, wrap-up
```

---

## What You Still Need to Complete Before Thursday 21 May at 23:59

After the lab, three areas of the Safety Audit still require work outside the session:

**Area 3 — MCP Server Security:** Run your MCP server, test auth rejection with a bad token, confirm the structured JSON error response, and paste terminal output into `docs/safety-audit.md`.

**Area 6 — Data Governance:** Run your cross-user isolation test, confirm User B cannot retrieve User A's data, confirm no PII in your episode log, confirm no `.env` in git history.

**Final commit:** Push the completed `docs/safety-audit.md` to your team repo before 23:59 on Thursday 21 May. The timestamp on that commit is your submission.

---

*Lab 9 Quickstart · CS-AI-2025 · Spring 2026 · KIU*
