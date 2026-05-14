# Metrics Report

**Team Name:**
**Capstone Project:**
**Generated:** [Date — or use the metrics_report.py script to auto-generate this]
**Episode log entries analysed:** [Run `wc -l logs/episode-log.jsonl`]

---

## Summary Statistics

| Metric | Value |
|--------|-------|
| Total LLM calls | |
| Total MCP tool calls | |
| Total cost to date (USD) | |
| Average cost per LLM call (USD) | |
| P50 latency (ms) | |
| P95 latency (ms) | |
| Cache hit rate | |
| Cache token saving rate | |
| Error rate | |
| Fallback trigger rate | |

*Use `python starter-code/observability/metrics_report.py` to populate this table automatically.*

---

## Threshold Check (Week 11 Targets)

| Metric | Value | Target | Status |
|--------|-------|--------|--------|
| Cache hit rate | | > 80% | |
| Cache token saving rate | | > 50% | |
| Latency P50 | | < 3000 ms | |
| Latency P95 | | < 6000 ms | |
| Fallback trigger rate | | < 5% | |
| Error rate | | < 2% | |

---

## Model Distribution

| Model | Calls | Share of Total | Task Types Routed |
|-------|-------|----------------|-------------------|
| | | | |
| | | | |
| | | | |

*Fill in the "Task Types Routed" column after completing the model selection review in Lab 9.*

---

## Alerts and Actions

**Metrics below threshold:**

[List any metrics that failed the threshold check, and what you are doing to address them]

Example:
- Cache hit rate 42% (target: 80%) — investigating whether system prompt prefix is being constructed dynamically. Will split into static and dynamic sections in next sprint.

**No issues if all thresholds pass.**

---

## Cost Analysis

**Total spend on LLM calls this semester:** $[total]

**Breakdown by model:**

| Model | Calls | Total Cost (USD) | Avg per Call (USD) |
|-------|-------|------------------|--------------------|
| | | | |
| | | | |

**Caching savings achieved:**

Without caching (from optimization-report.md): $[total per 10 calls]
With caching (from optimization-report.md): $[total per 10 calls]
Reduction: [X]%

*Reference your `docs/optimization-report.md` from Lab 8 for the before/after benchmark numbers.*

---

## What We Would Optimise Next

[Based on the metrics above, what are the top two or three changes that would have the biggest impact on cost or latency? Be specific.]

Examples:
- Intent classification calls (currently using Gemini 2.5 Flash) could move to Gemini 2.0 Flash free tier — estimated 80% cost reduction on those calls with no quality impact.
- P95 latency is 4,200 ms — the slow tail is caused by RAG retrieval taking 2,000+ ms. Switching to async chunk fetching would halve this.

---

*Metrics Report · CS-AI-2025 · Spring 2026 · KIU*
