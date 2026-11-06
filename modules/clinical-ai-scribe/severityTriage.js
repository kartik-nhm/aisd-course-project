/**
 * Module 2: Clinical AI Scribe & Extraction
 * File: severityTriage.js
 * 
 * 4-Level Medical Severity Triaging Engine
 * Categorizes cases into: Low, Medium, High, Critical
 */

const SEVERITY_LEVELS = {
  LOW: 'Low',           // Minor ailments (cold, mild headache, simple abrasions)
  MEDIUM: 'Medium',     // Non-urgent conditions (rashes, controlled chronic issues, moderate aches)
  HIGH: 'High',         // Urgent conditions requiring prompt attention (high fever with confusion, suspected fractures, persistent vomiting)
  CRITICAL: 'Critical', // Life-threatening emergencies (chest pain radiating to arm, stroke signs, severe hemorrhage, respiratory arrest)
};

const TRIAGE_PROMPT = `
You are a clinical triage decision system. Categorize the severity of this medical consultation into EXACTLY ONE of four levels:
- "Low": Minor ailments that are not urgent (e.g. common cold, mild fatigue, mild seasonal allergies).
- "Medium": Non-urgent conditions requiring routine doctor attention (e.g. skin rash, controlled hypertension review, mild sprain).
- "High": Urgent conditions requiring prompt intervention to avoid significant decline (e.g. high fever >=103F with disorientation, severe dehydration, suspected deep vein thrombosis).
- "Critical": Life-threatening medical emergencies needing immediate hospital emergency room intervention (e.g. acute chest pain, facial drooping/stroke signs, severe anaphylaxis, cyanosis/unresponsive).

Rules:
1. Err on the side of caution. Only classify as 'High' or 'Critical' if clear indicators exist.
2. Return ONLY a single JSON object in this format:
{"severity": "Low" | "Medium" | "High" | "Critical", "rationale": "One sentence clinical reasoning", "recommendedUrgencyHours": number}
`;

function parseTriageJson(text) {
  const raw = String(text || '').trim();
  const start = raw.indexOf('{');
  const end = raw.lastIndexOf('}');
  if (start < 0 || end <= start) {
    return { severity: SEVERITY_LEVELS.MEDIUM, rationale: 'Standard clinical evaluation', recommendedUrgencyHours: 24 };
  }
  try {
    return JSON.parse(raw.slice(start, end + 1));
  } catch (_e) {
    return { severity: SEVERITY_LEVELS.MEDIUM, rationale: 'Parsing fallback', recommendedUrgencyHours: 24 };
  }
}

async function classifyConsultationSeverity(transcript, apiKey, model = 'gemini-2.5-flash') {
  if (!apiKey) {
    return { severity: SEVERITY_LEVELS.MEDIUM, rationale: 'API key omitted; defaulted to routine review', recommendedUrgencyHours: 24 };
  }

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const payload = {
    contents: [
      {
        parts: [
          { text: TRIAGE_PROMPT },
          { text: `CONSULTATION DATA:\n${transcript}` },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.1,
    },
  };

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      return { severity: SEVERITY_LEVELS.MEDIUM, rationale: 'Evaluation service fallback', recommendedUrgencyHours: 24 };
    }

    const data = await response.json();
    const raw = data?.candidates?.[0]?.content?.parts?.map((p) => p.text || '').join('') || '';
    const parsed = parseTriageJson(raw);

    const validSeverity = Object.values(SEVERITY_LEVELS).includes(parsed.severity)
      ? parsed.severity
      : SEVERITY_LEVELS.MEDIUM;

    return {
      severity: validSeverity,
      rationale: parsed.rationale || 'Clinical review completed',
      recommendedUrgencyHours: parsed.recommendedUrgencyHours || (validSeverity === 'Critical' ? 1 : validSeverity === 'High' ? 4 : 24),
    };
  } catch (err) {
    console.error('[SeverityTriage] Error classifying consultation:', err.message);
    return { severity: SEVERITY_LEVELS.MEDIUM, rationale: 'Network fallback', recommendedUrgencyHours: 24 };
  }
}

module.exports = {
  classifyConsultationSeverity,
  SEVERITY_LEVELS,
};
