# Lab 8: MCP Production Upgrade and Optimisation Sprint

**CS-AI-2025 · Building AI-Powered Applications · Spring 2026**
**Friday 8 May 2026 · Group A 09:00 · Group B 11:00**

---

## What This Lab Is

Lab 8 is a two-part capstone sprint. You are not learning new concepts — you are hardening what you built in Labs 6 and 7 to meet production standards. The Safety and Evaluation Audit (Week 11, 10 pts) reads the commit you push today. Everything you do in this lab produces direct audit evidence.

**By the end of this lab your team will have:**
- A production-grade MCP server with authentication, input validation, and audit logging
- Prompt caching implemented on your primary model call with before/after benchmark
- An OpenRouter fallback chain configured and verified
- Your episode log extended with caching and latency fields
- A committed tag: `lab8-mcp-capstone`

---

## Prerequisites — Come With These Ready

Before you arrive (or fix in the first 10 minutes):

- [ ] Lab 7 agent architecture committed and pushed — `lab7-agent-architecture` tag exists
- [ ] Episode log running from Lab 6 — at minimum captures `ts`, `event_type`, `cost_usd`
- [ ] Lab 6 MCP server code accessible in your team repo under `mcp-server/`
- [ ] Your 10 golden test questions drafted (even rough versions) — you run them in lab
- [ ] Python 3.10+ and Node 18+ confirmed — run `python verify_setup.py` from Lab 5 if unsure
- [ ] OpenRouter API key working — test with a single call if in doubt

If your Lab 6 MCP server does not exist or was not committed, start with `starter-code/mcp-server/` in this folder. It is a working baseline you can upgrade.

---

## Lab Schedule

| Time | Activity | Duration |
|------|----------|----------|
| :00 | Arrival, status check, blocker queue | 10 min |
| :10 | Lab intro and Safety Audit brief walkthrough | 10 min |
| :20 | Part 1: MCP Production Upgrade | 60 min |
| :80 | Part 2: Caching and Benchmark Sprint | 40 min |
| :120 | Commit, tag, push, and wrap-up | 10 min |

*Group A runs 09:00 to 11:00. Group B runs 11:00 to 13:00.*

---

## Part 1: MCP Production Upgrade (60 minutes)

**Goal:** Upgrade your Lab 6 MCP tool to pass the Safety Audit security checks.

**Work through these steps in order:**

### Step 1 — Add Bearer Token Authentication (15 min)
Open `mcp-server/` in your team repo. Add token verification before any tool execution. Use the pattern in `starter-code/mcp-server/auth.py`. Your token should come from an environment variable, never hardcoded.

Test it: call the tool with a wrong token. You should receive a structured JSON error, not a traceback.

### Step 2 — Add Pydantic Input Validation (15 min)
Every input parameter your tool accepts should be validated before execution. Use the pattern in `starter-code/mcp-server/validated_tool.py`. Define the schema explicitly — do not trust `arguments` as a raw dict.

Test it: send a malformed input (missing required field, wrong type). Confirm the error is caught before your tool logic runs.

### Step 3 — Replace Print Statements with Structured Logging (15 min)
Every tool call should produce a structured JSON log entry. Use the template in `templates/mcp-audit-log-template.py`. The log must capture: tool name, input hash (not raw input), result status, and latency in milliseconds.

Test it: make three tool calls and open your log file. Confirm three entries appear in JSON format.

### Step 4 — Sanitise Error Responses (15 min)
Run your MCP tool with a deliberately broken internal dependency (comment out a function it calls). Inspect what gets returned to the caller. If you see a Python traceback, internal file paths, or environment variable names — that is a security failure. Wrap all execution in try/except and return a structured error code.

Test it: trigger an internal error. Confirm the caller receives `{"error": "tool_execution_failed"}` or equivalent — nothing more.

---

## Part 2: Caching and Benchmark Sprint (40 minutes)

**Goal:** Implement prompt caching and prove it works with numbers.

### Step 1 — Identify the Cache Target (5 min)
Open your main AI endpoint. Find the system prompt. Count its tokens (log `input_tokens` from your next API call). If it is longer than 1024 tokens and fires on every user request, it is a caching candidate. If your system prompt is short, check whether you inject a large document or knowledge base as context — that is also cacheable.

Write down: which call you are caching, and approximately how many tokens the cached prefix contains.

### Step 2 — Implement Caching (15 min)
Add `cache_control` markup (Anthropic) or `CachedContent` (Gemini) using the patterns in `guides/prompt-caching-guide.md`. Add `cache_read_tokens` and `cache_write_tokens` to your episode log schema.

### Step 3 — Run the Benchmark (10 min)
Run your main endpoint 10 times with caching off (comment out the markup). Record median latency and total cost from your episode log. Then run it 10 times with caching on. Record again.

Write the results in `docs/optimization-report.md` using the template in `templates/optimization-report-template.md`.

### Step 4 — Configure OpenRouter Fallback (10 min)
If you are using OpenRouter, define your fallback chain explicitly. Add `fallback_triggered` to your episode log. Force a primary model failure by temporarily using an invalid model string — confirm the fallback fires and logs correctly.

---

## Commit, Tag, and Push

When both parts are complete:

```bash
git add -A
git commit -m "lab8: production MCP upgrade + prompt caching + benchmark

- MCP server: added bearer auth, pydantic validation, structured logging, error sanitisation
- Prompt caching: implemented on [your main call], saving [X]% on input tokens
- OpenRouter: fallback chain configured with [model1] -> [model2]
- Episode log: extended with cache_read_tokens, cache_write_tokens, latency_ms, fallback_triggered
- Optimization report: docs/optimization-report.md"

git tag lab8-mcp-capstone
git push origin main --tags
```

The tag `lab8-mcp-capstone` is the commit the Safety Audit reads. Do not tag before both parts are complete.

---

## Safety Audit Brief

The Safety and Evaluation Audit brief is distributed in this folder as `SAFETY-AUDIT-BRIEF.md`. Read it before you leave today. Evidence is due Thursday 14 May at 23:59. The Week 11 lab (Friday 15 May) is a live verification session — not a tutorial.

---

## Files in This Package

```
Lab-8/
├── README.md                          ← You are here
├── QUICKSTART.md                      ← Get started in 5 minutes
├── GRADING-RUBRIC.md                  ← What the Safety Audit checks
├── SAFETY-AUDIT-BRIEF.md              ← The audit brief distributed today
├── guides/
│   ├── mcp-production-guide.md        ← Auth, validation, sandboxing patterns
│   ├── prompt-caching-guide.md        ← Anthropic and Gemini caching implementation
│   ├── openrouter-fallback-guide.md   ← Fallback chain configuration
│   └── episode-log-extension-guide.md ← New fields required from Lab 8
├── templates/
│   ├── mcp-audit-log-template.py      ← Structured JSON logging for MCP tools
│   ├── optimization-report-template.md ← Before/after benchmark document
│   ├── safety-audit-template.md       ← docs/safety-audit.md skeleton
│   └── lab8-checklist.md              ← Individual close-out checklist
└── starter-code/
    ├── mcp-server/
    │   ├── auth.py                    ← Bearer token auth pattern
    │   ├── validated_tool.py          ← Pydantic validation pattern
    │   ├── audit_logger.py            ← Structured JSON logger
    │   └── production_server.py       ← Complete upgraded server template
    ├── fastapi/
    │   ├── caching_router.py          ← Anthropic cache_control pattern
    │   └── gemini_caching_router.py   ← Gemini CachedContent pattern
    └── eval/
        ├── golden_set_template.json   ← 10-question template with schema
        └── run_golden_set.py          ← LLM-as-judge evaluation script
```

---

## Getting Help

- **Blocked on MCP auth:** See `starter-code/mcp-server/production_server.py` — it is a working upgraded server you can diff against your own.
- **Caching not showing hits:** Ensure your system prompt prefix is identical on every call (no dynamic content inside the cached section). Even one character difference breaks the cache.
- **Episode log missing fields:** See `guides/episode-log-extension-guide.md` for the exact schema update.
- **Office hours:** zeshan.ahmad@kiu.edu.ge — book via email for Google Meet.

---

*Lab 8 · CS-AI-2025 · Spring 2026 · KIU*
