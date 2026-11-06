/**
 * Module 1: Telehealth & Live Signaling
 * File: callSessionManager.js
 * 
 * Generates secure consultation room tokens, Jitsi configuration payloads,
 * and manages doctor availability status.
 */

const crypto = require('crypto');

function generateUuid() {
  try {
    return crypto.randomUUID();
  } catch (_e) {
    return 'uuid-' + Math.random().toString(36).substring(2, 15);
  }
}

const activeDoctorSessions = new Map();

/**
 * Creates a consultation room configuration for Jitsi Meet.
 */
function createConsultationRoom({
  patientPhone,
  doctorEmail,
  jitsiDomain = 'meet.jit.si',
  customRoomId = null,
}) {
  const roomId = customRoomId || `TeleHealth-${generateUuid().slice(0, 12)}`;
  const cleanRoomName = roomId.replace(/[^a-zA-Z0-9_-]/g, '');

  return {
    meetingUuid: generateUuid(),
    roomId: cleanRoomName,
    jitsiDomain,
    roomUrl: `https://${jitsiDomain}/${cleanRoomName}`,
    participants: {
      patientPhone: String(patientPhone || ''),
      doctorEmail: String(doctorEmail || '').toLowerCase(),
    },
    createdAt: new Date().toISOString(),
    configOverwrite: {
      startWithAudioMuted: false,
      startWithVideoMuted: false,
      enableWelcomePage: false,
      prejoinPageEnabled: false,
      disableDeepLinking: true,
    },
    interfaceConfigOverwrite: {
      TOOLBAR_BUTTONS: [
        'microphone',
        'camera',
        'closedcaptions',
        'desktop',
        'fullscreen',
        'hangup',
        'chat',
        'recording',
        'tileview',
      ],
    },
  };
}

/**
 * Tracks online doctor availability with timestamped heartbeats.
 */
class DoctorAvailabilityRegistry {
  static setAvailable(doctorEmail) {
    const key = String(doctorEmail || '').toLowerCase().trim();
    activeDoctorSessions.set(key, {
      available: true,
      lastHeartbeat: Date.now(),
    });
  }

  static extendAvailability(doctorEmail) {
    const key = String(doctorEmail || '').toLowerCase().trim();
    if (activeDoctorSessions.has(key)) {
      activeDoctorSessions.get(key).lastHeartbeat = Date.now();
    }
  }

  static unsetAvailable(doctorEmail) {
    const key = String(doctorEmail || '').toLowerCase().trim();
    activeDoctorSessions.delete(key);
  }

  static isAvailable(doctorEmail, timeoutMs = 60000) {
    const key = String(doctorEmail || '').toLowerCase().trim();
    const session = activeDoctorSessions.get(key);
    if (!session || !session.available) return false;
    const isFresh = Date.now() - session.lastHeartbeat <= timeoutMs;
    if (!isFresh) {
      activeDoctorSessions.delete(key);
      return false;
    }
    return true;
  }

  static listAvailableDoctors() {
    const result = [];
    for (const [email, session] of activeDoctorSessions.entries()) {
      if (Date.now() - session.lastHeartbeat <= 60000) {
        result.push(email);
      }
    }
    return result;
  }
}

module.exports = {
  createConsultationRoom,
  DoctorAvailabilityRegistry,
};
