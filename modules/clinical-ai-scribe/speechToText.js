/**
 * Module 2: Clinical AI Scribe & Extraction
 * File: speechToText.js
 * 
 * AssemblyAI REST API integration for conversational doctor-patient consultations.
 */

async function uploadAudioBuffer(buffer, apiKey, baseUrl = 'https://api.assemblyai.com/v2') {
  const response = await fetch(`${baseUrl}/upload`, {
    method: 'POST',
    headers: {
      authorization: apiKey,
      'content-type': 'application/octet-stream',
    },
    body: buffer,
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    throw new Error(`AssemblyAI audio upload failed (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  return data.upload_url;
}

async function requestTranscription(uploadUrl, apiKey, baseUrl = 'https://api.assemblyai.com/v2') {
  const response = await fetch(`${baseUrl}/transcript`, {
    method: 'POST',
    headers: {
      authorization: apiKey,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      audio_url: uploadUrl,
      speech_model: 'best',
      language_detection: true,
      speaker_labels: true, // Identify doctor vs patient dialogue turns
    }),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    throw new Error(`AssemblyAI transcript initialization failed (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  return data.id;
}

async function pollTranscriptResult(transcriptId, apiKey, baseUrl = 'https://api.assemblyai.com/v2', maxAttempts = 30, delayMs = 4000) {
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const response = await fetch(`${baseUrl}/transcript/${transcriptId}`, {
      method: 'GET',
      headers: { authorization: apiKey },
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      throw new Error(`AssemblyAI polling failed (${response.status}): ${errorText}`);
    }

    const data = await response.json();

    if (data.status === 'completed') {
      return {
        text: String(data.text || '').trim(),
        confidence: data.confidence,
        wordsCount: data.words?.length || 0,
        utterances: data.utterances || [],
      };
    }

    if (data.status === 'error') {
      throw new Error(`AssemblyAI transcription error: ${data.error || 'Unknown transcription fault'}`);
    }

    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }

  throw new Error('AssemblyAI transcription timed out');
}

/**
 * End-to-end audio transcription pipeline.
 */
async function transcribeConsultationAudio(audioBuffer, apiKey, baseUrl) {
  if (!apiKey) {
    throw new Error('ASSEMBLYAI_API_KEY is required for consultation transcription');
  }
  const uploadUrl = await uploadAudioBuffer(audioBuffer, apiKey, baseUrl);
  const transcriptId = await requestTranscription(uploadUrl, apiKey, baseUrl);
  return await pollTranscriptResult(transcriptId, apiKey, baseUrl);
}

module.exports = {
  transcribeConsultationAudio,
  uploadAudioBuffer,
  requestTranscription,
  pollTranscriptResult,
};
