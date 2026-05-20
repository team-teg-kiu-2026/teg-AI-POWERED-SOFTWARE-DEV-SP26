# Lab 4: Audio Integration and Design Review Sprint

**Course:** CS-AI-2025 — Building AI-Powered Applications | Spring 2026
**Lab:** 4 of 15
**Date:** Friday, 3 April 2026
**Time:** Group A 09:00-11:00 | Group B 11:00-13:00
**Lecture context:** Week 4 — Audio, TTS, STT, Real-Time Voice APIs, Streaming UX, Data Governance

---

## Before You Start

**Status check from previous labs:**

| Prerequisite | Where to Find It | Must Be Complete? |
|---|---|---|
| Lab 1 complete (environment, Gemini, prompt patterns) | `Lab-1/` in course repo | Yes |
| Lab 2 complete (builder sprint, team formation, vision I/O) | `Lab-2/` in course repo | Yes |
| Lab 3 complete (image generation, content filters, capstone integration) | `Lab-3/` in course repo | Yes |
| HW1 submitted (individual prompt engineering, 5 pts) | Your personal repo | Yes |
| OpenRouter key working for text, vision, and image calls | `.env` file | Yes |
| Team repo exists with frontend/ and backend/ folders | Team GitHub repo | Yes |

**If you are behind:** Use the first 20 minutes of lab to catch up before joining the audio exercises.

---

## Overview

Lab 4 has two parts of roughly equal weight. This reflects where you are in the course: audio integration is the Week 4 technical topic, and the Design Review was due yesterday.

**First hour -- Audio Integration (individual technical exercises):** You will make your first TTS (text-to-speech) and STT (speech-to-text) API calls via OpenRouter, evaluate audio latency and cost, and decide whether audio fits your capstone product.

**Second hour -- Design Review Debrief and HW2 Launch (mixed team/individual):** Your team debriefs the Design Review submission, identifies any gaps, and you receive the HW2 individual assignment which applies the audio skills from Part 1.

---

## Learning Objectives

By the end of Lab 4 you will be able to:

1. Call a TTS API via OpenRouter and save the audio output as a file
2. Call an STT API to transcribe a short audio clip
3. Measure and compare the latency and cost of audio API calls relative to text and image calls
4. Make a reasoned, documented decision about whether audio fits your capstone product
5. Build a complete audio processing script that chains TTS and STT together

---

## Technology Stack for This Lab

| Component | Technology | Model string (OpenRouter) |
|---|---|---|
| Text to speech | OpenAI TTS | `openai/tts-1` |
| Speech to text | OpenAI Whisper | `openai/whisper-1` |
| Audio output format | MP3 (default) | `response_format="mp3"` |
| Playback (dev) | System audio player or Python `playsound` | n/a |

**Important:** Audio API calls use the same OpenRouter key as your text and image calls. The SDK call pattern is different from text completions -- see the starter code for the exact syntax.

**Agentic context (from Lecture Week 4):** Real-time voice agents are the most commercially active AI application category right now. The TTS/STT patterns you learn today are the exact building blocks behind voice assistants, real-time translators, and audio-first products. The latency patterns you measure today are what separate a usable voice agent from an unusable one.

---

## Lab Exercises

### Exercise 1 -- Text to Speech: Your First Audio Output (20 minutes)

Open `examples/starter-code/01_hello_tts.py`. Read it fully before running it. This script demonstrates the minimum working call to OpenAI TTS via OpenRouter.

**Tasks:**
1. Run the script and confirm you hear your generated audio
2. Change the voice parameter (options: `alloy`, `echo`, `fable`, `onyx`, `nova`, `shimmer`) and compare at least two voices
3. Measure and log the generation time for each call
4. Note the file size of each output MP3
5. Record everything in `exercises/ex1-audio-log.md`

**Success criterion:** You have generated at least two audio files with different voices and can articulate the quality and character difference between them.

---

### Exercise 2 -- Speech to Text: Transcription (20 minutes)

Open `examples/starter-code/02_hello_stt.py`. This script takes an audio file and returns a transcript.

**Tasks:**
1. Record a 15-30 second voice memo on your phone (or use the provided sample file at `resources/sample-audio/sample_en_30s.mp3`)
2. Transfer the file to your laptop
3. Run the STT script on your audio file
4. Compare the transcript against what you actually said -- note any errors
5. Test with a noisy recording versus a clean one if you have both
6. Record your results in `exercises/ex2-stt-log.md`

**Success criterion:** You have a working transcript from a real audio file, and you can describe where the model was accurate and where it struggled.

---

### Exercise 3 -- Audio Decision for Your Capstone (20 minutes)

This is a team exercise. Sit together and work through the decision template at `exercises/ex3-audio-decision.md`.

**The question:** Should your capstone product include audio features?

Work through the template together. The four options to evaluate:
1. **Core audio** -- your product cannot function without TTS/STT (e.g., a voice assistant, an accessibility tool)
2. **Enhancement audio** -- audio adds value but is not required (e.g., reading articles aloud, voice memo transcription)
3. **Deferred audio** -- audio would be nice but is not worth the complexity right now
4. **No audio** -- audio does not fit your product and you should not force it

Document your decision with reasoning. This feeds directly into your Design Review's feature roadmap.

**Success criterion:** Your team has a written, reasoned decision about audio in your capstone with specific justification.

---

## Part 2: Design Review Debrief and HW2 Launch (Second Hour)

### Design Review Debrief (30 minutes, team)

The Design Review was due Thursday 2 April at 23:59. Your team should have submitted via the team repo and Google Form.

**In-lab debrief activities:**
1. Each team member reads the full submitted document (if you have not already)
2. Identify one section that is strong and one section that needs improvement
3. Discuss: What questions do you expect from the instructor or peers about your proposal?
4. If you missed the deadline, use this time to finalize and submit with late penalty

**TA circulation:** The TA will visit each team to discuss specific questions about the Design Review. This is not a graded check -- it is a support opportunity.

### HW2 Launch and Setup (30 minutes, individual)

The TA will walk through the HW2 assignment brief. See `homework/hw2-individual-audio.md` for the full specification.

**HW2 summary:** Build a complete audio processing Python script that demonstrates TTS and STT integration, with cost tracking, error handling, and a reflection on data governance considerations for audio data.

**Due:** Thursday, 10 April 2026 at 23:59 Georgia Time
**Points:** 5 (individual, part of Participation/Labwork)

Use the remaining lab time to set up your HW2 repository structure and run the first exercise from the homework to confirm your environment works.

---

## Common Issues and Troubleshooting

**"I cannot install the openai package"**
Run `pip install openai` (or `pip3 install openai`). If you are in a virtual environment, make sure it is activated first.

**"The TTS call returns an error about the model"**
The model string is `tts-1` (not `openai/tts-1`). When calling through the OpenAI SDK pointed at OpenRouter, some audio models use shortened model names. Check the starter code for the exact syntax.

**"I cannot play the MP3 file"**
On macOS: `open output.mp3`. On Linux: `xdg-open output.mp3`. On Windows: `start output.mp3`. Alternatively, install `playsound` (`pip install playsound`) and play from Python.

**"The STT call fails with my audio file"**
Whisper supports MP3, MP4, WAV, WEBM, M4A, MPEG, and MPGA formats. File size must be under 25 MB. If your file is too large, trim it to 30 seconds using any audio editor or the `pydub` library.

**"My OpenRouter key does not work for audio calls"**
Audio models (TTS, Whisper) are available through OpenRouter. Make sure your key has credit. Verify by running the simpler text completion first. If text works but audio does not, check the model string and API endpoint configuration.

---

## Folder Structure

```
Lab-4/
├── README.md                              <- You are here
├── QUICKSTART.md
├── GRADING-RUBRIC.md
├── INSTRUCTOR-GUIDE.md
├── exercises/
│   ├── ex1-audio-log.md                   <- Exercise 1 log
│   ├── ex2-stt-log.md                     <- Exercise 2 log
│   └── ex3-audio-decision.md              <- Exercise 3 team decision
├── examples/
│   └── starter-code/
│       ├── 01_hello_tts.py                <- Exercise 1 starter
│       ├── 02_hello_stt.py                <- Exercise 2 starter
│       └── 03_capstone_audio_example.py   <- Team reference example
├── homework/
│   └── hw2-individual-audio.md            <- HW2 assignment brief
├── templates/
│   ├── audio-cost-tracker.md              <- Cost logging template
│   └── data-governance-checklist.md       <- Governance template for HW2
├── guides/
│   └── audio-api-guide.md                 <- TTS/STT reference
└── resources/
    └── sample-audio/
        └── sample_en_30s.mp3              <- Sample for Exercise 2
```

---

## Resources

**In This Lab Folder:**
- [Quickstart](./QUICKSTART.md) -- run Exercise 1 in under 5 minutes
- [Audio API Guide](./guides/audio-api-guide.md) -- model comparison, cost reference, streaming patterns
- [HW2 Assignment](./homework/hw2-individual-audio.md) -- full brief
- [Grading Rubric](./GRADING-RUBRIC.md) -- how lab and HW2 are assessed

**External Documentation:**
- [OpenAI TTS API Reference](https://platform.openai.com/docs/api-reference/audio/createSpeech)
- [OpenAI Whisper API Reference](https://platform.openai.com/docs/api-reference/audio/createTranscription)
- [OpenRouter Audio Models](https://openrouter.ai/docs)
- [Course GitHub](https://github.com/ZA-KIU-Classroom/AI-POWERED-SOFTWARE-DEV-SP26)

**Questions?**
- During lab: raise your hand -- TA and instructor are circulating
- After lab: post in the course forum first (others benefit from your question)
- Email: zeshan.ahmad@kiu.edu.ge
- Office hours: email to schedule a Google Meet

---

## Looking Ahead: What Lab 5 Will Expect

Lab 5 (Friday, 10 April 2026) follows Lecture Week 5 on Embeddings, RAG, and Retrieval. Quiz 1 also takes place during Week 5 (Thursday 2 April was the original date -- check announcements for confirmed timing). Your team must arrive at Lab 5 with:
- HW2 submitted (audio individual, due Thursday 10 April)
- Design Review submitted and reviewed (feedback may come before Lab 5)
- OpenRouter key working for embedding calls

---

*Lab materials for CS-AI-2025 Spring 2026. Maintained at [github.com/ZA-KIU-Classroom/AI-POWERED-SOFTWARE-DEV-SP26](https://github.com/ZA-KIU-Classroom/AI-POWERED-SOFTWARE-DEV-SP26).*
*Last updated: March 2026.*
