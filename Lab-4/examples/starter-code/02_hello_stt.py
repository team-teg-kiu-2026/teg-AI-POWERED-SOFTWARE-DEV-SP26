"""
Lab 4 -- Exercise 2: Speech to Text
CS-AI-2025 Spring 2026, Kutaisi International University

Transcribe an audio file using OpenAI Whisper via OpenRouter.

BEFORE RUNNING:
  1. pip install openai python-dotenv
  2. Create a .env file with: OPENROUTER_API_KEY=sk-or-v1-your-key-here
  3. Have an audio file ready (MP3, WAV, M4A, WEBM, MP4, MPEG, or MPGA)
  4. Run: python 02_hello_stt.py path/to/your/audio.mp3

WHAT THIS DOES:
  - Reads an audio file from disk
  - Sends it to OpenAI Whisper through OpenRouter
  - Returns the transcribed text
  - Reports transcription time and token-equivalent cost estimate
"""

import os
import sys
import time
from pathlib import Path
from dotenv import load_dotenv
from openai import OpenAI

# ── Setup ──────────────────────────────────────────────────────────────────
load_dotenv()

client = OpenAI(
    api_key=os.getenv("OPENROUTER_API_KEY"),
    base_url="https://openrouter.ai/api/v1",
)

# Supported audio formats for Whisper
SUPPORTED_FORMATS = {".mp3", ".mp4", ".wav", ".webm", ".m4a", ".mpeg", ".mpga"}

# Maximum file size: 25 MB
MAX_FILE_SIZE_MB = 25


# ── STT Function ──────────────────────────────────────────────────────────

def speech_to_text(audio_file_path: str) -> dict:
    """
    Transcribe an audio file using OpenAI Whisper via OpenRouter.

    Args:
        audio_file_path: Path to the audio file to transcribe

    Returns:
        Dictionary with transcript text, duration, language, and timing
    """
    path = Path(audio_file_path)

    # ── Validation ─────────────────────────────────────────────────────
    if not path.exists():
        raise FileNotFoundError(f"Audio file not found: {audio_file_path}")

    if path.suffix.lower() not in SUPPORTED_FORMATS:
        raise ValueError(
            f"Unsupported format: {path.suffix}. "
            f"Supported: {', '.join(sorted(SUPPORTED_FORMATS))}"
        )

    file_size_mb = path.stat().st_size / (1024 * 1024)
    if file_size_mb > MAX_FILE_SIZE_MB:
        raise ValueError(
            f"File too large: {file_size_mb:.1f} MB. "
            f"Maximum: {MAX_FILE_SIZE_MB} MB. "
            f"Trim your audio to under 30 seconds or use pydub to split it."
        )

    print(f"Transcribing: {path.name}")
    print(f"File size: {file_size_mb:.2f} MB")
    print(f"Format: {path.suffix}")

    start = time.time()

    # ── API Call ───────────────────────────────────────────────────────
    with open(path, "rb") as audio_file:
        transcript = client.audio.transcriptions.create(
            model="whisper-1",
            file=audio_file,
            response_format="verbose_json",  # Returns timestamps + language
        )

    elapsed = round(time.time() - start, 2)

    # ── Parse Response ─────────────────────────────────────────────────
    result = {
        "text": transcript.text,
        "language": getattr(transcript, "language", "unknown"),
        "duration_seconds": getattr(transcript, "duration", None),
        "transcription_time_seconds": elapsed,
        "file_name": path.name,
        "file_size_mb": round(file_size_mb, 2),
    }

    return result


# ── Main ──────────────────────────────────────────────────────────────────

def main():
    # Check command-line argument
    if len(sys.argv) < 2:
        # Default to the sample audio file if no argument given
        sample_path = Path(__file__).parent.parent.parent / "resources" / "sample-audio" / "sample_en_30s.mp3"
        if sample_path.exists():
            audio_path = str(sample_path)
            print(f"No audio file specified. Using sample: {sample_path}")
        else:
            print("Usage: python 02_hello_stt.py <path-to-audio-file>")
            print()
            print("Examples:")
            print("  python 02_hello_stt.py my_recording.mp3")
            print("  python 02_hello_stt.py ../../resources/sample-audio/sample_en_30s.mp3")
            print()
            print(f"Supported formats: {', '.join(sorted(SUPPORTED_FORMATS))}")
            sys.exit(1)
    else:
        audio_path = sys.argv[1]

    try:
        result = speech_to_text(audio_path)
    except (FileNotFoundError, ValueError) as e:
        print(f"\nError: {e}")
        sys.exit(1)

    # ── Display Results ────────────────────────────────────────────────
    print(f"\n{'=' * 60}")
    print("TRANSCRIPT:")
    print(f"{'=' * 60}")
    print(result["text"])
    print(f"{'=' * 60}")

    print(f"\n--- Metadata ---")
    print(f"  Language detected: {result['language']}")
    if result["duration_seconds"]:
        print(f"  Audio duration:    {result['duration_seconds']:.1f} seconds")
    print(f"  Transcription time: {result['transcription_time_seconds']}s")
    print(f"  File: {result['file_name']} ({result['file_size_mb']} MB)")

    # Cost estimate for Whisper: $0.006 per minute of audio
    if result["duration_seconds"]:
        duration_min = result["duration_seconds"] / 60
        cost = duration_min * 0.006
        print(f"  Cost estimate: ~${cost:.4f} ({duration_min:.2f} min at $0.006/min)")

    print("\n--- Exercise 2 Tasks ---")
    print("1. Compare the transcript to what was actually said.")
    print("2. Note any words that were transcribed incorrectly.")
    print("3. Test with a noisy recording vs a clean one.")
    print("4. Record your findings in exercises/ex2-stt-log.md.")
    print("5. What types of audio would your capstone need to handle?")


if __name__ == "__main__":
    main()
