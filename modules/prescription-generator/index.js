/**
 * Module 3: Automated Prescription & Clinical Records
 * Entry Point: index.js
 */

const { compilePrescriptionPDF } = require('./pdfCompiler');
const { sanitizePrescriptionItems, standardizeFrequency, FREQUENCY_MAP } = require('./dosageParser');
const { checkDrugAllergyConflict, DRUG_ALLERGY_MATRIX } = require('./allergyChecker');

module.exports = {
  compilePrescriptionPDF,
  sanitizePrescriptionItems,
  standardizeFrequency,
  FREQUENCY_MAP,
  checkDrugAllergyConflict,
  DRUG_ALLERGY_MATRIX,
};
