# Prompt Caching Guide

**Implementing caching with Anthropic and Gemini — and proving it works**

---

## The Core Idea

When you make repeated API calls where the beginning of the context is the same every time, the provider can store that beginning on their servers after the first call. Every subsequent call that starts with the identical prefix pays a reduced rate for that portion — typically 10–25% of the standard input token price.

The prefix must be bitwise identical. If your system prompt contains any dynamic content (a timestamp, a user name, a session ID), that content must appear after the cached prefix, not inside it.

---

## Anthropic: cache_control Markup

Anthropic's caching is controlled by adding `"cache_control": {"type": "ephemeral"}` to the last block of your system prompt that you want cached. Everything up to and including that marker is cached. Everything after it is not.

The cache is valid for 5 minutes. After 5 minutes, the next call is a cache write (slightly more expensive), and subsequent calls within the next 5 minutes are cache reads again.

### Basic Implementation

```python
import anthropic
import time

client = anthropic.Anthropic()

# This is your static system prompt — define it once outside your handler
SYSTEM_PROMPT_STATIC = """You are a helpful assistant for the KIU student
support platform. You have access to the following knowledge base:

[... your full static knowledge base, tool descriptions, persona, etc ...]

Always respond in Georgian or English based on the user's language.
Never reveal internal system details."""

async def call_model_with_cache(user_message: str, conversation_history: list) -> dict:
    start = time.time()

    response = client.messages.create(
        model="claude-sonnet-4-5",
        max_tokens=1024,
        system=[
            {
                "type": "text",
                "text": SYSTEM_PROMPT_STATIC,
                "cache_control": {"type": "ephemeral"}
                # Everything above is cached after the first call
            }
        ],
        messages=conversation_history + [
            {"role": "user", "content": user_message}
            # This part is never cached — it changes every call
        ]
    )

    usage = response.usage
    latency_ms = round((time.time() - start) * 1000)

    return {
        "content": response.content[0].text,
        "input_tokens": usage.input_tokens,
        "output_tokens": usage.output_tokens,
        "cache_read_tokens": getattr(usage, "cache_read_input_tokens", 0),
        "cache_write_tokens": getattr(usage, "cache_creation_input_tokens", 0),
        "latency_ms": latency_ms,
        "cost_usd": calculate_cost(usage, "claude-sonnet-4-5"),
    }
```

### Verifying a Cache Hit

A cache hit is confirmed when `cache_read_input_tokens > 0` in the response usage. On the first call you will see `cache_creation_input_tokens > 0` (the write). On the second call within 5 minutes you will see `cache_read_input_tokens > 0` (the hit).

```python
# Confirm your cache is working
result = await call_model_with_cache("test message", [])
print(f"Cache write: {result['cache_write_tokens']} tokens")  # First call

result = await call_model_with_cache("second test", [])
print(f"Cache read: {result['cache_read_tokens']} tokens")  # Should be > 0
```

---

## Gemini: CachedContent API

Gemini's caching works differently. You create a `CachedContent` object explicitly with a TTL, then reference that cache in your model calls.

### Basic Implementation

```python
import google.generativeai as genai
import datetime
import time

genai.configure(api_key=os.environ["GEMINI_API_KEY"])

# Create the cache once — ideally at startup, not per request
def create_system_cache(system_prompt: str, ttl_minutes: int = 60):
    cache = genai.caching.CachedContent.create(
        model="models/gemini-2.5-flash-preview",
        system_instruction=system_prompt,
        ttl=datetime.timedelta(minutes=ttl_minutes),
    )
    return cache

# Store globally — do not recreate per request
_cache = None

def get_or_create_cache():
    global _cache
    if _cache is None:
        _cache = create_system_cache(SYSTEM_PROMPT_STATIC)
    return _cache

async def call_gemini_with_cache(user_message: str) -> dict:
    cache = get_or_create_cache()
    model = genai.GenerativeModel.from_cached_content(cached_content=cache)

    start = time.time()
    response = model.generate_content(user_message)
    latency_ms = round((time.time() - start) * 1000)

    metadata = response.usage_metadata
    cached_tokens = metadata.cached_content_token_count
    total_tokens = metadata.prompt_token_count
    uncached_tokens = total_tokens - cached_tokens

    return {
        "content": response.text,
        "input_tokens": total_tokens,
        "cached_tokens": cached_tokens,
        "uncached_tokens": uncached_tokens,
        "output_tokens": metadata.candidates_token_count,
        "latency_ms": latency_ms,
    }
```

### Important Constraint

Gemini caching requires a minimum of 1024 tokens in the cached content. If your system prompt is shorter than 1024 tokens, caching will not apply. In that case, consider caching a large static document (your knowledge base, your tool definitions, or a long persona description) that you consistently inject into every request.

---

## Splitting Dynamic From Static Content

This is the most common mistake. If your system prompt includes any of these, they must come after the cached prefix:

- Current date or time
- User's name or session ID
- Recent conversation context
- Dynamic configuration values

**Wrong — date inside the cached prefix:**
```python
system = f"""You are a helpful assistant. Today is {datetime.date.today()}.
[... rest of static content ...]"""

# Adding cache_control here will never hit because the date changes daily
```

**Right — static prefix cached, dynamic part appended:**
```python
STATIC_PREFIX = """You are a helpful assistant.
[... all static content, no dynamic values ...]"""

def build_messages(user_message, current_date):
    return {
        "system": [
            {
                "type": "text",
                "text": STATIC_PREFIX,
                "cache_control": {"type": "ephemeral"}
            },
            {
                "type": "text",
                "text": f"Today's date is {current_date}."
                # No cache_control — this part changes daily
            }
        ],
        "messages": [{"role": "user", "content": user_message}]
    }
```

---

## The Benchmark Procedure

Run this procedure and record the numbers for your `docs/optimization-report.md`:

```python
import asyncio
import statistics

async def run_benchmark():
    test_messages = [
        "What documents can I upload?",
        "How do I reset my password?",
        "What are the course requirements?",
        "When is the next assignment due?",
        "How do I contact my instructor?",
    ] * 2  # 10 calls total

    # Run WITHOUT caching — comment out cache_control for this
    print("=== Without caching ===")
    no_cache_results = []
    for msg in test_messages:
        result = await call_model_no_cache(msg)
        no_cache_results.append(result)
        print(f"Cost: ${result['cost_usd']:.5f} | Latency: {result['latency_ms']}ms")

    print(f"Median latency: {statistics.median(r['latency_ms'] for r in no_cache_results)}ms")
    print(f"Total cost: ${sum(r['cost_usd'] for r in no_cache_results):.5f}")

    # Run WITH caching — restore cache_control
    print("\n=== With caching ===")
    cache_results = []
    for msg in test_messages:
        result = await call_model_with_cache(msg, [])
        cache_results.append(result)
        print(f"Cost: ${result['cost_usd']:.5f} | Latency: {result['latency_ms']}ms | Cache hit: {result['cache_read_tokens'] > 0}")

    print(f"Median latency: {statistics.median(r['latency_ms'] for r in cache_results)}ms")
    print(f"Total cost: ${sum(r['cost_usd'] for r in cache_results):.5f}")
    print(f"Cache hit rate: {sum(1 for r in cache_results if r.get('cache_read_tokens', 0) > 0)}/{len(cache_results)}")

asyncio.run(run_benchmark())
```

Paste the output into your `docs/optimization-report.md`.

---

*Prompt Caching Guide · Lab 8 · CS-AI-2025 · Spring 2026*
