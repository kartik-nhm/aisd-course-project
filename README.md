# Smart Telehealth & Clinical Intelligence Platform
> **AI-Assisted Software Development (AISD) Course Project**
> An integrated platform unifying real-time WebRTC telemedicine, automated clinical ambient scribing, multilingual vernacular health assistance, and proactive regional pharmacy outbreak surveillance.

---

## 1. System Architecture Overview

The platform bridges real-time clinical consultations with ambient intelligence and community healthcare networks through a modular, decoupled architecture:

```mermaid
flowchart TD
    subgraph Clients["Portals (services/web-frontend)"]
        Pat["Patient Portal"]
        Doc["Doctor Portal"]
        Phar["Pharmacy Portal"]
    end

    subgraph Core["Platform Core (services/api-backend)"]
        Gateway["Express API Gateway & JWT Auth"]
        WS["STOMP / WebSocket Signaling Broker"]
        DB[("MongoDB Database")]
    end

    subgraph AI["AI Microservice (services/ai-service)"]
        Chat["Multilingual RAG (Pinecone + Groq + Gemini)"]
        Surge["Regional Surge Detection Engine"]
        Triage["4-Tier Severity Triager"]
    end

    subgraph Modules["Decoupled Domain Modules (/modules)"]
        M1["Module 1: telehealth-signaling"]
        M2["Module 2: clinical-ai-scribe"]
        M3["Module 3: prescription-generator"]
        M4["Module 4: multilingual-chatbot"]
        M5["Module 5: pharmacy-alerts"]
    end

    Doc & Pat <--> WS
    Pat & Doc & Phar <--> Gateway
    Gateway <--> DB
    Gateway --> M2
    Gateway --> M3
    Chat --> M4
    Surge --> M5
    M5 -->|/topic/pharmacy/alerts/{pincode}| WS
    WS --> Phar
```

---

## 2. Decided Technical Modules

The platform is structured into five core, independently testable domain modules:

| Module | Feature | Core Technologies | Primary Responsibilities |
| :--- | :--- | :--- | :--- |
| **`modules/telehealth-signaling`** | Feature 1 | Jitsi Meet WebRTC, STOMP over WebSocket, Web Audio API | Low-latency audio/video consultations, doctor availability status, call invitation routing, and dual-track audio recording. |
| **`modules/clinical-ai-scribe`** | Feature 2 | AssemblyAI REST, Google Gemini 2.5 Flash, LangChain | Conversational audio transcription with speaker diarization, strict JSON clinical entity extraction, and 4-tier triage classification (`Low`, `Medium`, `High`, `Critical`). |
| **`modules/prescription-generator`** | Feature 3 | jsPDF, Regex dosage parsers, MongoDB | Standardized dosage formatting (OD, BD, TDS, SOS), client/server PDF generation of signed prescriptions, and EHR record storage. |
| **`modules/multilingual-chatbot`** | Feature 4 | FastAPI, Pinecone, Groq LLaMA 3.1, Gemini | Multilingual auto-detection and translation (English, Romanized Hindi/Urdu, Romanized Kannada), semantic vector search (`intfloat/e5-base-v2`), and clinical advice with legal disclaimers. |
| **`modules/pharmacy-alerts`** | Feature 5 | MongoDB Aggregation, STOMP push, Resend API | 24-hour rolling query aggregation by pincode, disease outbreak detection ($\text{queryCount} \ge X$), real-time `/topic/pharmacy/alerts/{pincode}` push, and automated email advisories. |

---

## 3. Directory Layout

```
aisd-course-project/
├── README.md                           # Master Project Documentation
├── TECHNOLOGY_SURVEY.md                # System Architecture & Tech Stack Survey
├── package.json                        # Root monorepo workspace configuration
├── .env.example                        # Consolidated environment variable configuration
├── .gitignore                          # Standard git ignore rules
├── docs/
│   └── Software_Requirements_Specification.docx  # Comprehensive IEEE 830 SRS Document
├── modules/                            # Standalone Domain Modules
│   ├── telehealth-signaling/           # WebRTC signaling, STOMP broker, room coordination
│   ├── clinical-ai-scribe/             # Transcription, Gemini clinical extraction, triage classifier
│   ├── prescription-generator/         # jsPDF compiler, dosage parsing & prescription builder
│   ├── multilingual-chatbot/           # Language detector, Pinecone RAG engine, Gemini responder
│   └── pharmacy-alerts/                # Surge detection engine, STOMP topic push, Resend dispatcher
├── services/                           # Deployable Service Runtimes
│   ├── api-backend/                    # Express.js REST API, JWT Auth & STOMP server
│   ├── ai-service/                     # FastAPI microservice for Chatbot, RAG & Triage
│   └── web-frontend/                   # Next.js 16 + React 19 Frontend (Patient, Doctor, Pharmacist)
├── tests/                              # Automated Verification Suites
│   ├── verify_modules.js               # Node.js domain module test suite
│   └── verify_ai_module.py             # Python AI module test suite
└── scripts/
    └── generate_srs_doc.py             # Automated SRS Document Generator
```

---

## 4. Getting Started

### 1. Environment Setup
Copy the environment template and populate your API credentials:
```bash
cp .env.example .env
```

Key environment parameters:
- `GOOGLE_API_KEY`: Google Gemini GenAI API key
- `ASSEMBLYAI_API_KEY`: AssemblyAI speech recognition key
- `GROQ_API_KEY`: Groq Cloud key for LLaMA 3.1 inference
- `PINECONE_API_KEY`: Pinecone vector database key
- `RESEND_API_KEY`: Resend API key for transactional email and pharmacy advisories

### 2. Run Domain Module Tests
Verify all five modules standalone before booting services:
```bash
# Verify Node.js Modules (Telehealth, Scribe, Prescription, Pharmacy Alerts)
node tests/verify_modules.js

# Verify Python AI Module (Multilingual Chatbot & Regional Tagging)
python3 tests/verify_ai_module.py
```

### 3. Start Backend Gateway & STOMP Broker
```bash
cd services/api-backend
npm install
npm run dev
```
- REST API Gateway: `http://localhost:8080`
- STOMP WebSocket: `ws://localhost:8080/telehealth-ws`

### 4. Start AI Microservice
```bash
cd services/ai-service
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app:app --host 0.0.0.0 --port 8000 --reload
```
- Interactive API Docs: `http://localhost:8000/docs`

### 5. Start Web Client Portals
```bash
cd services/web-frontend
npm install
npm run dev
```
- Web Application: `http://localhost:3000`
- Pharmacy Early Alert Dashboard: `http://localhost:3000/pharmacy/alerts`

---

## 5. Course Project Deliverables

1. [**`TECHNOLOGY_SURVEY.md`**](file:///Users/kartiknhm/stuff/ai-assisted-software-development/project/smart-telehealth-platform/TECHNOLOGY_SURVEY.md): Comprehensive system architecture survey and technology stack justifications.
2. [**`Software_Requirements_Specification.docx`**](file:///Users/kartiknhm/stuff/ai-assisted-software-development/project/smart-telehealth-platform/docs/Software_Requirements_Specification.docx): Complete IEEE 830 / ISO/IEC/IEEE 29148 Software Requirements Specification with 16 tables, 5 feature specifications, technical cards, and Requirements Traceability Matrix (RTM).
3. **Automated Verification Suites**: Complete unit and integration test coverage for all modules.
