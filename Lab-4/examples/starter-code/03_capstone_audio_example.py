"""
Lab 4 -- Reference: Capstone Audio Integration Example
CS-AI-2025 Spring 2026, Kutaisi International University

This is a REFERENCE EXAMPLE -- not a script to run as-is.
It shows how a team might integrate TTS and STT into a capstone product.

The example is a "study assistant" that:
  1. Takes a text passage as input
  2. Generates an audio version for listening (TTS)
  3. Records the student reading it back (STT)
  4. Compares the original text to the student's spoken version
  5. Tracks cost and latency for every API call

Your capstone integration will be different. Use this as a structural
reference for how to wire audio into a larger application, not as code
to copy directly.
"""

import os
import time
import json
from pathlib import Path
from datetime import datetime
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()

client = OpenAI(
    api_key=os.getenv("OPENROUTER_API_KEY"),
    base_url="https://openrouter.ai/api/v1",
)

OUTPUT_DIR = Path("audio-output")
OUTPUT_DIR.mkdir(exist_ok=True)

LOG_FILE = Path("audio-cost-log.jsonl")


# ── Cost Logging ──────────────────────────────────────────────────────────

def log_api_call(call_type: str, model: str, duration_seconds: float,
                 input_size: str, cost_estimate: float, metadata: dict = None):
    """
    Append a structured log entry for every audio API call.
    This is critical for cost tracking and debugging.
    """
    entry = {
        "timestamp": datetime.now().isoformat(),
        "call_type": call_type,        # "tts" or "stt"
        "model": model,
        "duration_seconds": duration_seconds,
        "input_size": input_size,
        "cost_estimate_usd": cost_estimate,
        "metadata": metadata or {},
    }
    with open(LOG_FILE, "a") as f:
        f.write(json.dumps(entry) + "\n")
    return entry


# ── TTS Integration ──────────────────────────────────────────────────────

def generate_audio_lesson(text: str, voice: str = "nova") -> dict:
    """
    Generate an audio version of a study passage.

    In a real product, this would be called when a student clicks
    "Listen to this passage" in the UI.
    """
    filename = f"lesson_{int(time.time())}.mp3"
    output_path = OUTPUT_DIR / filename

    start = time.time()
    try:
        response = client.audio.speech.create(
            model="tts-1",
            voice=voice,
            input=text,
            response_format="mp3",
        )
        response.stream_to_file(str(output_path))
        elapsed = round(time.time() - start, 2)

        cost = (len(text) / 1000) * 0.015  # $0.015 per 1k chars

        log_api_call(
            call_type="tts",
            model="tts-1",
            duration_seconds=elapsed,
            input_size=f"{len(text)} chars",
            cost_estimate=cost,
            metadata={"voice": voice, "output_file": filename},
        )

        return {
            "success": True,
            "audio_path": str(output_path),
            "generation_time": elapsed,
            "cost_estimate": cost,
        }

    except Exception as e:
        elapsed = round(time.time() - start, 2)
        log_api_call(
            call_type="tts",
            model="tts-1",
            duration_seconds=elapsed,
            input_size=f"{len(text)} chars",
            cost_estimate=0.0,
            metadata={"error": str(e)},
        )
        return {
            "success": False,
            "error": str(e),
            "generation_time": elapsed,
        }


# ── STT Integration ──────────────────────────────────────────────────────

def transcribe_student_reading(audio_path: str) -> dict:
    """
    Transcribe a student's spoken reading of a passage.

    In a real product, this would be called after the student
    records themselves reading the passage aloud.
    """
    path = Path(audio_path)
    if not path.exists():
        return {"success": False, "error": f"File not found: {audio_path}"}

    start = time.time()
    try:
        with open(path, "rb") as audio_file:
            transcript = client.audio.transcriptions.create(
                model="whisper-1",
                file=audio_file,
                response_format="verbose_json",
            )
        elapsed = round(time.time() - start, 2)

        duration_min = getattr(transcript, "duration", 0) / 60
        cost = duration_min * 0.006  # $0.006 per minute

        log_api_call(
            call_type="stt",
            model="whisper-1",
            duration_seconds=elapsed,
            input_size=f"{path.stat().st_size / 1024:.1f} KB",
            cost_estimate=cost,
            metadata={
                "audio_duration_seconds": getattr(transcript, "duration", None),
                "language": getattr(transcript, "language", "unknown"),
            },
        )

        return {
            "success": True,
            "text": transcript.text,
            "language": getattr(transcript, "language", "unknown"),
            "transcription_time": elapsed,
            "cost_estimate": cost,
        }

    except Exception as e:
        elapsed = round(time.time() - start, 2)
        log_api_call(
            call_type="stt",
            model="whisper-1",
            duration_seconds=elapsed,
            input_size=f"{path.stat().st_size / 1024:.1f} KB",
            cost_estimate=0.0,
            metadata={"error": str(e)},
        )
        return {"success": False, "error": str(e)}


# ── Comparison ────────────────────────────────────────────────────────────

def compare_texts(original: str, transcribed: str) -> dict:
    """
    Compare original text to transcribed version.
    Simple word-level comparison. A production system would use
    more sophisticated NLP-based comparison (edit distance, semantic
    similarity, etc.).
    """
    original_words = original.lower().split()
    transcribed_words = transcribed.lower().split()

    # Simple word overlap metric
    original_set = set(original_words)
    transcribed_set = set(transcribed_words)
    overlap = original_set & transcribed_set
    accuracy = len(overlap) / len(original_set) if original_set else 0

    missing = original_set - transcribed_set
    extra = transcribed_set - original_set

    return {
        "word_overlap_accuracy": round(accuracy * 100, 1),
        "original_word_count": len(original_words),
        "transcribed_word_count": len(transcribed_words),
        "missing_words": sorted(missing)[:10],  # Limit output
        "extra_words": sorted(extra)[:10],
    }


# ── Full Pipeline Demo ───────────────────────────────────────────────────

def demo_study_assistant():
    """
    Demonstrate the full pipeline:
      text -> TTS -> audio file -> STT -> transcript -> comparison
    """
    passage = (
        "Machine learning models learn patterns from data. "
        "They generalize from training examples to make predictions "
        "on new, unseen inputs. The quality of the training data "
        "directly determines the quality of the model's predictions."
    )

    print("=" * 60)
    print("STUDY ASSISTANT DEMO")
    print("=" * 60)

    # Step 1: Generate audio lesson
    print("\n[Step 1] Generating audio from text...")
    tts_result = generate_audio_lesson(passage, voice="nova")
    if not tts_result["success"]:
        print(f"TTS failed: {tts_result['error']}")
        return
    print(f"  Audio saved: {tts_result['audio_path']}")
    print(f"  Generation time: {tts_result['generation_time']}s")
    print(f"  Cost: ${tts_result['cost_estimate']:.4f}")

    # Step 2: Transcribe the generated audio (simulating student reading)
    print("\n[Step 2] Transcribing audio back to text...")
    stt_result = transcribe_student_reading(tts_result["audio_path"])
    if not stt_result["success"]:
        print(f"STT failed: {stt_result['error']}")
        return
    print(f"  Transcript: {stt_result['text'][:80]}...")
    print(f"  Transcription time: {stt_result['transcription_time']}s")
    print(f"  Cost: ${stt_result['cost_estimate']:.4f}")

    # Step 3: Compare
    print("\n[Step 3] Comparing original vs transcribed...")
    comparison = compare_texts(passage, stt_result["text"])
    print(f"  Word overlap accuracy: {comparison['word_overlap_accuracy']}%")
    print(f"  Original words: {comparison['original_word_count']}")
    print(f"  Transcribed words: {comparison['transcribed_word_count']}")
    if comparison["missing_words"]:
        print(f"  Missing words: {', '.join(comparison['missing_words'][:5])}")
    if comparison["extra_words"]:
        print(f"  Extra words: {', '.join(comparison['extra_words'][:5])}")

    # Step 4: Cost summary
    total_cost = tts_result["cost_estimate"] + stt_result["cost_estimate"]
    total_time = tts_result["generation_time"] + stt_result["transcription_time"]
    print(f"\n--- Pipeline Summary ---")
    print(f"  Total cost: ${total_cost:.4f}")
    print(f"  Total latency: {total_time:.2f}s")
    print(f"  Cost log: {LOG_FILE}")

    print(f"\n--- What This Means for Your Capstone ---")
    print(f"  If your product processes 100 passages/day:")
    print(f"    Daily cost: ~${total_cost * 100:.2f}")
    print(f"    Monthly cost: ~${total_cost * 100 * 30:.2f}")
    print(f"  Factor this into your token usage plan.")


if __name__ == "__main__":
    demo_study_assistant()
