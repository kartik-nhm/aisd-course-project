/**
 * Module 5: Regional Pharmacy Early Alert System
 * Entry Point: index.js
 */

const { detectSurges, normalizeCondition, getRecommendedMedicines, ESSENTIAL_MEDICINES_MAP } = require('./surgeDetector');
const { broadcastStompAlert, sendEmailAdvisory, processAndDispatchAlerts } = require('./alertDispatcher');
const { InventoryManager } = require('./inventoryManager');

module.exports = {
  detectSurges,
  normalizeCondition,
  getRecommendedMedicines,
  ESSENTIAL_MEDICINES_MAP,
  broadcastStompAlert,
  sendEmailAdvisory,
  processAndDispatchAlerts,
  InventoryManager,
};
