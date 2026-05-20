"""
Episode Log Metrics Report — CS-AI-2025 Lab 9, Spring 2026

Reads your episode log and computes the six key metrics from the Week 11 lecture.
Prints a formatted report and writes docs/metrics-report.md.

Usage:
    python starter-code/observability/metrics_report.py

    Or with a custom log path:
    EPISODE_LOG_PATH=logs/episode-log.jsonl python starter-code/observability/metrics_report.py

Output:
    Terminal: formatted metrics table with pass/fail against Week 11 thresholds
    File:     docs/metrics-report.md — committed to repo for Repository Review
"""

import json
import os
import statistics
import time
from datetime import datetime
from pathlib import Path

# ─── Configuration ─────────────────────────────────────────────────────────

LOG_PATH = Path(os.environ.get("EPISODE_LOG_PATH", "logs/episode-log.jsonl"))
REPORT_PATH = Path("docs/metrics-report.md")

# Week 11 lecture thresholds — do not change these
THRESHOLDS = {
    "cache_hit_rate_min":       0.80,   # > 80% on calls with static system prompt
    "cost_reduction_min":       0.50,   # > 50% reduction on cached tokens
    "latency_p50_stream_max":   800,    # < 800ms first token at p50 (streaming)
    "latency_p50_full_max":     3000,   # < 3s full response at p50
    "fallback_rate_max":        0.05,   # < 5% fallback trigger rate
    "error_rate_max":           0.02,   # < 2% error rate with retry exhausted
}


# ─── Log Reader ─────────────────────────────────────────────────────────────

def load_log(path: Path) -> list[dict]:
    if not path.exists():
        print(f"ERROR: Episode log not found at {path}")
        print(f"Set EPISODE_LOG_PATH or run from your repo root.")
        return []
    entries = []
    with open(path) as f:
        for i, line in enumerate(f, 1):
            line = line.strip()
            if not line:
                continue
            try:
                entries.append(json.loads(line))
            except json.JSONDecodeError:
                print(f"  Warning: skipped malformed line {i}")
    return entries


# ─── Metric Computations ────────────────────────────────────────────────────

def compute_metrics(entries: list[dict]) -> dict:
    llm = [e for e in entries if e.get("event_type") == "llm_call"]
    mcp = [e for e in entries if e.get("event_type") == "mcp_tool_call"]

    if not llm:
        return {"error": "No llm_call entries found in episode log"}

    # Latency
    latencies = [e["latency_ms"] for e in llm if isinstance(e.get("latency_ms"), (int, float)) and e["latency_ms"] > 0]
    p50_latency = statistics.median(latencies) if latencies else None
    p95_latency = sorted(latencies)[int(len(latencies) * 0.95)] if len(latencies) >= 20 else None

    # Cost
    costs = [e["cost_usd"] for e in llm if isinstance(e.get("cost_usd"), (int, float))]
    total_cost = sum(costs)
    avg_cost_per_call = total_cost / len(llm) if llm else 0

    # Errors
    errors = [e for e in llm if e.get("error") is not None]
    error_rate = len(errors) / len(llm) if llm else 0

    # Cache
    cache_hits = [e for e in llm if isinstance(e.get("cache_read_tokens"), (int, float)) and e["cache_read_tokens"] > 0]
    cache_hit_rate = len(cache_hits) / len(llm) if llm else 0

    # Cache token savings
    total_input_tokens = sum(e.get("input_tokens", 0) for e in llm)
    total_cache_read = sum(e.get("cache_read_tokens", 0) for e in llm)
    cache_token_rate = total_cache_read / total_input_tokens if total_input_tokens > 0 else 0

    # Fallback
    fallbacks = [e for e in llm if e.get("fallback_triggered") is True]
    fallback_rate = len(fallbacks) / len(llm) if llm else 0

    # Model distribution
    model_counts: dict[str, int] = {}
    for e in llm:
        m = e.get("model", "unknown")
        model_counts[m] = model_counts.get(m, 0) + 1

    # Provider distribution
    provider_counts: dict[str, int] = {}
    for e in llm:
        p = e.get("provider", "unknown")
        provider_counts[p] = provider_counts.get(p, 0) + 1

    return {
        "total_llm_calls": len(llm),
        "total_mcp_calls": len(mcp),
        "total_entries": len(entries),
        "p50_latency_ms": round(p50_latency) if p50_latency else None,
        "p95_latency_ms": round(p95_latency) if p95_latency else None,
        "total_cost_usd": round(total_cost, 4),
        "avg_cost_per_call_usd": round(avg_cost_per_call, 6),
        "error_rate": round(error_rate, 4),
        "error_count": len(errors),
        "cache_hit_rate": round(cache_hit_rate, 4),
        "cache_token_rate": round(cache_token_rate, 4),
        "fallback_rate": round(fallback_rate, 4),
        "fallback_count": len(fallbacks),
        "model_distribution": model_counts,
        "provider_distribution": provider_counts,
    }


# ─── Threshold Checks ───────────────────────────────────────────────────────

def check_thresholds(metrics: dict) -> list[dict]:
    checks = []

    def check(name: str, value, threshold, mode: str, unit: str = ""):
        if value is None:
            checks.append({"name": name, "value": "N/A", "threshold": threshold, "status": "SKIP", "unit": unit})
            return
        if mode == "min":
            status = "PASS" if value >= threshold else "FAIL"
        else:  # max
            status = "PASS" if value <= threshold else "FAIL"
        checks.append({"name": name, "value": value, "threshold": threshold, "mode": mode, "status": status, "unit": unit})

    check("Cache hit rate",            metrics["cache_hit_rate"],  THRESHOLDS["cache_hit_rate_min"],       "min", "%")
    check("Cache token saving rate",   metrics["cache_token_rate"],THRESHOLDS["cost_reduction_min"],       "min", "%")
    check("Latency p50",               metrics["p50_latency_ms"],  THRESHOLDS["latency_p50_full_max"],     "max", "ms")
    check("Latency p95",               metrics["p95_latency_ms"],  THRESHOLDS["latency_p50_full_max"] * 2, "max", "ms")
    check("Fallback trigger rate",     metrics["fallback_rate"],   THRESHOLDS["fallback_rate_max"],        "max", "%")
    check("Error rate",                metrics["error_rate"],      THRESHOLDS["error_rate_max"],           "max", "%")

    return checks


# ─── Terminal Printer ────────────────────────────────────────────────────────

def print_report(metrics: dict, checks: list[dict]) -> None:
    print()
    print("=" * 60)
    print("  Episode Log Metrics Report")
    print(f"  Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"  Log: {LOG_PATH}")
    print("=" * 60)

    print(f"\n  Total entries:      {metrics['total_entries']}")
    print(f"  LLM call entries:   {metrics['total_llm_calls']}")
    print(f"  MCP tool entries:   {metrics['total_mcp_calls']}")
    print(f"  Total cost to date: ${metrics['total_cost_usd']}")
    print(f"  Avg cost per call:  ${metrics['avg_cost_per_call_usd']}")

    if metrics["model_distribution"]:
        print("\n  Model distribution:")
        for model, count in sorted(metrics["model_distribution"].items(), key=lambda x: -x[1]):
            pct = round(count / metrics["total_llm_calls"] * 100)
            print(f"    {model:<45} {count:>4} calls ({pct}%)")

    print("\n  Metric Thresholds (Week 11 lecture targets):")
    print(f"  {'Metric':<30} {'Value':>10}  {'Threshold':>12}  Status")
    print(f"  {'-'*30}  {'-'*10}  {'-'*12}  ------")

    for c in checks:
        val_str = f"{c['value'] * 100:.1f}%" if c["unit"] == "%" and c["value"] != "N/A" else f"{c['value']}ms" if c["unit"] == "ms" else str(c["value"])
        thr_str = f"{c['threshold'] * 100:.0f}%" if c["unit"] == "%" else f"{c['threshold']}ms" if c["unit"] == "ms" else str(c["threshold"])
        status_str = "PASS" if c["status"] == "PASS" else ("SKIP" if c["status"] == "SKIP" else "FAIL")
        print(f"  {c['name']:<30} {val_str:>10}  {'> ' if c.get('mode') == 'min' else '< '}{thr_str:>10}  {status_str}")

    passed = sum(1 for c in checks if c["status"] == "PASS")
    total_checked = sum(1 for c in checks if c["status"] != "SKIP")
    print(f"\n  Summary: {passed}/{total_checked} thresholds met")

    if metrics.get("error_count", 0) > 0:
        print(f"\n  Errors logged: {metrics['error_count']} (check episode log for details)")
    if metrics.get("fallback_count", 0) > 0:
        print(f"  Fallbacks triggered: {metrics['fallback_count']}")

    print()


# ─── Markdown Report Writer ─────────────────────────────────────────────────

def write_markdown_report(metrics: dict, checks: list[dict]) -> None:
    REPORT_PATH.parent.mkdir(parents=True, exist_ok=True)
    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    lines = [
        "# Metrics Report",
        "",
        f"**Generated:** {now}",
        f"**Episode log:** `{LOG_PATH}`",
        f"**Total entries analysed:** {metrics['total_entries']}",
        "",
        "---",
        "",
        "## Summary Statistics",
        "",
        f"| Metric | Value |",
        f"|--------|-------|",
        f"| Total LLM calls | {metrics['total_llm_calls']} |",
        f"| Total MCP tool calls | {metrics['total_mcp_calls']} |",
        f"| Total cost to date | ${metrics['total_cost_usd']} |",
        f"| Average cost per call | ${metrics['avg_cost_per_call_usd']} |",
        f"| P50 latency | {metrics['p50_latency_ms']} ms |",
        f"| P95 latency | {metrics['p95_latency_ms']} ms |",
        f"| Cache hit rate | {metrics['cache_hit_rate'] * 100:.1f}% |",
        f"| Cache token saving rate | {metrics['cache_token_rate'] * 100:.1f}% |",
        f"| Error rate | {metrics['error_rate'] * 100:.2f}% |",
        f"| Fallback trigger rate | {metrics['fallback_rate'] * 100:.2f}% |",
        "",
        "---",
        "",
        "## Threshold Check (Week 11 Targets)",
        "",
        "| Metric | Value | Target | Status |",
        "|--------|-------|--------|--------|",
    ]

    for c in checks:
        val_str = f"{c['value'] * 100:.1f}%" if c["unit"] == "%" and c["value"] != "N/A" else f"{c['value']} ms" if c["unit"] == "ms" else str(c["value"])
        thr_str = f"{'> ' if c.get('mode') == 'min' else '< '}{c['threshold'] * 100:.0f}%" if c["unit"] == "%" else f"< {c['threshold']} ms" if c["unit"] == "ms" else str(c["threshold"])
        status_emoji = "PASS" if c["status"] == "PASS" else ("N/A" if c["status"] == "SKIP" else "FAIL")
        lines.append(f"| {c['name']} | {val_str} | {thr_str} | {status_emoji} |")

    passed = sum(1 for c in checks if c["status"] == "PASS")
    total_checked = sum(1 for c in checks if c["status"] != "SKIP")

    lines += [
        "",
        f"**Result: {passed}/{total_checked} thresholds met**",
        "",
        "---",
        "",
        "## Model Distribution",
        "",
        "| Model | Calls | Share |",
        "|-------|-------|-------|",
    ]

    for model, count in sorted(metrics["model_distribution"].items(), key=lambda x: -x[1]):
        pct = round(count / metrics["total_llm_calls"] * 100)
        lines.append(f"| `{model}` | {count} | {pct}% |")

    lines += [
        "",
        "---",
        "",
        "## Alerts",
        "",
    ]

    alerts = []
    if metrics["cache_hit_rate"] < THRESHOLDS["cache_hit_rate_min"]:
        alerts.append(f"Cache hit rate {metrics['cache_hit_rate']*100:.1f}% is below the 80% target. Check that your system prompt prefix is bitwise identical across calls.")
    if metrics["error_rate"] > THRESHOLDS["error_rate_max"]:
        alerts.append(f"Error rate {metrics['error_rate']*100:.2f}% exceeds the 2% threshold. Review episode log for error patterns.")
    if metrics["fallback_rate"] > THRESHOLDS["fallback_rate_max"]:
        alerts.append(f"Fallback rate {metrics['fallback_rate']*100:.2f}% exceeds the 5% threshold. Primary model may be unstable.")
    if metrics["p50_latency_ms"] and metrics["p50_latency_ms"] > THRESHOLDS["latency_p50_full_max"]:
        alerts.append(f"P50 latency {metrics['p50_latency_ms']} ms exceeds the 3000 ms target. Consider async batching or model downgrade for classification steps.")

    if alerts:
        for a in alerts:
            lines.append(f"- {a}")
    else:
        lines.append("No alerts — all monitored metrics within target thresholds.")

    lines += [
        "",
        "---",
        "",
        "*Metrics Report · CS-AI-2025 · Spring 2026 · KIU*",
    ]

    with open(REPORT_PATH, "w") as f:
        f.write("\n".join(lines))

    print(f"  Metrics report written to {REPORT_PATH}")
    print(f"  Commit it: git add {REPORT_PATH} && git commit -m 'docs: add metrics report from lab9'")


# ─── Entry Point ────────────────────────────────────────────────────────────

if __name__ == "__main__":
    print(f"Loading episode log from {LOG_PATH}...")
    entries = load_log(LOG_PATH)

    if not entries:
        print("No entries loaded. Exiting.")
        exit(1)

    print(f"Loaded {len(entries)} entries.")
    metrics = compute_metrics(entries)

    if "error" in metrics:
        print(f"ERROR: {metrics['error']}")
        exit(1)

    checks = check_thresholds(metrics)
    print_report(metrics, checks)
    write_markdown_report(metrics, checks)
