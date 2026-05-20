"""
MCP Audit Log Template — CS-AI-2025 Lab 8, Spring 2026

Copy this into your mcp-server/ folder and import it in your server.
This replaces any print() statements you used for logging in Lab 6.
"""

import hashlib
import json
import logging
import os
import time
from pathlib import Path

# Server-side logger — full tracebacks go here, never to the caller
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
server_logger = logging.getLogger("mcp-audit")

# Structured audit log — one JSON object per line
AUDIT_LOG_PATH = Path(os.environ.get("MCP_LOG_PATH", "logs/mcp-audit.jsonl"))


def _hash_input(input_dict: dict) -> str:
    """SHA-256 hash of the input. Never log raw user data."""
    canonical = json.dumps(input_dict, sort_keys=True, ensure_ascii=True)
    return hashlib.sha256(canonical.encode()).hexdigest()[:16]


def log_tool_call(
    tool_name: str,
    input_dict: dict,
    result_status: str,
    latency_ms: int,
    error: str = None,
) -> None:
    """
    Write a structured audit entry for one MCP tool call.

    Parameters
    ----------
    tool_name     : Name of the tool that was invoked
    input_dict    : The validated (not raw) input dictionary
    result_status : "ok" | "error" | "auth_failed" | "validation_failed"
    latency_ms    : Wall-clock time from call start to log entry
    error         : Exception class name if status is "error", else None
    """
    AUDIT_LOG_PATH.parent.mkdir(parents=True, exist_ok=True)

    entry = {
        "ts": round(time.time(), 3),
        "event_type": "mcp_tool_call",
        "tool_name": tool_name,
        "input_hash": _hash_input(input_dict),
        "result_status": result_status,
        "latency_ms": latency_ms,
        "error": error,
    }

    with open(AUDIT_LOG_PATH, "a", encoding="utf-8") as f:
        f.write(json.dumps(entry) + "\n")

    # Mirror to server log for live monitoring — does not expose user data
    level = logging.ERROR if result_status == "error" else logging.INFO
    server_logger.log(
        level,
        f"tool={tool_name} status={result_status} latency={latency_ms}ms"
        + (f" error={error}" if error else ""),
    )


# ─── Usage Example ─────────────────────────────────────────────────────────
#
# In your MCP tool handler:
#
#   from audit_logger import log_tool_call
#   import time
#
#   start = time.time()
#   try:
#       result = await do_search(validated.query)
#       log_tool_call(
#           "search_knowledge",
#           validated.dict(),
#           "ok",
#           round((time.time() - start) * 1000),
#       )
#   except Exception as e:
#       log_tool_call(
#           "search_knowledge",
#           validated.dict(),
#           "error",
#           round((time.time() - start) * 1000),
#           type(e).__name__,
#       )
#       raise
