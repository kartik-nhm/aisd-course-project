# Module 1: Telehealth & Live Signaling
> Feature 1 from [TECHNOLOGY_SURVEY.md](../../TECHNOLOGY_SURVEY.md)

## Purpose & Architecture
Facilitates seamless real-time consultations between patients and healthcare providers:
1. **Video Calling Engine:** **Jitsi Meet API (WebRTC)** for low-latency audio/video consultations without heavy custom media servers.
2. **Signaling Protocol:** **STOMP over WebSockets** (`@stomp/stompjs` on client, Node.js `ws` on backend) for call invitations, doctor availability tracking, and real-time alerts.
3. **Dual-Track Audio Capture:** Mixes doctor mic and incoming patient audio via Web Audio API into unified streams for automated scribing.
