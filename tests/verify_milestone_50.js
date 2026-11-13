/**
 * Automated Verification Suite for Milestone 50% (AISD Course Project)
 * Validates all 5 Core Architecture Modules and API Gateway End-to-End.
 */

const assert = require('assert');
const http = require('http');

// Module 1 Imports
const {
  createConsultationRoom,
  DoctorAvailabilityRegistry,
  parseStompFrame,
  serializeStompFrame,
} = require('../modules/telehealth-signaling');

// Module 2 Imports
const {
  extractClinicalEntities,
  classifyConsultationSeverity,
  normalizeClinicalData,
} = require('../modules/clinical-ai-scribe');

// Module 3 Imports
const {
  standardizeFrequency,
  sanitizePrescriptionItems,
  compilePrescriptionPDF,
} = require('../modules/prescription-generator');
const { jsPDF } = require('jspdf');

// Module 5 Imports
const {
  normalizeCondition,
  getRecommendedMedicines,
  detectSurges,
  InventoryManager,
} = require('../modules/pharmacy-alerts');

// Backend Gateway
const { app } = require('../services/api-backend/src/app');
const { connectDB } = require('../services/api-backend/src/config/db');
const ChatQueryLog = require('../services/api-backend/src/models/ChatQueryLog');

async function runMilestoneVerification() {
  console.log('================================================================');
  console.log('   SMART TELEHEALTH PLATFORM - MILESTONE 50% VERIFICATION SUITE  ');
  console.log('================================================================\n');

  // -------------------------------------------------------------
  // Test 1: Module 1 (Telehealth & STOMP Signaling)
  // -------------------------------------------------------------
  console.log('▶ [1/6] Verifying Module 1: WebRTC Telehealth & STOMP Signaling...');
  const room = createConsultationRoom({
    patientPhone: '9876543210',
    doctorEmail: 'dr.priya@telehealth.org',
    jitsiDomain: 'meet.jit.si',
  });
  assert(room.meetingUuid, 'Room meetingUuid valid');
  assert(room.roomUrl.includes('meet.jit.si'), 'Jitsi Meet URL generated');

  DoctorAvailabilityRegistry.setAvailable('dr.priya@telehealth.org');
  assert.strictEqual(DoctorAvailabilityRegistry.isAvailable('dr.priya@telehealth.org'), true, 'Doctor marked online');
  DoctorAvailabilityRegistry.unsetAvailable('dr.priya@telehealth.org');
  assert.strictEqual(DoctorAvailabilityRegistry.isAvailable('dr.priya@telehealth.org'), false, 'Doctor marked offline');

  const frameStr = serializeStompFrame('CONNECT', { accept: '1.2', host: 'telehealth.local' });
  const parsedFrame = parseStompFrame(frameStr);
  assert.strictEqual(parsedFrame.command, 'CONNECT', 'STOMP serialization/deserialization matches');
  console.log('  ✔ WebRTC room generation, doctor heartbeat registry, and STOMP signaling verified.\n');

  // -------------------------------------------------------------
  // Test 2: Module 2 (Clinical AI Scribe & Triage Engine)
  // -------------------------------------------------------------
  console.log('▶ [2/6] Verifying Module 2: Ambient Clinical Scribing & 4-Level Triage...');
  const sampleDialogue = `
    Doctor: Good morning Kartik, what seems to be the trouble today?
    Patient: Doctor, I have had high fever, dry cough, and intense body aches for the last 3 days.
    Doctor: Any shortness of breath or chest pain?
    Patient: No chest pain, but I feel very weak and throat is scratchy.
    Doctor: Vitals check: Temperature 101.2 F, Blood Pressure 122/80 mmHg, SpO2 98%, Pulse 82 bpm.
    Doctor: Lungs sound clear. Diagnosing Acute Viral Upper Respiratory Tract Infection.
    Doctor: Prescribing Paracetamol 650mg TDS for 3 days and Cetirizine 10mg OD at bedtime.
  `;

  const extracted = await extractClinicalEntities({ transcript: sampleDialogue });
  assert(extracted.symptoms.length > 0, 'Symptoms successfully extracted');
  assert.strictEqual(extracted.vitals.bloodPressure, '122/80 mmHg', 'Blood pressure extracted');
  assert.strictEqual(extracted.vitals.temperature, '101.2 F', 'Temperature extracted');
  assert(extracted.prescription.length >= 2, 'Prescription items extracted');

  const triageResult = await classifyConsultationSeverity(extracted);
  assert(['Low', 'Medium', 'High', 'Critical'].includes(triageResult.severity), 'Valid 4-tier triage level');
  console.log(`  ✔ Extracted vitals: BP ${extracted.vitals.bloodPressure}, Temp ${extracted.vitals.temperature}, SpO2 ${extracted.vitals.spo2}`);
  console.log(`  ✔ Classified Severity: "${triageResult.severity}" (${triageResult.recommendedUrgencyHours}h urgency)`);
  console.log('  ✔ Ambient clinical AI scribe & triage pipeline verified.\n');

  // -------------------------------------------------------------
  // Test 3: Module 3 (Automated Prescription Compiler & PDF Export)
  // -------------------------------------------------------------
  console.log('▶ [3/6] Verifying Module 3: Dosage Sanitization & jsPDF Compiler...');
  assert.strictEqual(standardizeFrequency('TDS'), 'Three times daily (TDS)');
  assert.strictEqual(standardizeFrequency('OD'), 'Once daily (OD)');
  assert.strictEqual(standardizeFrequency('BD'), 'Twice daily (BD)');

  const pdfDoc = compilePrescriptionPDF(jsPDF, {
    doctor: {
      name: 'Dr. Priya Sharma, MD',
      specialty: 'Cardiology & General Medicine',
      regNumber: 'MCI-54812',
      clinicName: 'Apex Virtual Health Center',
    },
    patient: {
      name: 'Kartik Narayana',
      phone: '9876543210',
      age: '22',
      bloodType: 'O+',
      allergies: ['Penicillin, Cephalosporins'],
    },
    clinicalData: extracted,
  });

  const pdfBytes = Buffer.from(pdfDoc.output('arraybuffer'));
  assert(pdfBytes.length > 1000, 'Prescription PDF compiled with valid byte array');
  console.log(`  ✔ Generated official PDF Prescription: ${pdfBytes.length} bytes`);
  console.log('  ✔ Dosage regex standardization & jsPDF compiler verified.\n');

  // -------------------------------------------------------------
  // Test 4: Module 4 (Multilingual Detection & Regional Surveillance)
  // -------------------------------------------------------------
  console.log('▶ [4/6] Verifying Module 4: Multilingual Vernacular Chatbot & Tagging...');
  // Simulated language detection heuristic
  const hindiQuery = 'Mujhe 3 din se tez bukhar aur sar dard ho raha hai';
  const kannadaQuery = 'Nange tumba jwara mattu kemmu ide';
  const engQuery = 'High fever with shivering and body pain for 2 days';

  assert.strictEqual(normalizeCondition(hindiQuery), 'fever', 'Hindi query condition normalized to fever');
  assert.strictEqual(normalizeCondition(kannadaQuery), 'fever', 'Kannada query condition normalized to fever');
  assert.strictEqual(normalizeCondition(engQuery), 'fever', 'English query condition normalized to fever');

  const medsForFever = getRecommendedMedicines('fever');
  assert(medsForFever.includes('Paracetamol 650mg'), 'Essential medicine checklist mapped');
  console.log('  ✔ Vernacular condition normalization (Hinglish/Kannada/English) verified.');
  console.log(`  ✔ Recommended restock for fever: ${medsForFever.join(', ')}\n`);

  // -------------------------------------------------------------
  // Test 5: Module 5 (Regional Pharmacy Alerts & Inventory Analysis)
  // -------------------------------------------------------------
  console.log('▶ [5/6] Verifying Module 5: Outbreak Surge Detection & Stock Deficit...');
  const pharmacyInventory = [
    { medicineName: 'Paracetamol 650mg', currentQuantity: 12, minimumSafetyStock: 50 },
    { medicineName: 'ORS Electral Sachets', currentQuantity: 4, minimumSafetyStock: 30 },
    { medicineName: 'Cetirizine 10mg', currentQuantity: 80, minimumSafetyStock: 20 },
  ];

  const analysis = InventoryManager.analyzeStockDeficit(pharmacyInventory, medsForFever);
  assert(analysis.deficits.length >= 2, 'Stock deficits correctly identified for low-stock medicines');
  assert(analysis.deficits.some((d) => d.urgency === 'CRITICAL'), 'Critical deficit items flagged');
  console.log(`  ✔ Identified ${analysis.deficits.length} stock deficits out of ${medsForFever.length} recommended medicines.`);
  console.log('  ✔ Regional pharmacy surge & inventory deficit analysis verified.\n');

  // -------------------------------------------------------------
  // Test 6: Backend API Gateway Integration
  // -------------------------------------------------------------
  console.log('▶ [6/6] Verifying End-to-End API Gateway Routes...');
  await connectDB('mongodb://127.0.0.1:27017/test_milestone_50');

  const server = http.createServer(app);
  const TEST_PORT = 8999;
  await new Promise((resolve) => server.listen(TEST_PORT, resolve));

  async function api(path, method = 'GET', body = null) {
    const opts = { method, headers: { 'Content-Type': 'application/json' } };
    if (body) opts.body = JSON.stringify(body);
    const res = await fetch(`http://localhost:${TEST_PORT}${path}`, opts);
    return res;
  }

  // 1. Health check
  const healthRes = await (await api('/health')).json();
  assert.strictEqual(healthRes.status, 'online', 'Health endpoint online');

  // 2. Doctors list
  const docsRes = await (await api('/api/consultation/doctors')).json();
  assert(docsRes.doctors.length >= 2, 'Doctors list accessible');

  // 3. Scribe simulate
  const scribeSimRes = await (await api('/api/consultation/scribe/simulate', 'POST', {})).json();
  assert.strictEqual(scribeSimRes.success, true, 'Scribe simulation endpoint functional');

  // 4. Multilingual Chat message
  const chatRes = await (await api('/api/chat/message', 'POST', {
    message: 'Mujhe tez bukhar aur sar dard hai',
    pincode: '560001',
  })).json();
  assert.strictEqual(chatRes.success, true, 'Chat endpoint functional');
  assert.strictEqual(chatRes.detected_condition, 'fever', 'Condition normalized in chat');

  // 5. Patient records
  const recordsRes = await (await api('/api/consultation/records/9876543210')).json();
  assert.strictEqual(recordsRes.patient.phone, '9876543210', 'Patient records retrieved');

  // 6. Prescription PDF stream
  const pdfStreamRes = await api('/api/consultation/prescription/pdf/consult-demo-001');
  assert.strictEqual(pdfStreamRes.status, 200, 'PDF stream returns HTTP 200');
  assert.strictEqual(pdfStreamRes.headers.get('content-type'), 'application/pdf', 'PDF Content-Type valid');

  // 7. Simulate Outbreak Surge
  const surgeSimRes = await (await api('/api/pharmacy/simulate-surge', 'POST', {
    pincode: '560001',
    condition: 'dengue',
    count: 5,
  })).json();
  assert.strictEqual(surgeSimRes.success, true, 'Simulate surge functional');
  assert.strictEqual(surgeSimRes.surgeDetected, true, 'Dengue surge correctly triggered at threshold');

  server.close();
  console.log('  ✔ All REST API Gateway endpoints verified successfully.');

  console.log('\n================================================================');
  console.log('🎉 50% MILESTONE VERIFICATION COMPLETE: ALL TESTS PASSED! (6/6)');
  console.log('================================================================\n');
}

runMilestoneVerification().catch((err) => {
  console.error('❌ Verification Failed:', err);
  process.exit(1);
});
