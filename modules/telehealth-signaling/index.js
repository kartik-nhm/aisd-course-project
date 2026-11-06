/**
 * Module 1: Telehealth & Live Signaling
 * Entry Point: index.js
 */

const { TelehealthStompBroker, parseStompFrame, serializeStompFrame } = require('./stompBroker');
const { createConsultationRoom, DoctorAvailabilityRegistry } = require('./callSessionManager');

module.exports = {
  TelehealthStompBroker,
  createConsultationRoom,
  DoctorAvailabilityRegistry,
  parseStompFrame,
  serializeStompFrame,
};
