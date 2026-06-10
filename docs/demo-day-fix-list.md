# Demo Day Fix List

Ranked after the Lab 12 hardening pass (11 June 2026). Most "must-fix" items were found **and** fixed during the pass; they are listed with their resolution so the demo narrative is clear.

## Must fix (a judge will notice) — DONE during the pass

1. ✅ **Dead primary model.** `google/gemini-flash-1.5` now 404s on OpenRouter, so every chat burned 3 retries before falling back to GPT-4o (50× pricier). Fixed to `google/gemini-2.5-flash`; chat now succeeds on the first call. The eval judge model had the same dead slug — also fixed.
2. ✅ **No `/health` endpoint.** Added a fast, no-I/O `/health` (Repository Review hard gate); 247 ms live, ~4 ms local.
3. ✅ **Worker starvation under load.** 2 sync workers served only 2 concurrent requests; `/health` p50 was 21 s under load. Switched to `gthread` (2×8); throughput 0.73→3.94 req/s and `/health` p50 21 s→5 ms.
4. ✅ **Prompt-injection exposure.** Added untrusted-content fencing, a hardened system prompt, and an output filter. All four red-team attacks (direct, indirect, jailbreak, cross-user) held.
5. ✅ **Over-refusal regression** introduced by the first hardening pass (model refused "protein in chicken breast"). Broadened the prompt scope; eval recovered from 6/10 to 8/10 with the red team still holding.

## Should fix (improves the score)

1. **Chat p95 latency (14 s under 20 concurrent users).** A single Gemini 2.5 Flash call is ~2–3 s, so the 2 s p95 target is aggressive. Stream tokens (lower time-to-first-byte) and/or add an instance for true concurrency.
2. **Eval pass rate 7–8/10.** Remaining misses are format-strictness (g008 JSON object) and occasional terseness (g004 reasoning). Tighten the format adherence in the system prompt and re-judge.
3. **Output filter is a deny-list.** It catches key/JWT/prompt-echo shapes; add a couple more secret patterns and consider an allow-list framing for the highest-risk responses.

## Nice to have (only if everything above is done)

1. Add a real 429 injection in the load test to demonstrate the fallback firing live (currently demonstrated from production logs, not a synthetic 429).

## Videos

- [ ] 2-minute narrated demo video recorded and embedded in README
- [ ] 60-second launch video cut and ready to play first at Demo Day

## Repository Review hard gates

- [x] No secrets anywhere in git history
- [x] Working Dockerfile that builds and runs
- [x] `/health` responds under 500ms
- [x] Green CI run on main (runs on this push)
- [x] `eval/results/` has at least 3 committed run files (7 files)

## Owner and deadline per item

| Fix | Owner | Done by |
|---|---|---|
| Record demo + launch videos | Tekla | Wed 10 Jun |
| Confirm green CI on main | Giorgi | on push |
| Chat streaming (should-fix) | Giorgi | stretch |
| Format adherence in eval (should-fix) | Giorgi | stretch |
