/**
 * Multilingual Medical AI Chatbot & Regional Query Surveillance Routes
 * Connects Module 4 (Multilingual RAG Chatbot) & Module 5 (Regional Pharmacy Alerts)
 */

const express = require('express');
const ChatQueryLog = require('../models/ChatQueryLog');
const PharmacyAlert = require('../models/PharmacyAlert');
const { env } = require('../config/env');
const { detectSurges, processAndDispatchAlerts, normalizeCondition } = require('../../../../modules/pharmacy-alerts');

const router = express.Router();

// Helper to access the global stompBroker
function getStompBroker(req) {
  return req.app.get('stompBroker');
}

/**
 * Vernacular language and script detection heuristic
 */
function detectLanguageAndScript(text) {
  const lower = String(text || '').toLowerCase();

  // Romanized Hindi / Hinglish cues
  const hindiKeywords = ['mujhe', 'humko', 'bukhar', 'jwar', 'sar dard', 'dard', 'gale', 'khansi', 'dawa', 'dawakhana', 'din se', 'tez', 'chhatii', 'pet'];
  const hasHindiWord = hindiKeywords.some((w) => lower.includes(w));

  // Romanized Kannada cues
  const kannadaKeywords = ['nange', 'nanage', 'jwara', 'kemmu', 'tale novu', 'mai novu', 'ide', 'agide', 'tumba', 'othu'];
  const hasKannadaWord = kannadaKeywords.some((w) => lower.includes(w));

  if (hasKannadaWord) {
    return { language: 'Romanized Kannada (Kanglish)', script: 'Latin', isVernacular: true };
  }
  if (hasHindiWord) {
    return { language: 'Romanized Hindi (Hinglish)', script: 'Latin', isVernacular: true };
  }
  return { language: 'English', script: 'Latin', isVernacular: false };
}

/**
 * Extracts 6-digit Indian postal pincode from message or headers
 */
function extractPincode(text, fallback = '560001') {
  const match = String(text || '').match(/\b[1-9][0-9]{5}\b/);
  return match ? match[0] : fallback;
}

/**
 * Knowledge Base Advice Catalog
 */
const CLINICAL_KNOWLEDGE_BASE = {
  fever: {
    en: {
      summary: 'Fever is commonly an immune reaction to viral or bacterial infection.',
      homeCare: ['Stay hydrated with warm fluids and ORS.', 'Rest in a well-ventilated room.', 'Tepid sponging if temperature exceeds 101°F.'],
      otcMedicines: ['Paracetamol 500mg/650mg every 6-8 hours as needed (avoid overdose).'],
      redFlags: ['Persistent high fever (>102°F) for over 3 days.', 'Difficulty breathing, chest pain, or confusion.', 'Stiff neck or persistent vomiting.'],
    },
    hi: {
      summary: 'Bukhar aam taur par viral ya bacterial infection ke khilaf sharir ki pratikriya hai.',
      homeCare: ['Khub paani aur ORS ghol piyein.', 'Puri tarah aaram karein.', 'Agar bukhar 101°F se zyada ho toh maathe par taaze paani ki patti rakhein.'],
      otcMedicines: ['Paracetamol 650mg khana khane ke baad le sakte hain (din mein 3 baar se zyada na lein).'],
      redFlags: ['3 din se zyada tez bukhar rehna.', 'Saans lene mein takleef ya chhati mein dard.', 'Gardan mein akad ya lagatar ultiyan.'],
    },
    kn: {
      summary: 'Jwara samanyavagi viral athava bacterial sankramana viruddha shareerada pratikriye.',
      homeCare: ['Hecchu neeru mattu ORS kudi.', 'Sampurna vishranti thagolli.', 'Jwara 101°F meeliddare thannane neerina batte hani hani hidi.'],
      otcMedicines: ['Oota adamele Paracetamol 650mg thegedukollabahudu.'],
      redFlags: ['3 dinakkinta hechhu kalathana jwara.', 'Usiraatadalli tondare athava edeyalli novu.', 'Koralu bigiyuvudu athava sarata vanti.'],
    },
  },
  dengue: {
    en: {
      summary: 'Dengue is a mosquito-borne viral illness causing high fever, severe retro-orbital headache, joint pains, and potential platelet drop.',
      homeCare: ['Intense hydration with electrolyte solutions, coconut water, and soups.', 'Monitor platelet counts daily.', 'Strict bed rest.'],
      otcMedicines: ['Paracetamol only. Do NOT take Aspirin or Ibuprofen as they increase bleeding risks.'],
      redFlags: ['Spontaneous bleeding from gums/nose or red petechial spots on skin.', 'Severe abdominal pain or persistent vomiting.', 'Extreme lethargy or sudden drop in blood pressure.'],
    },
    hi: {
      summary: 'Dengue macchar ke kaatne se hone wala viral rog hai jismein tez bukhar, aankhon ke pichhe dard aur platelets girte hain.',
      homeCare: ['Kaccha nariyal paani, ORS aur soup khoob piyein.', 'Platelet count ki niyamit jaanch karwayein.', 'Pura aaram karein.'],
      otcMedicines: ['Sirf Paracetamol lein. Aspirin ya Ibuprofen bilkul na lein kyunki ye bleeding badha sakti hain.'],
      redFlags: ['Masoodon ya naak se khoon aana.', 'Pet mein tez dard ya lagatar ulti.', 'Achanak bohot zyada kamzori aana.'],
    },
    kn: {
      summary: 'Dengue sollina kachuvikayinda baruva rogavagiddu, theevra jwara mattu platelet ilikege karana aguttade.',
      homeCare: ['Yelaneeru, ORS mattu hutta rasavannu kudi.', 'Dinavoo platelet count check madi.', 'Purna vishranti thagolli.'],
      otcMedicines: ['Kevala Paracetamol thegedukolli. Ibuprofen athava Aspirin beedave beeda.'],
      redFlags: ['Mugina athava hidigalinda raktha sravavaguvudu.', 'Hotteyalli theevra novu.', 'Achanakkagi ashaktate.'],
    },
  },
};

const STATUTORY_DISCLAIMER =
  '⚠️ MANDATORY MEDICAL DISCLAIMER: This assistant is an AI clinical support tool and does not provide an official medical diagnosis. Please consult a licensed physician or visit an emergency facility if you experience severe symptoms.';

/**
 * POST /api/chat/message
 * Handles patient queries, provides localized care responses, logs to ChatQueryLog,
 * and triggers proactive pharmacy surge surveillance.
 */
router.post('/message', async (req, res) => {
  try {
    const { message, pincode: clientPincode, userId = 'patient-web', language: forcedLang } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Message cannot be empty' });
    }

    const { language: detectedLang, script: detectedScript, isVernacular } = detectLanguageAndScript(message);
    const activeLang = forcedLang || detectedLang;
    const pincode = clientPincode || extractPincode(message, '560001');
    const condition = normalizeCondition(message);

    // Select matching clinical advice
    const kbKey = CLINICAL_KNOWLEDGE_BASE[condition] ? condition : 'fever';
    const langKey = activeLang.includes('Hindi') ? 'hi' : activeLang.includes('Kannada') ? 'kn' : 'en';
    const entry = CLINICAL_KNOWLEDGE_BASE[kbKey][langKey] || CLINICAL_KNOWLEDGE_BASE[kbKey]['en'];

    // Assemble rich formatted reply
    let replyText = `**${entry.summary}**\n\n`;
    replyText += `**Care Guidance & Home Remedies:**\n`;
    entry.homeCare.forEach((item) => {
      replyText += `• ${item}\n`;
    });
    replyText += `\n**Recommended Over-The-Counter Options:**\n`;
    entry.otcMedicines.forEach((item) => {
      replyText += `• ${item}\n`;
    });
    replyText += `\n**🚨 Red Flag Warning Signs (Seek Immediate Medical Care):**\n`;
    entry.redFlags.forEach((item) => {
      replyText += `• ${item}\n`;
    });
    replyText += `\n\n_${STATUTORY_DISCLAIMER}_`;

    // Asynchronously log query to ChatQueryLog for regional surveillance
    await ChatQueryLog.create({
      queryText: message.trim(),
      detectedCondition: condition,
      pincode: String(pincode).trim(),
      detectedLanguage: activeLang,
      isVernacular,
      userId,
      createdAt: new Date(),
    });

    // Run rapid surge detection
    const alerts = await detectSurges({
      ChatQueryLog,
      threshold: env.PHARMACY_SURGE_THRESHOLD || 5,
      windowHours: env.PHARMACY_SURGE_WINDOW_HOURS || 24,
    });

    const matchingAlert = alerts.find((a) => a.pincode === String(pincode).trim() && a.condition === condition);
    let surgeAlertCreated = false;
    let alertDetails = null;

    if (matchingAlert) {
      surgeAlertCreated = true;
      alertDetails = matchingAlert;

      // Broadcast alert over STOMP WebSocket
      const stompBroker = getStompBroker(req);
      if (stompBroker) {
        try {
          const payload = JSON.stringify({
            type: 'SURGE_ALERT',
            pincode: matchingAlert.pincode,
            condition: matchingAlert.condition,
            queryCount: matchingAlert.queryCount,
            threshold: matchingAlert.threshold,
            severity: matchingAlert.severity,
            recommendedMedicines: matchingAlert.recommendedMedicines,
            timestamp: new Date().toISOString(),
          });
          if (typeof stompBroker.broadcastToTopic === 'function') {
            stompBroker.broadcastToTopic(`/topic/pharmacy/alerts/${matchingAlert.pincode}`, payload);
            stompBroker.broadcastToTopic('/topic/pharmacy/alerts', payload);
          } else if (typeof stompBroker.broadcast === 'function') {
            stompBroker.broadcast(`/topic/pharmacy/alerts/${matchingAlert.pincode}`, payload);
            stompBroker.broadcast('/topic/pharmacy/alerts', payload);
          }
        } catch (wsErr) {
          console.warn('[ChatRoute] WebSocket broadcast warning:', wsErr.message);
        }
      }

      // Record alert in PharmacyAlert collection
      await PharmacyAlert.create({
        alertId: `alert-${Date.now()}-${matchingAlert.pincode}`,
        pincode: matchingAlert.pincode,
        condition: matchingAlert.condition,
        queryCount: matchingAlert.queryCount,
        threshold: matchingAlert.threshold,
        severity: matchingAlert.severity,
        recommendedMedicines: matchingAlert.recommendedMedicines,
        status: 'ACTIVE',
        createdAt: new Date(),
      });
    }

    return res.json({
      success: true,
      answer: replyText,
      detected_language: activeLang,
      detected_script: detectedScript,
      isVernacular,
      detected_condition: condition,
      pincode: String(pincode).trim(),
      surgeAlertCreated,
      alertDetails,
    });
  } catch (error) {
    console.error('[ChatRoute] error:', error);
    return res.status(500).json({ error: error.message });
  }
});

module.exports = router;
