"""
NutriSmart AI module.

All LLM calls go through _call_with_fallback() which enforces:
  - TIMEOUT_SECONDS timeout on every call (openai client timeout param)
  - MAX_RETRIES attempts with exponential backoff before giving up
  - Automatic fallback: Gemini → GPT-4o
  - Episode log entry written for every attempt (success or failure)
"""

import json
import os
import random
import re
import time
import base64

from openai import OpenAI

from episode_logger import log_llm_call

PRIMARY_MODEL  = "google/gemini-flash-1.5"   # verify slug at openrouter.ai/models
FALLBACK_MODEL = "openai/gpt-4o"

TIMEOUT_SECONDS = 30      # applied to every single LLM call
MAX_RETRIES     = 3       # attempts per model (= 2 retries after first attempt)

SYSTEM_PROMPT = (
    "You are NutriSmart, a nutrition assistant for university students. "
    "Analyse meals, detect nutrient imbalances across the day, and suggest "
    "simple corrections using foods the user has available. "
    "You are not a medical tool; never give clinical diagnoses or prescriptions."
)

ANALYSIS_SCHEMA = """{
  "nutrients": {"calories": <number>, "protein_g": <number>, "carbs_g": <number>,
                "fat_g": <number>, "sugar_g": <number>, "fiber_g": <number>},
  "imbalances": [<string>, ...],
  "suggestions": [<string>, ...],
  "confidence": "high" | "medium" | "low",
  "items_detected": [<string>, ...]
}"""


def _client() -> OpenAI:
    return OpenAI(
        api_key=os.environ["OPENROUTER_API_KEY"],
        base_url="https://openrouter.ai/api/v1",
    )


def _extract_json(text: str) -> dict:
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        match = re.search(r"\{.*\}", text, re.DOTALL)
        if match:
            return json.loads(match.group())
        raise ValueError(f"No JSON found in response: {text[:200]}")


def _call_with_fallback(messages: list[dict]) -> tuple[dict, str]:
    """
    Try PRIMARY_MODEL then FALLBACK_MODEL.
    Each model gets MAX_RETRIES attempts with exponential backoff.
    Every attempt — success or failure — is written to the episode log.
    Returns (parsed_dict, model_name_used).
    """
    client = _client()
    fallback_triggered = False

    for model in [PRIMARY_MODEL, FALLBACK_MODEL]:
        last_error: Exception | None = None

        for attempt in range(1, MAX_RETRIES + 1):
            call_start = time.perf_counter()
            try:
                resp = client.chat.completions.create(
                    model=model,
                    messages=messages,
                    temperature=0.7,
                    timeout=TIMEOUT_SECONDS,          # ← timeout on every call
                )
                latency_ms = int((time.perf_counter() - call_start) * 1000)
                text = resp.choices[0].message.content or ""

                usage = resp.usage
                in_tok  = getattr(usage, "prompt_tokens",     0) or 0
                out_tok = getattr(usage, "completion_tokens", 0) or 0
                cache_read = 0
                if hasattr(usage, "prompt_tokens_details") and usage.prompt_tokens_details:
                    cache_read = getattr(usage.prompt_tokens_details, "cached_tokens", 0) or 0

                log_llm_call(
                    model=model,
                    input_tokens=in_tok,
                    output_tokens=out_tok,
                    latency_ms=latency_ms,
                    cache_read_tokens=cache_read,
                    fallback_triggered=fallback_triggered,
                )

                return _extract_json(text), model

            except Exception as exc:
                last_error = exc
                latency_ms = int((time.perf_counter() - call_start) * 1000)

                if attempt < MAX_RETRIES:
                    # Exponential backoff with jitter: 0.5 s, 1.0 s, ...
                    delay = 0.5 * (2 ** (attempt - 1)) + random.uniform(0, 0.1)
                    time.sleep(delay)
                else:
                    log_llm_call(
                        model=model,
                        input_tokens=0,
                        output_tokens=0,
                        latency_ms=latency_ms,
                        fallback_triggered=fallback_triggered,
                        error=str(last_error)[:200],
                    )

        if model == PRIMARY_MODEL:
            fallback_triggered = True  # next loop iteration will use FALLBACK_MODEL

    raise RuntimeError(
        f"Both models failed after {MAX_RETRIES} retries. Last: {last_error}"
    ) from last_error


# ── Public API ────────────────────────────────────────────────────────────────

def analyze_meal(meal_text: str, inventory: list[str], today_history: list[dict]) -> dict:
    inventory_str = ", ".join(inventory) if inventory else "none specified"
    history_str   = json.dumps(today_history) if today_history else "nothing logged yet"

    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": (
            f"Analyse this meal: {meal_text}\n\n"
            f"User's available ingredients: {inventory_str}\n"
            f"Today's intake so far: {history_str}\n\n"
            f"Respond only with JSON matching:\n{ANALYSIS_SCHEMA}"
        )},
    ]
    data, model = _call_with_fallback(messages)
    data["model_used"] = model
    return data


def analyze_meal_image(image_bytes: bytes, inventory: list[str]) -> dict:
    b64 = base64.b64encode(image_bytes).decode()
    inventory_str = ", ".join(inventory) if inventory else "none specified"

    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": [
            {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{b64}"}},
            {"type": "text", "text": (
                f"Identify the foods in this image and analyse nutritional content.\n"
                f"User's available ingredients: {inventory_str}\n\n"
                f"Respond only with JSON matching:\n{ANALYSIS_SCHEMA}"
            )},
        ]},
    ]
    data, model = _call_with_fallback(messages)
    data["model_used"] = model
    return data


def chat(message: str, inventory: list[str]) -> str:
    """
    General-purpose Q&A endpoint used by the golden test evaluation script.
    Returns plain text (not JSON).
    """
    inventory_str = ", ".join(inventory) if inventory else "none"
    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": (
            f"User's available ingredients: {inventory_str}\n\nQuestion: {message}"
        )},
    ]
    client = _client()
    fallback_triggered = False

    for model in [PRIMARY_MODEL, FALLBACK_MODEL]:
        for attempt in range(1, MAX_RETRIES + 1):
            call_start = time.perf_counter()
            try:
                resp = client.chat.completions.create(
                    model=model,
                    messages=messages,
                    temperature=0.7,
                    timeout=TIMEOUT_SECONDS,
                )
                latency_ms = int((time.perf_counter() - call_start) * 1000)
                usage = resp.usage
                in_tok  = getattr(usage, "prompt_tokens",     0) or 0
                out_tok = getattr(usage, "completion_tokens", 0) or 0
                log_llm_call(model=model, input_tokens=in_tok, output_tokens=out_tok,
                             latency_ms=latency_ms, fallback_triggered=fallback_triggered)
                return resp.choices[0].message.content or ""
            except Exception as exc:
                if attempt < MAX_RETRIES:
                    time.sleep(0.5 * (2 ** (attempt - 1)) + random.uniform(0, 0.1))
                else:
                    log_llm_call(model=model, input_tokens=0, output_tokens=0,
                                 latency_ms=int((time.perf_counter() - call_start) * 1000),
                                 fallback_triggered=fallback_triggered, error=str(exc)[:200])
        fallback_triggered = True

    raise RuntimeError("Both models failed in chat()")
