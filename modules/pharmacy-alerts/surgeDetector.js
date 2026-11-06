/**
 * Module 5: Regional Pharmacy Early Alert System
 * File: surgeDetector.js
 * 
 * Aggregates anonymized patient chatbot queries and clinical consultation logs
 * by medical condition and pincode over a sliding 24-hour window.
 * Fires alert events when frequency reaches or exceeds threshold X.
 */

const ESSENTIAL_MEDICINES_MAP = {
  dengue: ['Paracetamol 650mg', 'ORS Electral Sachets', 'Papaya Leaf Extract', 'IV Fluids (Normal Saline)'],
  malaria: ['Artemether + Lumefantrine', 'Chloroquine', 'Paracetamol 500mg'],
  flu: ['Oseltamivir 75mg', 'Paracetamol 500mg', 'Cetirizine 10mg', 'Saline Nasal Spray'],
  influenza: ['Oseltamivir 75mg', 'Paracetamol 500mg', 'Cetirizine 10mg', 'Steam Inhaler Packs'],
  fever: ['Paracetamol 650mg', 'Mefenamic Acid', 'ORS Sachets', 'Digital Thermometers'],
  covid: ['Azithromycin', 'Paracetamol 650mg', 'Vitamin C + Zinc Tablets', 'Pulse Oximeters', 'N95 Masks'],
  cholera: ['ORS Sachets', 'Zinc Sulfate', 'Doxycycline 100mg', 'IV Ringer Lactate'],
  typhoid: ['Cefixime 200mg', 'Azithromycin 500mg', 'Paracetamol 650mg', 'Probiotics'],
  gastroenteritis: ['ORS Electrolytes', 'Loperamide 2mg', 'Ondansetron 4mg', 'Probiotics'],
};

/**
 * Standardizes disease / condition names for aggregation.
 */
function normalizeCondition(condition) {
  const lower = String(condition || '').toLowerCase().trim();
  for (const key of Object.keys(ESSENTIAL_MEDICINES_MAP)) {
    if (lower.includes(key)) return key;
  }
  return lower || 'general-fever';
}

/**
 * Suggests required pharmacy stock based on the surge disease.
 */
function getRecommendedMedicines(condition) {
  const key = normalizeCondition(condition);
  return ESSENTIAL_MEDICINES_MAP[key] || ['Paracetamol 500mg', 'ORS Sachets', 'Multivitamin Tablets'];
}

/**
 * Scans MongoDB query logs for the past 24 hours to find regions exceeding threshold X.
 * @param {object} ChatQueryLog - Mongoose Model for query logs
 * @param {number} threshold - Number of queries triggering surge alert (default: 5)
 * @param {number} windowHours - Sliding window in hours (default: 24)
 * @returns {Promise<Array>} Array of surge alert event objects
 */
async function detectSurges({ ChatQueryLog, threshold = 5, windowHours = 24 }) {
  if (!ChatQueryLog) {
    throw new Error('ChatQueryLog model is required for surge detection');
  }

  const cutoff = new Date(Date.now() - windowHours * 60 * 60 * 1000);

  const pipeline = [
    {
      $match: {
        createdAt: { $gte: cutoff },
        pincode: { $exists: true, $ne: '' },
        detectedCondition: { $exists: true, $ne: '' },
      },
    },
    {
      $group: {
        _id: {
          pincode: '$pincode',
          condition: '$detectedCondition',
        },
        queryCount: { $sum: 1 },
        sampleQueries: { $push: '$queryText' },
        lastDetectedAt: { $max: '$createdAt' },
      },
    },
    {
      $match: {
        queryCount: { $gte: threshold },
      },
    },
    {
      $project: {
        _id: 0,
        pincode: '$_id.pincode',
        condition: '$_id.condition',
        queryCount: 1,
        lastDetectedAt: 1,
      },
    },
  ];

  const results = await ChatQueryLog.aggregate(pipeline);

  return results.map((record) => {
    const condition = normalizeCondition(record.condition);
    return {
      pincode: record.pincode,
      condition,
      queryCount: record.queryCount,
      threshold,
      windowHours,
      severity: record.queryCount >= threshold * 2 ? 'CRITICAL_SURGE' : 'ELEVATED_SURGE',
      recommendedMedicines: getRecommendedMedicines(condition),
      timestamp: record.lastDetectedAt || new Date(),
    };
  });
}

module.exports = {
  detectSurges,
  normalizeCondition,
  getRecommendedMedicines,
  ESSENTIAL_MEDICINES_MAP,
};
