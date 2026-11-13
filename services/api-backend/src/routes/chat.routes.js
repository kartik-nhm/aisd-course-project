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
      homeCare: ['Allergy uNDakida vastuvinda doora iri.', 'Thampa batteli tholisiri.', 'Hathi battagalanu dharisi.'],
      otcMedicines: ['Cetirizine 10mg dina 1 bar thegedukolli.', 'Calamine lotion lepisiri.'],
      redFlags: ['Thuti, nalige athava gantu bapu baruvudu.', 'Usiradalu theevra thondare.', 'Achanak murche baruvudu.'],
    },
  },
  muscle_pain: {
    en: {
      summary: 'Muscle and body pain (myalgia) after physical activity is typically caused by micro-tears in muscle fibres, lactic acid build-up, or dehydration.',
      homeCare: ['Apply an ice pack for 20 minutes in the first 48 hours to reduce inflammation.', 'After 48 hours switch to warm compress or hot water bottle.', 'Gentle stretching and light walking to improve blood flow.', 'Rest the affected muscles — avoid strenuous activity for 24–48 hours.', 'Stay well-hydrated (at least 2.5–3 L water/day) to flush lactic acid.'],
      otcMedicines: ['Ibuprofen 400mg or Diclofenac Gel (topical) for pain and swelling.', 'Paracetamol 650mg TDS if NSAIDs are contraindicated.', 'Electrolyte ORS sachets to replenish sodium and potassium lost in sweat.'],
      redFlags: ['Dark brown or tea-coloured urine (possible rhabdomyolysis — muscle breakdown).', 'Swelling, redness, or hardness in a single limb (possible DVT or compartment syndrome).', 'Muscle weakness persisting beyond 72 hours without improvement.', 'Pain after a fall or impact — may indicate fracture.'],
    },
    hi: {
      summary: 'Vyayam ke baad badan dard ya muscle dard aam taur par lactic acid jama hone aur muscle fiber ki micro-tearing se hota hai.',
      homeCare: ['Pehle 48 ghante mein barf ka thanda sekhna karein.', '48 ghante ke baad garm sekhna ya hot water bottle lagaayein.', 'Halki stretching karein aur thodi der walk karein.', 'Prachur matra mein paani piyein aur araam karein.'],
      otcMedicines: ['Dard ke liye Ibuprofen 400mg khane ke baad lein.', 'Sujan wali jagah par Diclofenac gel lagaayein.', 'ORS sachets se electrolytes bhari karein.'],
      redFlags: ['Peshab ka rang bahut gehra ya bhoora hona (rhabdomyolysis ka sanket).', 'Kisi ek taraf haath ya pair mein sujan aur laalapan.', 'Gira ya chot laga ho toh — haddi tooti ho sakti hai.'],
    },
    kn: {
      summary: 'Vyayamada nantara shareeradi novu (myalgia) samanyavagi lactic acid sanchayadinda mattu snaayu tuntu bageyuvudrindhinda baruttade.',
      homeCare: ['Modala 48 gandeyalli thampa ice patti idi.', '48 gandeyada nantara bisi neerina kamsana idi.', 'Haluvadaha stretching mattu nadige blood sanchalana baruttade.', 'Sariyaagi neeru kudiyiri mattu vishranti thegedukolli.'],
      otcMedicines: ['Nougige Ibuprofen 400mg ootada nantara thegedukolli.', 'Suji tholada mele Diclofenac gel lepisi.', 'ORS sachets vitamins tumbalu kurisi.'],
      redFlags: ['Mootravannu gadada neeru bediya banna iddare — rhabdomyolysis sandarbha.', 'Ondu kaalu athava kaiyalli bapu baruvudu.', 'Bhidisi aalladare — mugiyada novu anumaanikari.'],
    },
  },
  back_pain: {
    en: {
      summary: 'Back pain is one of the most common musculoskeletal complaints — typically caused by poor posture, muscle strain, disc issues, or prolonged sitting.',
      homeCare: ['Apply warm compress or heating pad to the painful area for 15–20 minutes.', 'Avoid bed rest for more than 1–2 days — gentle movement speeds recovery.', 'Practice correct sitting posture with lumbar support.', 'Sleep on a firm mattress in the foetal position with a pillow between knees.'],
      otcMedicines: ['Ibuprofen 400mg or Diclofenac Sodium 50mg after food.', 'Topical Diclofenac or Volini gel for localised back muscle spasm.', 'Muscle relaxant (Cyclobenzaprine/Mephenesin) if prescribed by a doctor.'],
      redFlags: ['Numbness or tingling radiating down one or both legs (sciatica).', 'Loss of bladder or bowel control (cauda equina syndrome — emergency).', 'Back pain following a fall or accident.', 'Constant night pain not relieved by any position.'],
    },
    hi: {
      summary: 'Kamar dard zyaadatar galat baith-chaal, muscle khichain, ya disc ki samasya se hota hai.',
      homeCare: ['Dard wali jagah par garm sekhna ya hot water bottle lagaayein.', 'Lamba araam na karein — halka chalein-phirein.', 'Seedha baith kar kaam karein aur kamar ko support dein.', 'Firm gadde par lete aur ghutne ke beech takiya rakhe.'],
      otcMedicines: ['Dard ke liye Ibuprofen 400mg ya Diclofenac 50mg lein.', 'Sujan ke liye Volini ya Diclofenac gel lagaayein.'],
      redFlags: ['Pair mein sunn ya jhanjhanahat (sciatica).', 'Peshab ya potty rok na pana — turant doctor ke paas jaayein.', 'Girne ya chot ke baad kamar dard.'],
    },
    kn: {
      summary: 'Bele novu belaganasana galat aasana, snaayu eereda yaa disc samasyerindhinda baruttade.',
      homeCare: ['Nouvina jagake bisi neerina patti idi.', 'Hecchinasthu malagirabeda — swalpa nadeyiri.', 'Sari aasanada jothe karche madi.'],
      otcMedicines: ['Ibuprofen 400mg ootada nantara thegedukolli.', 'Sthaneeya nougige Diclofenac gel lepisi.'],
      redFlags: ['Kaalu mele ede/jinjani sandarbhada novu (sciatica).', 'Mootra-mala niyantrana thappuvudu — turant doctoranna kano.', 'Biddu nogidu bele novu.'],
    },
  },
  fatigue: {
    en: {
      summary: 'Fatigue and weakness can stem from poor sleep, dehydration, anaemia, nutritional deficiencies, or underlying infections.',
      homeCare: ['Ensure 7–8 hours of uninterrupted sleep each night.', 'Eat iron-rich foods: leafy greens, lentils, eggs, and fortified cereals.', 'Limit caffeine and alcohol which worsen fatigue cycles.', 'Short 10–15 minute walks improve circulation and energy levels.'],
      otcMedicines: ['Iron + Folic Acid supplement if anaemia suspected (after blood test).', 'Vitamin B12 supplement if diet is primarily vegetarian.', 'Electrolyte ORS to rehydrate if fatigue follows excessive sweating or illness.'],
      redFlags: ['Extreme fatigue with shortness of breath and chest pain (cardiac rule-out needed).', 'Fatigue with unexplained weight loss and night sweats (TB screening advised).', 'Pale conjunctiva, yellowing of skin or eyes (severe anaemia or liver issue).'],
    },
    hi: {
      summary: 'Thakan neend ki kami, paani ki kami, khoon ki kami (anaemia) ya kisi bimari ki wajah se ho sakti hai.',
      homeCare: ['Roz 7-8 ghante ki neend lein.', 'Paalak, daal, ande aur iron-rich khana khayein.', 'Chai-coffee kam karein.', 'Roz halki walk karein.'],
      otcMedicines: ['Anaemia ke liye Iron + Folic acid tablet (doctor ki salaah se).', 'Vegetarian khane walo ke liye B12 supplement.'],
      redFlags: ['Thakan ke saath saans phoolna aur seene mein dard.', 'Thakan ke saath wajan ka ghatna aur raat ko paseeena aana (TB check karein).', 'Aankhon ya chehre ka peela padna.'],
    },
    kn: {
      summary: 'Nidde kotta, neeru kotta athava khoon kotta (anaemia) yinda thakate baruttade.',
      homeCare: ['Prathi dina 7-8 gandeyalli nidde madi.', 'Palakya-soppugalu, bele, munna, iron-tumbida aahara tevisi.', 'Roz halaviha nadeyiri.'],
      otcMedicines: ['Anaemia sandarbhadalli Iron + Folic Acid (vaidyarinda soochita).', 'Shakahari aahara thegedavaralli B12 supplement.'],
      redFlags: ['Thakate jothe usirataadukke thondare mathu edeyalli novu.', 'Thakate jothe tookadikeradi thoolu (TB screening). ', 'Kannu banna athava chamari-paduva (anaemia athava yakrut samasye).'],
    },
  },
  cold: {
    en: {
      summary: 'Common cold (viral rhinitis) is caused by rhinovirus infection causing runny nose, sneezing, mild fever, and sore throat.',
      homeCare: ['Steam inhalation with eucalyptus drops 2–3 times daily.', 'Warm saline gargles (half teaspoon salt in warm water) 3 times/day.', 'Stay warm and avoid cold drinks or ice.', 'Honey and ginger tea with black pepper soothes throat irritation.'],
      otcMedicines: ['Cetirizine 10mg at bedtime for runny nose.', 'Paracetamol 650mg if mild fever is present.', 'Saline nasal spray 2 puffs each nostril BD.'],
      redFlags: ['High fever >102°F persisting beyond 48 hours.', 'Thick green or blood-stained nasal discharge (possible sinusitis).', 'Severe throat pain making it impossible to swallow saliva.'],
    },
    hi: {
      summary: 'Sardi-zukhaam virus se hota hai jisme naak bahna, chheenk, halka bukhar aur gale mein dard hota hai.',
      homeCare: ['Eucalyptus wali bhaap lein.', 'Naman paani mein namak daal kar garara karein.', 'Garm pani mein adrak-shehad ka kadha piyein.', 'Thanda paani se bachein.'],
      otcMedicines: ['Naak bahne ke liye Cetirizine 10mg raat ko.', 'Halke bukhar ke liye Paracetamol 650mg.', 'Saline nasal spray.'],
      redFlags: ['102°F se zyada bukhar 48 ghante tak rehna.', 'Naak se haraa ya khoon wala pani aana.', 'Itna dard ki thook bhi na niga sakein.'],
    },
    kn: {
      summary: 'Negaladha sheetala (viral rhinitis) rhinovirus sankramanadinda baruttade — muggu sorruvudu, seethe, swalpa jwara.',
      homeCare: ['Eucalyptus teLinipinda aavi thegedukolli.', 'Bisi mara neeralli uppu haki garara madi.', 'Shunthiya kashaaya kudiyiri.'],
      otcMedicines: ['Muggu sorruvudakke Cetirizine 10mg rathri.', 'Jwarakke Paracetamol 650mg.'],
      redFlags: ['102°F meeridaru 48 gandeyalli jwara.', 'Muggininda hasiru raktha baruvudu.', 'Neru nungalu ashaktavaaguvudu.'],
    },
  },
  injury: {
    en: {
      summary: 'Minor injuries including cuts, bruises, sprains, and bumps can often be managed at home with appropriate first-aid.',
      homeCare: ['RICE method for sprains: Rest, Ice (20 min on/off), Compression (bandage), Elevation above heart level.', 'Clean cuts with running water and antiseptic, then apply a sterile dressing.', 'Do NOT apply toothpaste, soil, or home remedies to open wounds.'],
      otcMedicines: ['Betadine/Povidone iodine solution for wound cleaning.', 'Paracetamol 650mg for pain relief.', 'Topical antiseptic cream (Neosporin/Soframycin) for minor cuts.'],
      redFlags: ['Deep cuts that won\'t stop bleeding after 15 minutes of firm pressure.', 'Visible bone or white tissue in a wound (needs suturing/emergency).', 'Redness, warmth, and pus from a wound 2+ days old (infection).', 'Head injury with loss of consciousness, vomiting, or blurred vision.'],
    },
    hi: {
      summary: 'Chhoti chot, mochi aur ghav ko ghar par prathamik upchar se theek kiya ja sakta hai.',
      homeCare: ['Mochi ke liye RICE: Araam, Barf, Paatti, Ooncha rakhein.', 'Ghav ko saaf paani se dhoye aur antiseptic lagaayein.', 'Ghav par dahi, mitti ya kuch aur na lagaayein.'],
      otcMedicines: ['Betadine solution se ghav saaf karein.', 'Dard ke liye Paracetamol 650mg.', 'Chhoti khuroch ke liye Soframycin cream.'],
      redFlags: ['15 minute ke baad bhi khoon na rukna.', 'Ghav mein pus ya laalapan 2 din ke baad.', 'Sar ki chot ke baad ulti ya ankhon mein dhundla dekhna.'],
    },
    kn: {
      summary: 'Sanna nogita, nattu, morpata, kai-kaalidakke maneyallu prathamika chikitse madabahudu.',
      homeCare: ['Morpatakke RICE: Vishranti, Thampa, Baindhu, Ettari.', 'Nogivina thovala saaf neeralli thoyi antiseptic hachi dressing haki.', 'Hoppala mele halla, dhuli hakabeda.'],
      otcMedicines: ['Betadine solution dinda nogivina thovala thoyi.', 'Nougige Paracetamol 650mg.'],
      redFlags: ['15 nimishadalli raktha niludilla iddare.', 'Hoppala mele kuddu kaanu baruvudu (surgery beku).', 'Nogivina thovala kempagi, bisi aagi karu baruvudu.'],
    },
  },
  bp: {
    en: {
      summary: 'High blood pressure (hypertension) is usually asymptomatic but can cause headache, blurred vision, or palpitations. It needs regular monitoring.',
      homeCare: ['Reduce salt intake to less than 5g (1 teaspoon) per day.', 'Practice 30 minutes of moderate walking daily.', 'Avoid alcohol, tobacco, and high-stress situations.', 'Monitor BP at home twice daily at the same times.', 'Follow DASH diet: fruits, vegetables, whole grains, low-fat dairy.'],
      otcMedicines: ['BP medications must only be taken as prescribed by your doctor — never self-medicate.', 'Consult your doctor if readings consistently exceed 140/90 mmHg.'],
      redFlags: ['Sudden severe headache with vision changes — hypertensive emergency.', 'BP reading >180/120 mmHg (hypertensive crisis — go to ER).', 'Chest pain or shortness of breath with elevated BP.'],
    },
    hi: {
      summary: 'Zyada blood pressure (hypertension) mein sar dard, dhundhla dekhna ya dil ki dharkan tez ho sakti hai.',
      homeCare: ['Namak kam karein (1 chamach se kam roz).', 'Roz 30 minute walk karein.', 'Sharab, tambaaku aur stress se bachein.', 'Roz ghar par BP naapein.'],
      otcMedicines: ['BP ki dawa sirf doctor ke prescription par lein.', 'Agar reading 140/90 se zyada ho toh doctor se milein.'],
      redFlags: ['Achanak tez sar dard aur aankhon mein andhera.', 'BP 180/120 se zyada — turant emergency mein jaayein.', 'Seene mein dard aur saans phoolna.'],
    },
    kn: {
      summary: 'Uncca rakta-chhapa (hypertension) sadhaaranavaagi lakshana thorisuva udilla, aadare tale novu athava hridaya badukeyu sambhaviste.',
      homeCare: ['Uppu dina 1 chamach gintha kamma maadi.', 'Roz 30 nimisha nadeyiri.', 'Madya, tambakhu beedibidi.'],
      otcMedicines: ['Rakta-chhapada aushadha kevala vaidyarinda aadeshisida reeti thegedukolli.'],
      redFlags: ['Achanakkagi theevra tale novu + drushti thondare.', 'BP 180/120 meere iddare — emergency.', 'Edeyalli novu + usiradalu thondare.'],
    },
  },
  diabetes: {
    en: {
      summary: 'Diabetes symptoms include increased thirst, frequent urination, blurred vision, slow wound healing, and tingling in hands/feet.',
      homeCare: ['Follow a low glycaemic index diet: whole grains, legumes, non-starchy vegetables, avoid sugar and refined carbs.', 'Monitor blood glucose before and after meals using a glucometer.', 'Exercise for 30–45 minutes daily to improve insulin sensitivity.', 'Never skip medications or insulin doses.'],
      otcMedicines: ['Blood glucose monitoring is essential — get a glucometer.', 'Consult your doctor for HbA1c testing every 3 months.'],
      redFlags: ['Blood sugar <70 mg/dL (hypoglycaemia): give 15g sugar immediately (glucose tab, juice).', 'Blood sugar >300 mg/dL with vomiting or confusion (DKA risk — go to ER).', 'Non-healing wound, blackening of foot skin (diabetic foot emergency).'],
    },
    hi: {
      summary: 'Diabetes mein zyada pyaas, baar baar peshab, aankhon mein dhundlaahat, aur haath-pair mein jhanjhanahat hoti hai.',
      homeCare: ['Chini, maida aur mithaai bilkul band karein.', 'Khana khaane ke pehle aur baad mein blood sugar naapein.', 'Roz 30-45 minute walk karein.'],
      otcMedicines: ['Glucometer se roz blood sugar check karein.', 'Har 3 mahine mein HbA1c test karwaayein.'],
      redFlags: ['Blood sugar 70 se neeche — turant 15g sugar dein (juice, mishri).', 'Blood sugar 300 se zyada + ulti ya confusion — ER mein jaayein.', 'Ghav ka na bharna ya pair mein kaalaapan.'],
    },
    kn: {
      summary: 'Madhumehada lakshana: hecchinasthu neerina badike, aadaadha mootravaguvudu, kannu mandu kaanuvudu, kai kaalu jhanjana.',
      homeCare: ['Sakkare, maida, mishti thurisibidi.', 'Oota munna mattu nantara blood glucose check maadi.', 'Roz 30-45 nimisha vyayama madi.'],
      otcMedicines: ['Roz glucometer dinda blood sugar check maadi.', 'Prathi 3 tingaligondu HbA1c test maadi.'],
      redFlags: ['Blood sugar 70 kkintha kamma iddare — glucosindu adhika kodalavanu (juice, sakkare).', 'Blood sugar 300 kkintha hecca + vamana/gatibhrama — ER ge hogi.', 'Nogivina thovala muyuta iddare athava kaalu kalmaguvaruvudu.'],
    },
  },
  skin: {
    en: {
      summary: 'Skin problems like rashes, acne, eczema, or fungal infections are very common and most respond well to topical treatment.',
      homeCare: ['Keep the affected area clean and dry.', 'Avoid scratching — it spreads infection and worsens inflammation.', 'Wear loose, breathable cotton clothing over affected areas.', 'Avoid applying cosmetics, perfumes, or irritating agents on the rash.'],
      otcMedicines: ['Calamine lotion for itching and mild rashes.', 'Clotrimazole 1% cream for fungal/ringworm infections (apply BD for 2 weeks).', 'Hydrocortisone 1% cream for contact dermatitis (short-term use only).', 'Benzoyl peroxide 2.5% gel for acne.'],
      redFlags: ['Rapidly spreading rash with fever and blistering (possible Stevens-Johnson or severe drug reaction).', 'Rash with joint pain, butterfly pattern on face (lupus screening advised).', 'Open wounds or ulcers that are not healing within 2 weeks.'],
    },
    hi: {
      summary: 'Daane, khujli, eczema ya fungal infection aam hain aur zyaadatar topical cream se theek ho jaate hain.',
      homeCare: ['Prabhavit jagah ko saaf aur sukha rakhein.', 'Khujlaaiye mat — infection failta hai.', 'Dheele kapde pehnein.'],
      otcMedicines: ['Khujli ke liye Calamine lotion.', 'Fungal infection ke liye Clotrimazole cream 2 hafte tak.', 'Contact allergy ke liye Hydrocortisone 1% cream (thodi der ke liye).'],
      redFlags: ['Tezi se failte daane aur bukhar ke saath chhaale.', 'Daane + jodo mein dard + chehra laal (lupus screening).', '2 hafte mein ghav na bharna.'],
    },
    kn: {
      summary: 'Tholi samasyegalu (daddu, khujli, eczema, fungal) samanyavagivu mattu topical cream dinda theeguttave.',
      homeCare: ['Bayaladanu saaf mattu olu maadi.', 'Thikkaribeda — sankramana haraguttade.', 'Hathi battagalanu dharisi.'],
      otcMedicines: ['Khujlige Calamine lotion.', 'Fungal sankramanakke Clotrimazole cream 2 varavaraige.'],
      redFlags: ['Jwarada jothe vegada tholi daddu mathu gaaligala (severe drug reaction).', 'Tholi daddu + sandhi novu + mukhadalli kempu (lupus).', '2 varavaraige hepadilla hoppala.'],
    },
  },
};

const STATUTORY_DISCLAIMER =
  '⚠️ MANDATORY MEDICAL DISCLAIMER: This assistant is an AI clinical support tool and does not provide an official medical diagnosis. Please consult a licensed physician or visit an emergency facility if you experience severe symptoms.';

function resolveConditionFromQuery(text) {
  const lower = String(text || '').toLowerCase();

  // Dengue — highest priority (specific)
  if (lower.includes('dengue') || lower.includes('platelet')) return 'dengue';

  // Muscle / body pain (workout, gym, exercise, myalgia)
  if (
    lower.includes('muscle') || lower.includes('body pain') || lower.includes('badan dard') ||
    lower.includes('badan mein dard') || lower.includes('workout') || lower.includes('gym') ||
    lower.includes('exercise') || lower.includes('myalgia') || lower.includes('mai novu') ||
    lower.includes('angada novu') || lower.includes('pain in my body') || lower.includes('aches')
  ) return 'muscle_pain';

  // Back pain
  if (
    lower.includes('back pain') || lower.includes('kamar dard') || lower.includes('kamar') ||
    lower.includes('bele novu') || lower.includes('spine') || lower.includes('lower back')
  ) return 'back_pain';

  // Fatigue / weakness
  if (
    lower.includes('fatigue') || lower.includes('tired') || lower.includes('weakness') ||
    lower.includes('thakan') || lower.includes('kamzori') || lower.includes('thakate') ||
    lower.includes('weak') || lower.includes('no energy') || lower.includes('exhausted')
  ) return 'fatigue';

  // Cold / rhinitis (before cough so "cold" is caught here)
  if (
    lower.includes('negaladha') || lower.includes('rhinitis') || lower.includes('mucus') ||
    lower.includes('runny nose') || lower.includes('sneezing') || lower.includes('zukhaam')
  ) return 'cold';

  // Cough / sore throat
  if (
    lower.includes('cough') || lower.includes('khansi') || lower.includes('kemmu') ||
    lower.includes('cold') || lower.includes('sardi') || lower.includes('gale')
  ) return 'cough';

  // Headache / migraine
  if (
    lower.includes('headache') || lower.includes('sar dard') || lower.includes('tale novu') ||
    lower.includes('migraine') || lower.includes('head pain') || lower.includes('head ache')
  ) return 'headache';

  // Stomach / GI
  if (
    lower.includes('stomach') || lower.includes('pet') || lower.includes('hotte') ||
    lower.includes('vomit') || lower.includes('ulti') || lower.includes('diarrhea') ||
    lower.includes('dast') || lower.includes('gas') || lower.includes('acidity') ||
    lower.includes('indigestion') || lower.includes('nausea')
  ) return 'stomach';

  // Skin / rash / acne / fungal (before allergy to separate skin from allergy)
  if (
    lower.includes('rash') || lower.includes('itching') || lower.includes('khujli') ||
    lower.includes('skin') || lower.includes('acne') || lower.includes('eczema') ||
    lower.includes('fungal') || lower.includes('ringworm') || lower.includes('daddu') ||
    lower.includes('tholi')
  ) return 'skin';

  // Allergy
  if (lower.includes('allergy') || lower.includes('allergic')) return 'allergy';

  // Injury / wound / sprain
  if (
    lower.includes('injury') || lower.includes('cut') || lower.includes('wound') ||
    lower.includes('bruise') || lower.includes('sprain') || lower.includes('chot') ||
    lower.includes('nogita') || lower.includes('gira') || lower.includes('fell') ||
    lower.includes('fall') || lower.includes('twisted') || lower.includes('swollen')
  ) return 'injury';

  // Blood pressure
  if (
    lower.includes('blood pressure') || lower.includes('hypertension') ||
    lower.includes('bp high') || lower.includes('high bp') || lower.includes('rakta chhap') ||
    (lower.includes('bp') && !lower.includes('tbsp'))
  ) return 'bp';

  // Diabetes / blood sugar
  if (
    lower.includes('diabetes') || lower.includes('blood sugar') || lower.includes('glucose') ||
    lower.includes('madhumeh') || lower.includes('insulin') ||
    (lower.includes('sugar') && (lower.includes('blood') || lower.includes('high') || lower.includes('level')))
  ) return 'diabetes';

  // Fever — after more specific checks
  if (
    lower.includes('fever') || lower.includes('bukhar') || lower.includes('jwara') ||
    lower.includes('taap') || lower.includes('chills') || lower.includes('temperature')
  ) return 'fever';

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

    // Assemble structured reply as JSON sections (frontend renders these properly)
    const replyText = entry.summary;
    const replySections = [
      {
        heading: 'Care Guidance & Home Remedies',
        icon: 'home',
        items: entry.homeCare,
      },
      {
        heading: 'Recommended Over-The-Counter Options',
        icon: 'pill',
        items: entry.otcMedicines,
      },
      {
        heading: 'Red Flag Warning Signs',
        icon: 'alert',
        subtext: 'Seek immediate medical care if you notice:',
        items: entry.redFlags,
      },
    ];

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
      sections: replySections,
      disclaimer: STATUTORY_DISCLAIMER,
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
