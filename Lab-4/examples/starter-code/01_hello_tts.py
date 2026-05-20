"""
Lab 4 -- Exercise 1: Text to Speech
CS-AI-2025 Spring 2026, Kutaisi International University

Generate speech from text using OpenAI TTS via OpenRouter.

BEFORE RUNNING:
  1. pip install openai python-dotenv
  2. Create a .env file with: OPENROUTER_API_KEY=sk-or-v1-your-key-here
  3. Run: python 01_hello_tts.py

WHAT THIS DOES:
  - Sends text to the OpenAI TTS model through OpenRouter
  - Receives an audio stream back
  - Saves it as an MP3 file in the audio-output/ directory
  - Reports generation time and file size
"""

import os
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

OUTPUT_DIR = Path("audio-output")
OUTPUT_DIR.mkdir(exist_ok=True)

# ── Configuration ──────────────────────────────────────────────────────────

# The text you want to convert to speech.
# Change this to anything you want to hear.
TEXT = (
    "In this course, you are learning to work alongside AI systems "
    "as a collaborator, not just a consumer. "
    "The skills you are building this semester will define your career."
)

# Available voices: alloy, echo, fable, onyx, nova, shimmer
# Try at least two and describe the difference in your log.
VOICE = "nova"


# ── TTS Function ──────────────────────────────────────────────────────────

def text_to_speech(text: str, voice: str, output_filename: str) -> dict:
    """
    Convert text to speech using OpenAI TTS via OpenRouter.

    Args:
        text:            The text to speak
        voice:           Voice name (alloy, echo, fable, onyx, nova, shimmer)
        output_filename: Output filename (saved in OUTPUT_DIR)

    Returns:
        Dictionary with generation_time_seconds and file_size_bytes
    """
    output_path = OUTPUT_DIR / output_filename
    print(f"Generating speech ({voice} voice)...")
    print(f"Text: '{text[:60]}...'")

    start = time.time()

    # The TTS API streams the audio response directly.
    # Model: tts-1 (standard quality) or tts-1-hd (higher quality, slower)
    response = client.audio.speech.create(
        model="tts-1",
        voice=voice,
        input=text,
        response_format="mp3",  # Options: mp3, opus, aac, flac
    )

    elapsed = round(time.time() - start, 2)

    # Save the audio to a file
    response.stream_to_file(str(output_path))
    file_size = output_path.stat().st_size

    print(f"Generated in {elapsed}s -- saved to {output_path}")
    print(f"File size: {file_size / 1024:.1f} KB")

    return {
        "output_path": str(output_path),
        "generation_time_seconds": elapsed,
        "file_size_bytes": file_size,
        "voice": voice,
        "text_length_chars": len(text),
    }


# ── Main ──────────────────────────────────────────────────────────────────

def main():
    result = text_to_speech(TEXT, VOICE, f"ex1_{VOICE}_{int(time.time())}.mp3")

    print("\n--- Result ---")
    for key, value in result.items():
        print(f"  {key}: {value}")

    print(f"\nTo play the audio:")
    print(f"  macOS:   open {result['output_path']}")
    print(f"  Linux:   xdg-open {result['output_path']}")
    print(f"  Windows: start {result['output_path']}")

    # Cost estimate for TTS-1: $0.015 per 1,000 characters
    cost_estimate = (len(TEXT) / 1000) * 0.015
    print(f"\nCost estimate: ~${cost_estimate:.4f} ({len(TEXT)} chars at $0.015/1k)")

    print("\n--- Exercise 1 Tasks ---")
    print("1. Open the audio file and listen to it.")
    print("2. Change VOICE to 'alloy', 'echo', 'onyx', or 'shimmer' and run again.")
    print("3. Record generation time and file size for each voice in ex1-audio-log.md.")
    print("4. Which voice fits your capstone product's tone? Why?")


if __name__ == "__main__":
    main()
