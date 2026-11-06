/**
 * Module 5: Regional Pharmacy Early Alert System
 * File: inventoryManager.js
 * 
 * Manages pharmacy stock levels, low-stock thresholds, and regional availability lookup.
 */

class InventoryManager {
  /**
   * Evaluates if a pharmacy's current inventory meets the surge recommendation.
   * @param {Array} currentInventory - Array of { medicineName, quantity, minimumRequired }
   * @param {Array<string>} recommendedMedicines - List of medicines recommended for current surge
   * @returns {object} Deficit analysis with restock suggestions
   */
  static analyzeStockDeficit(currentInventory = [], recommendedMedicines = []) {
    const stockMap = new Map();
    for (const item of currentInventory) {
      stockMap.set(String(item.medicineName || '').toLowerCase().trim(), item.quantity || 0);
    }

    const deficits = [];
    const satisfied = [];

    for (const med of recommendedMedicines) {
      const normalizedMed = med.toLowerCase().trim();
      let foundQty = 0;
      let matchedKey = null;

      for (const [invName, qty] of stockMap.entries()) {
        if (invName.includes(normalizedMed) || normalizedMed.includes(invName)) {
          foundQty = qty;
          matchedKey = invName;
          break;
        }
      }

      if (matchedKey === null || foundQty < 20) {
        deficits.push({
          medicineName: med,
          currentStock: foundQty,
          suggestedRestockQuantity: Math.max(50, 50 - foundQty),
          urgency: foundQty === 0 ? 'CRITICAL' : 'MODERATE',
        });
      } else {
        satisfied.push({
          medicineName: med,
          currentStock: foundQty,
          status: 'SUFFICIENT',
        });
      }
    }

    return {
      hasDeficits: deficits.length > 0,
      deficits,
      satisfied,
      totalRecommended: recommendedMedicines.length,
    };
  }
}

module.exports = {
  InventoryManager,
};
