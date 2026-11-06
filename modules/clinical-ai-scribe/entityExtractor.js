/**
 * Module 2: Clinical AI Scribe & Extraction
 * File: entityExtractor.js
 * 
 * Google Gemini API integration configured with strict JSON schema to extract
 * clinical entities from doctor-patient conversation transcripts.
 */

const CLINICAL_PROMPT = `
You are an expert clinical AI medical scribe. Analyze the following doctor-patient consultation transcript with precision.
Extract ONLY explicit medical findings discussed in the dialogue.

Return ONLY a valid, single-line JSON object adhering to this EXACT schema:
{
  "symptoms": ["string"],
  "diagnosis": ["string"],
  "prescription": [
    {
      "medicine": "string",
      "dosage": "string",
      "frequency": "string",
      "duration": "string",
      "instructions": "string"
    }
  ],
  "vitals": {
    "bloodPressure": "string",
    "pulse": "string",
    "temperature": "string",
    "spo2": "string"
  },
  "lifestyle_advice": ["string"],
  "tests_recommended": ["string"],
  "follow_up_plan": ["string"]
}

Rules:
1. Do not invent or hallucinate facts not mentioned in the transcript.
2. If any field or category was not discussed, provide an empty array [] or empty string "".
3. Return raw JSON only, with no Markdown ticks (\`\`\`json) and no conversational preamble.
`;

function extractJson(rawText) {
  const text = String(rawText || '').trim();
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start < 0 || end <= start) {
    throw new Error('Gemini output does not contain a valid JSON object');
  }
  return text.slice(start, end + 1);
}

function normalizeClinicalData(raw) {
  const safeArray = (arr) => (Array.isArray(arr) ? arr.map((item) => (typeof item === 'object' ? item : String(item).trim())) : []);
  const safeString = (val) => String(val || '').trim();

  return {
    symptoms: safeArray(raw?.symptoms),
    diagnosis: safeArray(raw?.diagnosis),
    prescription: Array.isArray(raw?.prescription)
      ? raw.prescription.map((rx) => {
          if (typeof rx === 'string') return { medicine: rx, dosage: '', frequency: '', duration: '', instructions: '' };
          return {
            medicine: safeString(rx?.medicine),
            dosage: safeString(rx?.dosage),
            frequency: safeString(rx?.frequency),
            duration: safeString(rx?.duration),
            instructions: safeString(rx?.instructions),
          };
        })
      : [],
    vitals: {
      bloodPressure: safeString(raw?.vitals?.bloodPressure),
      pulse: safeString(raw?.vitals?.pulse),
      temperature: safeString(raw?.vitals?.temperature),
      spo2: safeString(raw?.vitals?.spo2),
    },
    lifestyle_advice: safeArray(raw?.lifestyle_advice),
    tests_recommended: safeArray(raw?.tests_recommended),
    follow_up_plan: safeArray(raw?.follow_up_plan),
  };
}

async function extractClinicalEntities(transcript, apiKey, model = 'gemini-2.5-flash') {
  if (!apiKey) {
    throw new Error('GOOGLE_API_KEY is required for clinical entity extraction');
  }

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const payload = {
    contents: [
      {
        parts: [
          { text: CLINICAL_PROMPT },
          { text: `TRANSCRIPT:\n${transcript}` },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.1, // High precision, minimal hallucination
      topP: 0.8,
    },
  };

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => '');
    throw new Error(`Google Gemini API error (${response.status}): ${errorBody}`);
  }

  const data = await response.json();
  const rawText = data?.candidates?.[0]?.content?.parts?.map((p) => p.text || '').join('') || '';

  if (!rawText.trim()) {
    throw new Error('Google Gemini returned an empty response for transcript extraction');
  }

  const jsonStr = extractJson(rawText);
  const parsed = JSON.parse(jsonStr);

  return normalizeClinicalData(parsed);
}

module.exports = {
  extractClinicalEntities,
  extractJson,
  normalizeClinicalData,
};
