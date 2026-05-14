# Lab 9 Grading Rubric

**CS-AI-2025 · Spring 2026**

Lab 9 has no standalone point value. It is the primary build session for the Safety and Evaluation Audit (Week 11, 10 pts). The grading criteria below are identical to those in `SAFETY-AUDIT-BRIEF.md` from Lab 8. They are repeated here for reference during the session.

The Safety Audit evidence deadline is **Thursday 21 May at 23:59**. The primary evidence source is your team repo at that deadline — not a specific commit tag. Work completed in Lab 9 and pushed before the deadline counts in full. The `lab8-mcp-capstone` tag is the evidence baseline for Lab 8 deliverables (MCP security, episode log fields, caching). Golden set and evaluation evidence (Area 5) must be new work committed after Lab 9.

---

## Safety and Evaluation Audit — 10 Points Total

### Area 1: Episode Log Quality — 2 Points

Evidence source: `lab8-mcp-capstone` tag for field schema + `docs/safety-audit.md` submitted by Thursday 21 May at 23:59 with a 5-entry sample.

| Score | Criteria |
|-------|----------|
| 2 pts | 100+ entries from Lab 6 onward. All required fields present on LLM call entries: `ts`, `event_type`, `model`, `provider`, `input_tokens`, `output_tokens`, `cache_read_tokens`, `cache_write_tokens`, `cost_usd`, `latency_ms`, `fallback_triggered`, `error`. MCP tool call entries present with `tool_name`, `input_hash`, `result_status`, `latency_ms`. |
| 1 pt | 50–99 entries, or most required fields present but some missing. Only one entry type (LLM or MCP, not both). |
| 0.5 pt | Fewer than 50 entries, or multiple fields consistently missing. |
| 0 pts | No episode log file, or log is not in JSONL format. |

### Area 2: Agent Architecture Documentation — 1 Point

Evidence source: README in repo, reviewed by instructor during audit grading after Thursday 21 May deadline.

| Score | Criteria |
|-------|----------|
| 1 pt | README has a section titled exactly "Agent Architecture". Contains: pattern choice with justification, AgentState dataclass with all fields named and typed, list of every irreversible action, each irreversible action mapped to a checkpoint or guard. |
| 0.5 pt | Section present but incomplete — pattern and AgentState present, irreversible action mapping missing or partial. |
| 0 pts | Section absent, or contains only prose description without the dataclass. |

### Area 3: MCP Server Security — 2 Points

Evidence source: `docs/safety-audit.md` Area 3 section submitted by Thursday 21 May at 23:59. Must include: terminal output of bad token rejection, code showing Pydantic validation, sample entry from `logs/mcp-audit.jsonl`, and a forced error showing sanitised response.

| Score | Criteria |
|-------|----------|
| 2 pts | All four checks pass with evidence: bearer token auth (bad token returns structured JSON, not traceback), Pydantic input validation (schema shown in code), structured audit log (sample JSON entry present in `logs/mcp-audit.jsonl`), sanitised error responses (forced error returns clean error code). |
| 1 pt | Two or three checks pass with evidence. |
| 0.5 pt | One check passes. |
| 0 pts | No checks pass, or no MCP server exists. |

### Area 4: Resilience Patterns — 1 Point

Evidence source: code review via `docs/safety-audit.md` Area 4 section and direct repo navigation after the Thursday 21 May deadline.

| Score | Criteria |
|-------|----------|
| 1 pt | `asyncio.wait_for` or equivalent wraps every LLM call. Retry logic uses exponential backoff with at least 2 retries. Episode log shows failed attempts before eventual success (at least one error entry present). |
| 0.5 pt | One of the two (timeout or retry) present and applied consistently. |
| 0 pts | Neither present, or pattern exists in one place but not applied consistently. |

### Area 5: Golden Test Set and Evaluation — 2 Points

Evidence source: `eval/golden_set.json` and `eval/results/` committed to repo by Thursday 21 May at 23:59. Results file from a run after Lab 9.

| Score | Criteria |
|-------|----------|
| 2 pts | 10 questions present in golden set. Script runs to completion without errors. 7 or more pass. Results file committed to `eval/results/`. Run time under 3 minutes. |
| 1 pt | 10 questions present, script runs, fewer than 7 pass. Or: script runs, 7+ pass, but results not committed. |
| 0.5 pt | Fewer than 10 questions, or script does not run to completion. |
| 0 pts | No golden set, or script cannot be started. |

### Area 6: Data Governance Evidence — 2 Points

Evidence source: `docs/safety-audit.md` Area 6 section submitted by Thursday 21 May at 23:59. Must include: isolation test terminal output showing PASS, data map document, PII grep confirmation, and `.env` git history check.

| Score | Criteria |
|-------|----------|
| 2 pts | Isolation test passes live (User B cannot retrieve User A data). `docs/data-map.md` or equivalent complete with: data types, storage locations, retention periods, deletion methods. Episode log confirmed PII-free (grep check shown). `git log --all -- .env` returns nothing. |
| 1 pt | Two of the three areas covered with evidence. |
| 0.5 pt | One area covered. |
| 0 pts | No evidence in any area. |

---

## Submission Deadline

The complete `docs/safety-audit.md` must be committed and pushed to your team repo by **Thursday 21 May at 23:59**. Evidence added after that timestamp is not eligible for credit. The instructor grades from the state of the repo at the deadline.

Lab 9 is your primary build session for this audit. Use it fully. The instructor circulates throughout the session and provides feedback on work in progress.

---

## Lab 9 Hardening Sprint — No Standalone Points

The Part 2 hardening sprint (metrics script, async golden set runner, model selection review) contributes to the Repository Review (10 pts, Week 15) and Demo Day (15 pts, Week 15). It does not generate a separate grade today.

The `lab9-hardening` tag is read by the instructor during Repository Review as evidence of ongoing engineering discipline.

---

*Lab 9 Grading Rubric · CS-AI-2025 · Spring 2026 · KIU*
