# Data Governance Checklist for Audio Features

**Course:** CS-AI-2025 -- Building AI-Powered Applications | Spring 2026
**Purpose:** Use this checklist when evaluating whether your audio feature meets responsible data handling standards. Reference this when writing your HW2 reflection.

---

## 1. Consent and Transparency

- [ ] Users are informed that audio is being recorded or processed BEFORE recording begins
- [ ] The purpose of audio processing is clearly stated (transcription, analysis, storage, etc.)
- [ ] Users can opt out of audio features and still use the core product
- [ ] Consent language is in plain, non-technical terms
- [ ] Users know whether their audio is sent to a third-party API (OpenAI, Google, etc.)
- [ ] Users can withdraw consent after the fact and have their audio deleted

---

## 2. Data Retention

- [ ] Audio files are deleted after processing unless there is a documented reason to retain them
- [ ] Retention period is defined and enforced (e.g., "delete after transcription" or "retain for 30 days")
- [ ] Transcripts are stored separately from audio (text is less sensitive than raw audio)
- [ ] Temporary files created during processing are cleaned up automatically
- [ ] Users can request deletion of their audio data at any time

---

## 3. PII and Sensitive Data

- [ ] Audio is checked for inadvertent PII (names, addresses, phone numbers spoken aloud)
- [ ] Voice biometric data (voiceprint) is not stored or used for identification
- [ ] Background audio is not analyzed or retained (conversations, ambient sounds)
- [ ] Metadata (recording time, device, location if embedded in file) is stripped before storage
- [ ] Emotional state inference from voice (tone, stress, pace) is not performed without explicit consent

---

## 4. Security

- [ ] Audio files are encrypted at rest if stored
- [ ] Audio is transmitted over HTTPS/TLS to the API provider
- [ ] API keys are not embedded in client-side code or audio files
- [ ] Access to stored audio is restricted to authorized processes only
- [ ] Audit logs track who accessed audio data and when

---

## 5. Third-Party API Considerations

- [ ] You have reviewed the API provider's data retention policy
- [ ] You know whether the provider uses your audio data for model training
- [ ] You have a plan if the API provider changes their privacy policy
- [ ] Your application's privacy policy mentions the third-party audio processing

**OpenAI (Whisper/TTS) data policy notes:**
- OpenAI states that API inputs are not used for model training (as of March 2026)
- Audio sent via API is processed and not retained beyond the request
- Verify the current policy at: https://openai.com/policies/api-data-usage-policies

---

## 6. Regulatory Compliance

- [ ] GDPR: Audio is personal data under GDPR. Lawful basis for processing is documented
- [ ] Biometric data: Voice data may qualify as biometric data in some jurisdictions (e.g., Illinois BIPA)
- [ ] Recording consent: Two-party consent laws may apply if recording conversations
- [ ] Cross-border data transfer: Audio sent to US-based APIs from Georgia crosses borders
- [ ] Data minimization: Only the minimum necessary audio is collected and processed

---

## Quick Self-Test

For your HW2 pipeline specifically:

1. Does your script delete the MP3 file after transcription? If not, should it?
2. If a user's name was spoken in the audio, would your pipeline detect and handle that?
3. Where does the audio go when you send it to OpenRouter/OpenAI? Do you know?
4. If you stored 1000 user audio files, how would you handle a deletion request?

---

*Use this checklist as a reference when writing your reflection.md for HW2.*
