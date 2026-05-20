# HW2: Individual Audio Pipeline

**Course:** CS-AI-2025 -- Building AI-Powered Applications | Spring 2026
**Assignment:** Homework 2 (Individual)
**Points:** 5 (part of Participation/Labwork, 15 pts total)
**Due:** Thursday, 10 April 2026 at 23:59 Georgia Time
**Submit:** Push to your personal course repository and submit the link via the course form

---

## Objective

Build a complete audio processing Python script that demonstrates TTS and STT integration in a round-trip pipeline. The script takes text, generates speech, transcribes that speech back to text, and compares the result. You will also write a data governance reflection that considers the privacy and ethical implications of processing audio data.

This is an individual assignment. You may discuss concepts with classmates, but all code and writing must be your own.

---

## What You Build

A single Python script (`hw2-audio-pipeline.py`) that performs the following pipeline:

```
Text Input --> TTS (generate speech) --> MP3 File --> STT (transcribe) --> Transcript --> Compare
```

### Required Features

**1. Text to Speech (1.0 pt)**
- Accept a text string as input (hardcoded is fine, command-line argument is better)
- Call OpenAI TTS via OpenRouter to generate speech
- Save the output as an MP3 file
- Support at least two different voices (demonstrate both in your output)
- Print the generation time and file size for each call

**2. Speech to Text (1.0 pt)**
- Accept an audio file (the one you just generated, or a separate recording)
- Call OpenAI Whisper via OpenRouter to transcribe
- Return and print the transcript text
- Report transcription time
- Handle at least MP3 and WAV formats (check the file extension before sending)

**3. Round-Trip Pipeline (1.0 pt)**
- Chain TTS and STT together in a single run
- Compare the original text to the transcribed text
- Report a simple accuracy metric (word overlap percentage is sufficient)
- Print both the original and transcribed text side by side for easy visual comparison
- The pipeline must run end-to-end with a single command: `python hw2-audio-pipeline.py`

**4. Cost and Latency Tracking (0.5 pt)**
- Every API call logs: timestamp, model used, latency in seconds, input size, and estimated cost
- Print a summary at the end: total TTS cost, total STT cost, total pipeline cost, average latency per call type
- Cost formulas: TTS is $0.015 per 1,000 characters; STT is $0.006 per minute of audio

**5. Error Handling (0.5 pt)**
- Handle file-not-found errors gracefully (do not crash, print a clear message)
- Handle API timeout or connection errors with at least one retry attempt
- Handle unsupported audio format errors (check the extension before sending)
- All error paths produce a human-readable message, not a raw stack trace

**6. Data Governance Reflection (1.0 pt)**
- A separate file: `reflection.md`
- Minimum 300 words
- Address all four questions below with specific examples from your own pipeline run

---

## Reflection Questions (for `reflection.md`)

Answer all four questions. Use specific numbers, file names, and observations from your own pipeline execution. Generic answers that could apply to any project will not earn full marks.

1. **Consent:** If your pipeline processed real user audio instead of synthetic audio, what consent mechanisms would be needed? Be specific: what would the consent screen say? When would it appear? Can the user revoke consent after the fact?

2. **Retention:** How long should audio files be retained? Consider three scenarios: (a) a study app that generates audio lessons, (b) a customer service transcription tool, (c) a medical intake form. How does the retention policy differ across these three?

3. **PII in Audio:** What personally identifiable information risks exist in audio data that do not exist in text data? Think beyond the words spoken. Consider: voice biometrics, accent and language markers, background sounds, emotional state, and recording metadata.

4. **Your Capstone:** Based on your team's Exercise 3 audio decision, how does data governance apply to your specific capstone project? If your team decided not to use audio, explain what governance considerations would change if you did add audio later.

---

## Submission Structure

Push the following to your personal course repository:

```
hw2/
├── hw2-audio-pipeline.py      # Your complete pipeline script
├── reflection.md               # Data governance reflection (300+ words)
├── requirements.txt            # Python dependencies
├── .env.example                # Template (NEVER include real API keys)
├── audio-output/               # Directory with generated audio files
│   ├── voice_nova_sample.mp3   # At least one TTS output
│   └── voice_alloy_sample.mp3  # Second voice demonstration
└── README.md                   # Brief description of how to run your script
```

### README.md Requirements

Your README should include:
- One-sentence description of what the script does
- How to install dependencies (`pip install -r requirements.txt`)
- How to set up the `.env` file
- How to run the script (`python hw2-audio-pipeline.py`)
- Expected output (paste a sample of what the terminal shows)

---

## Technical Constraints

- **Language:** Python 3.10+
- **API:** OpenAI TTS and Whisper via OpenRouter (same key as Labs 1-3)
- **SDK:** `openai` Python package (same as Labs 2-3)
- **No external audio processing libraries required** (but `pydub` is fine if you want to manipulate audio)
- **Audio files in submission should be under 10 MB total** (a few 30-second MP3s are well under this)

---

## Example Output

When your script runs, the terminal output should look something like this:

```
$ python hw2-audio-pipeline.py

=== HW2 Audio Pipeline ===

[1/4] Generating speech with voice: nova
  Text: "Machine learning models learn patterns from data..."
  Generated in 2.14s
  File: audio-output/voice_nova_sample.mp3 (47.3 KB)
  Cost: $0.0021

[2/4] Generating speech with voice: alloy
  Text: "Machine learning models learn patterns from data..."
  Generated in 1.98s
  File: audio-output/voice_alloy_sample.mp3 (45.8 KB)
  Cost: $0.0021

[3/4] Transcribing audio-output/voice_nova_sample.mp3
  Transcript: "Machine learning models learn patterns from data..."
  Transcribed in 1.52s
  Audio duration: 8.3s
  Cost: $0.0008

[4/4] Comparing original vs transcribed text
  Original:    "Machine learning models learn patterns from data..."
  Transcribed: "Machine learning models learn patterns from data..."
  Word overlap accuracy: 100.0%

=== Cost and Latency Summary ===
  TTS calls:  2 | Total cost: $0.0042 | Avg latency: 2.06s
  STT calls:  1 | Total cost: $0.0008 | Avg latency: 1.52s
  Pipeline total: $0.0050

=== Pipeline complete ===
```

---

## Common Mistakes to Avoid

- Hardcoding your API key in the script (use `.env` and `python-dotenv`)
- Submitting audio files larger than 10 MB (trim to 30 seconds)
- Writing a generic reflection that does not reference your actual pipeline output
- Missing error handling (test what happens when you pass a nonexistent file)
- Forgetting `requirements.txt` (the grader needs to install your dependencies)
- Including your `.env` file with real keys (only `.env.example` should be committed)

---

## Getting Started

1. Copy the starter code from Lab 4 exercises as your foundation
2. Run Exercise 1 (TTS) and Exercise 2 (STT) to confirm your environment works
3. Combine them into a single script
4. Add the comparison logic
5. Add cost tracking
6. Add error handling
7. Write the reflection
8. Test the full pipeline end-to-end
9. Push and submit

---

## Grading Reference

See `GRADING-RUBRIC.md` in the Lab-4 folder for the detailed rubric.

---

*HW2 assignment for CS-AI-2025 Spring 2026. Due Thursday 10 April 2026 at 23:59.*
