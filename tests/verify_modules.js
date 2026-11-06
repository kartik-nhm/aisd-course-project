/**
 * Verification Test Suite for Smart Telehealth Modules
 */

const assert = require('assert');

// 1. Test Module 5: Regional Pharmacy Alert System
console.log('--- Testing Module 5: Regional Pharmacy Alert System ---');
const {
  normalizeCondition,
  getRecommendedMedicines,
  InventoryManager,
} = require('../modules/pharmacy-alerts');

assert.strictEqual(normalizeCondition('severe dengue fever'), 'dengue');
assert.strictEqual(normalizeCondition('cold and flu with headache'), 'flu');
console.log('✓ normalizeCondition successfully identified disease conditions.');

const dengueMeds = getRecommendedMedicines('dengue');
assert(dengueMeds.includes('Paracetamol 650mg'));
assert(dengueMeds.includes('ORS Electral Sachets'));
console.log('✓ getRecommendedMedicines returns correct stock checklist:', dengueMeds);

const inventorySample = [
  { medicineName: 'Paracetamol 650mg', quantity: 100 },
  { medicineName: 'ORS Electral Sachets', quantity: 5 }, // Low stock deficit
];
const deficitAnalysis = InventoryManager.analyzeStockDeficit(inventorySample, dengueMeds);
assert.strictEqual(deficitAnalysis.hasDeficits, true);
assert(deficitAnalysis.deficits.some((d) => d.medicineName.includes('ORS')));
console.log('✓ InventoryManager accurately flagged deficit for low-stock items.');

// 2. Test Module 3: Automated Prescription & Clinical Records
console.log('\n--- Testing Module 3: Automated Prescription Generator ---');
const { sanitizePrescriptionItems, standardizeFrequency } = require('../modules/prescription-generator');

assert.strictEqual(standardizeFrequency('TDS'), 'Three times daily (TDS)');
assert.strictEqual(standardizeFrequency('bd'), 'Twice daily (BD)');
console.log('✓ standardizeFrequency converts Latin abbreviations to patient guidance.');

const rawMedications = [
  'Amoxicillin 500mg TDS after food x 7 days',
  { medicine: 'Cetirizine', dosage: '10mg', frequency: 'OD', duration: '5 days' },
];
const parsedMeds = sanitizePrescriptionItems(rawMedications);
assert.strictEqual(parsedMeds.length, 2);
assert.strictEqual(parsedMeds[0].medicine, 'Amoxicillin');
assert.strictEqual(parsedMeds[0].dosage, '500mg');
console.log('✓ sanitizePrescriptionItems successfully parsed strings and structured objects.');

// 3. Test Module 2: Clinical AI Scribe & Extraction
console.log('\n--- Testing Module 2: Clinical AI Scribe & Triage ---');
const { normalizeClinicalData, SEVERITY_LEVELS } = require('../modules/clinical-ai-scribe');

assert.deepStrictEqual(Object.values(SEVERITY_LEVELS), ['Low', 'Medium', 'High', 'Critical']);
const sampleRaw = {
  symptoms: ['High fever', 'Severe headache'],
  diagnosis: ['Viral syndrome'],
  prescription: ['Paracetamol 650mg'],
  vitals: { bloodPressure: '120/80', pulse: '76' },
};
const normalized = normalizeClinicalData(sampleRaw);
assert.strictEqual(normalized.symptoms.length, 2);
assert.strictEqual(normalized.vitals.bloodPressure, '120/80');
console.log('✓ normalizeClinicalData sanitizes structured medical records.');

// 4. Test Module 1: Telehealth & Live Signaling
console.log('\n--- Testing Module 1: Telehealth & Live Signaling ---');
const {
  createConsultationRoom,
  DoctorAvailabilityRegistry,
  parseStompFrame,
  serializeStompFrame,
} = require('../modules/telehealth-signaling');

const room = createConsultationRoom({
  patientPhone: '+919999999999',
  doctorEmail: 'dr.smith@telehealth.local',
  jitsiDomain: 'meet.jit.si',
});
assert(room.meetingUuid.length > 0);
assert(room.roomUrl.startsWith('https://meet.jit.si/TeleHealth-'));
console.log('✓ createConsultationRoom generates valid WebRTC consultation session.');

DoctorAvailabilityRegistry.setAvailable('dr.smith@telehealth.local');
assert.strictEqual(DoctorAvailabilityRegistry.isAvailable('dr.smith@telehealth.local'), true);
DoctorAvailabilityRegistry.unsetAvailable('dr.smith@telehealth.local');
assert.strictEqual(DoctorAvailabilityRegistry.isAvailable('dr.smith@telehealth.local'), false);
console.log('✓ DoctorAvailabilityRegistry tracks availability status correctly.');

const serialized = serializeStompFrame('SUBSCRIBE', { destination: '/topic/pharmacy/alerts/560001', id: 'sub-1' }, '');
const parsed = parseStompFrame(serialized.replace('\u0000', ''));
assert.strictEqual(parsed.command, 'SUBSCRIBE');
assert.strictEqual(parsed.headers.destination, '/topic/pharmacy/alerts/560001');
console.log('✓ STOMP frame parser and serializer verified for pub/sub messaging.');

console.log('\n🎉 ALL MODULE VERIFICATION TESTS PASSED SUCCESSFULLY! 🎉\n');
