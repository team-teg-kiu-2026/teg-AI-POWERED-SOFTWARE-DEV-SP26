"""
NutriSmart episode logger — writes JSONL to logs/episode-log.jsonl.

All LLM call entries have: ts, event_type, model, provider, input_tokens,
output_tokens, cache_read_tokens, cache_write_tokens, cost_usd, latency_ms,
fallback_triggered, error.

All MCP tool call entries have: ts, event_type, tool_name, input_hash,
result_status, latency_ms, error.
"""

import hashlib
import json
import time
from pathlib import Path

LOG_FILE = Path(__file__).parent.parent / "logs" / "episode-log.jsonl"

# Pricing per million tokens (OpenRouter rates, April 2026)
_PRICING: dict[str, dict] = {
    "google/gemini-flash-1.5": {
        "input": 0.075, "output": 0.30, "cache_read": 0.01875, "cache_write": 0.0,
    },
    "openai/gpt-4o": {
        "input": 2.50, "output": 10.00, "cache_read": 1.25, "cache_write": 0.0,
    },
}


def _write(entry: dict) -> None:
    LOG_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(LOG_FILE, "a", encoding="utf-8") as f:
        f.write(json.dumps(entry) + "\n")


def _cost(model: str, input_tokens: int, output_tokens: int,
          cache_read_tokens: int, cache_write_tokens: int) -> float:
    p = _PRICING.get(model, {"input": 0.10, "output": 0.30, "cache_read": 0.025, "cache_write": 0.0})
    billable_input = input_tokens - cache_read_tokens
    cost = (
        billable_input       * p["input"]       / 1_000_000
        + output_tokens      * p["output"]      / 1_000_000
        + cache_read_tokens  * p["cache_read"]  / 1_000_000
        + cache_write_tokens * p["cache_write"] / 1_000_000
    )
    return round(max(cost, 0.0), 8)


def log_llm_call(
    model: str,
    input_tokens: int,
    output_tokens: int,
    latency_ms: int,
    *,
    cache_read_tokens: int = 0,
    cache_write_tokens: int = 0,
    fallback_triggered: bool = False,
    error: str | None = None,
) -> None:
    _write({
        "ts": time.time(),
        "event_type": "llm_call",
        "model": model,
        "provider": "openrouter",
        "input_tokens": input_tokens,
        "output_tokens": output_tokens,
        "cache_read_tokens": cache_read_tokens,
        "cache_write_tokens": cache_write_tokens,
        "cost_usd": _cost(model, input_tokens, output_tokens, cache_read_tokens, cache_write_tokens),
        "latency_ms": latency_ms,
        "fallback_triggered": fallback_triggered,
        "error": error,
    })


def log_mcp_tool_call(
    tool_name: str,
    input_dict: dict,
    result_status: str,
    latency_ms: int,
    *,
    error: str | None = None,
) -> None:
    input_hash = hashlib.sha256(
        json.dumps(input_dict, sort_keys=True).encode()
    ).hexdigest()[:16]
    _write({
        "ts": time.time(),
        "event_type": "mcp_tool_call",
        "tool_name": tool_name,
        "input_hash": input_hash,
        "result_status": result_status,
        "latency_ms": latency_ms,
        "error": error,
    })
