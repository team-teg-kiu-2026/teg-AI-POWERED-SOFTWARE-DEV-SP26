"""
NutriSmart Golden Test Set Evaluator
=====================================
Uses LLM-as-judge to evaluate NutriSmart responses against 10 golden questions.

Usage:
    python eval/run_eval.py

Requirements:
    pip install openai python-dotenv
    OPENROUTER_API_KEY set in .env (repo root)
    Backend running at http://localhost:5000 (python backend/app.py)

Output:
    eval/results/golden-set-results-<timestamp>.json
    Pass/fail summary printed to stdout
    Completes in < 3 minutes.
"""

import json
import os
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

from dotenv import load_dotenv
from openai import OpenAI

load_dotenv(Path(__file__).parent.parent / ".env")

# ── Config ─────────────────────────────────────────────────────────────────────

OR_API_KEY    = os.environ.get("OPENROUTER_API_KEY", "")
JUDGE_MODEL   = os.environ.get("JUDGE_MODEL", "google/gemini-2.5-flash")
APP_ENDPOINT  = os.environ.get("APP_ENDPOINT", "http://localhost:5000/api/chat")
GOLDEN_SET    = Path(__file__).parent / "golden_set.json"
RESULTS_DIR   = Path(__file__).parent / "results"

JUDGE_SYSTEM = (
    "You are a strict evaluator for a student AI nutrition assistant. "
    "Given a question, the expected answer description, an evaluation rubric, "
    "and the actual response from the system, decide PASS or FAIL. "
    "Be strict about the rubric. Return ONLY valid JSON: "
    '{"verdict": "PASS" or "FAIL", "reason": "<one sentence>"}'
)


# ── Helpers ────────────────────────────────────────────────────────────────────

def _openrouter_client() -> OpenAI:
    if not OR_API_KEY:
        sys.exit("ERROR: OPENROUTER_API_KEY not set in .env")
    return OpenAI(api_key=OR_API_KEY, base_url="https://openrouter.ai/api/v1")


def call_app(message: str, timeout: int = 30) -> str:
    """Call the NutriSmart /api/chat endpoint and return the response text."""
    import urllib.request, urllib.error
    payload = json.dumps({"message": message, "user_id": "eval-user"}).encode()
    req = urllib.request.Request(
        APP_ENDPOINT,
        data=payload,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            body = json.loads(resp.read().decode())
            return body.get("response", "")
    except urllib.error.URLError as exc:
        return f"[APP ERROR: {exc}]"


def judge_response(client: OpenAI, question: dict, actual: str) -> dict:
    """Ask the LLM judge to evaluate the actual response."""
    prompt = (
        f"Question: {question['input']}\n\n"
        f"Expected: {question['expected']}\n\n"
        f"Rubric: {question['rubric']}\n\n"
        f"Actual response:\n{actual}"
    )
    resp = client.chat.completions.create(
        model=JUDGE_MODEL,
        messages=[
            {"role": "system", "content": JUDGE_SYSTEM},
            {"role": "user", "content": prompt},
        ],
        temperature=0.0,
        timeout=20,
    )
    raw = resp.choices[0].message.content or "{}"
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        import re
        m = re.search(r'\{.*\}', raw, re.DOTALL)
        return json.loads(m.group()) if m else {"verdict": "FAIL", "reason": "judge parse error"}


# ── Main ───────────────────────────────────────────────────────────────────────

def run_evaluation() -> None:
    golden = json.loads(GOLDEN_SET.read_text(encoding="utf-8"))
    client = _openrouter_client()
    RESULTS_DIR.mkdir(parents=True, exist_ok=True)

    ts    = datetime.now(timezone.utc).strftime("%Y%m%d-%H%M%S")
    out   = RESULTS_DIR / f"golden-set-results-{ts}.json"
    rows  = []
    passed = 0

    print(f"\nNutriSmart Golden Test Set — {len(golden)} questions\n{'='*55}")

    for q in golden:
        print(f"[{q['id']}] {q['category']:<12} ", end="", flush=True)

        # 1. Call app
        actual = call_app(q["input"])

        # 2. Judge
        verdict_dict = judge_response(client, q, actual)
        verdict = verdict_dict.get("verdict", "FAIL").upper()
        reason  = verdict_dict.get("reason", "")

        ok = verdict == "PASS"
        if ok:
            passed += 1
        print(f"{'PASS' if ok else 'FAIL':<6}  {reason[:70]}")

        rows.append({
            "id":       q["id"],
            "category": q["category"],
            "input":    q["input"],
            "actual":   actual[:500],
            "verdict":  verdict,
            "reason":   reason,
        })
        time.sleep(0.5)  # avoid rate-limiting

    total = len(golden)
    summary = {
        "run_ts":        ts,
        "model_judge":   JUDGE_MODEL,
        "app_endpoint":  APP_ENDPOINT,
        "total":         total,
        "passed":        passed,
        "failed":        total - passed,
        "pass_rate":     f"{passed}/{total}",
        "results":       rows,
    }
    out.write_text(json.dumps(summary, indent=2, ensure_ascii=False), encoding="utf-8")

    print(f"\n{'='*55}")
    print(f"Result: {passed}/{total} pass  ({100*passed//total}%)")
    print(f"Saved:  {out}")

    if passed < 7:
        print("\nWARNING: fewer than 7/10 pass. Review failing cases above.")
        sys.exit(1)


if __name__ == "__main__":
    run_evaluation()
