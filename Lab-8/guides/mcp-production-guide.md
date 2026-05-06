# MCP Production Guide

**From Lab 6 test wrapper to production-safe server**

---

## The Gap Between Lab 6 and Production

In Lab 6 you wrapped a capstone function as an MCP tool and confirmed it was discoverable. That was the right starting point. A production MCP server adds four layers that Lab 6 intentionally omitted: authentication, input validation, audit logging, and error sanitisation.

None of these require rewriting your tool. They wrap it.

---

## Layer 1: Bearer Token Authentication

Every tool call your MCP server receives should be verified before any logic runs. The simplest approach that is also the most portable is a bearer token verified with a constant-time comparison.

```python
# auth.py
import hmac
import os

MCP_SECRET = os.environ.get("MCP_SECRET_KEY", "")

def verify_token(token: str) -> bool:
    """Constant-time comparison prevents timing attacks."""
    if not MCP_SECRET or not token:
        return False
    expected = MCP_SECRET.encode()
    provided = token.encode()
    return hmac.compare_digest(expected, provided)

def extract_bearer(auth_header: str) -> str:
    """Extract token from 'Bearer <token>' header."""
    if auth_header.startswith("Bearer "):
        return auth_header[7:]
    return ""
```

In your MCP server's tool handler:

```python
@app.call_tool()
async def handle_tool(name: str, arguments: dict) -> list:
    # Step 1: Auth check — first, before anything else
    token = arguments.pop("_auth_token", "")
    if not verify_token(token):
        return [TextContent(type="text",
            text='{"error": "unauthorized", "code": 401}')]

    # Step 2: Continue with validated logic
    ...
```

**Test:** Call your tool with `_auth_token: "wrong"`. Confirm you receive `{"error": "unauthorized"}` and nothing else.

---

## Layer 2: Pydantic Input Validation

Never pass raw `arguments` dict into your tool logic. Define a schema and validate against it before execution.

```python
from pydantic import BaseModel, Field, validator
from typing import Optional

class SearchInput(BaseModel):
    query: str = Field(..., min_length=1, max_length=500,
                       description="The search query")
    max_results: int = Field(default=5, ge=1, le=20,
                             description="Number of results to return")
    language: Optional[str] = Field(default="en",
                                     pattern="^[a-z]{2}$")

    @validator("query")
    def sanitise_query(cls, v):
        # Strip characters that could be used for injection
        return v.strip().replace("\x00", "")
```

In your tool handler:

```python
try:
    validated = SearchInput(**arguments)
except ValidationError as e:
    return [TextContent(type="text",
        text=f'{{"error": "invalid_input", "detail": "{e.error_count()} validation errors"}}')]
```

**What this prevents:** If a caller sends `max_results: 99999` or `query: ""`, Pydantic catches it before your function sees it.

---

## Layer 3: Structured Audit Logging

Replace all print statements with a structured JSON logger. Every tool call must produce a log entry — including failed calls.

```python
# audit_logger.py
import json
import time
import hashlib
import os
from pathlib import Path

LOG_PATH = Path(os.environ.get("MCP_LOG_PATH", "logs/mcp-audit.jsonl"))

def log_tool_call(
    tool_name: str,
    input_dict: dict,
    result_status: str,
    latency_ms: int,
    error: str = None
) -> None:
    LOG_PATH.parent.mkdir(parents=True, exist_ok=True)
    # Hash the input — never log raw user data
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
    with open(LOG_PATH, "a") as f:
        f.write(json.dumps(entry) + "\n")
```

Usage in your tool handler:

```python
start = time.time()
try:
    result = await do_search(validated.query, validated.max_results)
    latency = round((time.time() - start) * 1000)
    log_tool_call("search_knowledge", validated.dict(), "ok", latency)
    return [TextContent(type="text", text=json.dumps(result))]
except Exception as e:
    latency = round((time.time() - start) * 1000)
    log_tool_call("search_knowledge", validated.dict(), "error", latency, str(type(e).__name__))
    return [TextContent(type="text",
        text='{"error": "tool_execution_failed"}')]
```

Note: `str(type(e).__name__)` logs `ValueError` not the full traceback. The traceback is for your server logs, not for the caller.

---

## Layer 4: Error Sanitisation

Every `try/except` in your tool handler must return a safe, structured error — never a raw exception.

**Bad (never do this in production):**
```python
except Exception as e:
    return [TextContent(type="text", text=str(e))]
    # Could expose: file paths, env var values, DB connection strings
```

**Good:**
```python
except Exception as e:
    # Log the full error server-side for debugging
    logger.error(f"Tool execution failed: {e}", exc_info=True)
    # Return only a safe code to the caller
    return [TextContent(type="text",
        text='{"error": "tool_execution_failed", "code": 500}')]
```

**Testing this:** Comment out a function your tool calls internally. Run the tool. Inspect the response. If you see anything beyond `{"error": "tool_execution_failed"}`, there is a leak.

---

## Sandboxing Checklist

For the Safety Audit, you should be able to confirm the following about your MCP server environment:

- [ ] The MCP server process does not have write access to directories outside `logs/` and its own source directory
- [ ] The MCP server's environment variables contain only what it needs — not your full shell environment
- [ ] If the tool executes any subprocess or shell command: it runs with the minimum user permissions possible and with a timeout
- [ ] No MCP tool has access to credentials it does not need (a search tool should not have DB write credentials)

For most student capstones running locally or on Railway, full OS-level sandboxing is not required for the audit. What is required is that you have thought about and documented the scope of access each tool has.

---

*MCP Production Guide · Lab 8 · CS-AI-2025 · Spring 2026*
