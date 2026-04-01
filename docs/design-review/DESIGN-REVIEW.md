# Capstone Design Review

**Course:** CS-AI-2025 — Building AI-Powered Applications | Spring 2026
**Assessment:** Design Review — 10 points
**Due:** Thursday 2 April 2026 at 23:59 Georgia Time
**Submission:** Team repo (see required tree in Lab 3 README) + Google Form (link on Teams)
**Team:** TEG
**Project:** NutriSmart
**Repo:** https://github.com/ZA-KIU-Classroom/AI-POWERED-SOFTWARE-DEV-SP26

---

## Section 1 — Problem Statement and Users

*Built on your Lab 2 proposal Section 1. Sharpen to a single precise sentence.*

**Problem statement (one sentence):**
Format: "[Specific user group] struggle to [do thing] because [root cause], which means [consequence]."

```
University students struggle to maintain balanced nutrition because tracking macros, micronutrients, and daily intake is complex and time-consuming, which leads to unbalanced eating habits and negative health effects.
```

**Who exactly has this problem:**
Not a demographic — a specific person in a specific situation. If you have spoken to one real potential user, describe that conversation briefly.

```
Our primary user is Ana, a 20-year-old university student with a busy schedule of lectures and studying. She often eats quick meals or snacks and does not think about nutrient balance. In a short discussion, she said she wants to eat properly but does not know how to balance protein, sugar, and other nutrients across the day.
```

**What they do today without your solution:**

```
They either ignore nutrition entirely, rely on generic online advice that does not account for what they actually eat, or try to manually track macros using apps like MyFitnessPal — which requires tedious per-item logging and offers no real-time correction when intake becomes unbalanced.
```

**Why AI is the right tool:**
What does AI enable that a conventional approach cannot? One paragraph.

```
AI enables real-time, context-aware nutritional analysis that adapts to what the user has already eaten throughout the day. A conventional calorie-tracking app can log food, but it cannot detect that a user's sugar intake is already high and proactively suggest corrections using foods the user has available. AI can also understand food from images and natural language descriptions (e.g., "pizza and cola"), eliminating the need for manual database lookups. This combination of vision, reasoning, and personalized suggestion is impractical to build with traditional rule-based systems.
```

---

## Section 2 — Proposed Solution and Features

*Built on your Lab 2 proposal Section 2.*

**Solution summary (3–5 sentences):**

```
NutriSmart is an AI-powered assistant that helps students maintain balanced nutrition throughout the day. Users can log what ingredients they have in their fridge and pantry, and the system uses this inventory to generate personalized daily intake plans. It monitors what the user eats and detects imbalances such as too much sugar or missing nutrients. When an imbalance occurs, the AI suggests simple corrections specifically from the foods the user actually has at home. The goal is to help users maintain consistent, healthy nutrition without needing to manually calculate anything.
```

**Core features:**

| Feature | AI-powered? | The AI differentiator? |
|---|---|---|
| Fridge/pantry inventory — user logs what ingredients they have at home | No | No |
| Daily nutrition plan generation based on goals and available food | Yes | No |
| Real-time imbalance detection and correction suggestions | Yes | Yes |
| Food recognition from text or image input | Yes | No |
| Intake history and nutrient tracking dashboard | No | No |
| Personalized correction suggestions from user's stored ingredients | Yes | No |

**The one feature that would not exist without AI:**

```
Real-time detection of nutrient imbalances and context-aware correction suggestions using the user's available foods — this requires reasoning over the full day's intake plus knowledge of food composition.
```

---

## Section 3 — Measurable Success Criteria

*New in Lab 3. This section did not exist in your Lab 2 proposal.*

A measurable criterion has three parts: what you measure, how you measure it, and a target number. "Users will be satisfied" is not a criterion. "The vision extraction achieves greater than 85% field accuracy on our 20-item test set" is.

Write at least two criteria.

| Criterion | How you will measure it | Target |
|---|---|---|
| Nutrient balance accuracy | Compare AI-generated plans with nutrition guidelines across 20 test cases | ≥ 85% correct macro and micronutrient balance |
| Correction effectiveness | Measure how well AI suggestions fix nutrient imbalance in test scenarios | ≥ 70% of cases successfully balanced |

---

## Section 4 — Architecture

*Your Lab 2 proposal had a prose description. The Design Review requires a visual diagram.*

**Architecture diagram:**
Commit your diagram as `docs/design-review/architecture-diagram.png` and reference it here.

```
See: docs/design-review/architecture-diagram.png
```

The diagram must show: frontend, backend, AI model(s), storage layer, and arrows showing data direction. Use the checklist in `templates/architecture-template.md` to verify before committing.

**Technology stack:**

| Layer | Technology | Why |
|---|---|---|
| Frontend | Next.js | Server-side rendering, built-in routing, and interactive UI |
| Backend | Flask (Python) | Lightweight, easy AI/ML integration, team familiarity |
| Primary AI model | Gemini 3 Flash (via OpenRouter) | Fast and efficient for real-time recommendations |
| Secondary model (fallback) | GPT-4o (via OpenRouter) | More reliable if primary fails |
| Storage | Supabase (PostgreSQL) | Stores user data and history |
| Hosting | Vercel (frontend) + Render (backend) | Easy deployment |

**Multimodal capabilities (check all that apply now or planned by Week 8):**

- [x] Text generation
- [x] Vision / image understanding (Lab 2)
- [ ] Image generation (planned Lab 3 / Week 3)
- [ ] Audio TTS or STT
- [ ] Document / PDF understanding
- [ ] Function calling
- [ ] RAG

---

## Section 5 — Prompt and Data Flow

*New in Lab 3. Trace one specific user action step by step.*

Choose your most important AI feature. Trace the complete path from user input to user-visible output.

```
User action:
  User types foods they ate (e.g., "pizza, cola") or uploads an image of their meal.
  User can also log what ingredients they have in their fridge/pantry.

Preprocessing:
  Text input is cleaned and structured into food items
  Image input is processed using vision model to detect food items
  User's stored ingredient inventory is loaded from the database

Prompt construction:
  System prompt defines role as a nutrition assistant focused on balanced intake
  User food input is inserted along with their ingredient inventory
  Context includes recommended daily macro and micronutrient ranges

API call:
  Gemini 3 Flash via OpenRouter API (temperature ~0.7)

Response parsing:
  Extract structured output:
  - nutrient breakdown
  - imbalance detection (e.g., high sugar)
  - correction suggestions

Confidence / validation:
  Check if all required nutrients are present in the response
  If missing or inconsistent — mark as low confidence

User output:
  User sees:
  - current intake summary
  - highlighted imbalance (e.g., "high sugar")
  - suggested foods to correct it using available ingredients

  If low confidence:
  User sees: "We couldn't fully analyze this meal. Please check or edit items."
```

---

## Section 6 — Team Roles and Contract

*Built on your Lab 2 proposal Section 5. Team contract is new in Lab 3.*

**Team members and roles:**

| Name | Primary role |
|---|---|
| Tekla Kilasonia | Frontend (Next.js), UI/UX design, testing |
| Giorgi Papidze | Backend (Flask), AI integration, database |

**Team Contract:** Committed to repo root as `TEAM-CONTRACT.md`.

```
Link: https://github.com/ZA-KIU-Classroom/AI-POWERED-SOFTWARE-DEV-SP26/blob/main/TEAM-CONTRACT.md
```

---

## Section 7 — Safety Threats and Fallback UX

*New in Lab 3.*

### Safety Threats

Fill in every row that applies. For rows that do not apply, write "N/A" and one sentence explaining why.

| Threat | Relevant? | Your mitigation |
|---|---|---|
| Prompt injection — user input hijacks system behaviour | Yes | Validate and sanitize all user text input before inserting into prompts. Use a strict system prompt that limits the model's role to nutrition analysis only. |
| Hallucination in high-stakes output | Yes | Add a disclaimer that NutriSmart is not a medical tool. Cross-check AI nutrient estimates against known food databases where possible. Flag low-confidence responses for manual review. |
| Bias affecting specific user groups | Yes | Test with diverse dietary patterns (vegetarian, halal, regional cuisines). Avoid assuming Western diet defaults in prompts. Allow users to specify dietary restrictions. |
| Content policy violation (image generation, user-generated prompts) | N/A | The app does not generate images. User input is limited to food descriptions and meal photos, which are low-risk for content policy violations. |
| Privacy violation via stored model inputs or logs | Yes | Do not log raw user food inputs beyond 30-day retention. Do not send personally identifiable information to the AI API — only food item descriptions are sent. |
| Data exfiltration via model response | N/A | The model only receives food descriptions and nutritional context, not sensitive personal data. No credentials or private data are included in prompts. |

**Top risk you are most concerned about:**

```
Hallucination — the AI may generate incorrect nutritional values or unsafe dietary suggestions (e.g., recommending high-sodium foods to someone who should avoid them). Since users trust nutrition advice to make eating decisions, wrong information could directly affect their health.
```

### Fallback UX

Describe what the user sees when your AI fails, is unavailable, or returns a low-confidence answer. Write this as a user experience description, not an error handling description.

Start with: "The user sees..."

```
The user sees their entered foods highlighted with a message such as "We couldn't fully analyze this meal." Suggested corrections are still shown where possible, and the user can edit or re-enter items manually. The interface avoids technical language and focuses on helping the user continue without confusion.
```

---

## Section 8 — Data Governance

*New in Lab 3. Required by the syllabus (Week 4: data governance plan).*

Answer all six questions. "We have not decided yet" is not an answer — make a decision now and note that it is provisional.

| Question | Your answer |
|---|---|
| What user data does your app collect or process? | Food inputs, fridge/pantry ingredient inventory, preferences, and nutrition goals |
| Where is it stored? (service name, country) | Supabase (EU servers) |
| How long is it retained? | 30 days |
| Who has access to it? | Only the user and backend system |
| How can a user request deletion? | Delete button in settings |
| Does your app send user data to third-party AI APIs? Which ones? | Gemini 3 Flash, GPT-4o (fallback) |

---

## Section 9 — IRB-Light Checklist

*Built on your Lab 2 proposal Section 6. Review and confirm.*

Check all that apply:

- [ ] My app collects or processes images of real people
- [ ] My app collects or processes audio recordings
- [x] My app handles personal health information
- [ ] My app handles financial information
- [ ] My app involves users under 18
- [ ] My app processes documents containing personal data

**For each box checked, describe consent flow and data retention:**

```
Personal health information (nutrition goals, dietary preferences, food intake history):
- Consent: Users explicitly agree to data collection during account registration via a consent screen that explains what data is collected and why.
- Retention: Food intake logs are retained for 30 days, then automatically deleted. Users can delete their data at any time via a "Delete my data" button in settings.
- The app displays a clear disclaimer that it is not a medical or dietetic tool and should not replace professional nutritional advice.
```

---

## Section 10 — Submission Checklist

Complete before Thursday 2 April 23:59.

- [ ] All sections above have no `[fill in]` remaining
- [ ] `docs/design-review/architecture-diagram.png` committed and readable
- [ ] `TEAM-CONTRACT.md` in repo root with all member names
- [ ] `.env` is not committed (check `.gitignore`)
- [ ] Lab 1 work visible or linked in repo
- [ ] Lab 2 proposal and vision call visible in repo
- [ ] `lab-3/generation-strategy.md` committed
- [ ] Team repo matches the tree in the Lab 3 README
- [ ] Google Form completed by one team member

---

*Design Review for CS-AI-2025 Spring 2026.*
*Questions: zeshan.ahmad@kiu.edu.ge or course forum.*
