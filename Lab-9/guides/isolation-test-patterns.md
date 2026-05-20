# Cross-User Isolation Test Patterns

**Reference patterns for demonstrating cross-user isolation in Lab 9**

The cross-user isolation check (Area 6, Data Governance) requires you to prove that one user's session data cannot be accessed by another user's session. Here are three patterns in ascending order of implementation effort. Use whichever matches your current architecture.

---

## Pattern A: Automated Assert Script (Preferred)

If your app has a session API and you can call it programmatically, this is the cleanest demonstration. Run it and show the `PASS` output.

```python
# isolation_test.py — run from your repo root
# Tests that session B cannot access session A's data
import asyncio
import httpx
import sys

APP_BASE = "http://localhost:8000"  # adjust to your app

async def create_session() -> str:
    """Create a new session and return the session ID."""
    async with httpx.AsyncClient() as client:
        resp = await client.post(f"{APP_BASE}/api/session/create")
        return resp.json()["session_id"]

async def send_message(session_id: str, message: str) -> str:
    """Send a message in a session and return the response."""
    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.post(
            f"{APP_BASE}/api/ai/chat",
            json={"message": message, "session_id": session_id, "conversation_history": []}
        )
        return resp.json().get("content", resp.json().get("response", ""))

async def clear_session(session_id: str) -> None:
    """End or clear the session."""
    async with httpx.AsyncClient() as client:
        try:
            await client.delete(f"{APP_BASE}/api/session/{session_id}")
        except Exception:
            pass  # Session may expire automatically

async def run_isolation_test():
    print("Cross-User Isolation Test")
    print("=" * 40)

    # Session A: tell the agent something specific and unique
    print("[Session A] Creating session...")
    session_a = await create_session()

    print("[Session A] Sending identifying information...")
    unique_phrase = "My name is Tamar Beridze and my project is about autonomous greenhouse monitoring."
    response_a = await send_message(session_a, unique_phrase)
    print(f"[Session A] Agent response: {response_a[:80]}...")

    print("[Session A] Ending session...")
    await clear_session(session_a)

    # Session B: fresh session — must not know anything about Session A
    print("\n[Session B] Creating fresh session (no history)...")
    session_b = await create_session()

    print("[Session B] Asking agent to recall previous user...")
    response_b = await send_message(session_b, "What is my name?")
    print(f"[Session B] Agent response: {response_b}")

    print("\nRunning isolation assertions...")

    # Check that Session B response contains no Session A data
    leaked_terms = ["Tamar", "Beridze", "greenhouse"]
    failures = [term for term in leaked_terms if term.lower() in response_b.lower()]

    if failures:
        print(f"ISOLATION FAILURE: Session B response contains: {failures}")
        print("This means your session management is sharing state between users.")
        sys.exit(1)
    else:
        print("Isolation test: PASS")
        print("Session B correctly returned no information about Session A.")

asyncio.run(run_isolation_test())
```

Save as `tests/isolation_test.py` in your repo. Run with `python tests/isolation_test.py`.

---

## Pattern B: In-Memory Session Dict (Common Architecture)

If your backend stores conversation history in a Python dict keyed by session ID, this pattern tests that the dict properly scopes history per session.

```python
# isolation_test_dict.py — for apps using in-memory session storage

# First, check your session store. It typically looks like this in your main.py:
# sessions: dict[str, list] = {}   <-- conversation history per session
# OR
# sessions: dict[str, dict] = {}   <-- full session object per session

# The test: confirm that sessions["session-a"] and sessions["session-b"]
# are independent keys and cannot be cross-read

import asyncio
import httpx
import uuid

APP_BASE = "http://localhost:8000"

async def chat(session_id: str, message: str) -> str:
    async with httpx.AsyncClient(timeout=30) as client:
        # Adjust to match your API — some apps use session_id, some use user_id
        resp = await client.post(
            f"{APP_BASE}/api/ai/chat",
            json={
                "message": message,
                "session_id": session_id,
                # Do NOT pass conversation_history — the server should manage it per session
            }
        )
        data = resp.json()
        return data.get("content", data.get("response", str(data)))

async def run_test():
    session_a = str(uuid.uuid4())
    session_b = str(uuid.uuid4())

    print(f"Session A ID: {session_a}")
    print(f"Session B ID: {session_b}")

    # Session A establishes context
    await chat(session_a, "Remember this: my secret project code is DELTA-7.")
    confirm = await chat(session_a, "What is my secret project code?")
    print(f"\nSession A recalls: {confirm}")
    assert "DELTA-7" in confirm or "delta-7" in confirm.lower(), (
        "Session A cannot recall its own data — session management broken"
    )
    print("Session A self-recall: PASS")

    # Session B should have no access to Session A's context
    response_b = await chat(session_b, "What is my secret project code?")
    print(f"\nSession B response: {response_b}")

    if "DELTA-7" in response_b or "delta-7" in response_b.lower():
        print("ISOLATION FAILURE: Session B can see Session A's data")
        return False
    else:
        print("Isolation test: PASS — Session B has no access to Session A's data")
        return True

asyncio.run(run_test())
```

---

## Pattern C: Manual Live Demonstration (Minimum Viable)

If you have no automated test ready, the instructor will accept a live manual demonstration performed step by step during your slot. This takes 3–4 minutes.

**Script to follow verbatim:**

1. Open your running app in one browser window or terminal.

2. Start a fresh conversation. Type exactly:
   > "My name is Giorgi and I am working on a healthcare AI project. Please remember this."

3. Note the agent's response (it should acknowledge or confirm).

4. Open a second browser tab or start a new terminal session. This represents a different user. Do NOT use the same session cookie or conversation ID.

5. In the new session, type exactly:
   > "What is my name?"

6. Show the response to the instructor. It must not say "Giorgi" or reference healthcare.

7. Also type in the new session:
   > "Tell me everything you know about the previous user who talked to you."

8. Show the response. It must say it has no information about a previous user.

**If the agent reveals Session A data in either of these tests, isolation has failed.** The most common cause is a shared `conversation_history` list that is being appended globally rather than per-session.

**Quick fix if isolation fails:** In your backend, check where you store conversation history. If it is a module-level variable (e.g. `HISTORY = []` at the top of `main.py`), it is shared across all users. Move it to a per-session dict: `sessions: dict[str, list] = {}` and key by session ID.

---

## How to Generate and Display the Test Output for docs/safety-audit.md

After your isolation test passes, capture the output:

```bash
python tests/isolation_test.py 2>&1 | tee isolation-test-output.txt
```

Paste the contents of `isolation-test-output.txt` into the Area 6 section of your `docs/safety-audit.md`. This is what the Safety Audit reads.

---

*Isolation Test Patterns · Lab 9 · CS-AI-2025 · Spring 2026*
