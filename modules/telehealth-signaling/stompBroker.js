/**
 * Module 1: Telehealth & Live Signaling
 * File: stompBroker.js
 * 
 * Production-ready STOMP 1.2 Broker over WebSockets.
 * Handles:
 * - Patient call initiation and ringing notifications to doctor queue
 * - Doctor availability signaling
 * - Topic-based pub/sub for Regional Pharmacy Alerts (/topic/pharmacy/alerts/{pincode})
 */

let WebSocketServer = null;
let jwt = null;

try {
  WebSocketServer = require('ws').WebSocketServer;
} catch (_e) {
  // Graceful fallback for test runners
}

try {
  jwt = require('jsonwebtoken');
} catch (_e) {
  // Graceful fallback for test runners
}

let messageCounter = 0;

function parseStompFrame(rawText) {
  const normalized = rawText.replace(/\r/g, '');
  const sep = normalized.indexOf('\n\n');
  const head = sep >= 0 ? normalized.slice(0, sep) : normalized;
  const body = sep >= 0 ? normalized.slice(sep + 2) : '';

  const lines = head.split('\n').filter((l) => l.length > 0);
  const command = lines.shift() || '';
  const headers = {};

  for (const line of lines) {
    const idx = line.indexOf(':');
    if (idx > 0) {
      headers[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
    }
  }

  return { command, headers, body };
}

function serializeStompFrame(command, headers = {}, body = '') {
  const headerLines = Object.entries(headers).map(([k, v]) => `${k}:${v}`);
  return `${command}\n${headerLines.join('\n')}\n\n${body}\u0000`;
}

function sendFrame(socket, command, headers = {}, body = '') {
  if (socket.readyState === 1) { // OPEN
    socket.send(serializeStompFrame(command, headers, body));
  }
}

class TelehealthStompBroker {
  constructor({ httpServer, path = '/telehealth-ws', jwtSecret }) {
    this.httpServer = httpServer;
    this.path = path;
    this.jwtSecret = jwtSecret;
    this.clients = new Set();
    this.wss = null;

    if (httpServer) {
      this.init();
    }
  }

  init() {
    if (!WebSocketServer) {
      console.warn('[StompBroker] "ws" package not installed. WebSocket listener deferred.');
      return;
    }
    this.wss = new WebSocketServer({ server: this.httpServer, path: this.path });

    this.wss.on('connection', (socket) => {
      socket.principal = null;
      socket.subscriptions = new Map(); // id -> { destination, id }
      socket.frameBuffer = '';
      this.clients.add(socket);

      socket.on('message', (data) => {
        const chunk = data.toString('utf8');
        if (chunk === '\n') return; // Heartbeat

        socket.frameBuffer += chunk;
        const frames = socket.frameBuffer.split('\u0000');
        socket.frameBuffer = frames.pop() || '';

        for (const rawFrame of frames) {
          const trimmed = rawFrame.trim();
          if (!trimmed) continue;
          const frame = parseStompFrame(trimmed);
          this.handleFrame(socket, frame);
        }
      });

      socket.on('close', () => this.clients.delete(socket));
      socket.on('error', () => this.clients.delete(socket));
    });

    console.log(`[StompBroker] WebSocket STOMP broker initialized on ${this.path}`);
  }

  handleFrame(socket, frame) {
    const { command, headers, body } = frame;

    // 1. CONNECT / STOMP
    if (command === 'CONNECT' || command === 'STOMP') {
      const token = headers.token || headers.Authorization?.replace('Bearer ', '');
      if (!token) {
        sendFrame(socket, 'ERROR', { message: 'Missing auth token' }, 'Token required');
        socket.close();
        return;
      }

      try {
        let payload;
        if (this.jwtSecret) {
          payload = jwt.verify(token, this.jwtSecret);
        } else {
          payload = jwt.decode(token);
        }

        socket.principal = {
          subject: payload.sub || payload.phone || payload.email,
          role: String(payload.role || '').toLowerCase(),
          email: payload.email,
          phone: payload.phone,
        };

        sendFrame(socket, 'CONNECTED', {
          version: '1.2',
          'heart-beat': '10000,10000',
          server: 'smart-telehealth-stomp',
        });
      } catch (_err) {
        sendFrame(socket, 'ERROR', { message: 'Authentication failed' }, 'Invalid token');
        socket.close();
      }
      return;
    }

    if (!socket.principal) {
      sendFrame(socket, 'ERROR', { message: 'Unauthorized' }, 'Not authenticated');
      socket.close();
      return;
    }

    // 2. SUBSCRIBE
    if (command === 'SUBSCRIBE') {
      const destination = headers.destination;
      const id = headers.id || `sub-${Date.now()}`;
      if (destination) {
        socket.subscriptions.set(id, { id, destination });
      }
      return;
    }

    // 3. UNSUBSCRIBE
    if (command === 'UNSUBSCRIBE') {
      const id = headers.id;
      if (id) socket.subscriptions.delete(id);
      return;
    }

    // 4. SEND
    if (command === 'SEND') {
      const destination = headers.destination;

      // Patient initiating video call to doctor
      if (destination === '/app/consultation/create' || destination === '/app/videocall/create') {
        this.routeDoctorCallInvite(socket, body);
      }
      return;
    }

    // 5. DISCONNECT
    if (command === 'DISCONNECT') {
      socket.close();
    }
  }

  routeDoctorCallInvite(sourceSocket, body) {
    let payload;
    try {
      payload = JSON.parse(body || '{}');
    } catch (_e) {
      return;
    }

    const doctorEmail = String(payload.doctorEmail || '').toLowerCase().trim();
    const meetingUuid = String(payload.meetingUuid || '').trim();
    const patientPhone = sourceSocket.principal?.phone || sourceSocket.principal?.subject;

    if (!doctorEmail || !meetingUuid) return;

    const doctorQueue = '/user/queue/consultation/call-details';
    const legacyDoctorQueue = '/user/queue/videocall-details';
    const messageBody = JSON.stringify({
      meeting_uuid: meetingUuid,
      patient_phonenumber: patientPhone,
      timestamp: new Date().toISOString(),
    });

    for (const socket of this.clients) {
      if (socket.readyState !== 1 || !socket.principal) continue;
      const targetMatches =
        socket.principal.email?.toLowerCase() === doctorEmail ||
        socket.principal.subject?.toLowerCase() === doctorEmail;

      if (!targetMatches) continue;

      for (const sub of socket.subscriptions.values()) {
        if (sub.destination === doctorQueue || sub.destination === legacyDoctorQueue) {
          messageCounter += 1;
          sendFrame(
            socket,
            'MESSAGE',
            {
              subscription: sub.id,
              destination: sub.destination,
              'message-id': `call-msg-${messageCounter}`,
              'content-type': 'application/json',
            },
            messageBody
          );
        }
      }
    }
  }

  /**
   * Broadcasts a message to any client subscribed to a given destination or topic.
   * Used for Module 5 Pharmacy Alerts: /topic/pharmacy/alerts/{pincode}
   */
  broadcastToTopic(topic, payload) {
    const bodyStr = typeof payload === 'string' ? payload : JSON.stringify(payload);

    for (const socket of this.clients) {
      if (socket.readyState !== 1) continue;

      for (const sub of socket.subscriptions.values()) {
        if (sub.destination === topic) {
          messageCounter += 1;
          sendFrame(
            socket,
            'MESSAGE',
            {
              subscription: sub.id,
              destination: topic,
              'message-id': `topic-msg-${messageCounter}`,
              'content-type': 'application/json',
            },
            bodyStr
          );
        }
      }
    }
  }
}

module.exports = {
  TelehealthStompBroker,
  parseStompFrame,
  serializeStompFrame,
};
