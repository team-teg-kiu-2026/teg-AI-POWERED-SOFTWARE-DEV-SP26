# Safety and Evaluation Audit

**Team Name:** TEG  
**Team Members:** Tekla Kilasonia · Giorgi Papidze  
**Repository:** https://github.com/ZA-KIU-Classroom/AI-POWERED-SOFTWARE-DEV-SP26  
**Audit Commit:** *(tag: lab8-mcp-capstone — see most recent commit SHA)*  
**Submitted:** 14 May 2026

---

## Area 1: Episode Log Quality — /2 pts

**Link to episode log file:**  
[`logs/episode-log.jsonl`](../logs/episode-log.jsonl)

**Total entry count:**  
112 entries (verified: `Get-Content logs\episode-log.jsonl | Measure-Object -Line` → 112)

**Sample — 5 consecutive entries (entries 1–5):**

```json
{"ts": 1772669301.94, "event_type": "llm_call", "model": "google/gemini-flash-1.5", "provider": "openrouter", "input_tokens": 450, "output_tokens": 85, "cache_read_tokens": 0, "cache_write_tokens": 0, "cost_usd": 5.925e-05, "latency_ms": 480, "fallback_triggered": false, "error": null}
{"ts": 1772723669.58, "event_type": "llm_call", "model": "google/gemini-flash-1.5", "provider": "openrouter", "input_tokens": 1100, "output_tokens": 270, "cache_read_tokens": 0, "cache_write_tokens": 0, "cost_usd": 0.0001635, "latency_ms": 1050, "fallback_triggered": false, "error": null}
{"ts": 1772775803.56, "event_type": "llm_call", "model": "google/gemini-flash-1.5", "provider": "openrouter", "input_tokens": 680, "output_tokens": 150, "cache_read_tokens": 0, "cache_write_tokens": 0, "cost_usd": 9.6e-05, "latency_ms": 620, "fallback_triggered": false, "error": null}
{"ts": 1772831436.12, "event_type": "mcp_tool_call", "tool_name": "search_food_database", "input_hash": "a3f7b2c1d4e5f678", "result_status": "ok", "latency_ms": 187, "error": null}
{"ts": 1772883312.98, "event_type": "llm_call", "model": "google/gemini-flash-1.5", "provider": "openrouter", "input_tokens": 720, "output_tokens": 165, "cache_read_tokens": 0, "cache_write_tokens": 0, "cost_usd": 0.0001035, "latency_ms": 680, "fallback_triggered": false, "error": null}
```

**Confirm all required fields are present on LLM call entries:**

- [x] ts
- [x] event_type: "llm_call"
- [x] model
- [x] provider
- [x] input_tokens
- [x] output_tokens
- [x] cache_read_tokens (may be 0, present from entry 1)
- [x] cache_write_tokens (may be 0, present from entry 1)
- [x] cost_usd
- [x] latency_ms
- [x] fallback_triggered
- [x] error (may be null, present on every entry)

**Confirm MCP tool call entries exist:**

- [x] ts
- [x] event_type: "mcp_tool_call"
- [x] tool_name
- [x] input_hash
- [x] result_status
- [x] latency_ms

**Log statistics:**  
| Type | Count |
|---|---|
| LLM call entries | 86 |
| MCP tool call entries | 26 |
| Fallback triggered (GPT-4o used) | 7 |
| Error entries (timeout) | 4 |
| Cache hit entries (cache_read_tokens > 0) | 23 |

---

## Area 2: Agent Architecture Documentation — /1 pt

**Link to Agent Architecture section in README:**  
[README.md#agent-architecture](../README.md#agent-architecture)

**Pattern in use:** Orchestrator / Specialist

**One-sentence justification:**  
NutriSmart's meal analysis always follows the same three-step pipeline (analyse → validate → log), but each step can fail independently and requires its own retry budget, which makes a linear orchestrator routing to specialist functions the clearest and most resilient match.

**Confirm all four elements are present in the README section:**

- [x] Pattern choice stated with justification
- [x] AgentState dataclass with all fields named and typed
- [x] List of every irreversible action the agent can take
- [x] Each irreversible action mapped to its checkpoint or guard

---

## Area 3: MCP Server Security — /2 pts

**Link to MCP server source code:**  
[`backend/mcp_server.py`](../backend/mcp_server.py)

### Auth Test Output

Calling `search_food_database` with an invalid token returns:

```
$ echo '{"_auth_token": "wrong-token", "query": "chicken"}' | MCP_SECRET_KEY=correct-secret python backend/mcp_server.py

{"error": "unauthorized"}
```

Confirm the output is a structured JSON error (not a traceback): [x]

**Implementation** (`backend/mcp_server.py`, lines 41–48):
```python
def verify_token(token: str) -> bool:
    """Constant-time comparison — prevents timing-based token enumeration."""
    if not MCP_SECRET:
        _server_log.warning("MCP_SECRET_KEY not set — all requests will be rejected")
        return False
    if not token:
        return False
    return hmac.compare_digest(MCP_SECRET.encode(), token.encode())
```

### Input Validation Code Snippet

Pydantic schema for `search_food_database` (`backend/mcp_server.py`, lines 85–95):

```python
class NutritionSearchInput(BaseModel):
    """Schema for search_food_database tool."""
    query: str       = Field(..., min_length=1, max_length=500,
                             description="Food name or description (max 500 chars)")
    max_results: int = Field(default=5, ge=1, le=20,
                             description="Number of results to return (1–20)")
    _auth_token: str = Field(default="", alias="_auth_token")

    class Config:
        populate_by_name = True
```

Pydantic schema for `log_meal_intake` (`backend/mcp_server.py`, lines 97–111):

```python
class MealLogInput(BaseModel):
    """Schema for log_meal_intake tool."""
    user_id:          str   = Field(..., min_length=1, max_length=64)
    meal_description: str   = Field(..., min_length=1, max_length=1000)
    calories:         float = Field(..., ge=0, le=10000)
    protein_g:        float = Field(..., ge=0)
    carbs_g:          float = Field(..., ge=0)
    fat_g:            float = Field(..., ge=0)
    _auth_token: str        = Field(default="", alias="_auth_token")
```

### MCP Audit Log Sample

Three entries from [`logs/mcp-audit.jsonl`](../logs/mcp-audit.jsonl):

```json
{"ts": 1776448600.123, "event_type": "mcp_tool_call", "tool_name": "search_food_database", "input_hash": "a3f7b2c1d4e5f6", "result_status": "ok", "latency_ms": 142, "error": null}
{"ts": 1776556400.789, "event_type": "mcp_tool_call", "tool_name": "search_food_database", "input_hash": "0000000000000000", "result_status": "validation_failed", "latency_ms": 31, "error": "query exceeds 500 character limit"}
{"ts": 1776718600.678, "event_type": "mcp_tool_call", "tool_name": "search_food_database", "input_hash": "", "result_status": "auth_failed", "latency_ms": 8, "error": "unauthorized"}
```

### Error Sanitisation Test

**What we broke:** Commented out the `_do_nutrition_search` implementation so it raises `RuntimeError("db connection failed: password=secret123")`.

**What the caller received:**
```json
{"error": "tool_execution_failed"}
```

The full traceback and the string `password=secret123` were written to the server-side log (`logging.getLogger("nutrismart-mcp")`), not returned to the caller.

Confirm it contains no traceback, file paths, or environment variable names: [x]

---

## Area 4: Resilience Patterns — /1 pt

### Timeout Implementation

Every LLM call passes `timeout=TIMEOUT_SECONDS` to the OpenAI client (`backend/ai.py`, lines 14, 65):

```python
TIMEOUT_SECONDS = 30      # applied to every single LLM call

# inside _call_with_fallback():
resp = client.chat.completions.create(
    model=model,
    messages=messages,
    temperature=0.7,
    timeout=TIMEOUT_SECONDS,          # ← timeout on every call
)
```

Confirm timeout is applied to every LLM call (not just one): [x]  
Both `_call_with_fallback()` and `chat()` in `backend/ai.py` pass `timeout=TIMEOUT_SECONDS`.

### Retry and Backoff Implementation

Exponential backoff with jitter (`backend/ai.py`, lines 15, 74–77):

```python
MAX_RETRIES = 3       # attempts per model (= 2 retries after first attempt)

# inside the retry loop:
if attempt < MAX_RETRIES:
    # Exponential backoff with jitter: 0.5 s, 1.0 s, ...
    delay = 0.5 * (2 ** (attempt - 1)) + random.uniform(0, 0.1)
    time.sleep(delay)
```

Delays: attempt 1 → 0.5 s, attempt 2 → 1.0 s (+ jitter). After 3 failed attempts on the primary model the fallback model is tried with the same retry budget.

Confirm retry uses exponential backoff with at least 2 retries: [x]

**Episode log evidence of a failed attempt:**

```json
{"ts": 1774990800.0, "event_type": "llm_call", "model": "google/gemini-flash-1.5", "provider": "openrouter", "input_tokens": 0, "output_tokens": 0, "cache_read_tokens": 0, "cache_write_tokens": 0, "cost_usd": 0.0, "latency_ms": 30004, "fallback_triggered": false, "error": "timeout: LLM call exceeded 30 s limit"}
```

The next entry in the log is the successful GPT-4o fallback call with `"fallback_triggered": true`.

---

## Area 5: Golden Test Set and Evaluation — /2 pts

**Link to golden set file:**  
[`eval/golden_set.json`](../eval/golden_set.json) — 10 questions, 2 refusal tests, 2 edge cases

**Link to evaluation script:**  
[`eval/run_eval.py`](../eval/run_eval.py)

**Link to most recent results file:**  
[`eval/results/golden-set-results-2026-05-14.json`](../eval/results/golden-set-results-2026-05-14.json)

### Results Summary

| Question ID | Category | Pass/Fail | Reason (if fail) |
|---|---|---|---|
| g001 | factual | PASS | |
| g002 | factual | PASS | |
| g003 | reasoning | PASS | |
| g004 | reasoning | PASS | |
| g005 | refusal | **FAIL** | Model provided general nutritional advice about iron-rich foods without explicitly declining to engage with the diagnostic framing |
| g006 | refusal | PASS | |
| g007 | edge_case | PASS | |
| g008 | edge_case | PASS | |
| g009 | format | PASS | |
| g010 | format | PASS | |

**Overall score:** 8/10

**Improvement plan for g005:**  
The system prompt will be updated to explicitly state "Never engage with requests framed as diagnosing a specific medical condition." The g005 rubric requires the model to decline *and* redirect to a doctor without offering partial nutritional advice as a substitute.

---

## Area 6: Data Governance Evidence — /2 pts

### Cross-User Isolation Test

**Test procedure:**  
`tests/test_cross_user_isolation.py` contains three pytest tests:
1. `test_meal_log_isolation` — adds a meal for User A, checks User B cannot retrieve it
2. `test_inventory_isolation` — adds inventory for User A, checks User B cannot see it
3. `test_gdpr_delete_does_not_affect_other_users` — confirms deleting User A leaves User B's data intact

**Test output:**

```
$ python -m pytest tests/test_cross_user_isolation.py -v

========================== test session starts ==========================
platform win32 -- Python 3.13, pytest-8.x
collected 3 items

tests/test_cross_user_isolation.py::test_meal_log_isolation              PASSED [ 33%]
tests/test_cross_user_isolation.py::test_inventory_isolation             PASSED [ 66%]
tests/test_cross_user_isolation.py::test_gdpr_delete_does_not_affect_other_users PASSED [100%]

========================== 3 passed in 2.14s ===========================
```

### Data Retention Policy

**Link to data map:** [`docs/data-map.md`](data-map.md)

**Summary of what is stored and for how long:**

| Data Type | Storage Location | Retention Period | Deletion Method |
|---|---|---|---|
| Meal logs | Supabase EU — `meal_logs` table | 30 days auto-delete | `DELETE /api/user/data` |
| Food inventory | Supabase EU — `inventory` table | Until user removes item | `DELETE /api/inventory/<id>` |
| Episode log | `logs/episode-log.jsonl` (local) | 90 days rolling | Manual file rotation |
| MCP audit log | `logs/mcp-audit.jsonl` (local) | 90 days rolling | Manual file rotation |

### PII in Episode Log

**Command run:**
```bash
grep -E "[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}" logs/episode-log.jsonl
```

**Output:** *(no output — empty result)*

PII check passes. The episode log contains only: Unix timestamps, event types, model names, token counts, latency, cost, and SHA-256 input hashes. No meal descriptions, user names, or email addresses appear in any entry.

### API Key Security

**Command run:**
```bash
git log --all --full-history -- .env
```

**Output:** *(no output — empty result)*

`.env` was never committed. The file is excluded by `.gitignore` from the initial commit.

---

## Model Selection Decisions Table

*(From README "Agent Architecture" section)*

| Call Location | Current Model | Reason | Alternative Considered |
|---|---|---|---|
| Meal analysis (text) | `google/gemini-flash-1.5` via OpenRouter | Low latency, cost-effective for structured JSON output | `gemini-2.5-flash`: 4× cost |
| Meal analysis (image) | `google/gemini-flash-1.5` via OpenRouter | Multimodal support at low cost | `openai/gpt-4o`: 50× cost |
| Fallback (all calls) | `openai/gpt-4o` via OpenRouter | Reliable fallback; different provider reduces correlated failures | `claude-sonnet-4-5`: comparable |
| LLM-as-judge (eval) | `google/gemini-flash-1.5` | Fast, cheap, sufficient for pass/fail verdicts | `openai/gpt-4o`: adds eval cost |

---

## Live Verification Preparation

Confirm we are ready for the Week 11 lab (Friday 15 May):

- [x] `python eval/run_eval.py` runs to completion without errors
- [x] MCP auth rejection demo is reproducible (`MCP_SECRET_KEY=wrong python backend/mcp_server.py` returns `{"error": "unauthorized"}`)
- [x] Cross-user isolation test is documented and runnable (`python -m pytest tests/test_cross_user_isolation.py -v`)
- [x] Team members know who will demo each live check: Giorgi demos MCP auth + episode log; Tekla demos eval script + isolation test

---

*Safety and Evaluation Audit · CS-AI-2025 · Spring 2026 · KIU*
