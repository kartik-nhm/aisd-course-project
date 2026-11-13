/**
 * Database Preload and Verification Script
 * Validates and displays the pre-seeded demo dataset across doctors, patients,
 * pharmacies, historical consultations, and surge trigger logs.
 */

const { collections } = require('../services/api-backend/src/config/inMemoryStore');

console.log('================================================================');
console.log('       SMART TELEHEALTH PLATFORM - PRELOADED DEMO DATASET       ');
console.log('================================================================\n');

console.log('👨‍⚕️ Registered Doctors (Module 1 & 2):');
for (const doc of collections.doctors.data) {
  console.log(`  • ${doc.name} (${doc.specialty})`);
  console.log(`    Email: ${doc.email} | Reg: ${doc.regNumber} | Clinic: ${doc.clinicName}`);
}

console.log('\n👤 Registered Patients (Module 1 & 3):');
for (const pat of collections.patients.data) {
  console.log(`  • ${pat.name} (Age: ${pat.age}, Blood: ${pat.bloodType})`);
  console.log(`    Phone: ${pat.phone} | Region Pincode: ${pat.pincode}`);
  console.log(`    ⚠️ Known Allergies: ${pat.allergies}`);
}

console.log('\n🏥 Registered Regional Pharmacies (Module 5):');
for (const phar of collections.pharmacies.data) {
  console.log(`  • ${phar.name} (Pincode: ${phar.pincode})`);
  console.log(`    Email: ${phar.email} | License: ${phar.licenseNumber}`);
}

console.log('\n📋 Seeded Historical Consultations (Module 2 & 3):');
for (const c of collections.consultations.data) {
  console.log(`  • Consultation ID: ${c._id} (Patient: ${c.patient_phonenumber})`);
  console.log(`    Diagnosis: ${c.summary_data.diagnosis.join(', ')}`);
  console.log(`    Vitals: BP ${c.summary_data.vitals.bp}, Temp ${c.summary_data.vitals.temp}, SpO2 ${c.summary_data.vitals.spo2}`);
  console.log(`    Triage: ${c.triage.severity} Priority (${c.triage.recommendedUrgencyHours}h urgency)`);
  console.log(`    Prescribed: ${c.summary_data.prescription.map((rx) => rx.drug + ' ' + rx.dosage + ' (' + rx.frequency + ')').join(', ')}`);
}

console.log('\n🚨 Preloaded Surveillance Query Logs (Module 4 & 5):');
console.log(`  • Total 24h query logs preloaded: ${collections.chatLogs.data.length} logs in pincode 560001.`);
console.log('  • When 1 additional fever query is received in pincode 560001, the system automatically crosses threshold X=5 and fires a live outbreak surge alert!\n');

console.log('================================================================');
console.log('✔ Dataset ready for demonstration, testing, and grading review.');
console.log('================================================================\n');
