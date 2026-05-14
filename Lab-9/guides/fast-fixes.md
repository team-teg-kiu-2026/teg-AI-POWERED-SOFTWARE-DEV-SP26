# Fast Fixes Guide

**Closing common Lab 8 gaps during the Lab 9 remediation window**

Each fix below is rated by time required. Only attempt fixes you can complete within the remaining session time. Partial completion counts for partial credit — a fix that is 60% done is better than one you abandoned halfway.

---

## Fix 1 — Episode Log Fewer Than 100 Entries (~10 min)

**Gap:** Your log exists but has under 100 entries. The Safety Audit requires 100+ from Lab 6 onward.

**Why it happened:** The logger was working but the app was not used consistently in the weeks since Lab 6.

**Fix:** Generate entries now using a call loop against your running app.

```python
# run_log_generator.py — run from your repo root
# Generates 50 entries by hitting your app endpoint repeatedly
import asyncio
import httpx

APP_ENDPOINT = "http://localhost:8000/api/ai/chat"  # adjust to your endpoint

TEST_MESSAGES = [
    "What can you help me with?",
    "Summarise your main capabilities.",
    "What file formats do you support?",
    "How do I get started?",
    "Can you help me with a document?",
    "What are your limitations?",
    "How does your search work?",
    "What happens if I ask something you cannot answer?",
    "Can you remember our previous conversation?",
    "Explain retrieval-augmented generation in one sentence.",
]

async def generate_entries(n: int = 50):
    async with httpx.AsyncClient(timeout=30) as client:
        tasks = []
        for i in range(n):
            message = TEST_MESSAGES[i % len(TEST_MESSAGES)]
            tasks.append(
                client.post(APP_ENDPOINT, json={"message": message, "conversation_history": []})
            )
        results = await asyncio.gather(*tasks, return_exceptions=True)
        success = sum(1 for r in results if not isinstance(r, Exception))
        print(f"Generated {success}/{n} entries successfully")

asyncio.run(generate_entries(50))
```

After running, confirm: `wc -l logs/episode-log.jsonl`

**Time required:** 8 minutes to write and run. Log entries appear in real time — you can watch the count increase.

---

## Fix 2 — Missing cache_read_tokens / latency_ms Fields (~8 min)

**Gap:** Your episode log exists and has 100+ entries, but LLM call entries are missing `cache_read_tokens`, `cache_write_tokens`, `latency_ms`, or `fallback_triggered`.

**Why it happened:** You added caching in Lab 8 but did not update the logging function to capture the new fields.

**Fix:** Update your logging function and make 5 calls to confirm the new fields appear.

```python
# Updated log_llm_call function — add to episode_logger.py
def log_llm_call(
    model: str,
    input_tokens: int,
    output_tokens: int,
    cost_usd: float,
    latency_ms: int = 0,
    cache_read_tokens: int = 0,
    cache_write_tokens: int = 0,
    provider: str = "",
    fallback_triggered: bool = False,
    error: str = None,
) -> None:
    entry = {
        "ts": time.time(),
        "event_type": "llm_call",
        "model": model,
        "provider": provider or extract_provider(model),
        "input_tokens": input_tokens,
        "output_tokens": output_tokens,
        "cache_read_tokens": cache_read_tokens,   # add this
        "cache_write_tokens": cache_write_tokens,  # add this
        "cost_usd": cost_usd,
        "latency_ms": latency_ms,                  # add this
        "fallback_triggered": fallback_triggered,   # add this
        "error": error,
    }
    with open(LOG_PATH, "a") as f:
        f.write(json.dumps(entry) + "\n")
```

After updating: make 5 calls to your app. Check the last 5 entries: `tail -5 logs/episode-log.jsonl | python -m json.tool`

**Time required:** 5 minutes if your logger is already structured. The fields just need to be added to the dict.

---

## Fix 3 — No MCP Audit Log (~10 min)

**Gap:** Your MCP server runs and auth works, but there is no `logs/mcp-audit.jsonl` file with structured tool call entries.

**Why it happened:** Print statements were used instead of the structured logger from Lab 8 starter code.

**Fix:** Add the audit logger to your MCP tool handler.

```python
# Add to your MCP server — replaces print statements
import hashlib
import json
import time
from pathlib import Path

MCP_LOG_PATH = Path("logs/mcp-audit.jsonl")

def log_mcp_tool_call(tool_name: str, input_dict: dict, result_status: str, latency_ms: int, error: str = None):
    MCP_LOG_PATH.parent.mkdir(parents=True, exist_ok=True)
    input_hash = hashlib.sha256(
        json.dumps(input_dict, sort_keys=True).encode()
    ).hexdigest()[:16]
    entry = {
        "ts": time.time(),
        "event_type": "mcp_tool_call",
        "tool_name": tool_name,
        "input_hash": input_hash,
        "result_status": result_status,
        "latency_ms": latency_ms,
        "error": error,
    }
    with open(MCP_LOG_PATH, "a") as f:
        f.write(json.dumps(entry) + "\n")
```

After adding: make 3 tool calls. Check: `cat logs/mcp-audit.jsonl`

**Time required:** 8 minutes. Add the function, call it in your tool handler, test three calls.

---

## Fix 4 — No Resilience Patterns (~12 min)

**Gap:** Your LLM calls have no timeout and no retry with backoff. The Safety Audit requires both.

**Fix:** Wrap your primary LLM call function.

```python
import asyncio
import httpx
import time

async def call_model_with_resilience(messages: list, model: str, api_key: str) -> str:
    """LLM call with timeout and exponential backoff retry."""
    max_retries = 3
    base_delay = 1.0

    for attempt in range(max_retries):
        start = time.time()
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:  # 30s timeout
                response = await asyncio.wait_for(
                    client.post(
                        "https://openrouter.ai/api/v1/chat/completions",
                        headers={"Authorization": f"Bearer {api_key}"},
                        json={"model": model, "messages": messages, "max_tokens": 1024},
                    ),
                    timeout=30.0
                )
                data = response.json()
                return data["choices"][0]["message"]["content"]

        except (asyncio.TimeoutError, httpx.TimeoutException) as e:
            latency_ms = round((time.time() - start) * 1000)
            log_llm_call(model=model, input_tokens=0, output_tokens=0, cost_usd=0,
                         latency_ms=latency_ms, error=f"timeout_attempt_{attempt+1}")
            if attempt < max_retries - 1:
                delay = base_delay * (2 ** attempt)  # 1s, 2s, 4s
                await asyncio.sleep(delay)
            else:
                raise

        except Exception as e:
            latency_ms = round((time.time() - start) * 1000)
            log_llm_call(model=model, input_tokens=0, output_tokens=0, cost_usd=0,
                         latency_ms=latency_ms, error=type(e).__name__)
            if attempt < max_retries - 1:
                delay = base_delay * (2 ** attempt)
                await asyncio.sleep(delay)
            else:
                raise
```

After adding: show the function to the instructor. No need to trigger a real timeout to demonstrate — the code review is sufficient for Area 4.

**Time required:** 10 minutes to write and integrate. Can be done faster by copying the snippet above verbatim.

---

## Fix 5 — Minimal Data Map (~8 min)

**Gap:** No `docs/data-map.md` exists, or it exists but does not cover all required fields.

**Fix:** Create a minimal but complete data map now.

```markdown
# Data Map

**Project:** [Your capstone project name]
**Last updated:** 15 May 2026

## Data Stored by This Application

| Data Type | Storage Location | Retention Period | Deletion Method |
|-----------|-----------------|------------------|-----------------|
| Conversation history | In-memory (Redis session or dict) | Session only — deleted on session end | Automatic on session expiry |
| Episode log entries | `logs/episode-log.jsonl` on server filesystem | 30 days | Automated log rotation (or manual: `truncate -s 0 logs/episode-log.jsonl`) |
| MCP audit log entries | `logs/mcp-audit.jsonl` on server filesystem | 30 days | Same as above |
| Uploaded documents (if applicable) | Temporary `/tmp/` directory | Session only | Automatic on process restart |
| User preferences (if applicable) | [your database, e.g. Neon PostgreSQL] | Until user deletes account | DELETE /api/user/data endpoint |

## PII Policy

This application does not log personally identifiable information. Conversation content is not persisted beyond the session. The episode log captures only: timestamps, token counts, model names, costs, and error types. No user names, email addresses, or message content appear in any log file.

## API Key Security

No API keys are committed to the repository. All secrets are loaded from environment variables. The `.env` file is listed in `.gitignore`. Verification: `git log --all -- .env` returns no results.

## User Data Deletion

Users may delete their session data by ending their session. [If you have a delete endpoint: Users may also call `DELETE /api/user/data` with their session token to remove all stored data.]
```

Save this as `docs/data-map.md` and commit it.

**Time required:** 6 minutes to fill in the blanks and commit.

---

## Fix 6 — No Agent Architecture Section in README (~8 min)

**Gap:** The README does not have a section titled exactly "Agent Architecture" with the four required elements.

**Fix:** Add the section to your README now. Minimum viable content:

```markdown
## Agent Architecture

**Pattern:** [Single Agent with tool use / Orchestrator-Specialist / Pipeline — choose one]

**Justification:** [One sentence: why this pattern fits your use case]

### AgentState

```python
from dataclasses import dataclass
from typing import Optional

@dataclass
class AgentState:
    session_id: str
    conversation_history: list[dict]
    current_tool: Optional[str]
    tool_results: list[dict]
    cost_usd_this_session: float
    error_count: int
```

### Irreversible Actions

| Action | Guard or Checkpoint |
|--------|-------------------|
| [e.g. Send an email on user's behalf] | [e.g. Explicit user confirmation required before calling email tool] |
| [e.g. Delete a document from database] | [e.g. Soft delete only — moved to trash, not removed for 30 days] |
| [e.g. Submit a form to an external service] | [e.g. Preview step shown to user, explicit "Confirm submission" required] |
```

Adapt the AgentState fields to your actual state variables. List every tool that modifies external state.

**Time required:** 8 minutes. The structure is mechanical — fill in your actual fields and actions.

---

*Fast Fixes Guide · Lab 9 · CS-AI-2025 · Spring 2026*
