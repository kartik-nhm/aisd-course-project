"""
generate_srs_doc.py
Generates the complete Software Requirements Specification (SRS) for:
Smart Telehealth, Clinical AI Scribe, Multilingual Assistant & Regional Pharmacy Alert System.
Adheres strictly to the docx-minimalist-styling skill and the structure defined in SRS_Table_of_Contents.docx.
"""

import sys
import os
from typing import List, Tuple, Dict, Any

# Append skill scripts to path
SKILL_SCRIPTS_PATH = "/Users/kartiknhm/stuff/ai-assisted-software-development/.agent/skills/docx-minimalist-styling/scripts"
if SKILL_SCRIPTS_PATH not in sys.path:
    sys.path.append(SKILL_SCRIPTS_PATH)

import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml import parse_xml
from docx.oxml.ns import nsdecls, qn

from docx_styler import (
    StylePalette,
    create_document,
    add_header_banner,
    add_section_title,
    format_table,
    set_cell_background,
    set_cell_valign,
    prevent_row_split,
    repeat_header_row,
    add_minimalist_decision_cell,
    add_technical_card,
)

OUTPUT_PATH = sys.argv[1] if len(sys.argv) > 1 else "/Users/kartiknhm/Downloads/SRS_Table_of_Contents-2.docx"
DOCS_SYNC_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "../docs/Software_Requirements_Specification.docx"))


def add_h2(doc: docx.Document, title: str, space_before: float = 12.0, space_after: float = 4.0):
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(space_before)
    p.paragraph_format.space_after = Pt(space_after)
    r = p.add_run(title)
    r.font.name = "Aptos"
    r.font.size = Pt(13.0)
    r.font.bold = True
    r.font.color.rgb = StylePalette.TITLE_BLACK
    return p


def add_h3(doc: docx.Document, title: str, space_before: float = 8.0, space_after: float = 2.0):
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(space_before)
    p.paragraph_format.space_after = Pt(space_after)
    r = p.add_run(title)
    r.font.name = "Aptos"
    r.font.size = Pt(11.0)
    r.font.bold = True
    r.font.color.rgb = StylePalette.SUBTITLE_SLATE
    return p


def add_p(doc: docx.Document, text: str, space_before: float = 0.0, space_after: float = 4.0, bold_prefix: str = None):
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(space_before)
    p.paragraph_format.space_after = Pt(space_after)
    p.paragraph_format.line_spacing = 1.15
    if bold_prefix:
        r_pre = p.add_run(bold_prefix)
        r_pre.font.name = "Aptos"
        r_pre.font.size = Pt(10.0)
        r_pre.font.bold = True
        r_pre.font.color.rgb = StylePalette.TITLE_BLACK
    r = p.add_run(text)
    r.font.name = "Aptos"
    r.font.size = Pt(10.0)
    r.font.color.rgb = StylePalette.BODY_SLATE
    return p


def add_bullet(doc: docx.Document, text: str, bold_prefix: str = None):
    p = doc.add_paragraph(style="List Bullet")
    p.paragraph_format.space_before = Pt(1.0)
    p.paragraph_format.space_after = Pt(2.0)
    p.paragraph_format.line_spacing = 1.15
    if bold_prefix:
        r_pre = p.add_run(bold_prefix)
        r_pre.font.name = "Aptos"
        r_pre.font.size = Pt(9.5)
        r_pre.font.bold = True
        r_pre.font.color.rgb = StylePalette.TITLE_BLACK
    r = p.add_run(text)
    r.font.name = "Aptos"
    r.font.size = Pt(9.5)
    r.font.color.rgb = StylePalette.BODY_SLATE
    return p


def build_table(
    doc: docx.Document,
    headers: List[str],
    rows_data: List[List[Any]],
    col_widths: List[int],
    total_width: int = 8640,
    decision_col_idx: int = -1,
):
    table = doc.add_table(rows=len(rows_data) + 1, cols=len(headers))
    format_table(table, col_widths, total_width)

    # Style Header Row
    hdr_cells = table.rows[0].cells
    for i, title in enumerate(headers):
        set_cell_background(hdr_cells[i], "F1F5F9")
        set_cell_valign(hdr_cells[i], "center")
        p = hdr_cells[i].paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER if (i == decision_col_idx or "Priority" in title or "Status" in title) else WD_ALIGN_PARAGRAPH.LEFT
        p.paragraph_format.space_before = Pt(3)
        p.paragraph_format.space_after = Pt(3)
        r = p.add_run(title)
        r.font.name = "Aptos"
        r.font.size = Pt(9.5)
        r.font.bold = True
        r.font.color.rgb = StylePalette.TITLE_BLACK

    # Style Data Rows
    for r_idx, row in enumerate(rows_data):
        row_cells = table.rows[r_idx + 1].cells
        bg_color = "F8FAFC" if (r_idx % 2 == 1) else "FFFFFF"
        for c_idx, val in enumerate(row):
            set_cell_background(row_cells[c_idx], bg_color)
            set_cell_valign(row_cells[c_idx], "top" if c_idx != decision_col_idx else "center")
            if c_idx == decision_col_idx:
                add_minimalist_decision_cell(row_cells[c_idx], str(val))
            else:
                p = row_cells[c_idx].paragraphs[0]
                p.paragraph_format.space_before = Pt(2)
                p.paragraph_format.space_after = Pt(2)
                p.paragraph_format.line_spacing = 1.15
                r = p.add_run(str(val))
                r.font.name = "Aptos"
                r.font.size = Pt(9.5)
                r.font.color.rgb = StylePalette.BODY_SLATE

    # Space after table
    p_spacer = doc.add_paragraph()
    p_spacer.paragraph_format.space_before = Pt(0)
    p_spacer.paragraph_format.space_after = Pt(4)
    return table


def generate_srs():
    print("Generating comprehensive SRS document...")
    doc = create_document(page_width_in=8.27, page_height_in=11.69, margin_in=1.0, font_name="Aptos", body_size_pt=10.0)

    # ---------------------------------------------------------
    # TOP BANNER & TITLE
    # ---------------------------------------------------------
    add_header_banner(doc, "IEEE 830 / ISO/IEC/IEEE 29148 STANDARD SPECIFICATION  |  CONFIDENTIAL")
    add_section_title(
        doc,
        "Software Requirements Specification (SRS)",
        "Smart Telehealth, Clinical AI Scribe, Multilingual Assistant & Regional Pharmacy Alert System\nDocument ID: SRS-STP-2026-V1  •  Status: Approved Production Specification  •  Version: 1.0",
        space_before_pt=4,
        space_after_pt=12,
    )

    # ---------------------------------------------------------
    # SECTION 1: INTRODUCTION
    # ---------------------------------------------------------
    add_h2(doc, "1. Introduction")

    add_h3(doc, "1.1 Purpose")
    add_p(
        doc,
        "This Software Requirements Specification (SRS) provides a comprehensive, rigorous technical blueprint for the Smart Telehealth Platform. It formalizes both functional and non-functional requirements for developers, cloud architects, machine learning engineers, healthcare compliance officers, and clinical evaluators. The system integrates low-latency WebRTC video consultations, automated speech-to-text with conversational diarization, clinical entity extraction using Google Gemini, four-tier medical severity triage, client-side digital prescription compilation via jsPDF, multilingual vernacular health assistance, and an automated regional pharmacy surge alert engine.",
    )

    add_h3(doc, "1.2 Document Conventions")
    add_p(
        doc,
        "This document follows the IEEE 830 and ISO/IEC/IEEE 29148 international standards for requirements engineering. Requirements are uniquely identified using structured alphanumerical tags (e.g., FR-1.1 for Functional Requirements, NFR-2.1 for Non-Functional Requirements). Prioritization adheres to standard industry levels (Critical, High, Medium, Low). In accordance with the docx-minimalist-styling design framework, tables utilize high-contrast slate typography, comfortable padding, repeating headers, and minimalist status indicators.",
    )

    conventions_data = [
        ["Critical", "Must be implemented for initial release; core clinical safety or diagnostic functionality.", "Accept"],
        ["High", "Essential for standard operation; primary user workflows and notification pipelines.", "Accept"],
        ["Medium", "Important feature that enhances usability or optimization; may be delivered in minor updates.", "Modify"],
        ["Low", "Optional or speculative enhancement; non-essential administrative functionality.", "Modify"],
    ]
    build_table(
        doc,
        ["Priority Marker", "Architectural Definition & Operational Impact", "Status"],
        conventions_data,
        [1800, 5340, 1500],
        total_width=8640,
        decision_col_idx=2,
    )

    add_h3(doc, "1.3 Intended Audience and Reading Suggestions")
    add_p(
        doc,
        "This document is organized into modular sections catering to distinct technical and operational personas across the engineering and healthcare lifecycle:",
    )

    audience_data = [
        ["Full-Stack & Backend Developers", "Sections 2, 3, 4.1, 4.5, Appendix B", "Focus on Node.js Express APIs, STOMP WebSocket broker, MongoDB schemas, and WebRTC Jitsi signaling."],
        ["AI & NLP Engineers", "Sections 4.2, 4.4, 5.1, Appendix B", "Focus on AssemblyAI REST audio pipeline, Gemini prompt engineering, LangChain triage, and Pinecone RAG."],
        ["Clinical QA & Medical Officers", "Sections 4.2, 4.3, 5.2, 5.5", "Focus on clinical entity extraction validation, dosage regex sanitization, legal disclaimers, and triage guidelines."],
        ["Security & Compliance Auditors", "Sections 2.5, 5.2, 5.3, 5.5", "Focus on HIPAA, Telemedicine Practice Guidelines, JWT auth, TLS 1.3 encryption, and data sanitization."],
        ["Community Pharmacists & Ops", "Sections 4.5, 4.6 (UC-4), 5.1", "Focus on pincode surge detection thresholds, STOMP alert topics, and Resend email restock advisories."],
    ]
    build_table(
        doc,
        ["User Class / Persona", "Recommended Reading Path", "Key Architectural Focus Areas"],
        audience_data,
        [2200, 2440, 4000],
        total_width=8640,
    )

    add_h3(doc, "1.4 Product Scope")
    add_p(
        doc,
        "The Smart Telehealth Platform is an integrated clinical ecosystem engineered to eliminate operational bottlenecks in remote patient care. Core objectives include:",
    )
    add_bullet(doc, "Doctor-Patient Live Consultations: Secure, zero-install WebRTC video calling embedded seamlessly in browser portals without third-party desktop app dependencies.", "• Telehealth Streaming: ")
    add_bullet(doc, "Automated Clinical AI Scribing: Real-time dual-track audio capture transcribed by AssemblyAI and parsed by Google Gemini 2.5 Flash into standardized medical JSON summaries.", "• Ambient Scribing: ")
    add_bullet(doc, "Emergency Severity Triaging: Automated 4-tier risk classification categorizing cases as Low, Medium, High, or Critical based on clinical symptom severity.", "• Triage Engine: ")
    add_bullet(doc, "Instant Prescription Generation: Automated client-side compilation of digitally signed, standardized prescriptions formatted with jsPDF.", "• Digital Rx: ")
    add_bullet(doc, "Multilingual Vernacular Chatbot: High-throughput medical Q&A supporting Romanized Hindi/Urdu (Hinglish), Romanized Kannada (Kanglish), and English.", "• Multilingual RAG: ")
    add_bullet(doc, "Proactive Pharmacy Early Warning: Automated aggregation of anonymized symptoms by postal pincode, triggering instant STOMP push and Resend email alerts to pharmacies when disease surges occur.", "• Outbreak Defense: ")

    add_h3(doc, "1.5 Definitions, Acronyms, and Abbreviations")
    glossary_data = [
        ["EHR", "Electronic Health Record: Digital repository of patient clinical consultations, diagnoses, and treatments."],
        ["WebRTC", "Web Real-Time Communication: Open framework enabling audio/video communication inside web browsers."],
        ["STOMP", "Simple Text Oriented Messaging Protocol: Lightweight wire format running over WebSockets for pub/sub messaging."],
        ["RAG", "Retrieval-Augmented Generation: Architecture combining semantic vector search with LLMs to eliminate hallucination."],
        ["STT", "Speech-to-Text: Computational transcription of spoken audio into written text via deep acoustic models."],
        ["LLM", "Large Language Model: Advanced neural models (e.g., Google Gemini, Groq LLaMA) for natural language reasoning."],
        ["jsPDF", "JavaScript PDF Generation Library: High-performance client and server library for instant PDF rendering."],
        ["HIPAA", "Health Insurance Portability and Accountability Act: US data privacy standard for safeguarding Protected Health Information (PHI)."],
        ["NMC / MCI", "National Medical Commission / Medical Council of India: Regulatory guidelines governing telemedicine prescriptions."],
        ["Rx / Latin Sig", "Prescription directions: OD (once daily), BD (twice daily), TDS (thrice daily), QID (four times daily), SOS (as needed)."],
    ]
    build_table(
        doc,
        ["Acronym / Term", "Formal Engineering & Medical Definition"],
        glossary_data,
        [1800, 6840],
        total_width=8640,
    )

    # ---------------------------------------------------------
    # SECTION 2: OVERALL DESCRIPTION
    # ---------------------------------------------------------
    add_h2(doc, "2. Overall Description")

    add_h3(doc, "2.1 Product Perspective")
    add_p(
        doc,
        "The platform operates as a cohesive, distributed microservices ecosystem designed to bridge synchronous telemedicine with asynchronous clinical intelligence. Unlike traditional telehealth portals that treat video calls and medical documentation as disconnected workflows, this system establishes an automated pipeline connecting live dialogue to structured EHR records, multilingual triage, and regional public health surveillance.",
    )
    add_p(
        doc,
        "The system consists of three deployable runtimes mounting five decoupled domain modules: (1) A Next.js 16 / React 19 Frontend housing role-based portals for Patients, Doctors, and Pharmacists; (2) A Node.js Express API Gateway with an integrated STOMP over WebSocket broker and MongoDB Mongoose persistence; and (3) A Python FastAPI AI microservice hosting the Pinecone vector database, Groq LLaMA translation layer, and Gemini response engines.",
    )

    add_h3(doc, "2.2 Product Functions")
    add_bullet(doc, "Room coordination, doctor availability tracking, call invitation ringing, and dual-track Web Audio mixing.", "1. Telehealth & Signaling: ")
    add_bullet(doc, "Conversational transcription via AssemblyAI, clinical entity parsing via Gemini, and 4-tier triage classification.", "2. Clinical AI Scribe: ")
    add_bullet(doc, "Dosage regex standardization, client-side PDF rendering via jsPDF, and UUID-indexed medical vault storage.", "3. Prescription Generator: ")
    add_bullet(doc, "Vernacular language/script auto-detection, Pinecone vector retrieval, and contextual medical generation with mandatory disclaimers.", "4. Multilingual RAG Chatbot: ")
    add_bullet(doc, "Rolling 24-hour query frequency aggregation by pincode, STOMP topic broadcast (/topic/pharmacy/alerts/{pincode}), and Resend email restock advisories.", "5. Regional Pharmacy Alert System: ")

    add_h3(doc, "2.3 User Classes and Characteristics")
    user_classes_data = [
        ["Patient", "Low to Moderate", "Role Code: '01'. Accesses multilingual medical chatbot, initiates on-demand consultations, views history, downloads prescriptions.", "Daily / As needed"],
        ["Doctor", "Moderate to High", "Role Code: '02'. Manages incoming patient queue, toggles live availability, conducts video consults, approves AI-scribed notes, signs prescriptions.", "Continuous / Work Shift"],
        ["Pharmacist", "Moderate", "Role Code: '03'. Subscribes to regional pincode STOMP alerts, reviews outbreak summaries, analyzes stock deficits, restocks essential drugs.", "Daily / Business Hours"],
        ["System Administrator", "High", "Superuser role. Manages API credentials, monitors WebSocket broker health, oversees compliance audit logs, adjusts surge thresholds.", "Maintenance / Weekly"],
    ]
    build_table(
        doc,
        ["User Class", "Technical Literacy", "Access Privileges & Primary Workflows", "Usage Pattern"],
        user_classes_data,
        [1600, 1600, 4240, 1200],
        total_width=8640,
    )

    add_h3(doc, "2.4 Operating Environment")
    add_p(doc, "The software platform is architected to operate reliably across the following minimum infrastructure specifications:")
    add_bullet(doc, "Google Chrome (v110+), Mozilla Firefox (v115+), Apple Safari (v16+), Microsoft Edge (v110+). Client devices require functional microphone and webcam hardware.", "• Client Browsers: ")
    add_bullet(doc, "Linux (Ubuntu 22.04 LTS / Debian 12) or macOS (14+) with minimum 4 vCPUs, 8 GB RAM, and Node.js v20+ runtime.", "• Backend Host: ")
    add_bullet(doc, "Python 3.11+ environment with Uvicorn ASGI server and PyTorch/HuggingFace runtime libraries.", "• AI Microservice Host: ")
    add_bullet(doc, "MongoDB 7.0+ Community / Enterprise Edition configured with replica sets and secondary indexing on pincode, datetime, and user roles.", "• Persistence Store: ")

    add_h3(doc, "2.5 Design and Implementation Constraints")
    add_bullet(doc, "Consultation notes and patient documents must adhere to Telemedicine Practice Guidelines and HIPAA standards. Data in transit must be protected via TLS 1.3.", "1. Medical Data Privacy: ")
    add_bullet(doc, "To prevent hallucination in medical notes, Google Gemini 2.5 Flash must operate with temperature <= 0.1 and strict JSON schema prompts.", "2. Model Determinism: ")
    add_bullet(doc, "The AI chatbot must append an explicit legal medical disclaimer to every answer and reject emergency triage diagnostic assertions.", "3. Clinical Disclaimers: ")
    add_bullet(doc, "Audio buffers uploaded for transcription must not exceed 30 MB per session and must be sanitized immediately following transcript generation.", "4. Audio Storage Limits: ")

    add_h3(doc, "2.6 User Documentation")
    add_p(
        doc,
        "The project includes comprehensive user documentation: (1) Doctor & Clinical Scribe Workflow Guide, (2) Pharmacist Regional Alert Operations Manual, (3) REST API Gateway Swagger/OpenAPI documentation, (4) WebSocket STOMP Wire Specification, and (5) Docker Deployment and Environment Configuration Guide.",
    )

    add_h3(doc, "2.7 Assumptions and Dependencies")
    add_bullet(doc, "AssemblyAI API availability for speech-to-text processing; fallback deterministic templates trigger if API times out.", "• Speech Recognition: ")
    add_bullet(doc, "Google Gemini API and Groq Cloud endpoints operating within rate limits (>99.9% uptime SLA).", "• Generative AI: ")
    add_bullet(doc, "Pinecone Serverless vector database hosting pre-indexed medical knowledge base embeddings.", "• Vector Storage: ")
    add_bullet(doc, "Resend API operational for delivering transactional OTPs and emergency pharmacy stock advisory emails.", "• Notification Delivery: ")
    add_bullet(doc, "Patients and doctors possess minimum 2.0 Mbps broadband connectivity for standard WebRTC 720p video streaming.", "• Network Bandwidth: ")

    # ---------------------------------------------------------
    # SECTION 3: EXTERNAL INTERFACE REQUIREMENTS
    # ---------------------------------------------------------
    add_h2(doc, "3. External Interface Requirements")

    add_h3(doc, "3.1 User Interfaces (UI)")
    add_p(
        doc,
        "The user interfaces are crafted with Next.js 16 (App Router), React 19, and Tailwind CSS following modern healthcare human-interface guidelines:",
    )
    add_bullet(doc, "Accessible, high-contrast consultation initiation screen, integrated Jitsi external frame, real-time doctor availability badge, and floating multilingual AI chat drawer.", "• Patient Portal: ")
    add_bullet(doc, "Queue-based dashboard with patient card details, real-time incoming call ringing modals, live audio recording widget, Gemini-extracted clinical summary editor, and one-click jsPDF prescription compiler.", "• Doctor Portal: ")
    add_bullet(doc, "Live STOMP alert ticker, pincode surveillance switcher, visual outbreak risk cards (Dengue, Flu, Malaria), essential restock checklists, and inventory deficit calculators.", "• Pharmacy Portal: ")

    add_h3(doc, "3.2 Hardware Interfaces")
    add_p(
        doc,
        "The system interacts directly with client audio and video capture hardware via the HTML5 MediaDevices API and Web Audio API (`AudioContext`). Dual-track audio capture merges the physician's local microphone track with the patient's remote WebRTC audio stream into a unified 44.1 kHz, 16-bit mono WebM/WAV stream via `MediaRecorder`.",
    )

    add_h3(doc, "3.3 Software Interfaces")
    software_interfaces_data = [
        ["AssemblyAI REST API", "v2/upload & v2/transcript", "Submits consultation audio buffers; polls for diarized transcripts.", "HTTPS / REST (TLS 1.3)"],
        ["Google Gemini API", "models/gemini-2.5-flash:generateContent", "Executes strict JSON clinical entity extraction and chatbot reasoning.", "HTTPS / REST (JSON)"],
        ["Groq Cloud API", "openai/v1/chat/completions (llama-3.1-8b)", "Performs sub-second multilingual script detection and English translation.", "HTTPS / REST (JSON)"],
        ["Pinecone Vector Store", "Index: medical-knowledge-base", "Retrieves top-k semantically relevant clinical literature passages.", "HTTPS / gRPC"],
        ["Resend API", "v1/emails", "Dispatches transactional verification OTPs and pharmacy surge advisories.", "HTTPS / REST (JSON)"],
        ["MongoDB Engine", "Mongoose ODM v8.x", "Persists user credentials, consultation summaries, query logs, and alerts.", "TCP / Mongo Wire Protocol"],
    ]
    build_table(
        doc,
        ["External System", "Endpoint / Identifier", "Functional Purpose", "Protocol / Security"],
        software_interfaces_data,
        [2000, 2440, 2600, 1600],
        total_width=8640,
    )

    add_h3(doc, "3.4 Communications Interfaces")
    add_p(doc, "All network communications are secured using industry-standard protocols:")
    add_bullet(doc, "All REST API endpoints enforce HTTPS with TLS 1.3 encryption and CORS credential verification.", "• REST API Gateway: ")
    add_bullet(doc, "STOMP 1.2 protocol executed over secure WebSocket (WSS) at endpoint '/telehealth-ws' authenticated via JWT bearer token in connection headers.", "• Real-Time Signaling: ")
    add_bullet(doc, "Audio and video streams encrypted end-to-end using Secure Real-time Transport Protocol (SRTP) and DTLS 1.2.", "• WebRTC Media: ")

    # ---------------------------------------------------------
    # SECTION 4: SYSTEM FEATURES & FUNCTIONAL REQUIREMENTS
    # ---------------------------------------------------------
    add_h2(doc, "4. System Features & Functional Requirements")

    # Feature 1
    add_h3(doc, "4.1 Feature 1: Doctor-to-Patient Live Video Call & Signaling")
    add_p(doc, "Implementation Priority: HIGH  •  Component: modules/telehealth-signaling", bold_prefix="• ")
    add_p(
        doc,
        "Enables end-to-end encrypted, low-latency audio/video consultations between verified patients and registered doctors. Utilizes Jitsi Meet API embedded via iframe alongside a Node.js STOMP WebSocket signaling engine for call invitations, doctor availability tracking, and browser Web Audio API dual-track recording.",
    )
    add_p(doc, "Stimulus / Response Sequences:", bold_prefix="• ")
    add_bullet(doc, "Doctor logs into portal -> Backend updates DoctorAvailabilityRegistry -> STOMP heartbeat extended every 30s.", "1. Availability: ")
    add_bullet(doc, "Patient clicks 'Start Call' -> Client sends STOMP frame to '/app/consultation/create' -> Backend routes ringing message to doctor queue '/user/queue/.../videocall-details'.", "2. Call Request: ")
    add_bullet(doc, "Doctor accepts -> Both clients load Jitsi consultation room -> Web Audio API records combined conversation stream.", "3. Session Active: ")

    f1_requirements = [
        ["FR-1.1", "Doctor Availability Signaling", "System shall allow doctors to toggle online availability and broadcast heartbeat signals every 30 seconds via STOMP.", "Accept"],
        ["FR-1.2", "Consultation Room Generation", "System shall generate cryptographically secure, unique consultation room UUIDs and embed Jitsi WebRTC video rooms.", "Accept"],
        ["FR-1.3", "Ringing & Queue Dispatch", "System shall transmit instant ringing notifications to the designated physician queue via STOMP frame routing.", "Accept"],
        ["FR-1.4", "Dual-Track Audio Capture", "Client browser shall mix doctor microphone and patient audio into a unified 44.1 kHz stream using Web Audio API.", "Accept"],
        ["FR-1.5", "Session Termination & Teardown", "System shall handle graceful disconnects, stop media tracks, and transmit the final recorded audio blob to the scribing API.", "Accept"],
    ]
    build_table(
        doc,
        ["Requirement ID", "Functional Specification", "Detailed Processing Rules", "Status"],
        f1_requirements,
        [1400, 2400, 3640, 1200],
        total_width=8640,
        decision_col_idx=3,
    )

    # Feature 2
    add_h3(doc, "4.2 Feature 2: Automated Video Call Summarization, Clinical Extraction & Severity Triaging")
    add_p(doc, "Implementation Priority: HIGH  •  Component: modules/clinical-ai-scribe", bold_prefix="• ")
    add_p(
        doc,
        "Converts consultation audio recordings into structured electronic medical records. AssemblyAI transcribes dialogue with language detection and speaker diarization. Google Gemini 2.5 Flash executes strict JSON entity extraction (symptoms, diagnosis, prescription, vitals, lifestyle advice, tests, follow-up plan). LangChain severity triaging classifies cases into Low, Medium, High, or Critical risk tiers.",
    )

    f2_requirements = [
        ["FR-2.1", "Audio Ingestion & STT Upload", "Backend shall accept audio buffers up to 30 MB and upload them to AssemblyAI with language detection enabled.", "Accept"],
        ["FR-2.2", "Speaker Diarization Polling", "System shall poll AssemblyAI transcript endpoint with exponential backoff until transcription status is 'completed'.", "Accept"],
        ["FR-2.3", "Gemini Clinical Extraction", "System shall query Gemini 2.5 Flash at temperature 0.1 with strict JSON schema to extract clinical entities without hallucination.", "Accept"],
        ["FR-2.4", "Vitals & Diagnosis Normalization", "System shall normalize extracted BP, pulse, temperature, SpO2, and diagnosis lists into validated schema objects.", "Accept"],
        ["FR-2.5", "4-Level Severity Triaging", "System shall classify consultations into Low, Medium, High, or Critical severity with a clinical rationale and urgency window.", "Accept"],
        ["FR-2.6", "Consultation Note Persistence", "System shall persist transcript context, clinical entities, and triage scores into MongoDB ConversationSummary collection.", "Accept"],
    ]
    build_table(
        doc,
        ["Requirement ID", "Functional Specification", "Detailed Processing Rules", "Status"],
        f2_requirements,
        [1400, 2400, 3640, 1200],
        total_width=8640,
        decision_col_idx=3,
    )

    # Technical Card for Scribing
    scribe_spec_elements = [
        (
            "[ELEMENT 1 — CLINICAL JSON SCHEMA]",
            "Strict JSON shape returned by Google Gemini 2.5 Flash (temperature: 0.1)",
            [
                ("• Output: ", "JSON Root: ", '{"symptoms": ["str"], "diagnosis": ["str"], "prescription": [...], "vitals": {...}}'),
                ("• Fields: ", "Prescription Array: ", '[{"medicine": "str", "dosage": "str", "frequency": "str", "duration": "str"}]'),
                ("• Fields: ", "Objective Vitals: ", '{"bloodPressure": "str", "pulse": "str", "temperature": "str", "spo2": "str"}'),
                ("• Rule: ", "(USE THIS) Strict Determinism: ", "Zero markdown ticks, raw JSON single line output, no conversational preamble."),
            ],
        ),
        (
            "[ELEMENT 2 — 4-LEVEL TRIAGE RULES]",
            "Clinical triage severity classification tiers",
            [
                ("• Low Tier: ", "Minor Ailments: ", "Non-urgent conditions (common cold, mild headache, simple abrasions)."),
                ("• Medium Tier: ", "Routine Review: ", "Requires doctor visit within 24h (rashes, controlled chronic issues, mild sprains)."),
                ("• High Tier: ", "Urgent Care: ", "Prompt attention needed within 4h (high fever >=103F with confusion, suspected fracture)."),
                ("• Critical Tier: ", "Life-Threatening Emergency: ", "Immediate hospital ER care within 1h (chest pain radiating to arm, stroke signs, shock)."),
                ("• Rule: ", "(USE THIS) Safe Fallback: ", "Err on the side of caution; assign lower tier if clinical indicators are ambiguous."),
            ],
        ),
    ]
    add_technical_card(doc, "Clinical AI Scribe & Triage Specification Card", scribe_spec_elements)

    # Feature 3
    add_h3(doc, "4.3 Feature 3: Automated Prescription & Clinical Note Generation")
    add_p(doc, "Implementation Priority: HIGH  •  Component: modules/prescription-generator", bold_prefix="• ")
    add_p(
        doc,
        "Automates the compilation, regex sanitization, and printing of clinical prescriptions and medical visit summaries. Integrates regex dosage parsers with jsPDF to compile professional medical prescriptions formatted with clinic headers, patient demographic cards, allergy alert banners, diagnosis lists, structured Rx tables, and digital doctor signatures.",
    )

    f3_requirements = [
        ["FR-3.1", "Dosage Regex Parsing", "System shall sanitize freeform medicine text and map Latin abbreviations (OD, BD, TDS, QID, SOS) into patient-readable guidance.", "Accept"],
        ["FR-3.2", "Allergy Alert Banner", "Prescription compiler shall highlight recorded patient drug allergies in bold crimson (#B91C1C) at the top of the document.", "Accept"],
        ["FR-3.3", "Structured Rx Table", "jsPDF compiler shall generate an alternating-row table with medicine name, strength, frequency, duration, and food instructions.", "Accept"],
        ["FR-3.4", "Doctor Digital Signature Block", "System shall embed doctor name, medical council registration number, clinic branding, and digital timestamp.", "Accept"],
        ["FR-3.5", "Client & Server PDF Export", "System shall allow doctors to download prescriptions instantly in browser and allow backend streaming via REST endpoint.", "Accept"],
    ]
    build_table(
        doc,
        ["Requirement ID", "Functional Specification", "Detailed Processing Rules", "Status"],
        f3_requirements,
        [1400, 2400, 3640, 1200],
        total_width=8640,
        decision_col_idx=3,
    )

    # Feature 4
    add_h3(doc, "4.4 Feature 4: Multilingual Medical AI Chatbot & Regional Query Tagging")
    add_p(doc, "Implementation Priority: MEDIUM-HIGH  •  Component: modules/multilingual-chatbot", bold_prefix="• ")
    add_p(
        doc,
        "A high-performance RAG chatbot microservice hosted in FastAPI. Groq LLaMA 3.1 auto-detects language and script (English, Romanized Hindi/Urdu, Romanized Kannada) and translates queries into clinical English. Pinecone retrieves medical context indexed with HuggingFace embeddings. Google Gemini generates empathetic responses in vernacular scripts with mandatory clinical disclaimers. Crucially, the pipeline extracts clinical condition entities and user pincodes to feed the Regional Pharmacy Early Alert System.",
    )

    f4_requirements = [
        ["FR-4.1", "Vernacular Language Detection", "System shall utilize Groq LLaMA 3.1 to detect whether query is in English, Romanized Hindi (Hinglish), or Romanized Kannada.", "Accept"],
        ["FR-4.2", "Clinical English Translation", "System shall translate vernacular medical complaints into standardized clinical English for vector database lookup.", "Accept"],
        ["FR-4.3", "Pinecone Semantic Retrieval", "System shall query Pinecone index using HuggingFace 'intfloat/e5-base-v2' embeddings to retrieve top-3 clinical literature passages.", "Accept"],
        ["FR-4.4", "Empathetic Localized Generation", "Google Gemini / Groq shall generate conversational replies in the user's input language and script with structured care advice.", "Accept"],
        ["FR-4.5", "Mandatory Legal Disclaimer", "Every chatbot reply must append the standardized non-physician medical AI disclaimer.", "Accept"],
        ["FR-4.6", "Regional Query Logging", "Chatbot shall extract condition keywords and user postal pincode and log them asynchronously to MongoDB ChatQueryLog.", "Accept"],
    ]
    build_table(
        doc,
        ["Requirement ID", "Functional Specification", "Detailed Processing Rules", "Status"],
        f4_requirements,
        [1400, 2400, 3640, 1200],
        total_width=8640,
        decision_col_idx=3,
    )

    # Feature 5
    add_h3(doc, "4.5 Feature 5: Regional Pharmacy Early Alert System")
    add_p(doc, "Implementation Priority: HIGH  •  Component: modules/pharmacy-alerts", bold_prefix="• ")
    add_p(
        doc,
        "A public health early warning engine that monitors chatbot queries and consultation logs grouped by condition and postal pincode. When query frequency reaches or exceeds threshold X (default: 5) within a 24-hour sliding window, the alert engine fires: (1) Instant WebSocket push over STOMP to '/topic/pharmacy/alerts/{pincode}', updating the pharmacist dashboard in real time, and (2) Automated Resend API emails transmitting supply advisories with essential medicine restock checklists.",
    )

    f5_requirements = [
        ["FR-5.1", "Sliding 24h Aggregation", "MongoDB aggregation pipeline shall compute rolling 24-hour query counts grouped by condition and pincode.", "Accept"],
        ["FR-5.2", "Threshold Evaluation Trigger", "System shall evaluate surge condition when queryCount >= threshold X (default: 5) and classify surge as ELEVATED or CRITICAL.", "Accept"],
        ["FR-5.3", "Essential Medicine Mapping", "System shall map surging condition (Dengue, Flu, Malaria) to pre-configured essential medicine supply checklists.", "Accept"],
        ["FR-5.4", "STOMP WebSocket Alert Push", "System shall broadcast live JSON alert payloads to regional topic '/topic/pharmacy/alerts/{pincode}' and global pharmacy topic.", "Accept"],
        ["FR-5.5", "Resend Email Supply Advisory", "System shall look up registered pharmacies in that pincode and dispatch formatted HTML restock advisories via Resend API.", "Accept"],
        ["FR-5.6", "Inventory Deficit Calculation", "Pharmacist portal shall compare shelf inventory quantities against surge recommendations and highlight deficit items.", "Accept"],
    ]
    build_table(
        doc,
        ["Requirement ID", "Functional Specification", "Detailed Processing Rules", "Status"],
        f5_requirements,
        [1400, 2400, 3640, 1200],
        total_width=8640,
        decision_col_idx=3,
    )

    # Technical Card for Pharmacy Alerts
    pharmacy_spec_elements = [
        (
            "[ELEMENT 1 — SURGE AGGREGATION PIPELINE]",
            "MongoDB 24-hour sliding aggregation query",
            [
                ("• Match: ", "Filter Criteria: ", "{ createdAt: { $gte: cutoff24h }, pincode: { $exists: true }, condition: { $exists: true } }"),
                ("• Group: ", "Compound Key: ", "{ _id: { pincode: '$pincode', condition: '$detectedCondition' }, queryCount: { $sum: 1 } }"),
                ("• Filter: ", "Threshold Breach: ", "{ queryCount: { $gte: threshold_X } } (Default threshold X = 5 queries in 24 hours)."),
                ("• Throttle: ", "(USE THIS) Alert Deduping: ", "Only transmit email advisories once per 6-hour sliding window per postal pincode."),
            ],
        ),
        (
            "[ELEMENT 2 — STOMP TOPIC WIRE FORMAT]",
            "Broadcast wire format on /topic/pharmacy/alerts/{pincode}",
            [
                ("• Command: ", "MESSAGE: ", "STOMP 1.2 protocol broadcast to active subscribers."),
                ("• Destination: ", "Topic Path: ", "/topic/pharmacy/alerts/560001 & /topic/pharmacy/alerts"),
                ("• Payload: ", "Surge Advisory JSON: ", '{"type": "REGIONAL_SURGE_ALERT", "pincode": "560001", "condition": "dengue", "queryCount": 7, "severity": "CRITICAL_SURGE"}'),
                ("• Actions: ", "Checklist Dispatch: ", "Lists recommended medicines (e.g. Paracetamol 650mg, ORS Sachets) for immediate shelf restock."),
            ],
        ),
    ]
    add_technical_card(doc, "Pharmacy Surge Alert Specification Card", pharmacy_spec_elements)

    # 4.6 Use Cases
    add_h3(doc, "4.6 Detailed Use Cases / User Stories")
    use_cases_data = [
        ["UC-1: Urgent Video Consult & Scribing", "Patient with acute fever initiates call with available doctor.", "1. Patient verifies phone via OTP.\n2. STOMP rings doctor queue.\n3. Session conducted in WebRTC Jitsi.\n4. Audio captured & sent to AssemblyAI.\n5. Gemini extracts clinical entities.\n6. Case triaged as 'Medium'.", "Prescription & structured note persisted to EHR vault."],
        ["UC-2: Clinical Review & Prescription Export", "Doctor reviews AI-scribed consultation notes and issues signed prescription.", "1. Doctor loads consultation summary.\n2. Edits dosage of Paracetamol to 650mg TDS.\n3. Clicks 'Compile Prescription'.\n4. jsPDF renders high-contrast PDF.\n5. Doctor digitally verifies and signs.", "Printable PDF downloaded and archived with UUID."],
        ["UC-3: Multilingual Vernacular Chatbot", "Rural patient asks health question in Romanized Hindi ('Hinglish').", "1. Patient types: 'Mujhe 3 din se bukhar hai'.\n2. Groq detects Hinglish, translates to English.\n3. Pinecone retrieves viral fever guidelines.\n4. Gemini replies in warm conversational Hinglish.\n5. Query tagged with 'fever' and pincode.", "Patient guided with home care tips & clinic disclaimer."],
        ["UC-4: Community Pharmacy Surge Warning", "Surge in Dengue queries detected in Bangalore pincode 560001.", "1. 6th Dengue query logged within 24 hours.\n2. SurgeDetector flags threshold breach.\n3. STOMP broadcast pushes toast to pharmacist UI.\n4. Resend dispatches email to registered stores.\n5. Pharmacist reviews deficit analysis.", "Community pharmacy restocks ORS and Paracetamol ahead of shortage."],
    ]
    build_table(
        doc,
        ["Use Case Identifier", "Clinical Scenario Description", "Step-by-Step System & User Interactions", "Postcondition / State Change"],
        use_cases_data,
        [1800, 2200, 3240, 1400],
        total_width=8640,
    )

    # ---------------------------------------------------------
    # SECTION 5: NON-FUNCTIONAL REQUIREMENTS (NFRS)
    # ---------------------------------------------------------
    add_h2(doc, "5. Non-Functional Requirements (NFRs)")

    add_h3(doc, "5.1 Performance Requirements")
    nfr_perf_data = [
        ["NFR-1.1", "WebRTC Media Latency", "Audio and video round-trip latency shall remain below 200 ms under standard 4G broadband conditions.", "Accept"],
        ["NFR-1.2", "STOMP Frame Latency", "Signaling frames for call invitations and pharmacy alerts shall be delivered within 50 ms.", "Accept"],
        ["NFR-1.3", "STT Processing Turnaround", "AssemblyAI transcription for a 5-minute consultation shall complete within 15 seconds.", "Accept"],
        ["NFR-1.4", "Clinical Entity Extraction", "Google Gemini 2.5 Flash clinical JSON extraction shall execute within 3.0 seconds.", "Accept"],
        ["NFR-1.5", "jsPDF Document Compilation", "Client-side prescription rendering shall compile and trigger download in under 500 ms.", "Accept"],
        ["NFR-1.6", "Concurrent Consultations", "API Gateway and STOMP server shall support 500 concurrent consultation sessions without socket drops.", "Accept"],
    ]
    build_table(
        doc,
        ["NFR ID", "Performance Metric", "Engineering Target & Latency Bounds", "Status"],
        nfr_perf_data,
        [1200, 2400, 3840, 1200],
        total_width=8640,
        decision_col_idx=3,
    )

    add_h3(doc, "5.2 Safety Requirements")
    add_bullet(doc, "If AssemblyAI or Gemini APIs experience downtime, the system shall fall back to deterministic emergency consultation templates.", "• Deterministic AI Fallback: ")
    add_bullet(doc, "All dosage values, duration days, and frequency codes must pass strict regex validation before entering prescription templates.", "• Dosage Bounds Validation: ")
    add_bullet(doc, "Background query logging and surge detection must run asynchronously without blocking patient chat responses.", "• Non-Blocking Pipelines: ")
    add_bullet(doc, "Patients presenting acute emergency symptoms (chest pain, stroke signs) are immediately prompted with emergency call hotline triggers.", "• Emergency Intercept: ")

    add_h3(doc, "5.3 Security Requirements")
    add_bullet(doc, "Strict separation of Patient (01), Doctor (02), and Pharmacist (03) roles enforced via JWT authorization middleware.", "• Role-Based Access Control: ")
    add_bullet(doc, "Passwords salted and hashed using SHA-256; JWTs signed with HMAC-SHA256 and configured with 24-hour expiration.", "• Cryptographic Tokens: ")
    add_bullet(doc, "All network traffic enforced over TLS 1.3; database connections protected via authenticated MongoDB URI strings.", "• Transport Security: ")
    add_bullet(doc, "All consultation transcripts, clinical summaries, and patient document downloads logged with user IDs and timestamps.", "• Comprehensive Audit Trail: ")

    add_h3(doc, "5.4 Software Quality Attributes")
    add_bullet(doc, "Decoupled microservice architecture allowing independent scaling of Web, Express Gateway, and FastAPI AI containers.", "• Scalability: ")
    add_bullet(doc, "Domain modules housed in standalone 'modules/' directory with decoupled entry points and zero circular dependencies.", "• Maintainability: ")
    add_bullet(doc, "Client portals compliant with WCAG 2.1 AA accessibility standards, responsive across desktop and tablet viewports.", "• Usability: ")
    add_bullet(doc, "Native and Romanized multilingual support for Indian languages (Hindi, Urdu, Kannada) with modular vector stores.", "• Internationalization (i18n): ")

    add_h3(doc, "5.5 Business Rules & Compliance")
    add_bullet(doc, "Every prescription generated must feature a verified physician MCI/NMC registration number and legal digital disclaimer.", "• Telemedicine Guidelines: ")
    add_bullet(doc, "Prescription drugs categorized as Schedule X or habit-forming narcotics are programmatically excluded from digital scribing.", "• Drug Exclusions: ")
    add_bullet(doc, "Community pharmacy surge alerts only trigger when queryCount >= threshold X within a 24-hour window, throttled to 1 email per 6 hours.", "• Surge Alert Quotas: ")

    # ---------------------------------------------------------
    # SECTION 6: APPENDIX
    # ---------------------------------------------------------
    add_h2(doc, "6. Appendix")

    add_h3(doc, "Appendix A: Glossary & Terminology Dictionary")
    add_p(
        doc,
        "Comprehensive dictionary of domain-specific terminology across clinical telemedicine, generative artificial intelligence, and real-time networking protocols:",
    )
    appendix_a_data = [
        ["AssemblyAI Diarization", "Machine learning technique that identifies and separates different speakers (doctor vs patient) in an audio recording."],
        ["CantSplit", "Word processing XML rule ensuring table rows are rendered atomically on one page without splitting."],
        ["DTO", "Data Transfer Object: Standardized serialized payload exchanged between frontend clients and REST APIs."],
        ["Hinglish", "Conversational Hindi written phonetically in Roman/Latin script; processed by the Groq translation layer."],
        ["Kanglish", "Conversational Kannada written phonetically in Roman/Latin script; translated to English for vector search."],
        ["MCI / NMC Number", "Unique identification assigned to medical practitioners by the National Medical Commission."],
        ["Pinecone Index", "Cloud-native serverless vector database index holding multidimensional embeddings of clinical literature."],
        ["Resend", "Modern developer-first email delivery API used for OTP verification and automated pharmacy surge notifications."],
        ["Sliding Window", "Rolling analytical timeframe (e.g., last 24 hours) used to compute real-time outbreak query frequencies."],
        ["STOMP Broker", "Server-side message broker managing WebSocket connections, subscriptions, queues, and topic broadcasts."],
    ]
    build_table(
        doc,
        ["Technical Term", "Explanatory Definition & Clinical Context"],
        appendix_a_data,
        [2200, 6440],
        total_width=8640,
    )

    add_h3(doc, "Appendix B: Analysis Models")
    add_p(
        doc,
        "Architectural flow models, data exchange specifications, and component interaction sequences:",
    )
    add_bullet(doc, "Patient/Doctor -> Jitsi Meet Video -> Web Audio Context -> AssemblyAI REST -> Gemini 2.5 Flash -> MongoDB EHR -> jsPDF Prescription.", "1. Video & Scribe Pipeline: ")
    add_bullet(doc, "Patient Query -> Groq LLaMA 3.1 Detection -> Pinecone Vector Search -> Gemini Generation -> ChatQueryLog (Pincode Tag).", "2. Multilingual RAG Pipeline: ")
    add_bullet(doc, "ChatQueryLog -> 24h Aggregation Engine -> Threshold Evaluation (X >= 5) -> STOMP Broadcast (/topic/pharmacy/alerts) -> Resend Email -> Pharmacist Dashboard.", "3. Regional Pharmacy Surge Pipeline: ")

    add_h3(doc, "Appendix C: Requirements Traceability Matrix (RTM)")
    add_p(
        doc,
        "Maps high-level business goals and functional requirements to implemented software modules, service runtimes, and automated verification tests:",
    )
    rtm_data = [
        ["FR-1.1 to FR-1.5", "Live Telehealth Video Consultations & Signaling", "modules/telehealth-signaling & /patient/consultation", "tests/verify_milestone_50.js (Test 1)", "Accept"],
        ["FR-2.1 to FR-2.6", "Clinical AI Scribe & 4-Level Triage Engine", "modules/clinical-ai-scribe & /doctor/queue", "tests/verify_milestone_50.js (Test 2)", "Accept"],
        ["FR-3.1 to FR-3.5", "Automated jsPDF Prescription & Allergy Safety", "modules/prescription-generator & /patient/records", "tests/verify_milestone_50.js (Test 3)", "Accept"],
        ["FR-4.1 to FR-4.6", "Multilingual Chatbot & Query Tagging", "modules/multilingual-chatbot & /patient/chat", "tests/verify_milestone_50.js (Test 4)", "Accept"],
        ["FR-5.1 to FR-5.6", "Regional Pharmacy Early Alert System", "modules/pharmacy-alerts & /pharmacy/alerts", "tests/verify_milestone_50.js (Test 5)", "Accept"],
        ["NFR-1.1 to NFR-1.6", "Sub-second Latency & High Throughput", "services/api-backend & inMemoryStore", "tests/verify_milestone_50.js (Test 6)", "Accept"],
        ["NFR-5.1 to NFR-5.3", "HIPAA & Telemedicine Regulations", "services/api-backend/src/middleware", "auth.js & roleGuard", "Accept"],
    ]
    build_table(
        doc,
        ["Requirement IDs", "Business Objective", "Implemented Module / Path", "Verification Test Suite", "Verification"],
        rtm_data,
        [1400, 2200, 2040, 1800, 1200],
        total_width=8640,
        decision_col_idx=4,
    )

    # Save document
    print(f"Saving completed SRS document to: {OUTPUT_PATH}")
    doc.save(OUTPUT_PATH)
    try:
        doc.save(DOCS_SYNC_PATH)
        print(f"✓ Synchronized SRS copy to: {DOCS_SYNC_PATH}")
    except Exception as e:
        print(f"Notice on docs sync: {e}")
    print("✓ Successfully generated and saved SRS document!")


if __name__ == "__main__":
    generate_srs()
