# Exercise 3: Audio Decision for Capstone

**Team Name:** [Your team name]
**Team Members:** [List all members present]
**Date:** [Lab date]

---

## Your Capstone Product

**Product name:** [Name]
**One-sentence description:** [What it does and who it serves]

---

## Audio Decision

Select one:

- [ ] **Core audio** -- our product cannot function without TTS/STT
- [ ] **Enhancement audio** -- audio adds value but is not required for core functionality
- [ ] **Deferred audio** -- audio would be nice but is not worth the complexity right now
- [ ] **No audio** -- audio does not fit our product

---

## Reasoning

### If you selected Core Audio or Enhancement Audio:

**Where does audio appear in your product?**
[Be specific: which screen, which user action triggers it, what does the user hear or say?]

**TTS use case:**
[What text would be read aloud? Why is listening better than reading in this context?]

**STT use case:**
[What would the user say? Why is speaking better than typing in this context?]

**Voice selection:**
[Which OpenAI voice (alloy, echo, fable, onyx, nova, shimmer) fits your product tone? Why?]

**Latency tolerance:**
[How fast must the audio response be? Under 2 seconds? Under 5? Does the user wait or continue?]

**Data governance considerations:**
[Does your audio feature collect user voice data? If yes, what consent is needed?]

**Estimated cost impact:**
[Based on Exercise 1 and 2 results, how much would audio features cost per user per day?]

---

### If you selected Deferred Audio or No Audio:

**Why audio does not fit right now:**
[Explain the specific reason. "We don't have time" is insufficient. What about your product makes audio not the right choice?]

**What would change your decision:**
[Under what conditions would you add audio? A specific user request? A different product direction?]

**Alternative to audio:**
[If a user wanted audio-like interaction, what would you offer instead? (e.g., text-based chat, visual feedback)]

---

## Impact on Design Review

**Does this decision change anything in your submitted Design Review?**

- [ ] No change needed -- Design Review already reflects this decision
- [ ] Yes -- we need to update the feature roadmap to include/exclude audio
- [ ] Yes -- we need to update the architecture diagram
- [ ] Yes -- we need to update the data governance section

**Specific update needed (if any):**
[Describe what needs to change]

---

## Team Agreement

All team members present agree with this decision:

| Name | Agree? |
|------|--------|
| | [ ] Yes |
| | [ ] Yes |
| | [ ] Yes |
| | [ ] Yes |

---

*Save this file and commit it to your team repository before the end of lab.*
