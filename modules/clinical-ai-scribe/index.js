/**
 * Module 2: Clinical AI Scribe & Extraction
 * Entry Point: index.js
 */

const { transcribeConsultationAudio } = require('./speechToText');
const { extractClinicalEntities, normalizeClinicalData } = require('./entityExtractor');
const { classifyConsultationSeverity, SEVERITY_LEVELS } = require('./severityTriage');

/**
 * End-to-end clinical consultation processing pipeline:
 * Audio Buffer -> AssemblyAI Transcript -> Gemini Entity Extraction -> Gemini/LangChain Severity Triage
 */
async function processConsultationAudio({
  audioBuffer,
  assemblyAiApiKey,
  assemblyAiBaseUrl,
  googleApiKey,
  geminiModel,
}) {
  // Step 1: Speech-to-Text Transcription
  const transcriptionResult = await transcribeConsultationAudio(
    audioBuffer,
    assemblyAiApiKey,
    assemblyAiBaseUrl
  );

  const transcript = transcriptionResult.text;

  // Step 2: Parallel Extraction of Entities and Triage Classification
  const [entities, triage] = await Promise.all([
    extractClinicalEntities(transcript, googleApiKey, geminiModel),
    classifyConsultationSeverity(transcript, googleApiKey, geminiModel),
  ]);

  return {
    transcript,
    confidence: transcriptionResult.confidence,
    clinicalData: entities,
    triage,
    processedAt: new Date().toISOString(),
  };
}

module.exports = {
  processConsultationAudio,
  transcribeConsultationAudio,
  extractClinicalEntities,
  normalizeClinicalData,
  classifyConsultationSeverity,
  SEVERITY_LEVELS,
};
