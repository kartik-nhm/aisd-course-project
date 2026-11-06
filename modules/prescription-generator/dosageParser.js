/**
 * Module 3: Automated Prescription & Clinical Records
 * File: dosageParser.js
 * 
 * Standardized regex sanitization and dosage parsers to structure medicine tables.
 */

const FREQUENCY_MAP = {
  od: 'Once daily (OD)',
  qd: 'Once daily (OD)',
  bd: 'Twice daily (BD)',
  bid: 'Twice daily (BD)',
  tds: 'Three times daily (TDS)',
  tid: 'Three times daily (TDS)',
  qid: 'Four times daily (QID)',
  sos: 'As needed (SOS)',
  prn: 'As needed (PRN)',
  stat: 'Immediately (STAT)',
  hs: 'At bedtime (HS)',
};

/**
 * Standardizes common clinical Latin abbreviations into patient-readable instructions.
 */
function standardizeFrequency(frequencyStr) {
  if (!frequencyStr) return 'As directed by physician';
  const clean = frequencyStr.toLowerCase().replace(/[^a-z]/g, '');
  return FREQUENCY_MAP[clean] || frequencyStr;
}

/**
 * Sanitizes and normalizes an array of prescription items.
 */
function sanitizePrescriptionItems(items = []) {
  if (!Array.isArray(items)) return [];

  return items.map((item, idx) => {
    if (typeof item === 'string') {
      // Parse patterns like: "Paracetamol 650mg TDS after food x 5 days"
      const match = item.match(/^(.*?)\s+(\d+\s*(?:mg|ml|mcg|g|tablets?|caps?))?\s*(od|bd|tds|qid|sos|prn|once|twice|thrice)?\s*(.*)$/i);
      if (match) {
        return {
          id: idx + 1,
          medicine: match[1]?.trim() || item,
          dosage: match[2]?.trim() || 'Standard Dose',
          frequency: standardizeFrequency(match[3]),
          duration: match[4]?.trim() || 'Complete course',
          instructions: 'Take with warm water after food',
        };
      }
      return {
        id: idx + 1,
        medicine: item,
        dosage: 'As prescribed',
        frequency: 'As directed',
        duration: 'As directed',
        instructions: '',
      };
    }

    return {
      id: idx + 1,
      medicine: String(item.medicine || 'Medication').trim(),
      dosage: String(item.dosage || 'Standard Dose').trim(),
      frequency: standardizeFrequency(item.frequency),
      duration: String(item.duration || 'As directed').trim(),
      instructions: String(item.instructions || '').trim(),
    };
  });
}

module.exports = {
  sanitizePrescriptionItems,
  standardizeFrequency,
  FREQUENCY_MAP,
};
