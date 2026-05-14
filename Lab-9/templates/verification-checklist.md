# Lab 9 Golden Set Review Checklist

**Use this to self-assess your golden set before and during the lab session.**
**The Safety Audit deadline is Thursday 21 May at 23:59.**

---

**Team name:** ______________________________

---

## Step 1 — Composition Check

Count your questions by type. You need exactly this distribution:

| Type | Required | Yours |
|------|----------|-------|
| Factual / retrieval | 3 | |
| Reasoning / multi-step | 2 | |
| Edge case / boundary | 2 | |
| Refusal / safety | 2 | |
| Format / structure | 1 | |
| **Total** | **10** | |

If you have fewer than 2 refusal questions, stop and write them now before proceeding.

---

## Step 2 — Rubric Quality Check

For each question, read the rubric aloud. Then answer:

| Question ID | Rubric contains "good/helpful/appropriate" without specifics? | Can a stranger produce a deterministic verdict? | Action needed |
|------------|--------------------------------------------------------------|------------------------------------------------|---------------|
| g001 | Yes / No | Yes / No | |
| g002 | Yes / No | Yes / No | |
| g003 | Yes / No | Yes / No | |
| g004 | Yes / No | Yes / No | |
| g005 | Yes / No | Yes / No | |
| g006 | Yes / No | Yes / No | |
| g007 | Yes / No | Yes / No | |
| g008 | Yes / No | Yes / No | |
| g009 | Yes / No | Yes / No | |
| g010 | Yes / No | Yes / No | |

Rewrite any rubric where you answered "Yes" in column 2 or "No" in column 3.

---

## Step 3 — Runner Check

Before running the async golden set runner:

- [ ] App is running: `curl http://localhost:8000/api/ai/chat -H "Content-Type: application/json" -d '{"message":"test"}'` returns a response
- [ ] `OPENROUTER_API_KEY` is set: `echo $OPENROUTER_API_KEY` shows a non-empty value
- [ ] Questions copied from `eval/golden_set.json` into `starter-code/eval/async_golden_set.py`
- [ ] `YOUR_APP_ENDPOINT` updated to your local endpoint URL

Run the script:
```bash
python starter-code/eval/async_golden_set.py
```

When it completes — even with a low score — commit immediately:
```bash
git add eval/results/
git commit -m "eval: first lab9 golden set run"
git push origin main
```

First run score: _______ / 10

---

## Step 4 — Safety Audit Document Progress

| Area | Description | Status | Complete by |
|------|-------------|--------|-------------|
| A1: Episode Log | 100+ entries, all fields present | In lab | Today |
| A2: Agent Architecture | README section with dataclass and action map | In lab | Today |
| A3: MCP Security | Auth rejection + validation + audit log + error sanitisation | After lab | Tue 19 May |
| A4: Resilience | Timeout + backoff on every LLM call | In lab | Today |
| A5: Golden Test Set | 10 questions, 7+ pass, results committed | In lab | Today |
| A6: Data Governance | Isolation test + data map + PII check + .env check | After lab | Wed 20 May |

**Final commit of `docs/safety-audit.md`: Thursday 21 May at 23:59**

---

## Remaining Tasks After the Lab

- [ ] Run MCP server, test bad token rejection, paste terminal output into audit doc (Area 3)
- [ ] Run cross-user isolation test, paste PASS output into audit doc (Area 6)
- [ ] Complete data-map.md with data types, storage locations, retention periods, deletion methods
- [ ] Run `grep -r "email\|phone\|password" logs/` — confirm no PII in episode log
- [ ] Run `git log --all -- .env` — confirm returns nothing
- [ ] Final commit and push of `docs/safety-audit.md` before 23:59 on Thursday 21 May

---

*Verification Checklist · Lab 9 · CS-AI-2025 · Spring 2026*
