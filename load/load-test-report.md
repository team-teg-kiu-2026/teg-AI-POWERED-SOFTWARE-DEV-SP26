# Load Test Report

Tool: **Locust 2.44.1** · Scenario: [`load/locustfile.py`](locustfile.py) · Raw data: [`locust_run_stats.csv`](locust_run_stats.csv) (after), [`locust_run_BEFORE_stats.csv`](locust_run_BEFORE_stats.csv) (before) · Summary capture: [`screenshots/locust-summary.txt`](screenshots/locust-summary.txt)

## Configuration

- **Target host:** local run of the production Docker image (`nutrismart-backend`) over HTTP, plus the live `/health` gate checked on `https://nutrismart-production-2965.up.railway.app`
- **Users:** 20   **Spawn rate:** 5/s   **Duration:** 60s   **Mode:** headless
- **Primary model under test:** `google/gemini-2.5-flash` (OpenRouter), fallback `openai/gpt-4o` → `meta-llama/llama-3.3-70b-instruct`
- **Date of run:** 11 June 2026

**Why a local run of the production image, not the live URL:** Locust's gevent-patched SSL fails on this Windows + Python 3.13 machine — every request to a remote **HTTPS** host comes back as `status 0`, even though `curl` and PowerShell hit the same URL fine and get `200`. To get honest numbers we load-tested a local container built from the exact production `Dockerfile` over HTTP, which exercises the real stack (gunicorn → Flask → OpenRouter → Supabase). The `/health` latency gate is verified separately against the live Railway HTTPS URL.

**Reading the "fails" column:** every request returned **HTTP 200**. The failures Locust reports are our own `catch_response` latency SLAs (`chat > 2s`, `health > 500ms`), not transport errors. True HTTP error rate is **0%**, with **0** rate-limit (429) events.

## Results (after the worker fix — see "What you changed")

| Metric | Result | Target | Pass? |
|---|---|---|---|
| `/health` response (live Railway) | 247 ms steady (702 ms cold) | under 500 ms | ✅ |
| `/health` p50 (local image) | 5 ms | reference | ✅ |
| Chat p50 latency | 2,300 ms | reference | — |
| Chat p95 latency | 14,000 ms | under 2,000 ms | ❌ (see below) |
| Chat p99 latency | 21,000 ms | reference | — |
| Throughput (aggregate) | 3.94 req/s | reference | — |
| HTTP error rate | 0% | under 2% | ✅ |
| 429 / fallback events | 0 | fallback should catch | ✅ (none needed) |

## What broke first

With the original **2 synchronous gunicorn workers**, the server could only handle **2 concurrent requests**. Under 20 users every request queued, so chat p50 hit **23 s** and even `/health` was stuck at **21 s** behind slow LLM calls — only **43 requests** completed in 60 s (0.73 req/s). The bottleneck was worker concurrency, not the model or the network.

## What you changed in response

Switched gunicorn to **threaded workers** (`--worker-class gthread --workers 2 --threads 8` = 16 concurrent slots). This service is I/O-bound — it spends most of each request waiting on OpenRouter — so threads let one worker serve many in-flight requests instead of blocking. Result:

| | Before (2 sync) | After (2×8 gthread) |
|---|---|---|
| `/health` p50 | 21,000 ms | **5 ms** |
| Chat p50 | 23,000 ms | **2,300 ms** |
| Requests in 60s | 43 | **234** |
| Throughput | 0.73 req/s | **3.94 req/s** |

`/health` is no longer blocked by chat traffic, and throughput improved **5.4×**.

**Remaining finding:** chat p95 (14 s) still exceeds the 2 s target. Two honest reasons: (1) a single Gemini 2.5 Flash call already takes ~2–3 s, so 2 s p95 is an aggressive SLA for an LLM endpoint; (2) 20 concurrent users still exceed 16 thread slots, so a queue forms under sustained peak. Mitigations for production scale: raise worker/thread count or instances, stream tokens so time-to-first-byte drops, and cache common questions. For class-sized concurrency (≤ a handful at once) p50 ~2.3 s is the realistic experience.

**Fallback chain:** no 429s occurred (Gemini served every call), so the chain didn't need to fire during this run. It is demonstrably wired, though: production logs from an earlier deploy show the primary returning errors, three failed attempts, then a **200 from the GPT-4o fallback** — the user still got a working answer. The dead primary slug that caused those errors (`google/gemini-flash-1.5`, now 404 on OpenRouter) was fixed to `google/gemini-2.5-flash` as part of this lab.

## Cost note

≈ 240 real chat completions were issued across both load runs plus smoke tests, on `google/gemini-2.5-flash` (~600 in / ~150 out tokens each) → **≈ $0.13** total. Projected monthly cost at a realistic class usage of ~50 chats/day ≈ **$1–2/month** on the primary model; the GPT-4o fallback is ~50× pricier per call but only fires when the primary is unavailable.

_Evidence: `load/locust_run_stats.csv`, `load/locust_run_BEFORE_stats.csv`, `load/screenshots/locust-summary.txt`._
