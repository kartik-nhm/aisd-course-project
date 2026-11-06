# Module 5: Regional Pharmacy Early Alert System
> Feature 5 from [TECHNOLOGY_SURVEY.md](../../TECHNOLOGY_SURVEY.md)

## Purpose & Architecture
Monitors incoming multilingual chatbot questions and clinical consultation transcripts tagged by user pincode. When queries for a given condition (e.g. Dengue, Influenza, Malaria) reach or exceed threshold $X$ (default: 5) in a specific region within a 24-hour sliding window, the alert engine fires:
1. **Instant WebSocket Push:** Broadcasts over STOMP to `/topic/pharmacy/alerts/{region}` directly updating the pharmacist dashboard in real time.
2. **Email Dispatch:** Uses **Resend API** to transmit automated supply advisories with essential medicine checklists to registered regional pharmacies.

## Components
- `surgeDetector.js`: MongoDB aggregation engine computing rolling 24h frequency per condition and pincode.
- `alertDispatcher.js`: Multi-channel notification dispatcher (STOMP topic broadcast + Resend email advisories).
- `inventoryManager.js`: Inventory deficit analyzer comparing pharmacy stock with surge requirements.
