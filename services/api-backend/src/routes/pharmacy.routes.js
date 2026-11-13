/**
 * Pharmacy & Regional Surge Alert Routes
 * Connects Module 5 (Regional Pharmacy Early Alert System) with the REST API.
 */

const express = require('express');
const Pharmacy = require('../models/Pharmacy');
const ChatQueryLog = require('../models/ChatQueryLog');
const PharmacyAlert = require('../models/PharmacyAlert');
const { attachAuth, requireAuth } = require('../middleware/auth');
const { env } = require('../config/env');

// Import domain Module 5: Regional Pharmacy Alert System
const {
  detectSurges,
  processAndDispatchAlerts,
  normalizeCondition,
  getRecommendedMedicines,
  InventoryManager,
} = require('../../../../modules/pharmacy-alerts');

const router = express.Router();
router.use(attachAuth);

// Helper to access the global stompBroker instance
function getStompBroker(req) {
  return req.app.get('stompBroker');
}

/**
 * Log incoming patient chatbot query with detected condition & pincode.
 * Automatically runs surge check if query threshold is reached.
 */
router.post('/log-query', async (req, res) => {
  try {
    const { queryText, condition, pincode, language, userId } = req.body;
    if (!queryText || !pincode) {
      return res.status(400).json({ error: 'queryText and pincode are required' });
    }

    const detectedCondition = normalizeCondition(condition || queryText);

    const logEntry = await ChatQueryLog.create({
      queryText,
      detectedCondition,
      pincode: String(pincode).trim(),
      detectedLanguage: language || 'English',
      userId: userId || 'anonymous',
    });

    // Run rapid surge check for this pincode
    const alerts = await detectSurges({
      ChatQueryLog,
      threshold: env.PHARMACY_SURGE_THRESHOLD,
      windowHours: env.PHARMACY_SURGE_WINDOW_HOURS,
    });

    const matchingAlert = alerts.find((a) => a.pincode === String(pincode).trim());
    let dispatchSummary = null;

    if (matchingAlert) {
      // Check if we haven't already alerted in the last 6 hours
      const existingAlert = await PharmacyAlert.findOne({
        pincode: matchingAlert.pincode,
        condition: matchingAlert.condition,
        status: 'ACTIVE',
        createdAt: { $gte: new Date(Date.now() - 6 * 60 * 60 * 1000) },
      });

      if (!existingAlert) {
        const broker = getStompBroker(req);
        dispatchSummary = await processAndDispatchAlerts({
          alerts: [matchingAlert],
          stompBroker: broker,
          PharmacyModel: Pharmacy,
          resendApiKey: env.RESEND_API_KEY,
          senderEmail: env.RESEND_SENDER_EMAIL,
        });

        await PharmacyAlert.create({
          alertId: `alert-${matchingAlert.pincode}-${Date.now()}`,
          pincode: matchingAlert.pincode,
          condition: matchingAlert.condition,
          queryCount: matchingAlert.queryCount,
          threshold: matchingAlert.threshold,
          severity: matchingAlert.severity,
          recommendedMedicines: matchingAlert.recommendedMedicines,
          dispatchedToCount: dispatchSummary[0]?.recipientsCount || 0,
        });
      }
    }

    return res.json({
      success: true,
      logId: logEntry._id,
      condition: detectedCondition,
      surgeDetected: Boolean(matchingAlert),
      dispatchSummary,
    });
  } catch (error) {
    console.error('[PharmacyRoute] log-query failed:', error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * Manually or periodically evaluate regional surges across all pincodes.
 */
router.post('/evaluate-surges', async (req, res) => {
  try {
    const alerts = await detectSurges({
      ChatQueryLog,
      threshold: env.PHARMACY_SURGE_THRESHOLD,
      windowHours: env.PHARMACY_SURGE_WINDOW_HOURS,
    });

    const broker = getStompBroker(req);
    const dispatchResults = await processAndDispatchAlerts({
      alerts,
      stompBroker: broker,
      PharmacyModel: Pharmacy,
      resendApiKey: env.RESEND_API_KEY,
      senderEmail: env.RESEND_SENDER_EMAIL,
    });

    for (const a of alerts) {
      await PharmacyAlert.updateOne(
        { pincode: a.pincode, condition: a.condition, status: 'ACTIVE' },
        {
          $set: {
            queryCount: a.queryCount,
            severity: a.severity,
            recommendedMedicines: a.recommendedMedicines,
          },
          $setOnInsert: {
            alertId: `alert-${a.pincode}-${Date.now()}`,
            threshold: a.threshold,
          },
        },
        { upsert: true }
      );
    }

    return res.json({
      totalSurgesDetected: alerts.length,
      alerts,
      dispatchResults,
    });
  } catch (error) {
    console.error('[PharmacyRoute] evaluate-surges error:', error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * Get active alerts for a pharmacist dashboard (filtered by pincode or all).
 */
router.get('/alerts', async (req, res) => {
  try {
    const { pincode } = req.query;
    const filter = { status: 'ACTIVE' };
    if (pincode) filter.pincode = String(pincode).trim();

    const alerts = await PharmacyAlert.find(filter).sort({ createdAt: -1 }).limit(50).lean();
    return res.json({ alerts });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

/**
 * Register or update pharmacy store details and inventory.
 */
router.post('/register', async (req, res) => {
  try {
    const { name, email, phone, pincode, licenseNumber, address, inventory } = req.body;
    if (!name || !email || !pincode || !licenseNumber) {
      return res.status(400).json({ error: 'Missing required pharmacy fields' });
    }

    const updated = await Pharmacy.findOneAndUpdate(
      { email: String(email).toLowerCase().trim() },
      {
        $set: {
          name,
          phone,
          pincode: String(pincode).trim(),
          licenseNumber,
          address: address || '',
          ...(inventory ? { inventory } : {}),
        },
      },
      { upsert: true, new: true }
    );

    return res.json({ success: true, pharmacy: updated });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

/**
 * Check stock deficit for a pharmacy against the latest regional surge advisory.
 */
router.get('/inventory/deficit-check', async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) return res.status(400).json({ error: 'Pharmacy email is required' });

    const pharmacy = await Pharmacy.findOne({ email: String(email).toLowerCase() }).lean();
    if (!pharmacy) return res.status(404).json({ error: 'Pharmacy record not found' });

    // Find any active surge in this pharmacy's pincode
    const activeAlerts = await PharmacyAlert.find({ pincode: pharmacy.pincode, status: 'ACTIVE' }).lean();

    const allRecommended = new Set();
    for (const alert of activeAlerts) {
      for (const med of alert.recommendedMedicines) {
        allRecommended.add(med);
      }
    }

    const recommendedList = allRecommended.size > 0
      ? Array.from(allRecommended)
      : ['Paracetamol 650mg', 'ORS Electral Sachets', 'Cetirizine 10mg'];

    const analysis = InventoryManager.analyzeStockDeficit(pharmacy.inventory, recommendedList);

    return res.json({
      pincode: pharmacy.pincode,
      activeSurgesCount: activeAlerts.length,
      analysis,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

/**
 * Simulate surge queries for testing and demonstration.
 */
router.post('/simulate-surge', async (req, res) => {
  try {
    const { pincode = '560001', condition = 'fever', count = 5 } = req.body;
    const normCond = normalizeCondition(condition);

    for (let i = 0; i < count; i++) {
      await ChatQueryLog.create({
        queryText: `Simulated query #${i + 1} for ${normCond} symptoms in pincode ${pincode}`,
        detectedCondition: normCond,
        pincode: String(pincode).trim(),
        detectedLanguage: 'English',
        isVernacular: false,
        userId: `sim-user-${i + 1}`,
        createdAt: new Date(),
      });
    }

    const alerts = await detectSurges({
      ChatQueryLog,
      threshold: env.PHARMACY_SURGE_THRESHOLD || 5,
      windowHours: env.PHARMACY_SURGE_WINDOW_HOURS || 24,
    });

    const matchingAlert = alerts.find((a) => a.pincode === String(pincode).trim() && a.condition === normCond);

    if (matchingAlert) {
      const broker = getStompBroker(req);
      if (broker) {
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
        broker.broadcast(`/topic/pharmacy/alerts/${matchingAlert.pincode}`, payload);
        broker.broadcast('/topic/pharmacy/alerts', payload);
      }

      await PharmacyAlert.create({
        alertId: `alert-${matchingAlert.pincode}-${Date.now()}`,
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
      success: true,
      simulatedCount: count,
      pincode,
      condition: normCond,
      surgeDetected: Boolean(matchingAlert),
      alert: matchingAlert,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

module.exports = router;
