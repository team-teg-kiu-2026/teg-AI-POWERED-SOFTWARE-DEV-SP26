# Lab 4 Grading Rubric

**Course:** CS-AI-2025 -- Building AI-Powered Applications | Spring 2026
**Lab:** 4 of 15 -- Audio Integration and Design Review Sprint
**Total In-Lab Component:** Participation/Labwork (tracked in overall 15-pt category)
**Homework 2:** 5 points (individual)

---

## Lab Participation Assessment

Lab 4 is assessed for participation via the following evidence. TAs circulate during the lab and record completion at the end of the session.

| Evidence | What the Instructor or TA Checks |
|---|---|
| Exercise 1 log submitted | `exercises/ex1-audio-log.md` filled in with at least 2 voice comparisons and generation times |
| Exercise 2 STT log | `exercises/ex2-stt-log.md` contains transcript output, accuracy notes, and at least one audio file tested |
| Exercise 3 audio decision | `exercises/ex3-audio-decision.md` completed as a team with a clear decision and reasoning |
| Active engagement | Student is coding, testing, and contributing during lab -- not idle or working on unrelated material |

Attendance and active engagement are recorded. Students who are present but not coding or contributing are noted.

---

## Homework 2 Rubric -- 5 Points (Individual)

Homework 2 is submitted individually to your personal course repository. Due Thursday, 10 April 2026 at 23:59 Georgia Time.

| Category | Points | What Earns Full Marks |
|---|---|---|
| **Working TTS Feature** | 1.0 | Script accepts text input, calls OpenAI TTS via OpenRouter, saves a playable MP3 file. No crashes on normal use. At least two different voices demonstrated. |
| **Working STT Feature** | 1.0 | Script accepts an audio file, calls Whisper via OpenRouter, returns and saves the transcript. Handles at least MP3 and WAV formats. |
| **Pipeline Integration** | 1.0 | A single script chains: text input to TTS to audio file to STT back to transcript. The round-trip works end-to-end. Output includes comparison of original text versus transcribed text. |
| **Cost and Latency Tracking** | 0.5 | Each API call logs generation time. A summary section reports total cost estimate and average latency per call type (TTS vs STT). |
| **Error Handling** | 0.5 | File-not-found, API timeout, and invalid audio format errors are handled gracefully with clear error messages. Script does not crash on bad input. |
| **Data Governance Reflection** | 1.0 | A `reflection.md` file (300+ words) addresses: (1) What consent mechanisms would be needed if this processed real user audio? (2) How long should audio files be retained and why? (3) What PII risks exist in audio data versus text data? (4) How does your answer change for your specific capstone project? |
| **Total** | **5.0** | |

---

## Scoring Guidelines

**5/5 (Excellent):** All components work. Pipeline runs end-to-end without errors. Cost tracking is accurate. Reflection demonstrates genuine engagement with data governance concepts and connects them to the student's capstone.

**4/5 (Good):** TTS and STT both work individually. Pipeline has minor issues (e.g., format mismatch between TTS output and STT input). Cost tracking present but incomplete. Reflection addresses all four questions but lacks depth.

**3/5 (Satisfactory):** Either TTS or STT works. The other has bugs but shows clear attempt. Pipeline is incomplete. Reflection is present but superficial.

**2/5 (Needs Improvement):** Only one of TTS or STT works. No pipeline integration. Minimal error handling. Reflection is missing or under 150 words.

**1/5 (Minimal Effort):** Code is mostly copied starter code with minimal modification. Does not run successfully. No reflection.

**0/5:** Not submitted or submitted without meaningful content.

---

## Late Policy

Per the syllabus: up to 72 hours late, minus 10 percent of the item score per 24 hours. Beyond 72 hours requires instructor approval. One resubmission allowed on labs only, within one week, for up to 80 percent of lost points.

---

## Submission Checklist

Before submitting, verify:

- [ ] `hw2-audio-pipeline.py` runs without errors on a fresh terminal
- [ ] At least one generated MP3 file is included (do not include files over 10 MB)
- [ ] `reflection.md` is 300+ words and addresses all four questions
- [ ] `.env.example` is included (no real API keys)
- [ ] `requirements.txt` lists all dependencies
- [ ] Your repository is pushed and the link is submitted via the course form

---

*Grading rubric for CS-AI-2025 Lab 4, Spring 2026.*
