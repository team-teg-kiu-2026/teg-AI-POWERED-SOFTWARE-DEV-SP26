"""
Locust load test for NutriSmart (CS-AI-2025 capstone).

Run against the deployed Railway backend:

    locust -f load/locustfile.py \
        --host https://nutrismart-production-2965.up.railway.app \
        --users 30 --spawn-rate 10 --run-time 90s --headless

Drop --headless for the web dashboard at http://localhost:8089.

Exercises two endpoints:
  - GET  /health    must respond under 500ms (Repository Review hard gate)
  - POST /api/chat  main chat route, checked against a 2s p95 target

NutriSmart's chat route returns {"response": "..."} and persists messages for
the given user_id, so the test uses a dedicated "load-test-user" whose history
is cleared after the run (see README in load/).
"""

from locust import HttpUser, task, between

LOAD_USER = "load-test-user"

# Realistic nutrition prompts so every request is not identical.
PROMPTS = [
    "Am I getting enough protein today?",
    "What's a quick healthy breakfast?",
    "How do I cut sugar without feeling tired?",
    "Suggest a balanced dinner from common pantry items.",
]


class CapstoneUser(HttpUser):
    # 1-3s between requests approximates real human pacing.
    wait_time = between(1, 3)
    _i = 0

    @task(1)
    def health(self):
        """Health check should be fast. Flag anything over 500ms."""
        with self.client.get("/health", catch_response=True) as res:
            if res.status_code != 200:
                res.failure(f"health status {res.status_code}")
            elif res.elapsed.total_seconds() > 0.5:
                res.failure("health slower than 500ms")

    @task(5)
    def chat(self):
        """Main chat path, hit ~5x more than health to mirror real traffic."""
        prompt = PROMPTS[CapstoneUser._i % len(PROMPTS)]
        CapstoneUser._i += 1

        with self.client.post(
            "/api/chat",
            json={"message": prompt, "user_id": LOAD_USER},
            catch_response=True,
        ) as res:
            # A 429 means the primary provider rate-limited us. The fallback
            # chain from ai.py should have caught it, so a 429 reaching here
            # is a bug, not expected behaviour.
            if res.status_code == 429:
                res.failure("429: fallback chain did not catch the rate limit")
            elif res.status_code != 200:
                res.failure(f"chat status {res.status_code}")
            elif res.elapsed.total_seconds() > 2.0:
                res.failure("chat slower than 2s (p95 target)")
            else:
                try:
                    if not res.json().get("response"):
                        res.failure("200 but no response field")
                except Exception:
                    res.failure("200 but body was not valid JSON")
