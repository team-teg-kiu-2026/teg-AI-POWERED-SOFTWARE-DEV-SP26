"""
Production MCP Server Template — CS-AI-2025 Lab 8, Spring 2026

This is a complete, upgradeable MCP server template with all four production
layers applied: authentication, input validation, structured audit logging,
and error sanitisation.

Compare this against your Lab 6 server and make the equivalent changes.

Usage:
    pip install mcp pydantic python-dotenv
    MCP_SECRET_KEY=your_secret python production_server.py
"""

import asyncio
import hashlib
import hmac
import json
import logging
import os
import time
from pathlib import Path

from mcp.server import Server
from mcp.server.stdio import stdio_server
from mcp.types import TextContent, Tool
from pydantic import BaseModel, Field, ValidationError

# ─── Configuration ─────────────────────────────────────────────────────────

MCP_SECRET = os.environ.get("MCP_SECRET_KEY", "")
LOG_PATH = Path(os.environ.get("MCP_LOG_PATH", "logs/mcp-audit.jsonl"))

# Server-side logging (tracebacks go here, not to the caller)
logging.basicConfig(level=logging.INFO)
server_logger = logging.getLogger("mcp-server")

# ─── Auth ──────────────────────────────────────────────────────────────────

def verify_token(token: str) -> bool:
    """Constant-time comparison prevents timing attacks."""
    if not MCP_SECRET:
        server_logger.warning("MCP_SECRET_KEY not set — all requests will be rejected")
        return False
    if not token:
        return False
    return hmac.compare_digest(MCP_SECRET.encode(), token.encode())


def error_response(message: str) -> list[TextContent]:
    """Return a structured error — never a traceback."""
    return [TextContent(type="text", text=json.dumps({"error": message}))]


# ─── Audit Logger ──────────────────────────────────────────────────────────

def log_tool_call(
    tool_name: str,
    input_dict: dict,
    result_status: str,
    latency_ms: int,
    error: str = None,
) -> None:
    LOG_PATH.parent.mkdir(parents=True, exist_ok=True)
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


# ─── Input Schemas ─────────────────────────────────────────────────────────

class SearchInput(BaseModel):
    query: str = Field(..., min_length=1, max_length=500)
    max_results: int = Field(default=5, ge=1, le=20)
    _auth_token: str = Field(default="", alias="_auth_token")

    class Config:
        populate_by_name = True


# ─── MCP Server ────────────────────────────────────────────────────────────

app = Server("capstone-production")


@app.list_tools()
async def list_tools() -> list[Tool]:
    return [
        Tool(
            name="search_knowledge",
            description="Search the capstone knowledge base for relevant information.",
            inputSchema={
                "type": "object",
                "properties": {
                    "_auth_token": {
                        "type": "string",
                        "description": "Bearer auth token"
                    },
                    "query": {
                        "type": "string",
                        "description": "Search query (max 500 chars)"
                    },
                    "max_results": {
                        "type": "integer",
                        "description": "Number of results (1-20)",
                        "default": 5
                    }
                },
                "required": ["_auth_token", "query"]
            }
        )
    ]


@app.call_tool()
async def call_tool(name: str, arguments: dict) -> list[TextContent]:
    start = time.time()

    # ── Layer 1: Authentication ───────────────────────────────────────────
    token = arguments.pop("_auth_token", "")
    if not verify_token(token):
        log_tool_call(name, {}, "auth_failed", round((time.time() - start) * 1000))
        return error_response("unauthorized")

    # ── Layer 2: Input Validation ─────────────────────────────────────────
    if name == "search_knowledge":
        try:
            validated = SearchInput(**arguments)
        except ValidationError as e:
            log_tool_call(
                name, arguments, "validation_failed",
                round((time.time() - start) * 1000),
                f"{e.error_count()} validation errors"
            )
            return error_response("invalid_input")

        # ── Layer 3 + 4: Execute with logging and error sanitisation ──────
        try:
            result = await do_search(validated.query, validated.max_results)
            latency_ms = round((time.time() - start) * 1000)
            log_tool_call(name, validated.dict(), "ok", latency_ms)
            return [TextContent(type="text", text=json.dumps(result))]

        except Exception as e:
            latency_ms = round((time.time() - start) * 1000)
            # Log full error server-side
            server_logger.error(f"Tool {name} failed: {e}", exc_info=True)
            # Log status for audit
            log_tool_call(name, validated.dict(), "error", latency_ms, type(e).__name__)
            # Return only a safe error code to caller
            return error_response("tool_execution_failed")

    return error_response("unknown_tool")


# ─── Your Tool Logic ───────────────────────────────────────────────────────

async def do_search(query: str, max_results: int) -> dict:
    """
    Replace this with your actual search implementation.
    This is where your RAG retrieval, database query, or API call goes.
    """
    # Placeholder — replace with real implementation
    return {
        "results": [
            {"text": f"Result for: {query}", "score": 0.95}
        ][:max_results],
        "query": query,
        "total_found": 1,
    }


# ─── Entry Point ──────────────────────────────────────────────────────────

async def main():
    if not MCP_SECRET:
        print("WARNING: MCP_SECRET_KEY environment variable not set.")
        print("Set it before running in production: export MCP_SECRET_KEY=your_secret")

    async with stdio_server() as (read_stream, write_stream):
        await app.run(read_stream, write_stream, app.create_initialization_options())


if __name__ == "__main__":
    asyncio.run(main())
