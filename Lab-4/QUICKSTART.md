# Lab 4 Quickstart

Get Exercise 1 running in under 5 minutes. Do this before anything else.

---

## Step 1: Confirm your environment

```bash
cd your-project-folder
python --version    # Must be 3.10+
```

If you do not have Python 3.10+, install it before proceeding.

---

## Step 2: Install the OpenAI SDK (if not already installed from Lab 3)

```bash
pip install openai
```

You should already have this from Lab 3. If `import openai` works in Python, skip this step.

---

## Step 3: Confirm your `.env` file has your OpenRouter key

```bash
cat .env
```

You should see:

```
OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

If you do not have a `.env` file, create one using the `.env.example` from Lab 1 or Lab 2.

---

## Step 4: Run the TTS starter script

```bash
cd Lab-4/examples/starter-code
python 01_hello_tts.py
```

**Expected output:**

```
Generating speech (nova voice)...
Text: 'In this course, you are learning to work alongside AI sy...'
Generated in 2.31s -- saved to audio-output/ex1_nova_1743660000.mp3
File size: 48.2 KB

--- Result ---
  output_path: audio-output/ex1_nova_1743660000.mp3
  generation_time_seconds: 2.31
  file_size_bytes: 49356
  voice: nova
  text_length_chars: 147

To play the audio:
  macOS:   open audio-output/ex1_nova_1743660000.mp3
  Linux:   xdg-open audio-output/ex1_nova_1743660000.mp3
  Windows: start audio-output/ex1_nova_1743660000.mp3
```

---

## Step 5: Listen to the audio

Open the generated MP3 file using the command shown in the output. You should hear a synthesized voice reading the text.

---

## What if it does not work?

**Error: `AuthenticationError`**
Your OpenRouter API key is missing or incorrect. Check your `.env` file. Make sure there are no extra spaces around the key.

**Error: `ModuleNotFoundError: No module named 'openai'`**
Run `pip install openai` again. Make sure you are in the correct Python environment.

**Error: `No module named 'dotenv'`**
Run `pip install python-dotenv`.

**Error: Permission denied when creating audio-output directory**
Run `mkdir audio-output` manually in the starter-code directory.

**No sound when playing the file**
Check your system volume. Try opening the file directly in a media player rather than from the terminal. The file format is MP3, which all modern systems can play.

---

*Once the script runs and you hear audio, return to README.md and proceed through the exercises.*
