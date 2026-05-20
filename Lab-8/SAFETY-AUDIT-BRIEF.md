# Safety and Evaluation Audit — Brief

**CS-AI-2025 · Building AI-Powered Applications · Spring 2026**
**Worth: 10 points · Evidence Due: Thursday 14 May 2026 at 23:59**
**Live Verification: Friday 15 May 2026 · Week 11 Lab Session**

---

## What This Is

The Safety and Evaluation Audit is a graded review of the safety, evaluation, and data governance practices you have been building into your capstone since Lab 3. It is not a new assignment. It is an audit of work that should already exist. If you have followed the lab requirements each week, most evidence already lives in your repository.

The audit has two phases:

**Phase 1 — Document submission (Thursday 14 May 23:59):** You submit `docs/safety-audit.md` to your team repository. This document links to and summarises all required evidence. The instructor reads this before the lab.

**Phase 2 — Live verification (Friday 15 May, Week 11 lab):** You demonstrate the following live during the lab session: your golden test set running, your MCP auth rejection working, and your cross-user isolation test passing. This is a verification session, not a tutorial. Come prepared to run these in the first 20 minutes of lab.

---

## Grading Breakdown — 10 Points Total

### Area 1: Episode Log Quality — 2 Points

Your episode log must have been running since at least Lab 6 and must contain all required fields.

**Evidence required in docs/safety-audit.md:**
- A link to your episode log file in the repository
- A sample of 5 consecutive entries showing all fields
- A count of total entries (must be 100 or more from Lab 6 onward)

**Required fields on every LLM call entry (from Lab 8 onward):**

```json
{
  "ts": 1746700800.0,
  "event_type": "llm_call",
  "model": "google/gemini-2.5-flash-preview",
  "input_tokens": 1850,
  "output_tokens": 312,
  "cache_read_tokens": 1620,
  "cache_write_tokens": 0,
  "cost_usd": 0.00041,
  "latency_ms": 743,
  "provider": "google",
  "fallback_triggered": false,
  "error": null
}
```

**Required fields on every MCP tool call entry:**

```json
{
  "ts": 1746700801.2,
  "event_type": "mcp_tool_call",
  "tool_name": "search_knowledge",
  "input_hash": "a3f7b2...",
  "result_status": "ok",
  "latency_ms": 142,
  "error": null
}
```

**Scoring:**
- 2 pts: 100+ entries, all required fields present, both LLM and MCP call types represented
- 1 pt: 50+ entries, most required fields present, only one entry type
- 0 pts: fewer than 50 entries, or fields consistently missing

---

### Area 2: Agent Architecture Documentation — 1 Point

Your README must have a section titled exactly "Agent Architecture" containing four things.

**Evidence required in docs/safety-audit.md:**
- A link to the Agent Architecture section in your README
- A one-sentence summary of the pattern you chose and why

**The four required elements in your README Agent Architecture section:**
1. Which pattern you are using: orchestrator/specialist, supervisor/worker, pipeline, or single agent with justification
2. Your AgentState dataclass (or equivalent) with all fields named and typed
3. A list of every irreversible action your agent can take
4. For each irreversible action: the checkpoint, guard, or approval gate that prevents unintended execution

**Scoring:**
- 1 pt: all four elements present, irreversible actions explicitly mapped to guards
- 0.5 pt: pattern and AgentState present but irreversible action mapping incomplete
- 0 pts: section missing or contains only a description without the dataclass

---

### Area 3: MCP Server Security — 2 Points

Your MCP server must pass four security checks.

**Evidence required in docs/safety-audit.md:**
- A link to your MCP server source code
- Terminal output showing a bad token returning a structured error (not a traceback)
- A code snippet showing your Pydantic validation schema for at least one tool
- A sample JSON entry from your MCP audit log

**The four security checks:**

| Check | Pass Criteria |
|---|---|
| Bearer token authentication | Token verified before any tool logic runs. Bad token returns `{"error": "unauthorized"}` |
| Pydantic input validation | Every tool input parameter validated against a schema before execution |
| Structured audit logging | Every tool call produces a JSON log entry with tool_name, input_hash, result_status, latency_ms |
| Sanitised error responses | Internal errors return a structured error code. No tracebacks, file paths, or env var names exposed |

**Scoring:**
- 2 pts: all four checks pass with evidence
- 1 pt: two or three checks pass with evidence
- 0.5 pt: one check passes with evidence
- 0 pts: no checks pass or no MCP server exists

---

### Area 4: Resilience Patterns — 1 Point

Your codebase must show that every LLM call has a timeout and retry with exponential backoff.

**Evidence required in docs/safety-audit.md:**
- A code snippet showing timeout on an LLM call
- A code snippet showing your retry/backoff implementation
- A note confirming this pattern is applied to all LLM calls, not just one

**Pass criteria:** `asyncio.wait_for` or equivalent wraps every LLM call. Retry logic uses exponential backoff with at least 2 retries. The episode log captures failed attempts before eventual success.

**Scoring:**
- 1 pt: both timeout and retry present, applied consistently
- 0.5 pt: one of the two present
- 0 pts: neither present

---

### Area 5: Golden Test Set and Evaluation — 2 Points

You must have a set of 10 test questions with expected answers, an evaluation script, and committed results.

**Evidence required in docs/safety-audit.md:**
- Your 10 golden questions listed in the document (or a link to your golden set JSON file)
- The pass/fail result for each question from your most recent evaluation run
- A link to the evaluation script in your repository

**What the golden test set must contain:**
- 10 question-answer pairs relevant to your capstone's core functionality
- At least 2 edge cases or refusal tests (questions your agent should decline or handle carefully)
- Expected answers or rubrics that are specific enough to evaluate programmatically
- LLM-as-judge script that produces a pass/fail verdict and a reason per question

**In the Week 11 lab you will run the evaluation script live.** It must complete in under 3 minutes.

**Scoring:**
- 2 pts: 10 questions, evaluation script runs cleanly, 7 or more pass, committed results file exists
- 1 pt: 10 questions exist, script runs, fewer than 7 pass or results not committed
- 0.5 pt: fewer than 10 questions or script does not run
- 0 pts: no golden set

---

### Area 6: Data Governance Evidence — 2 Points

You must demonstrate that your data governance plan (submitted with the Design Review) has been implemented.

**Evidence required in docs/safety-audit.md:**

**Cross-user isolation (required):**
- The isolation test script or procedure
- Terminal output showing the test passing: User B cannot retrieve User A's data

**Data retention policy (required):**
- A link to your `docs/data-map.md` or equivalent document showing: what data is stored, where, how long it is retained, and how a user can delete it
- Confirmation that no PII appears in your episode log (show a log sample and confirm it contains no names, emails, or phone numbers)

**API key security (required):**
- Confirmation that `.env` was never committed: `git log --all -- .env` returns nothing

**Scoring:**
- 2 pts: isolation test passes, data map complete, PII-free logs confirmed, no .env in history
- 1 pt: two of the three areas covered
- 0.5 pt: one area covered
- 0 pts: no evidence

---

## What to Submit

A single markdown file at `docs/safety-audit.md` in your team repository. Use the template in `templates/safety-audit-template.md` from the Lab 8 folder.

The document must be committed to the branch that was tagged `lab8-mcp-capstone`. If you need to add evidence after the tag, make a new commit and submit the commit SHA in your document.

**Deadline: Thursday 14 May 2026 at 23:59.**

Late submissions follow the course policy: 10% deduction per 24 hours up to 72 hours. Beyond 72 hours requires instructor approval.

---

## What Happens in Week 11 Lab

The Week 11 lab (Friday 15 May) is a 2-hour verification session. Bring your laptop and your team.

In the first 20 minutes, each team demonstrates three things live:

1. **Golden test set run:** `python eval/run_golden_set.py` completes without errors and produces a pass/fail summary.
2. **MCP auth rejection:** Call your MCP tool with an invalid token. Show the structured error response.
3. **Cross-user isolation:** Run your isolation test. Show the passing terminal output.

The instructor then reviews your `docs/safety-audit.md` and asks follow-up questions about your evidence. The remaining lab time is used to complete any missing items and to introduce the Week 11 lecture content on evaluation and observability.

**If you have not submitted `docs/safety-audit.md` before the lab, you lose the Phase 1 evidence component and the instructor can only grade what is demonstrated live.**

---

## Model Selection Decisions Table

In addition to the six audit areas, your README must contain a "Model Selection Decisions" section added in Lab 8. This is not graded separately — it is read as part of the agent architecture documentation.

Format:

| Call Location | Current Model | Reason for Choice | Alternative Considered |
|---|---|---|---|
| Intent classification | gemini-2.0-flash | Free tier, speed priority, binary output | gemini-2.5-flash: overkill |
| RAG answer generation | gemini-2.5-flash-preview | Accuracy matters, moderate cost | claude-sonnet-4-5: 20x cost |
| Code review tool | claude-sonnet-4-5 | Best code quality for this task | gemini-2.5-pro: comparable but slower |

---

## Quick Reference: Evidence Checklist

Use this before submitting:

```
Episode Log (2 pts)
[ ] 100+ entries in log file
[ ] LLM call entries have: cache_read_tokens, latency_ms, fallback_triggered
[ ] MCP tool entries have: tool_name, input_hash, result_status, latency_ms
[ ] At least one error entry present

Agent Architecture (1 pt)
[ ] README has "Agent Architecture" section
[ ] Pattern choice stated with justification
[ ] AgentState dataclass present with typed fields
[ ] Every irreversible action mapped to a checkpoint or guard

MCP Security (2 pts)
[ ] Bearer token auth — bad token test output shown
[ ] Pydantic validation — schema shown in code snippet
[ ] Structured audit log — sample JSON entry shown
[ ] Error sanitisation — forced error shows clean response

Resilience (1 pt)
[ ] Timeout on every LLM call
[ ] Exponential backoff retry present

Golden Test Set (2 pts)
[ ] 10 questions with expected answers committed
[ ] Evaluation script exists and runs
[ ] Results file committed with most recent run

Data Governance (2 pts)
[ ] Cross-user isolation test passes
[ ] Data map document complete
[ ] PII confirmed absent from episode log
[ ] No .env in git history
```

---

*Safety and Evaluation Audit Brief · CS-AI-2025 · Spring 2026 · KIU*
