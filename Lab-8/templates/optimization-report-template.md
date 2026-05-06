# Optimisation Report

**Team Name:**
**Date:**
**Capstone Project:**

---

## 1. What We Optimised

**Target call identified:**
[e.g. "The main chat endpoint at POST /api/ai/chat, which fires on every user message"]

**Model used for this call:**
[e.g. "claude-sonnet-4-5"]

**Approximate system prompt token count:**
[e.g. "~2,100 tokens — confirmed from input_tokens in episode log"]

**Reason this call is a caching candidate:**
[e.g. "The system prompt is identical on every call and contains our full knowledge base. Only the user message changes."]

---

## 2. Benchmark Results — Without Caching

**Test procedure:** 10 consecutive calls to the same endpoint with identical system prompt. Cache_control markup removed.

| Call # | Input Tokens | Output Tokens | Cost (USD) | Latency (ms) |
|--------|-------------|---------------|------------|--------------|
| 1 | | | | |
| 2 | | | | |
| 3 | | | | |
| 4 | | | | |
| 5 | | | | |
| 6 | | | | |
| 7 | | | | |
| 8 | | | | |
| 9 | | | | |
| 10 | | | | |

**Median latency (ms):**
**Total cost (USD):**
**Average cost per call (USD):**

---

## 3. Benchmark Results — With Caching

**Test procedure:** 10 consecutive calls to the same endpoint with cache_control markup active.

| Call # | Input Tokens | Cache Read Tokens | Cache Write Tokens | Cost (USD) | Latency (ms) | Cache Hit |
|--------|-------------|------------------|-------------------|------------|--------------|-----------|
| 1 | | | | | | Write |
| 2 | | | | | | |
| 3 | | | | | | |
| 4 | | | | | | |
| 5 | | | | | | |
| 6 | | | | | | |
| 7 | | | | | | |
| 8 | | | | | | |
| 9 | | | | | | |
| 10 | | | | | | |

**Cache hit rate:** [X]/10 calls
**Median latency (ms):**
**Total cost (USD):**
**Average cost per call (USD):**

---

## 4. Summary and Analysis

**Cost reduction:**
Without caching: $[total] total / $[avg] per call
With caching: $[total] total / $[avg] per call
Reduction: [X]%

**Latency change:**
Without caching: [median]ms median
With caching: [median]ms median
Change: [+/-X ms]

**Why latency changed (or did not change):**
[e.g. "Caching reduced input processing time but the main latency driver is token generation, which is unchanged"]

**Tokens saved by caching per call (on cache hits):**
[e.g. "2,100 tokens cached = 2,100 × 0.75 = 1,575 tokens saved per call vs standard input pricing"]

---

## 5. OpenRouter Fallback Chain

**Fallback chain configured:**

```
Primary:    [model string]
Fallback 1: [model string]
Fallback 2: [model string] (if applicable)
```

**Fallback test result:**
[Describe: forced primary failure, confirmed fallback fired, show episode log entry with fallback_triggered: true]

---

## 6. What We Would Do Next

[If you had more time, what further optimisations would you apply? Examples: async batching, smaller model for classification steps, document chunking to reduce context size]

---

*Optimisation Report · CS-AI-2025 · Spring 2026*
