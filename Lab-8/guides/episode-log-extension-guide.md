# Episode Log Extension Guide

**Extending your Lab 6 episode log with caching and latency fields**

---

## What to Add From Lab 8

Your episode log has been running since Lab 6. Lab 8 adds five new fields to the LLM call entry type, and formalises the MCP tool call entry type. You do not need to backfill historical entries — just apply the new schema to all entries from Lab 8 onward.

---

## Updated LLM Call Schema

Add these fields to your existing LLM call logging function:

```python
# episode_logger.py — updated for Lab 8

import json
import time
import os
from pathlib import Path

LOG_PATH = Path(os.environ.get("EPISODE_LOG_PATH", "logs/episode-log.jsonl"))

def log_llm_call(
    model: str,
    input_tokens: int,
    output_tokens: int,
    cost_usd: float,
    # New fields from Lab 8:
    cache_read_tokens: int = 0,
    cache_write_tokens: int = 0,
    latency_ms: int = 0,
    provider: str = "",
    fallback_triggered: bool = False,
    error: str = None,
) -> None:
    LOG_PATH.parent.mkdir(parents=True, exist_ok=True)
    entry = {
        "ts": time.time(),
        "event_type": "llm_call",
        "model": model,
        "provider": provider or extract_provider(model),
        "input_tokens": input_tokens,
        "output_tokens": output_tokens,
        "cache_read_tokens": cache_read_tokens,
        "cache_write_tokens": cache_write_tokens,
        "cost_usd": cost_usd,
        "latency_ms": latency_ms,
        "fallback_triggered": fallback_triggered,
        "error": error,
    }
    with open(LOG_PATH, "a") as f:
        f.write(json.dumps(entry) + "\n")

def extract_provider(model_string: str) -> str:
    """Extract provider name from OpenRouter model string."""
    if "/" in model_string:
        return model_string.split("/")[0]
    if "claude" in model_string:
        return "anthropic"
    if "gemini" in model_string:
        return "google"
    if "gpt" in model_string:
        return "openai"
    return "unknown"
```

---

## MCP Tool Call Schema

This is the separate entry type for MCP tool invocations. Log these in the same file as LLM calls — the `event_type` field distinguishes them.

```python
import hashlib

def log_mcp_tool_call(
    tool_name: str,
    input_dict: dict,
    result_status: str,  # "ok" | "error" | "auth_failed" | "validation_failed"
    latency_ms: int,
    error: str = None,
) -> None:
    LOG_PATH.parent.mkdir(parents=True, exist_ok=True)
    # Hash input — never log raw user data
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

---

## How to Call the Logger in Your Route Handler

```python
# In your FastAPI route or wherever you call the LLM

import time
start = time.time()
primary_model = "google/gemini-2.5-flash-preview"
actual_model = primary_model

try:
    response = await call_with_fallback(messages, primary_model)
    actual_model = response.model_used  # if your fallback returns this

    usage = response.usage
    log_llm_call(
        model=actual_model,
        input_tokens=usage.input_tokens,
        output_tokens=usage.output_tokens,
        cost_usd=calculate_cost(usage, actual_model),
        cache_read_tokens=getattr(usage, "cache_read_input_tokens", 0),
        cache_write_tokens=getattr(usage, "cache_creation_input_tokens", 0),
        latency_ms=round((time.time() - start) * 1000),
        fallback_triggered=(actual_model != primary_model),
    )
    return response.content

except Exception as e:
    log_llm_call(
        model=actual_model,
        input_tokens=0,
        output_tokens=0,
        cost_usd=0.0,
        latency_ms=round((time.time() - start) * 1000),
        error=type(e).__name__,
    )
    raise
```

---

## Verifying Your Log Is Correct

After making 3 calls with caching enabled, your log should look like this:

```jsonl
{"ts": 1746700800.0, "event_type": "llm_call", "model": "google/gemini-2.5-flash-preview", "provider": "google", "input_tokens": 1850, "output_tokens": 312, "cache_read_tokens": 0, "cache_write_tokens": 1620, "cost_usd": 0.00078, "latency_ms": 1102, "fallback_triggered": false, "error": null}
{"ts": 1746700810.4, "event_type": "llm_call", "model": "google/gemini-2.5-flash-preview", "provider": "google", "input_tokens": 1850, "output_tokens": 287, "cache_read_tokens": 1620, "cache_write_tokens": 0, "cost_usd": 0.00021, "latency_ms": 743, "fallback_triggered": false, "error": null}
{"ts": 1746700820.1, "event_type": "mcp_tool_call", "tool_name": "search_knowledge", "input_hash": "a3f7b2c1", "result_status": "ok", "latency_ms": 142, "error": null}
```

First call: `cache_write_tokens: 1620` (cache populated).
Second call: `cache_read_tokens: 1620` (cache hit, cost dropped from 0.00078 to 0.00021).

---

*Episode Log Extension Guide · Lab 8 · CS-AI-2025 · Spring 2026*
