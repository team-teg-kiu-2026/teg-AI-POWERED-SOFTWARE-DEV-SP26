# Safety and Evaluation Audit

**Team Name:**
**Team Members:**
**Repository:** https://github.com/ZA-KIU-Classroom/AI-POWERED-SOFTWARE-DEV-SP26/[your-team-repo]
**Audit Commit:** [SHA of your lab8-mcp-capstone tag or most recent commit]
**Submitted:** [Date]

---

## Area 1: Episode Log Quality — /2 pts

**Link to episode log file:**
[e.g. https://github.com/.../logs/episode-log.jsonl]

**Total entry count:**
[Count the lines in your log file: `wc -l logs/episode-log.jsonl`]

**Sample — 5 consecutive entries (paste here):**

```json
[paste 5 entries from your episode log]
```

**Confirm all required fields are present on LLM call entries (tick each):**

- [ ] ts
- [ ] event_type: "llm_call"
- [ ] model
- [ ] provider
- [ ] input_tokens
- [ ] output_tokens
- [ ] cache_read_tokens (may be 0, must exist)
- [ ] cache_write_tokens (may be 0, must exist)
- [ ] cost_usd
- [ ] latency_ms
- [ ] fallback_triggered
- [ ] error (may be null, must exist)

**Confirm MCP tool call entries exist (tick each):**

- [ ] ts
- [ ] event_type: "mcp_tool_call"
- [ ] tool_name
- [ ] input_hash
- [ ] result_status
- [ ] latency_ms

---

## Area 2: Agent Architecture Documentation — /1 pt

**Link to Agent Architecture section in README:**
[e.g. https://github.com/.../README.md#agent-architecture]

**Pattern in use (circle one):** Orchestrator/Specialist · Supervisor/Worker · Pipeline · Single Agent

**One-sentence justification for your pattern choice:**
[Write here]

**Confirm all four elements are present in the README section (tick each):**

- [ ] Pattern choice stated with justification
- [ ] AgentState dataclass with all fields named and typed
- [ ] List of every irreversible action your agent can take
- [ ] Each irreversible action mapped to its checkpoint or guard

---

## Area 3: MCP Server Security — /2 pts

**Link to MCP server source code:**
[e.g. https://github.com/.../mcp-server/]

### Auth Test Output

Paste the terminal output of calling your tool with an invalid token:

```
[paste terminal output here]
```

Confirm the output is a structured JSON error (not a traceback): [ ]

### Input Validation Code Snippet

Paste your Pydantic schema for at least one tool:

```python
[paste code here]
```

### MCP Audit Log Sample

Paste 3 entries from your MCP audit log:

```json
[paste entries here]
```

### Error Sanitisation Test

Describe the forced error you triggered and what the caller received:

**What you broke:**
[e.g. "Commented out the database connection function that search_knowledge calls"]

**What the caller received:**
[paste the response]

Confirm it contains no traceback, file paths, or environment variable names: [ ]

---

## Area 4: Resilience Patterns — /1 pt

### Timeout Implementation

Paste your timeout code:

```python
[paste code here]
```

Confirm timeout is applied to every LLM call (not just one): [ ]

### Retry and Backoff Implementation

Paste your retry/backoff code:

```python
[paste code here]
```

Confirm retry uses exponential backoff with at least 2 retries: [ ]

---

## Area 5: Golden Test Set and Evaluation — /2 pts

**Link to golden set file:**
[e.g. https://github.com/.../eval/golden_set.json or list them in full below]

**Link to evaluation script:**
[e.g. https://github.com/.../eval/run_golden_set.py]

**Link to most recent results file:**
[e.g. https://github.com/.../eval/results/golden-set-results-20260512-143022.json]

### Results Summary

| Question ID | Category | Pass/Fail | Reason (if fail) |
|---|---|---|---|
| g001 | factual | | |
| g002 | factual | | |
| g003 | reasoning | | |
| g004 | reasoning | | |
| g005 | refusal | | |
| g006 | refusal | | |
| g007 | edge_case | | |
| g008 | edge_case | | |
| g009 | format | | |
| g010 | format | | |

**Overall score:** [X]/10

**If fewer than 7 pass, explain what you are doing to improve:**
[Write here]

---

## Area 6: Data Governance Evidence — /2 pts

### Cross-User Isolation Test

**Test procedure (describe what you did):**
[Write here]

**Test output (paste terminal output showing the test passing):**

```
[paste output here]
```

### Data Retention Policy

**Link to data-map.md or equivalent document:**
[Write here]

**Summary of what is stored and for how long:**

| Data Type | Storage Location | Retention Period | Deletion Method |
|---|---|---|---|
| Conversation history | | | |
| Uploaded files | | | |
| Episode log | | | |
| User preferences | | | |

### PII in Episode Log

**Command you ran to check:**
```bash
grep -E "[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}" logs/episode-log.jsonl
```

**Output (paste):**
[If empty, PII check passes]

### API Key Security

**Command you ran:**
```bash
git log --all --full-history -- .env
```

**Output (should be empty):**
[paste here]

---

## Model Selection Decisions Table

*(This is read as part of Area 2 — paste your README table here for completeness)*

| Call Location | Current Model | Reason | Alternative Considered |
|---|---|---|---|
| | | | |
| | | | |
| | | | |

---

## Live Verification Preparation

Confirm you are ready for the Week 11 lab (Friday 15 May):

- [ ] `python eval/run_golden_set.py` runs to completion without errors
- [ ] MCP auth rejection demo is reproducible on your laptop
- [ ] Cross-user isolation test script or procedure is documented and runnable
- [ ] Team members know who will demo each of the three live checks

---

*Safety and Evaluation Audit · CS-AI-2025 · Spring 2026 · KIU*
