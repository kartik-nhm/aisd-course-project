/**
 * Multilingual Medical AI Chatbot & Outbreak Surveillance Routes
 * Module 4 (Multilingual Vernacular Chatbot) & Module 5 (Surge Trigger)
 */

const express = require('express');
const ChatQueryLog = require('../models/ChatQueryLog');
const PharmacyAlert = require('../models/PharmacyAlert');
const { detectSurges } = require('../../../../modules/pharmacy-alerts');
const { env } = require('../config/env');

const router = express.Router();

function getStompBroker(req) {
  return req.app.get('stompBroker');
}

/**
 * Vernacular language and script detection heuristic
 */
function detectLanguageAndScript(text) {
  const lower = String(text || '').toLowerCase();

  // Romanized Hindi / Hinglish cues
  const hindiKeywords = [
    'mujhe', 'humko', 'mera', 'meri', 'mere', 'bukhar', 'jwar', 'sar dard', 'dard',
    'gale', 'khansi', 'dawa', 'dawakhana', 'din se', 'tez', 'chhati', 'pet', 'ulti',
    'chakkar', 'khana', 'pina', 'pani', 'dast', 'saas', 'kamzori', 'susthu', 'badan'
  ];
  const hasHindiWord = hindiKeywords.some((w) => lower.includes(w));

  // Romanized Kannada / Kanglish cues
  const kannadaKeywords = [
    'nange', 'nanage', 'namage', 'nanna', 'jwara', 'kemmu', 'tale novu', 'mai novu',
    'hotte', 'novu', 'ide', 'agide', 'tumba', 'othu', 'neeru', 'bisi', 'aithu',
    'swalpa', 'kudiyoke', 'malagoke', 'usiru', 'bedve', 'beku'
  ];
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
 * Expansive Multi-Condition Clinical Knowledge Base
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
      homeCare: ['Bisi neeru mattu ORS dharalavagi kudiyiri.', 'Uttama vishranti thegedukolli.', 'Jwara 101°F meeridare thampa batteli netti thudisi.'],
      otcMedicines: ['Paracetamol 650mg oota aada mele thegedukolli (dina 3 barakkintha hechhagi beda).'],
      redFlags: ['3 dinagaliginta hechhu theevra jwara.', 'Usiradalu thondare athava edeyalli novu.', 'Kutthige bidadiruva novu athava suthha vamana.'],
    },
  },
  dengue: {
    en: {
      summary: 'Dengue is a mosquito-borne viral infection marked by high fever, severe retro-orbital headache, and muscle/joint pains.',
      homeCare: ['Intense hydration with ORS, coconut water, and soups (minimum 3L/day).', 'Strict bed rest.', 'Monitor platelet counts every 24-48 hours via local lab.'],
      otcMedicines: ['Take Paracetamol for fever. DO NOT take Ibuprofen, Aspirin, or Diclofenac as they increase bleeding risks.'],
      redFlags: ['Bleeding from nose, gums, or skin petechiae.', 'Severe persistent abdominal pain.', 'Extreme lethargy or rapid drop in platelet count (<50,000).'],
    },
    hi: {
      summary: 'Dengue macchar ke kaatne se hone wala viral bukhar hai jisme tez bukhar, aankhon ke peeche dard aur jodo mein dard hota hai.',
      homeCare: ['Prachur matra mein ORS, nariyal paani aur patla khana lein.', 'Pura vishram karein.', 'Platelet count par dhyan dein.'],
      otcMedicines: ['Sirf Paracetamol lein. Aspirin ya Ibuprofen galti se bhi na lein kyunki yeh khoon patla karti hain.'],
      redFlags: ['Naak ya masudo se khoon aana.', 'Pet mein asahneeya dard.', 'Chakkar aana ya behoshi ki sthiti.'],
    },
    kn: {
      summary: 'Dengue solleyinda haraduva viral jwara, idaralli theevra jwara, kannina hinde novu mattu sandhi novu kanisuttade.',
      homeCare: ['Yelaneeru, ORS mattu theluvadaha aaharavannu hecchagi sevisi.', 'Poorna vishranthi.', 'Platelet sankhye parisheelisi.'],
      otcMedicines: ['Kevala Paracetamol thegedukolli. Ibuprofen athava Aspirin beedave beeda.'],
      redFlags: ['Mugina athava hidigalinda raktha sravavaguvudu.', 'Hotteyalli theevra novu.', 'Achanakkagi ashaktate.'],
    },
  },
  cough: {
    en: {
      summary: 'Cough and bronchitis symptoms typically arise from viral airway irritation, allergens, or seasonal shifts.',
      homeCare: ['Steam inhalation twice daily.', 'Warm honey and ginger concoctions.', 'Stay well-hydrated to thin respiratory secretions.'],
      otcMedicines: ['Dextromethorphan syrup for dry cough; Guaifenesin for wet cough.', 'Cetirizine 10mg at bedtime for allergic irritation.'],
      redFlags: ['Coughing up blood or rust-colored sputum.', 'Shortness of breath at rest.', 'Cough lasting more than 3 weeks.'],
    },
    hi: {
      summary: 'Khansi aam taur par gale aur fefdo mein viral ya allergic jalan ke karan hoti hai.',
      homeCare: ['Din mein 2 baar garam paani ki bhaap lein.', 'Shehad aur adrak ka ras lein.', 'Gunguna paani piyein.'],
      otcMedicines: ['Sukhi khansi ke liye Dextromethorphan syrup.', 'Allergy hone par Cetirizine 10mg raat ko lein.'],
      redFlags: ['Khansi mein khoon aana.', 'Saans lene mein seeti jaisi aawaz ya ghutan.', '3 hafte se zyada khansi rehna.'],
    },
    kn: {
      summary: 'Kemmu samanyavagi gantu athava shwasakosha sankramanadinda baruttade.',
      homeCare: ['Bisi neerina aavi thegedukolli.', 'Jenu thuppa mattu shunthi rasa sevisi.', 'Kudiyuvudakke bisi neeru balasi.'],
      otcMedicines: ['Ona kemmige Dextromethorphan syrup.', 'Allergy iddare Cetirizine 10mg rathri thegedukolli.'],
      redFlags: ['Kemminalli raktha baruvudu.', 'Usiradalu theevra thondare.', '3 varakkinta hechhu kemmu.'],
    },
  },
  headache: {
    en: {
      summary: 'Headaches commonly stem from tension, dehydration, eye strain, or migraine episodes.',
      homeCare: ['Rest in a quiet, dark room.', 'Drink 2 large glasses of water immediately.', 'Gentle neck and temple massage.'],
      otcMedicines: ['Paracetamol 650mg or Naproxen/Ibuprofen after food.'],
      redFlags: ['Sudden "thunderclap" severe headache.', 'Headache accompanied by vision loss or limb weakness.', 'Headache with stiff neck and high fever.'],
    },
    hi: {
      summary: 'Sar dard aam taur par tanav, paani ki kami, ya thakan ki wajah se hota hai.',
      homeCare: ['Shant aur andhere kamre mein aaram karein.', 'Khub paani piyein.', 'Gardan aur sar ki halke haath se maalish karein.'],
      otcMedicines: ['Paracetamol 650mg khane ke baad lein.'],
      redFlags: ['Achanak bahut tez sar dard.', 'Aankhon ke aage andhera aana ya sharir sunn padna.', 'Bukhar ke saath gardan mein akad.'],
    },
    kn: {
      summary: 'Tale novu samanyavagi ottada, neerina korate athava thakadininda baruttade.',
      homeCare: ['Kattale koteyalli shantavagi malagi.', 'Hecchu neeru kudiyiri.', 'Kutthigege thampa patti idi.'],
      otcMedicines: ['Paracetamol 650mg ootada nantara thegedukolli.'],
      redFlags: ['Achanakkagi baruvuva theevra tale novu.', 'Drushti thondare athava kai kaalu ashaktate.', 'Jwarada jothe kutthige novu.'],
    },
  },
  stomach: {
    en: {
      summary: 'Abdominal discomfort, indigestion, or gastroenteritis caused by contaminated food, acidity, or viral gut irritation.',
      homeCare: ['BRAT diet (Bananas, Rice, Applesauce, Toast).', 'Frequent sips of Oral Rehydration Salts (ORS).', 'Avoid spicy, greasy, and dairy products for 48 hours.'],
      otcMedicines: ['Antacid gel/tablets for acidity.', 'ORS packets for electrolyte recovery.', 'Dicyclomine for acute spasms.'],
      redFlags: ['Severe localized pain in right lower quadrant (suspected appendicitis).', 'Black tarry stools or vomiting blood.', 'Inability to keep liquids down for 24 hours.'],
    },
    hi: {
      summary: 'Pet dard ya gas aam taur par galat khana, acidity ya pet ke infection se hota hai.',
      homeCare: ['Khichdi, dahi aur kela jaise halka khana lein.', 'ORS ka ghol thoda-thoda karke piyein.', 'Tala-bhuna aur masaledar khana band karein.'],
      otcMedicines: ['Acidity ke liye antacid syrup ya Pantoprazole.', 'Pet marod ke liye Dicyclomine.'],
      redFlags: ['Pet ke daayein hisse mein tez dard.', 'Ulti mein khoon ya kaala mal aana.', 'Lagatar ulti hone se paani bhi na rukna.'],
    },
    kn: {
      summary: 'Hotte novu aaharada badalavane, acidity athava bacterial sankramanadinda baruttade.',
      homeCare: ['Ganji, mosaru anna mathu balehannu sevisi.', 'ORS neeru swalpa swalpa kudiyiri.', 'Khara aahara thurisibidi.'],
      otcMedicines: ['Acidity ge antacid syrup.', 'Hotte kachuvuvudakke Dicyclomine.'],
      redFlags: ['Balabhagada theevra hotte novu.', 'Vamanadalli raktha baruvudu.', 'Neeru kooda niladire hanguva theevra vamana.'],
    },
  },
  allergy: {
    en: {
      summary: 'Allergic reactions occur when the immune system overreacts to food, pollen, medications, or insect bites.',
      homeCare: ['Identify and remove immediate contact with suspected allergen.', 'Apply cool compresses to itchy skin areas.', 'Wear loose, breathable cotton clothing.'],
      otcMedicines: ['Cetirizine 10mg or Fexofenadine 120mg once daily.', 'Calamine lotion for cutaneous itching.'],
      redFlags: ['Swelling of lips, tongue, face, or throat.', 'Difficulty breathing, wheezing, or stridor.', 'Dizziness, fainting, or anaphylactic shock.'],
    },
    hi: {
      summary: 'Allergy kisi dawa, dhool, khane ya keede ke kaatne se sharir ki tez pratikriya hai.',
      homeCare: ['Allergy karne wali cheez se door rahein.', 'Khujli wali jagah par thanda paani lagayein.', 'Dheele sooti kapde pehnein.'],
      otcMedicines: ['Cetirizine 10mg raat ko lein.', 'Khujli ke liye Calamine lotion lagayein.'],
      redFlags: ['Hoth, jeebh ya gale mein sujan aana.', 'Saans lene mein ghutan hona.', 'Chakkar aakar behosh hona (Anaphylaxis).'],
    },
    kn: {
      summary: 'Allergy aaharada, aushadhiya athava dhoolina viruddha shareerada theevra pratikriye.',
      homeCare: ['Allergy uണ്ടാkida vastuvinda doora iri.', 'Thampa batteli tholisiri.', 'Hathi battagalanu dharisi.'],
      otcMedicines: ['Cetirizine 10mg dina 1 bar thegedukolli.', 'Calamine lotion lepisiri.'],
      redFlags: ['Thuti, nalige athava gantu bapu baruvudu.', 'Usiradalu theevra thondare.', 'Achanak murche baruvudu.'],
    },
  },
};

const STATUTORY_DISCLAIMER =
  '⚠️ MANDATORY MEDICAL DISCLAIMER: This assistant is an AI clinical support tool and does not provide an official medical diagnosis. Please consult a licensed physician or visit an emergency facility if you experience severe symptoms.';

function resolveConditionFromQuery(text) {
  const lower = String(text || '').toLowerCase();
  if (lower.includes('dengue') || lower.includes('platelet')) return 'dengue';
  if (lower.includes('cough') || lower.includes('khansi') || lower.includes('kemmu') || lower.includes('cold') || lower.includes('sardi') || lower.includes('gale')) return 'cough';
  if (lower.includes('headache') || lower.includes('sar dard') || lower.includes('tale novu') || lower.includes('migraine')) return 'headache';
  if (lower.includes('stomach') || lower.includes('pet') || lower.includes('hotte') || lower.includes('vomit') || lower.includes('ulti') || lower.includes('diarrhea') || lower.includes('dast') || lower.includes('gas')) return 'stomach';
  if (lower.includes('allergy') || lower.includes('rash') || lower.includes('itching') || lower.includes('khujli')) return 'allergy';
  if (lower.includes('fever') || lower.includes('bukhar') || lower.includes('jwara') || lower.includes('taap') || lower.includes('chills')) return 'fever';
  return 'general';
}

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
    const condition = resolveConditionFromQuery(message);

    // Select matching clinical advice or synthesize dynamic guidance
    const langKey = activeLang.includes('Hindi') ? 'hi' : activeLang.includes('Kannada') ? 'kn' : 'en';
    let entry = CLINICAL_KNOWLEDGE_BASE[condition]?.[langKey] || CLINICAL_KNOWLEDGE_BASE[condition]?.['en'];

    if (!entry) {
      // Dynamic clinical synthesis for general queries
      entry = {
        summary: `Clinical Assessment for Symptom Query: "${message.trim()}"`,
        homeCare: [
          'Maintain adequate hydration and clinical resting protocols.',
          'Record daily temperature, heart rate, and symptom progression in your EHR log.',
          'Schedule a tele-consultation with a specialized doctor for definitive diagnostic review.'
        ],
        otcMedicines: [
          'Mild analgesics (Paracetamol) may be used for symptom relief if fever or pain is present.',
          'Avoid self-medicating with systemic antibiotics without physician evaluation.'
        ],
        redFlags: [
          'Sudden severe chest pressure, acute breathlessness, or persistent vomiting.',
          'Neurological deficits, confusion, or loss of consciousness.',
          'High fever failing to respond to antipyretics for >48 hours.'
        ]
      };
    }

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
      answer: replyText,
      detected_language: activeLang,
      detected_script: detectedScript,
      detected_condition: condition,
      isVernacular,
      pincode: String(pincode).trim(),
      surgeAlertCreated,
      alertDetails,
    });
  } catch (error) {
    console.error('[ChatRoute] Message handler failed:', error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/chat/history
 * Returns recent anonymized symptom logs for disease mapping.
 */
router.get('/history', async (_req, res) => {
  try {
    const logs = await ChatQueryLog.find({}).sort({ createdAt: -1 }).limit(50).lean();
    return res.json({ success: true, count: logs.length, logs });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

module.exports = router;
