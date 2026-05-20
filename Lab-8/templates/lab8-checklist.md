# Lab 8 Individual Close-Out Checklist

**CS-AI-2025 · Spring 2026**
**Complete this before leaving the lab session. Submit to the course LMS by end of day.**

---

**Name:**
**Team:**
**Date:** Friday 8 May 2026

---

## Part 1: MCP Production Upgrade

Tick each item your team completed in today's session:

- [ ] Bearer token authentication added to MCP server
- [ ] Bad token test confirmed: returns `{"error": "unauthorized"}` — not a traceback
- [ ] Pydantic input validation added to at least one tool
- [ ] Malformed input test confirmed: validation catches it before tool logic runs
- [ ] Print statements replaced with structured JSON audit logger
- [ ] Three tool calls produce three JSON entries in `logs/mcp-audit.jsonl`
- [ ] try/except wraps all tool execution with sanitised error response
- [ ] Forced internal error confirmed: caller receives `{"error": "tool_execution_failed"}`

**What you personally worked on in Part 1:**
*(Write 2–3 sentences. What specific lines or functions did you touch?)*

[Write here]

---

## Part 2: Caching and Benchmark

- [ ] Cacheable prefix identified and its token count estimated
- [ ] Cache_control markup (Anthropic) or CachedContent (Gemini) implemented
- [ ] `cache_read_tokens` appears in episode log entries after the first call
- [ ] 10 benchmark calls run without caching — numbers recorded
- [ ] 10 benchmark calls run with caching — numbers recorded
- [ ] `docs/optimization-report.md` written with before/after comparison
- [ ] OpenRouter fallback chain defined with at least one fallback model
- [ ] `fallback_triggered` field added to episode log schema
- [ ] Fallback tested: forced primary failure, fallback fired and logged

**What you personally worked on in Part 2:**
*(Write 2–3 sentences.)*

[Write here]

---

## Commit Status

- [ ] All Part 1 and Part 2 work committed to the team repo
- [ ] Commit message is descriptive (not "lab8 done" — see README for the template)
- [ ] Tag `lab8-mcp-capstone` pushed and visible on GitHub
- [ ] Confirmed tag is visible at: `https://github.com/ZA-KIU-Classroom/AI-POWERED-SOFTWARE-DEV-SP26/[your-repo]/tags`

**Tag URL (paste here):**
[Write here]

---

## Safety Audit Awareness

- [ ] I have read the `SAFETY-AUDIT-BRIEF.md` from this lab's GitHub folder
- [ ] I know that `docs/safety-audit.md` is due Thursday 14 May at 23:59
- [ ] I know what the six audit areas are and which ones I am personally responsible for helping gather evidence for

**Which audit area is your team most at risk of not completing?**
*(Be honest. This is for your own planning, not graded.)*

[Write here]

**What will you do before Thursday 14 May to close that gap?**

[Write here]

---

## Blockers and Questions

**Any issues not resolved in today's lab:**
*(If you left the session with something broken, describe it here so you can follow up.)*

[Write here]

**Questions for office hours or the course GitHub issue tracker:**

[Write here]

---

*Lab 8 Individual Close-Out · CS-AI-2025 · Spring 2026 · KIU*
