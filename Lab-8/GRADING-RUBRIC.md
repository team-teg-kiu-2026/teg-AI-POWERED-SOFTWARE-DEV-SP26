# Lab 8 Grading Rubric

**CS-AI-2025 · Spring 2026**

Lab 8 has no standalone point value. Its deliverables are the primary evidence source for the Safety and Evaluation Audit (Week 11, 10 pts) and contribute to the Repository Review (Week 15, 10 pts).

The commit tagged `lab8-mcp-capstone` is what is assessed. Work not in that commit does not count.

---

## What the Safety Audit Reads From This Commit

### MCP Server Security (2 pts of the 10-pt audit)

| Evidence Required | Where to Find It | Pass Criteria |
|---|---|---|
| Bearer token authentication | `mcp-server/` source code | Token verification runs before any tool logic |
| Structured error on bad token | Terminal output or test file | Returns JSON `{"error": "unauthorized"}`, not a traceback |
| Pydantic input validation | `mcp-server/` source code | Every tool input parameter has a type and is validated |
| Structured JSON audit log | `logs/mcp-audit.jsonl` or equivalent | Each entry has: tool_name, input_hash, result_status, latency_ms |
| Sanitised error responses | `mcp-server/` source code | try/except wraps all execution; no tracebacks in error returns |

### Episode Log Quality (2 pts of the 10-pt audit)

| Evidence Required | Where to Find It | Pass Criteria |
|---|---|---|
| 100+ entries from Lab 6 onward | `logs/episode-log.jsonl` | Entries exist covering tool calls, errors, and cost |
| `cache_read_tokens` field present | Episode log entries | Field exists on every LLM call entry from Lab 8 onward |
| `latency_ms` field present | Episode log entries | Field exists and contains non-zero values |
| `fallback_triggered` field present | Episode log entries | Field exists on every LLM call entry from Lab 8 onward |
| Error entries captured | Episode log | At least one entry with `"error"` not null |

### Optimisation Evidence (contributes to Repository Review)

| Evidence Required | Where to Find It | Pass Criteria |
|---|---|---|
| Before/after benchmark | `docs/optimization-report.md` | Shows 10 measurements before and 10 after caching with median latency and cost |
| Cache hit rate calculated | `docs/optimization-report.md` | cache_read_tokens / total_input_tokens per call reported |
| OpenRouter fallback defined | Main AI route or config file | At least two models in fallback order, explicitly defined |

---

## What Does Not Count

- Print statements where JSON logging is required
- Raw dict arguments passed to tools without validation
- Comments describing what auth "will" do rather than implemented auth
- The optimization report existing but containing no numbers
- Any work committed after the `lab8-mcp-capstone` tag

---

## Repository Review Contribution (Week 15)

The Repository Review (10 pts) reads your entire repo history. Lab 8 contributes to:

- Code quality: is the MCP server code readable, documented, and testable?
- Observability: does the episode log tell the story of your application over time?
- Engineering discipline: does the commit message accurately describe the change?
- Cost management: does the optimization report show evidence of deliberate cost control?

---

*Lab 8 Grading Rubric · CS-AI-2025 · Spring 2026*
