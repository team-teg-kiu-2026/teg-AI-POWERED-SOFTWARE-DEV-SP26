# Model Selection Review Guide

**Applying the Week 10 task-model matching framework to your capstone**

This guide walks you through Target 3 of the Lab 9 hardening sprint. By the end you will have an updated Model Selection Decisions table in your README that reflects deliberate, cost-aware choices — not whichever model you happened to use first.

---

## The Week 10 Framework: Three-Way Trade-off

Every model call in your capstone lives at the intersection of cost, quality, and latency. You can optimise for two of the three. The mistake every capstone makes at this stage is using the same premium model for everything.

The framework says: **match the model to the task, not to your preferences.**

---

## Step 1 — Inventory Every LLM Call in Your Codebase

Before you can review your choices, you need to know what choices you made. Run this from your repo root:

```bash
# Find every place a model string is referenced
grep -rn "model.*gemini\|model.*claude\|model.*gpt" backend/ --include="*.py" | grep -v ".pyc"

# Or if you define MODEL in a config file:
grep -rn "MODEL\s*=" backend/ --include="*.py"
grep -rn "JUDGE_MODEL\|PRIMARY_MODEL\|FALLBACK" . --include="*.py"
```

List every call point and the model currently assigned to it. This becomes the first two columns of your decisions table.

---

## Step 2 — Classify Each Call by Task Type

For each call point, assign it one of these task types from the Week 10 lecture:

| Task Type | Description | Optimal Model Tier |
|-----------|-------------|-------------------|
| Intent classification | Binary or small-class output. "Is this a question or a command?" Speed matters more than reasoning depth. | Free tier (Gemini 2.0 Flash) |
| Document summarisation | Long context, structured output. Reading a PDF and producing a summary. | Mid-tier (Gemini 2.5 Flash) |
| RAG answer generation | Citation accuracy matters. Grounding a response in retrieved chunks. | Mid-tier (Gemini 2.5 Flash) or escalate if hallucination rate is high |
| Multi-step agent reasoning | Complex tool-use chains, orchestration decisions, planning. | Premium (Claude Sonnet 4.5 or Gemini 2.5 Pro) |
| Code generation and review | Best code quality required. | Premium (Claude Sonnet 4.5) |
| LLM-as-judge evaluation | Structured pass/fail verdicts. Fast, cheap, separate from your primary model. | Mid-tier (Gemini 2.5 Flash) |
| TTS / STT | Voice synthesis and transcription. | Provider-native (Google or ElevenLabs directly — do not route through OpenRouter) |

---

## Step 3 — Identify Mismatches

A mismatch is when you are paying premium pricing for a task the free or mid tier handles just as well.

**Common mismatches in student capstones:**

**Using Claude Sonnet for intent classification.** If you are classifying whether a user message is a question, command, or greeting — Gemini 2.0 Flash does this at 95%+ accuracy at zero cost. Sonnet is 20–50x more expensive per call and adds no value for binary classification.

**Using Gemini 2.5 Pro for every single call.** Pro is justified for complex reasoning tasks where reasoning depth matters. Routing a simple factual Q&A through Pro is paying for capability you do not use.

**Using a premium model as the LLM judge.** The judge model does not need to be your best model — it needs to be consistent and instruction-following. Gemini 2.5 Flash is the correct choice for judging. Using Sonnet as the judge is expensive and introduces self-judging bias if your app also uses Sonnet.

**Routing TTS/STT through OpenRouter.** OpenRouter adds 200–500ms routing latency on every call. For voice endpoints where first-byte latency is critical, call the Google TTS or ElevenLabs APIs directly.

---

## Step 4 — Update Your Decisions Table

Open your README and find or create the "Model Selection Decisions" section. Format:

```markdown
## Model Selection Decisions

| Call Location | Current Model | Task Type | Reason for Choice | Alternative Considered | Cost Delta |
|---|---|---|---|---|---|
| Intent classifier in `router.py` | `google/gemini-2.0-flash` | Intent classification | Free tier, binary output, speed priority | gemini-2.5-flash: overkill for this task | — |
| Main RAG answer endpoint | `google/gemini-2.5-flash-preview` | RAG answer generation | Accuracy matters for citations, moderate cost | claude-sonnet-4-5: 20x cost, not justified unless hallucination rate rises above 5% | — |
| Golden set judge in `eval/run_golden_set.py` | `google/gemini-2.5-flash-preview` | LLM-as-judge | Fast, cheap, instruction-following, different family from app model | gemini-2.5-pro: overkill for pass/fail verdicts | — |
| Code review MCP tool | `anthropic/claude-sonnet-4-5` | Code generation and review | Best code quality; used only for this specific step, not the whole pipeline | gemini-2.5-pro: comparable but slower TTFT | — |
```

Add the actual dollar cost per 1000 calls in the "Cost Delta" column if you can compute it from your pricing knowledge. Even an estimate demonstrates cost-aware engineering.

---

## Step 5 — Make the Changes

If you identified a mismatch (e.g. premium model for intent classification), change the model string now and test one call to confirm the output is still acceptable.

```python
# Before:
INTENT_MODEL = "anthropic/claude-sonnet-4-5"  # expensive, overkill

# After:
INTENT_MODEL = "google/gemini-2.0-flash"      # free tier, correct for this task
```

Run your golden set after any model change. A mismatch correction should not drop your score. If it does, the premium model was earning its keep — revert and note it honestly in the decisions table.

---

## Model Strings — Current as of May 2026

Use these exact strings. Deprecated strings (gemini-2.0-flash-lite, old preview strings) will be rejected by the API from June 1 2026 onward.

| Model | OpenRouter String | Free Tier? | Best For |
|-------|------------------|------------|----------|
| Gemini 2.0 Flash | `google/gemini-2.0-flash` | Yes | Classification, formatting, fast tasks |
| Gemini 2.5 Flash | `google/gemini-2.5-flash-preview` | Limited | RAG, summarisation, structured output |
| Gemini 2.5 Pro | `google/gemini-2.5-pro-preview` | No | Complex reasoning, large doc analysis |
| Claude Sonnet 4.5 | `anthropic/claude-sonnet-4-5` | No | Agents, code, tool-use chains |
| Claude Haiku 4.5 | `anthropic/claude-haiku-4-5-20251001` | No | Fast Anthropic calls, classification |
| GPT-4.1 mini | `openai/gpt-4.1-mini` | No | Fallback, function calling |

---

*Model Selection Review Guide · Lab 9 · CS-AI-2025 · Spring 2026*
