"""
NutriSmart Production MCP Server

Security layers (Lab 8 requirements):
  1. Bearer token authentication  — verify_token() with constant-time compare
  2. Pydantic input validation    — NutritionSearchInput, MealLogInput schemas
  3. Structured audit logging     — every call → logs/mcp-audit.jsonl (JSONL)
  4. Sanitised error responses    — error_response() never leaks tracebacks

Tools exposed:
  search_food_database  — look up nutrition facts for a food item
  log_meal_intake       — append a verified meal entry to the user's log

Run:
  MCP_SECRET_KEY=your_secret python mcp_server.py
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

# ── Configuration ─────────────────────────────────────────────────────────────

MCP_SECRET  = os.environ.get("MCP_SECRET_KEY", "")
AUDIT_LOG   = Path(os.environ.get("MCP_LOG_PATH", "logs/mcp-audit.jsonl"))
BACKEND_URL = os.environ.get("BACKEND_URL", "http://localhost:5000")

logging.basicConfig(level=logging.INFO)
_server_log = logging.getLogger("nutrismart-mcp")   # tracebacks go here, not to caller


# ── Layer 1: Authentication ───────────────────────────────────────────────────

def verify_token(token: str) -> bool:
    """Constant-time comparison — prevents timing-based token enumeration."""
    if not MCP_SECRET:
        _server_log.warning("MCP_SECRET_KEY not set — all requests will be rejected")
        return False
    if not token:
        return False
    return hmac.compare_digest(MCP_SECRET.encode(), token.encode())


# ── Layer 4: Sanitised error responses ───────────────────────────────────────

def error_response(code: str) -> list[TextContent]:
    """Return a structured error code — never a raw traceback or file path."""
    return [TextContent(type="text", text=json.dumps({"error": code}))]


# ── Layer 3: Structured audit logging ────────────────────────────────────────

def _audit(
    tool_name: str,
    input_dict: dict,
    result_status: str,
    latency_ms: int,
    error: str | None = None,
) -> None:
    AUDIT_LOG.parent.mkdir(parents=True, exist_ok=True)
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
    with open(AUDIT_LOG, "a", encoding="utf-8") as f:
        f.write(json.dumps(entry) + "\n")


# ── Layer 2: Pydantic input schemas ──────────────────────────────────────────

class NutritionSearchInput(BaseModel):
    """Schema for search_food_database tool."""
    query: str       = Field(..., min_length=1, max_length=500,
                             description="Food name or description (max 500 chars)")
    max_results: int = Field(default=5, ge=1, le=20,
                             description="Number of results to return (1–20)")
    _auth_token: str = Field(default="", alias="_auth_token")

    class Config:
        populate_by_name = True


class MealLogInput(BaseModel):
    """Schema for log_meal_intake tool."""
    user_id:          str   = Field(..., min_length=1, max_length=64)
    meal_description: str   = Field(..., min_length=1, max_length=1000)
    calories:         float = Field(..., ge=0, le=10000)
    protein_g:        float = Field(..., ge=0)
    carbs_g:          float = Field(..., ge=0)
    fat_g:            float = Field(..., ge=0)
    _auth_token: str        = Field(default="", alias="_auth_token")

    class Config:
        populate_by_name = True


# ── MCP Server ────────────────────────────────────────────────────────────────

app = Server("nutrismart-mcp")


@app.list_tools()
async def list_tools() -> list[Tool]:
    return [
        Tool(
            name="search_food_database",
            description="Search nutrition facts for a food item.",
            inputSchema={
                "type": "object",
                "properties": {
                    "_auth_token": {"type": "string", "description": "Bearer token"},
                    "query":       {"type": "string", "description": "Food name (max 500 chars)"},
                    "max_results": {"type": "integer", "description": "1–20", "default": 5},
                },
                "required": ["_auth_token", "query"],
            },
        ),
        Tool(
            name="log_meal_intake",
            description="Append a verified meal entry to the user's nutrition log.",
            inputSchema={
                "type": "object",
                "properties": {
                    "_auth_token":      {"type": "string"},
                    "user_id":          {"type": "string", "maxLength": 64},
                    "meal_description": {"type": "string", "maxLength": 1000},
                    "calories":         {"type": "number", "minimum": 0},
                    "protein_g":        {"type": "number", "minimum": 0},
                    "carbs_g":          {"type": "number", "minimum": 0},
                    "fat_g":            {"type": "number", "minimum": 0},
                },
                "required": ["_auth_token", "user_id", "meal_description",
                             "calories", "protein_g", "carbs_g", "fat_g"],
            },
        ),
    ]


@app.call_tool()
async def call_tool(name: str, arguments: dict) -> list[TextContent]:
    start = time.time()

    # ── Layer 1: Auth (before any tool logic) ─────────────────────────────────
    token = arguments.pop("_auth_token", "")
    if not verify_token(token):
        _audit(name, {}, "auth_failed", round((time.time() - start) * 1000))
        return error_response("unauthorized")

    # ── Dispatch ──────────────────────────────────────────────────────────────
    if name == "search_food_database":
        return await _search_food(name, arguments, start)

    if name == "log_meal_intake":
        return await _log_meal(name, arguments, start)

    return error_response("unknown_tool")


async def _search_food(name: str, arguments: dict, start: float) -> list[TextContent]:
    # ── Layer 2: Input validation ─────────────────────────────────────────────
    try:
        validated = NutritionSearchInput(**arguments)
    except ValidationError as exc:
        _audit(name, arguments, "validation_failed",
               round((time.time() - start) * 1000),
               f"{exc.error_count()} validation errors")
        return error_response("invalid_input")

    # ── Layer 3 + 4: Execute, log, sanitise errors ────────────────────────────
    try:
        result = await _do_nutrition_search(validated.query, validated.max_results)
        _audit(name, validated.model_dump(), "ok", round((time.time() - start) * 1000))
        return [TextContent(type="text", text=json.dumps(result))]
    except Exception as exc:
        _server_log.error("search_food_database failed: %s", exc, exc_info=True)
        _audit(name, validated.model_dump(), "error",
               round((time.time() - start) * 1000), type(exc).__name__)
        return error_response("tool_execution_failed")


async def _log_meal(name: str, arguments: dict, start: float) -> list[TextContent]:
    try:
        validated = MealLogInput(**arguments)
    except ValidationError as exc:
        _audit(name, arguments, "validation_failed",
               round((time.time() - start) * 1000),
               f"{exc.error_count()} validation errors")
        return error_response("invalid_input")

    try:
        import httpx
        async with httpx.AsyncClient() as client:
            resp = await client.post(f"{BACKEND_URL}/api/history", json={
                "user_id":          validated.user_id,
                "meal_description": validated.meal_description,
                "nutrients": {
                    "calories": validated.calories, "protein_g": validated.protein_g,
                    "carbs_g":  validated.carbs_g,  "fat_g":     validated.fat_g,
                    "sugar_g":  0, "fiber_g": 0,
                },
                "imbalances": [], "suggestions": [], "confidence": "medium",
                "items_detected": [],
            }, timeout=10.0)
            resp.raise_for_status()
        _audit(name, validated.model_dump(exclude={"user_id"}), "ok",
               round((time.time() - start) * 1000))
        return [TextContent(type="text", text=json.dumps({"status": "logged"}))]
    except Exception as exc:
        _server_log.error("log_meal_intake failed: %s", exc, exc_info=True)
        _audit(name, validated.model_dump(exclude={"user_id"}), "error",
               round((time.time() - start) * 1000), type(exc).__name__)
        return error_response("tool_execution_failed")


# ── Tool logic ────────────────────────────────────────────────────────────────

async def _do_nutrition_search(query: str, max_results: int) -> dict:
    """
    Stub nutrition lookup — replace with USDA FoodData Central API or similar.
    The stub returns representative values for common foods.
    """
    STUB_DB = {
        "chicken breast": {"calories": 165, "protein_g": 31, "fat_g": 3.6, "carbs_g": 0},
        "egg":            {"calories": 155, "protein_g": 13, "fat_g": 11,  "carbs_g": 1.1},
        "brown rice":     {"calories": 216, "protein_g": 5,  "fat_g": 1.8, "carbs_g": 45},
        "spinach":        {"calories": 23,  "protein_g": 2.9,"fat_g": 0.4, "carbs_g": 3.6},
        "banana":         {"calories": 89,  "protein_g": 1.1,"fat_g": 0.3, "carbs_g": 23},
        "oats":           {"calories": 389, "protein_g": 17, "fat_g": 7,   "carbs_g": 66},
        "avocado":        {"calories": 160, "protein_g": 2,  "fat_g": 15,  "carbs_g": 9},
        "milk":           {"calories": 61,  "protein_g": 3.2,"fat_g": 3.3, "carbs_g": 4.8},
    }
    key = query.lower().strip()
    matches = [
        {"food": k, "per_100g": v, "score": 1.0 if k == key else 0.7}
        for k, v in STUB_DB.items()
        if key in k or k in key
    ]
    return {"results": matches[:max_results], "query": query, "total_found": len(matches)}


# ── Entry point ───────────────────────────────────────────────────────────────

async def main() -> None:
    if not MCP_SECRET:
        print("WARNING: MCP_SECRET_KEY not set. All requests will be rejected.")
    async with stdio_server() as (read_stream, write_stream):
        await app.run(read_stream, write_stream, app.create_initialization_options())


if __name__ == "__main__":
    asyncio.run(main())
