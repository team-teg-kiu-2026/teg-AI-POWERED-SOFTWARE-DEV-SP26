# OpenRouter Fallback Chain Guide

**Configuring reliable model routing for your capstone**

---

## Why You Need a Fallback Chain

Free-tier models have rate limits. Provider APIs have outages. When your primary model is unavailable, your capstone should degrade gracefully rather than return a 500 error to the user. A fallback chain defines the order of models to try when the primary fails.

---

## Recommended Chain for Student Capstones

```python
# config.py — define your chain once, reference everywhere

MODEL_CHAIN = [
    "google/gemini-2.5-flash-preview",   # Primary: good quality, limited free tier
    "google/gemini-2.0-flash",            # Fallback 1: reliable free tier
    "openai/gpt-4.1-mini",               # Fallback 2: different provider
]

PRIMARY_MODEL = MODEL_CHAIN[0]
```

---

## Implementation With Logging

```python
import httpx
import time
import os
from episode_logger import log_llm_call

OR_API_KEY = os.environ["OPENROUTER_API_KEY"]
OR_BASE_URL = "https://openrouter.ai/api/v1/chat/completions"

async def call_with_fallback(messages: list, system: list = None) -> dict:
    last_error = None

    for i, model in enumerate(MODEL_CHAIN):
        is_fallback = i > 0
        start = time.time()

        try:
            payload = {
                "model": model,
                "messages": messages,
                "max_tokens": 1024,
            }
            if system:
                payload["system"] = system

            async with httpx.AsyncClient(timeout=30) as client:
                response = await client.post(
                    OR_BASE_URL,
                    headers={"Authorization": f"Bearer {OR_API_KEY}"},
                    json=payload,
                )
                data = response.json()

                if "error" in data:
                    raise RuntimeError(data["error"].get("message", "API error"))

                usage = data.get("usage", {})
                latency_ms = round((time.time() - start) * 1000)

                log_llm_call(
                    model=model,
                    input_tokens=usage.get("prompt_tokens", 0),
                    output_tokens=usage.get("completion_tokens", 0),
                    cost_usd=calculate_cost_from_usage(usage, model),
                    latency_ms=latency_ms,
                    fallback_triggered=is_fallback,
                )

                return {
                    "content": data["choices"][0]["message"]["content"],
                    "model_used": model,
                    "fallback_triggered": is_fallback,
                }

        except Exception as e:
            latency_ms = round((time.time() - start) * 1000)
            log_llm_call(
                model=model,
                input_tokens=0,
                output_tokens=0,
                cost_usd=0.0,
                latency_ms=latency_ms,
                fallback_triggered=is_fallback,
                error=type(e).__name__,
            )
            last_error = e
            continue  # Try next model

    raise RuntimeError(f"All models failed. Last error: {last_error}")
```

---

## Testing Your Fallback

Force a failure by temporarily using an invalid model as primary:

```python
# Temporarily override for testing
MODEL_CHAIN[0] = "google/does-not-exist-model"

result = await call_with_fallback([{"role": "user", "content": "Hello"}])
print(f"Model used: {result['model_used']}")  # Should be fallback
print(f"Fallback triggered: {result['fallback_triggered']}")  # Should be True

# Restore
MODEL_CHAIN[0] = "google/gemini-2.5-flash-preview"
```

Check your episode log. You should see one entry with `error: "RuntimeError"` for the primary, then one entry with `fallback_triggered: true` for the fallback.

---

## Not Using OpenRouter?

If you are calling Anthropic or Google directly, implement fallback at the provider level:

```python
async def call_anthropic_with_fallback(messages: list) -> str:
    models = ["claude-sonnet-4-5", "claude-haiku-4-5-20251001"]
    for model in models:
        try:
            response = await client.messages.create(
                model=model, messages=messages, max_tokens=1024
            )
            return response.content[0].text
        except anthropic.APIStatusError as e:
            if e.status_code in (429, 503):
                continue  # Rate limit or unavailable — try next
            raise  # Other errors: do not retry
    raise RuntimeError("All Anthropic models failed")
```

---

*OpenRouter Fallback Guide · Lab 8 · CS-AI-2025 · Spring 2026*
