# Module 2: Clinical AI Scribe & Extraction
> Feature 2 from [TECHNOLOGY_SURVEY.md](../../TECHNOLOGY_SURVEY.md)

## Purpose & Architecture
Converts raw doctor-patient consultation audio recordings into structured electronic health records:
1. **Speech-to-Text (STT):** Powered by **AssemblyAI REST API** with automatic language detection, `speech_model: 'best'`, and speaker diarization.
2. **Clinical Entity Extraction:** Utilizes **Google Gemini (gemini-2.5-flash)** at temperature `0.1` with a strict JSON schema parser to extract:
   - Symptoms & Diagnoses
   - Prescription items (Medicine, Dosage, Frequency, Duration, Instructions)
   - Objective Vitals (Blood Pressure, Pulse, SpO2, Temperature)
   - Lifestyle Advice, Recommended Tests & Follow-Up Plan
3. **Severity Triaging:** 4-tier triage classification (`Low`, `Medium`, `High`, `Critical`) inspired by clinical emergency room triaging.
