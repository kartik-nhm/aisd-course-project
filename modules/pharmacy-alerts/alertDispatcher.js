/**
 * Module 5: Regional Pharmacy Early Alert System
 * File: alertDispatcher.js
 * 
 * Multi-channel alert dispatcher that notifies registered regional pharmacies via:
 * 1. Real-time STOMP WebSocket push to /topic/pharmacy/alerts/{region}
 * 2. Automated Resend API email advisories with essential medicine restock checklists.
 */

function getResendClient(apiKey) {
  try {
    const { Resend } = require('resend');
    return new Resend(apiKey);
  } catch (_err) {
    console.warn('[AlertDispatcher] resend package not found, falling back to mock email dispatch');
    return null;
  }
}

/**
 * Dispatches real-time WebSocket alert over STOMP to connected pharmacists.
 * @param {object} stompBroker - STOMP server instance
 * @param {object} alert - Surge alert event object
 */
function broadcastStompAlert(stompBroker, alert) {
  if (!stompBroker || typeof stompBroker.broadcastToTopic !== 'function') {
    console.warn('[AlertDispatcher] StompBroker broadcast function unavailable. Skipping WS push.');
    return;
  }

  const topicSpecific = `/topic/pharmacy/alerts/${alert.pincode}`;
  const topicGlobal = '/topic/pharmacy/alerts';

  const payload = {
    type: 'REGIONAL_SURGE_ALERT',
    alertId: `alert-${alert.pincode}-${Date.now()}`,
    pincode: alert.pincode,
    condition: alert.condition,
    queryCount: alert.queryCount,
    severity: alert.severity,
    recommendedMedicines: alert.recommendedMedicines,
    emittedAt: new Date().toISOString(),
    actionRequired: 'Ensure immediate stock availability for recommended medicines.',
  };

  // Broadcast to specific region and global pharmacy feed
  stompBroker.broadcastToTopic(topicSpecific, payload);
  stompBroker.broadcastToTopic(topicGlobal, payload);

  console.log(`[AlertDispatcher] Broadcasted STOMP alert to ${topicSpecific} & ${topicGlobal}`);
}

/**
 * Sends email advisory via Resend to registered regional pharmacies.
 * @param {Array<string>} recipientEmails - Registered pharmacists' emails in this pincode
 * @param {object} alert - Surge alert event object
 * @param {string} resendApiKey - Resend API key
 * @param {string} senderEmail - Sender email
 */
async function sendEmailAdvisory({ recipientEmails, alert, resendApiKey, senderEmail = 'alerts@telehealth.local' }) {
  if (!resendApiKey) {
    console.warn('[AlertDispatcher] RESEND_API_KEY missing. Skipping email dispatch.');
    return { success: false, reason: 'RESEND_API_KEY missing' };
  }

  if (!recipientEmails || recipientEmails.length === 0) {
    console.log(`[AlertDispatcher] No registered pharmacies found in pincode ${alert.pincode}`);
    return { success: true, count: 0 };
  }

  const resend = getResendClient(resendApiKey);
  if (!resend) {
    console.log(`[AlertDispatcher Mock Email] Would dispatch advisory to ${recipientEmails.length} pharmacies in pincode ${alert.pincode}`);
    return { success: true, count: recipientEmails.length, mocked: true };
  }

  const medicinesListHtml = alert.recommendedMedicines
    .map((med) => `<li style="padding: 4px 0; color: #1e293b;"><strong>${med}</strong></li>`)
    .join('');

  const htmlBody = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
      <div style="background-color: #0f172a; padding: 24px; color: #ffffff;">
        <h2 style="margin: 0; font-size: 20px; font-weight: 700; letter-spacing: -0.5px;">🏥 Regional Pharmacy Supply Advisory</h2>
        <p style="margin: 6px 0 0 0; color: #94a3b8; font-size: 14px;">Smart Telehealth Platform Early Warning System</p>
      </div>

      <div style="padding: 24px; background-color: #ffffff;">
        <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 16px; border-radius: 4px; margin-bottom: 20px;">
          <strong style="color: #991b1b; font-size: 15px;">Disease Surge Detected: ${alert.condition.toUpperCase()}</strong>
          <p style="margin: 6px 0 0 0; color: #7f1d1d; font-size: 13px;">
            Region Pincode: <strong>${alert.pincode}</strong> | Queries in 24h: <strong>${alert.queryCount}</strong> | Status: <strong>${alert.severity}</strong>
          </p>
        </div>

        <h3 style="font-size: 15px; color: #0f172a; margin-top: 0;">Recommended Medicines to Stock Immediately:</h3>
        <ul style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 12px 24px; margin: 0 0 20px 0;">
          ${medicinesListHtml}
        </ul>

        <p style="font-size: 13px; color: #64748b; line-height: 1.5;">
          This early warning alert was automatically triggered by elevated symptoms reporting and clinical consultations in your immediate postal area. Please verify your current shelf inventory and contact suppliers if replenishment is needed.
        </p>
      </div>

      <div style="background-color: #f1f5f9; padding: 14px 24px; text-align: center; color: #64748b; font-size: 12px;">
        Smart Telehealth Platform &copy; ${new Date().getFullYear()} &bull; Regional Healthcare Coordination Engine
      </div>
    </div>
  `;

  try {
    const response = await resend.emails.send({
      from: senderEmail,
      to: recipientEmails,
      subject: `🚨 Stock Advisory: ${alert.condition.toUpperCase()} Surge in Pincode ${alert.pincode}`,
      html: htmlBody,
    });

    console.log(`[AlertDispatcher] Dispatched Resend advisory to ${recipientEmails.length} pharmacies. ID:`, response?.data?.id);
    return { success: true, count: recipientEmails.length, response };
  } catch (err) {
    console.error('[AlertDispatcher] Failed to send Resend advisory email:', err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Complete alert dispatch workflow.
 */
async function processAndDispatchAlerts({ alerts, stompBroker, PharmacyModel, resendApiKey, senderEmail }) {
  const dispatchResults = [];

  for (const alert of alerts) {
    // 1. WebSocket Push
    broadcastStompAlert(stompBroker, alert);

    // 2. Lookup registered regional pharmacies
    let recipientEmails = [];
    if (PharmacyModel) {
      try {
        const regionalPharmacies = await PharmacyModel.find({
          pincode: alert.pincode,
          alertNotificationsEnabled: { $ne: false },
        }).lean();
        recipientEmails = regionalPharmacies.map((p) => p.email).filter(Boolean);
      } catch (err) {
        console.error(`[AlertDispatcher] Error finding pharmacies for pincode ${alert.pincode}:`, err.message);
      }
    }

    // 3. Email Dispatch
    const emailResult = await sendEmailAdvisory({
      recipientEmails,
      alert,
      resendApiKey,
      senderEmail,
    });

    dispatchResults.push({
      pincode: alert.pincode,
      condition: alert.condition,
      recipientsCount: recipientEmails.length,
      emailResult,
    });
  }

  return dispatchResults;
}

module.exports = {
  broadcastStompAlert,
  sendEmailAdvisory,
  processAndDispatchAlerts,
};
