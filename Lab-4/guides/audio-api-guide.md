# Audio API Guide: TTS and STT Reference

**Course:** CS-AI-2025 -- Building AI-Powered Applications | Spring 2026
**Purpose:** Reference guide for audio APIs used in Lab 4 and HW2

---

## Text to Speech (TTS)

### Available Models via OpenRouter

| Model | Provider | Quality | Latency | Cost per 1K chars | Best For |
|-------|----------|---------|---------|-------------------|----------|
| `tts-1` | OpenAI | Standard | ~1-3s for short text | $0.015 | Development, prototyping, most use cases |
| `tts-1-hd` | OpenAI | High definition | ~2-5s for short text | $0.030 | Production audio, podcasts, accessibility |

### Available Voices

| Voice | Character | Good For |
|-------|-----------|----------|
| `alloy` | Neutral, balanced | General purpose, default choice |
| `echo` | Warm, mid-range | Conversational apps, chatbots |
| `fable` | Expressive, storytelling | Narrative content, children's apps |
| `onyx` | Deep, authoritative | News readers, professional tools |
| `nova` | Warm, friendly | Customer-facing products, assistants |
| `shimmer` | Clear, energetic | Marketing content, upbeat apps |

### TTS API Call Pattern

```python
from openai import OpenAI

client = OpenAI(
    api_key=os.getenv("OPENROUTER_API_KEY"),
    base_url="https://openrouter.ai/api/v1",
)

response = client.audio.speech.create(
    model="tts-1",           # or "tts-1-hd"
    voice="nova",            # alloy, echo, fable, onyx, nova, shimmer
    input="Your text here",
    response_format="mp3",   # mp3, opus, aac, flac
)

# Save to file
response.stream_to_file("output.mp3")
```

### Output Formats

| Format | File Size | Quality | Compatibility | Use Case |
|--------|-----------|---------|---------------|----------|
| `mp3` | Small | Good | Universal | Default choice, web apps |
| `opus` | Smallest | Good | Good (not iOS Safari) | Bandwidth-constrained apps |
| `aac` | Small | Good | Universal (especially Apple) | iOS/macOS apps |
| `flac` | Large | Lossless | Limited | Audio archival, further processing |

### Cost Calculation

```
Cost = (number of characters / 1000) * price per 1K chars

Examples:
  100 chars with tts-1:    $0.0015
  500 chars with tts-1:    $0.0075
  1000 chars with tts-1:   $0.015
  1000 chars with tts-1-hd: $0.030
```

### Common TTS Patterns

**Caching repeated phrases:**
If your app generates the same phrases often (greetings, instructions, error messages), generate them once and cache the audio files. This eliminates repeated API calls and reduces both cost and latency to zero for cached phrases.

**Streaming for long text:**
For text longer than a few sentences, consider streaming the audio response to the user while it generates. The OpenAI TTS API returns a streaming response by default. Use `response.stream_to_file()` for file output or iterate over chunks for real-time playback.

**Chunking for very long text:**
TTS models have input limits (typically 4096 characters). For longer text, split into paragraphs, generate each separately, and concatenate the audio files. Use `pydub` for concatenation:

```python
from pydub import AudioSegment

combined = AudioSegment.empty()
for chunk_file in chunk_files:
    combined += AudioSegment.from_mp3(chunk_file)
combined.export("full_output.mp3", format="mp3")
```

---

## Speech to Text (STT)

### Available Models via OpenRouter

| Model | Provider | Languages | Max File Size | Cost per Minute | Best For |
|-------|----------|-----------|---------------|-----------------|----------|
| `whisper-1` | OpenAI | 50+ languages | 25 MB | $0.006 | General transcription, most use cases |

### Supported Audio Formats

| Format | Extension | Notes |
|--------|-----------|-------|
| MP3 | `.mp3` | Most common, recommended |
| MP4 | `.mp4` | Video files with audio |
| WAV | `.wav` | Uncompressed, large files |
| WebM | `.webm` | Browser recordings |
| M4A | `.m4a` | iPhone voice memos |
| MPEG | `.mpeg` | Legacy format |
| MPGA | `.mpga` | Legacy format |

### STT API Call Pattern

```python
with open("audio.mp3", "rb") as audio_file:
    transcript = client.audio.transcriptions.create(
        model="whisper-1",
        file=audio_file,
        response_format="verbose_json",  # Includes timestamps, language
    )

print(transcript.text)
print(transcript.language)
print(transcript.duration)
```

### Response Formats

| Format | Returns | Use Case |
|--------|---------|----------|
| `json` | `{"text": "..."}` | Simple transcription |
| `verbose_json` | Text + timestamps + language + duration | When you need metadata |
| `text` | Plain text string | Quick output |
| `srt` | SubRip subtitle format | Video subtitles |
| `vtt` | WebVTT subtitle format | Web video subtitles |

### Cost Calculation

```
Cost = (audio duration in minutes) * $0.006

Examples:
  15 seconds: $0.0015
  1 minute:   $0.006
  5 minutes:  $0.030
  30 minutes: $0.180
```

### Accuracy Optimization Tips

1. **Clean audio produces better transcripts.** Background noise, echo, and overlapping speakers all reduce accuracy.

2. **Specify the language if you know it.** Add `language="en"` to the API call. This prevents the model from spending time on language detection and can improve accuracy for non-English content.

3. **Use the prompt parameter for domain-specific terms.** If your audio contains technical jargon, names, or uncommon words, pass them in the `prompt` parameter:

```python
transcript = client.audio.transcriptions.create(
    model="whisper-1",
    file=audio_file,
    prompt="KIU, OpenRouter, Gemini, capstone, FastAPI",  # Domain hints
)
```

4. **Chunk long files.** For files approaching the 25 MB limit, split them into segments using `pydub` before transcribing. Overlap segments by 1-2 seconds to avoid losing words at boundaries.

5. **Post-process for common errors.** Build a simple find-and-replace dictionary for words the model consistently gets wrong in your domain.

---

## Cost Comparison: Audio vs Text vs Image

This comparison helps you budget when deciding which AI modalities to include in your capstone.

| Modality | Typical Call | Approximate Cost | Typical Latency |
|----------|-------------|-----------------|----------------|
| Text generation (Gemini 3.1 Flash) | 500 token response | $0.0002 | 0.5-2s |
| Image generation (DALL-E 3) | 1 image (1024x1024) | $0.040 | 5-15s |
| TTS (tts-1) | 500 chars | $0.0075 | 1-3s |
| STT (whisper-1) | 30 seconds | $0.003 | 1-3s |

**Key insight:** Audio is cheaper than images but more expensive than text. For most capstone projects, the audio cost is negligible unless you are processing hours of audio per day.

---

## Streaming Audio Patterns

For real-time applications, streaming is critical. There are three architectural patterns:

### Pattern 1: Generate, Then Play (Simplest)

```
User request --> Generate full audio --> Save file --> Play file
```

Latency: Full generation time before any audio plays. Simple to implement. Acceptable for short text (under 100 words).

### Pattern 2: Stream to File, Play When Ready

```
User request --> Stream audio chunks to file --> Play when complete
```

Latency: Still waits for completion, but the streaming reduces memory usage. Good for medium-length text.

### Pattern 3: Stream and Play Simultaneously (Production)

```
User request --> Stream audio chunks --> Play each chunk as it arrives
```

Latency: User hears audio within 1-2 seconds. Complex to implement. Required for voice assistants and real-time applications.

For HW2 and Lab 4, Pattern 1 is sufficient. Pattern 3 is what production voice products use and is covered in more detail in Week 7 (Streaming and Real-Time APIs).

---

## Data Governance Quick Reference

| Concern | Audio-Specific Risk | Mitigation |
|---------|-------------------|------------|
| PII in content | Names, addresses, numbers spoken aloud | Post-transcription PII redaction |
| Voice biometrics | Voiceprint can identify individuals | Do not store raw audio longer than needed |
| Emotional data | Tone, pace, stress are detectable | Do not analyze emotional content without consent |
| Background audio | Third-party conversations captured | Inform users about ambient recording risks |
| Metadata | Recording device, time, potentially location | Strip metadata before storage |

See `templates/data-governance-checklist.md` for the full checklist.

---

*Audio API guide for CS-AI-2025 Lab 4, Spring 2026.*
