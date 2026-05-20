# Lab 9: Safety Audit Verification and Capstone Hardening Sprint

**CS-AI-2025 · Building AI-Powered Applications · Spring 2026**
**Friday 15 May 2026 · Group A 09:00–11:00 · Group B 11:00–13:00**

---

## What This Lab Is

Lab 9 is a structured build session with two parts running back to back.

**Part 1 — Golden Set and Safety Audit Build Sprint (minutes 0–70)**
The Safety Audit deadline has been extended to **Thursday 21 May at 23:59** to give every team a full week to build a meaningful golden test set after the Week 11 lecture introduced LLM-as-judge evaluation. Lab 9 is where you build that golden set, run it for the first time, and make substantial progress on your `docs/safety-audit.md`. The audit brief is in the Lab 8 folder as `SAFETY-AUDIT-BRIEF.md`. The Lab 9 starter code in `starter-code/eval/async_golden_set.py` is your primary tool for Part 1.

**Part 2 — Capstone Hardening Sprint (minutes 70–110)**
Using what you learnt in the Week 10 lecture (model selection framework, async batching, measuring what you optimise) and the Week 11 lecture (LLM-as-judge evaluation, error taxonomy, telemetry), you harden what Lab 8 built. The targets are: a working metrics script that reads your episode log, and a model selection decisions review. Teams that complete their golden set early push into these targets.

By the end of this lab your team will have:
- A complete `eval/golden_set.json` with all 10 questions written and reviewed
- A first run of `eval/run_golden_set.py` with results committed to `eval/results/`
- Substantial progress on `docs/safety-audit.md` — most teams should complete 4 of 6 evidence areas today
- A `docs/metrics-report.md` showing six key metrics computed from your episode log (if time allows)
- A git tag: `lab9-hardening`

---

## Prerequisites — Have These Ready Before You Arrive

- [ ] Your app running locally — test the endpoint: `curl http://localhost:8000/api/ai/chat -d '{"message":"test"}'`
- [ ] Episode log file present with at least 100 entries: `wc -l logs/episode-log.jsonl`
- [ ] `eval/golden_set.json` started — even a draft with 5 questions is a good starting point
- [ ] `eval/run_golden_set.py` from Lab 8 accessible — you will upgrade it today
- [ ] Python 3.10+ confirmed: `python --version`
- [ ] OpenRouter API key active: `echo $OPENROUTER_API_KEY`
- [ ] `SAFETY-AUDIT-BRIEF.md` read — it is in the Lab 8 folder on GitHub

---

## Lab Schedule

| Time | Activity | Duration |
|------|----------|----------|
| :00 | Arrival, setup, golden set review in pairs | 5 min |
| :05 | Instructor opens — session goals, golden set composition reminder | 5 min |
| :10 | Part 1: Golden set and Safety Audit build sprint | 60 min |
| :70 | Whole room: run golden sets, commit first results | 10 min |
| :80 | Part 2: Capstone hardening sprint — metrics script and model selection review | 25 min |
| :105 | Commit, tag, push: `lab9-hardening` | 5 min |
| :110 | Session wrap-up — Safety Audit deadline reminder, Week 12 preview | 5 min |

*Group A runs 09:00 to 11:00. Group B runs 11:00 to 13:00.*

**Safety Audit evidence deadline: Thursday 21 May at 23:59.** Lab 9 is your primary build time. Use the full session.

---

## Part 1: Golden Set and Safety Audit Build Sprint (minutes 10–80)

This is the primary work of today's session. You have 70 minutes to build or complete your golden test set and make substantial progress on `docs/safety-audit.md`.

### Step 1 — Write and Review Your 10 Golden Questions (20 min)

If you do not yet have a `eval/golden_set.json`, create one now using the Week 11 composition rule: 3 factual, 2 reasoning, 2 edge case, 2 refusal, 1 format. Use `starter-code/eval/async_golden_set.py` as your template — the placeholder `GOLDEN_SET` at the top is where your questions go.

If you already have questions, apply the rubric review from `guides/model-selection-review.md`. Read every rubric aloud. Could a stranger produce a deterministic pass/fail verdict from it? Rewrite any rubric that contains the words "good," "appropriate," or "helpful" without specifying what those mean.

**Instructor will circulate and review golden set compositions at minute 20.** Be ready to explain your two refusal questions.

### Step 2 — Run the Async Golden Set Runner (20 min)

Open `starter-code/eval/async_golden_set.py`. Copy your questions from `eval/golden_set.json` into the `GOLDEN_SET` list at the top of the file. Update `YOUR_APP_ENDPOINT` to match your local endpoint.

```bash
# Start your app first
cd backend && uvicorn main:app --reload &

# Then run the evaluation
python starter-code/eval/async_golden_set.py
```

Work with the instructor to debug any errors. The most common blockers are in `guides/fast-fixes.md`. When the script completes successfully, commit the results immediately:

```bash
git add eval/results/
git commit -m "eval: first lab9 golden set run"
git push origin main
```

### Step 3 — Build docs/safety-audit.md (30 min)

Open `SAFETY-AUDIT-BRIEF.md` from the Lab 8 folder. Work through each of the six evidence areas and populate your `docs/safety-audit.md`. The instructor will circulate and give feedback on each team's document in progress.

Target for today: complete at least Areas 1, 2, 4, and 5 (episode log, agent architecture, resilience, golden set). Areas 3 and 6 (MCP security and data governance) require running your MCP server and isolation test — complete these before the Thursday 21 May deadline.

The full document must be committed to `docs/safety-audit.md` in your team repo **by Thursday 21 May at 23:59**.

---

## Part 2: Capstone Hardening Sprint (minutes 80–105)

### Target 1 — Metrics Script (15 min)

Build or extend a script that reads your episode log and prints the six key metrics from Week 11 with pass/fail thresholds. Starter code: `starter-code/observability/metrics_report.py`.

Output goes into `docs/metrics-report.md`. This file is read by the Repository Review (10 pts, Week 15).

### Target 2 — Model Selection Review (10 min)

Open your README's "Model Selection Decisions" table. Apply the Week 10 task-model matching framework to each entry. For each LLM call in your capstone: is the model chosen correct for its task type? Use `guides/model-selection-review.md`.

If any calls are using a premium model for a task the free tier handles well, update the table and change the code. Document the expected cost saving.

---

## Commit, Tag, and Push

When both parts are complete:

```bash
git add -A
git commit -m "lab9: golden set first run + hardening sprint

- eval/golden_set.json: 10 questions written and reviewed
- eval/results/: first run committed
- docs/safety-audit.md: progress on areas 1, 2, 4, 5
- docs/metrics-report.md: six metrics computed from episode log
- README model selection table: reviewed against task-model framework"

git tag lab9-hardening
git push origin main --tags
```

Confirm the tag is visible on GitHub before you leave.

**Safety Audit final submission deadline: Thursday 21 May at 23:59.** Everything committed today is a foundation — complete the remaining areas (MCP security and data governance) before that deadline.

---

## Getting Help

- **Golden set script errors:** See `guides/fast-fixes.md` — most failures are endpoint connectivity
- **Rubric writing:** Ask the instructor during the circulate at minute 20 — bring your draft questions
- **MCP server not starting:** `pip install mcp pydantic python-dotenv --break-system-packages`
- **Isolation test not automated:** See `guides/isolation-test-patterns.md` — complete before 21 May
- **Async batching import error:** Check Python version is 3.10+ and `pip install httpx --break-system-packages`
- **Office hours:** zeshan.ahmad@kiu.edu.ge — book via email for Google Meet

---

## Files in This Package

```
Lab-9/
├── README.md                              ← You are here
├── QUICKSTART.md                          ← Pre-session preparation checklist
├── GRADING-RUBRIC.md                      ← How the Safety Audit 10 pts are awarded
├── INSTRUCTOR-GUIDE.md                    ← Word-for-word facilitation script with timing
├── guides/
│   ├── fast-fixes.md                      ← Common Lab 8 gaps and how to close them
│   ├── isolation-test-patterns.md         ← Reference patterns for cross-user isolation
│   └── model-selection-review.md          ← Checklist for applying the Week 10 framework
├── starter-code/
│   ├── observability/
│   │   └── metrics_report.py              ← Episode log metrics script with thresholds
│   └── eval/
│       └── async_golden_set.py            ← Async golden set runner — your primary tool today
└── templates/
    ├── demo-order-sheet.md                ← Instructor tracking sheet — one row per team
    ├── verification-checklist.md          ← Student golden set review checklist
    └── metrics-report-template.md         ← docs/metrics-report.md skeleton
```

---

## Getting Help

- **Golden set script errors:** See `guides/fast-fixes.md` — most failures are endpoint connectivity
- **MCP server not starting:** `pip install mcp pydantic python-dotenv --break-system-packages`
- **Isolation test not automated:** See `guides/isolation-test-patterns.md` — manual demo procedure takes 3 minutes
- **Async batching import error:** Check Python version is 3.10+ and `pip install httpx --break-system-packages`
- **Office hours:** zeshan.ahmad@kiu.edu.ge — book via email for Google Meet

---

*Lab 9 · CS-AI-2025 · Spring 2026 · KIU*
