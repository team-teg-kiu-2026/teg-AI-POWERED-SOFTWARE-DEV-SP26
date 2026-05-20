# Lab 8 Quickstart

**Get oriented and into your first task in under 5 minutes.**

---

## Step 1 — Confirm Your Starting Point (2 min)

Open your team repo. Verify these exist before writing a single line of new code:

```bash
# Check your Lab 7 tag exists
git tag | grep lab7

# Check your MCP server folder exists
ls mcp-server/

# Check your episode log is present
ls logs/

# Check Python version
python --version  # Must be 3.10+
```

If any of these fail, raise your hand. Do not skip this check.

---

## Step 2 — Open the Four Files You Will Work In (1 min)

You will touch exactly four areas today:

1. `mcp-server/` — you are upgrading this (Part 1)
2. Your main FastAPI or Next.js AI route — you are adding caching (Part 2)
3. Your episode log utility — you are extending the schema (Part 2)
4. `docs/optimization-report.md` — you are creating this (Part 2)

Open all four now before starting.

---

## Step 3 — Part 1 Order of Operations (use this as your checklist)

```
[ ] Add bearer token auth to your MCP server
[ ] Test: bad token returns structured JSON error, not traceback
[ ] Add Pydantic validation to all tool inputs
[ ] Test: malformed input is caught before tool logic runs
[ ] Replace print statements with structured JSON audit logger
[ ] Test: three calls produce three JSON entries in your log file
[ ] Wrap tool execution in try/except with sanitised error response
[ ] Test: forced internal error returns {"error": "tool_execution_failed"}
```

---

## Step 4 — Part 2 Order of Operations

```
[ ] Identify your cacheable system prompt prefix and count its tokens
[ ] Add cache_control (Anthropic) or CachedContent (Gemini) markup
[ ] Add cache_read_tokens and cache_write_tokens to episode log schema
[ ] Run 10 calls, record median latency and total cost (no cache)
[ ] Run 10 calls, record median latency and total cost (with cache)
[ ] Write docs/optimization-report.md with both sets of numbers
[ ] Define OpenRouter fallback chain explicitly
[ ] Add fallback_triggered field to episode log
[ ] Test: force primary model failure, confirm fallback fires
```

---

## Step 5 — Final Commit (last 10 min of lab)

```bash
git add -A
git commit -m "lab8: production MCP upgrade + prompt caching + benchmark"
git tag lab8-mcp-capstone
git push origin main --tags
```

Confirm the tag is visible on GitHub before you leave.

---

## If You Are Stuck

- **MCP auth pattern:** `starter-code/mcp-server/auth.py`
- **Caching pattern (Anthropic):** `starter-code/fastapi/caching_router.py`
- **Caching pattern (Gemini):** `starter-code/fastapi/gemini_caching_router.py`
- **Episode log extension:** `guides/episode-log-extension-guide.md`
- **Complete upgraded MCP server:** `starter-code/mcp-server/production_server.py`
