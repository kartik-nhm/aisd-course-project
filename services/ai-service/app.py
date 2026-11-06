"""
AI Intelligence Microservice (FastAPI)
Hosts the Multilingual Medical Chatbot, Disease Prediction, and Triage Engine.
"""

import os
import sys
import requests
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Dict, Optional
from dotenv import load_dotenv

# Ensure modules directory is importable
current_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.abspath(os.path.join(current_dir, "../.."))
modules_dir = os.path.join(project_root, "modules")
if modules_dir not in sys.path:
    sys.path.insert(0, modules_dir)

load_dotenv(os.path.join(project_root, ".env"))

# Import from Module 4
from multilingual_chatbot import LanguageDetector, MedicalRAGEngine, ChatbotResponder, RegionalTagger

app = FastAPI(
    title="Smart Telehealth AI Intelligence Service",
    description="Multilingual RAG Chatbot, Symptom Predictor, and Clinical Triaging Engine",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize AI Components
language_detector = LanguageDetector()
rag_engine = MedicalRAGEngine()
responder = ChatbotResponder()

BACKEND_API_URL = os.getenv("BACKEND_API_URL", "http://localhost:8080")

class ChatRequest(BaseModel):
    question: str
    user_id: Optional[str] = "user-anon"
    pincode: Optional[str] = "560001"

class ChatResponse(BaseModel):
    answer: str
    detected_language: str
    detected_script: str
    english_translation: str
    context: List[str]
    detected_condition: str
    pincode: str

class TriageRequest(BaseModel):
    transcript: str

class TriageResponse(BaseModel):
    severity: str
    summary: str

@app.get("/")
def health_check():
    return {
        "status": "healthy",
        "service": "ai-intelligence-service",
        "version": "1.0.0",
    }

@app.post("/chat", response_model=ChatResponse)
async def chat_endpoint(req: ChatRequest):
    """
    Multilingual Chatbot Pipeline:
    1. Detect language / script via Groq LLaMA 3.1
    2. Extract clinical condition and pincode (for Regional Pharmacy Surge Detection)
    3. Retrieve medical knowledge from Pinecone
    4. Generate empathetic vernacular response with Google Gemini / Groq
    5. Asynchronously notify backend API to log query for surge monitoring
    """
    try:
        # Step 1: Detect language & translate to English if vernacular
        lang_meta = language_detector.analyze_query(req.question)
        search_query = lang_meta.get("english_translation", req.question)

        # Step 2: Tag condition & pincode
        condition = RegionalTagger.extract_condition(search_query)
        pincode = RegionalTagger.extract_pincode(req.question, req.pincode)

        # Step 3: Retrieve relevant context
        context_docs = rag_engine.retrieve_context(search_query)

        # Step 4: Generate response
        answer = responder.generate_response(req.question, lang_meta, context_docs)

        # Step 5: Notify backend to log query for Module 5 Pharmacy Surge Alert
        try:
            requests.post(
                f"{BACKEND_API_URL}/api/pharmacy/log-query",
                json={
                    "queryText": req.question,
                    "condition": condition,
                    "pincode": pincode,
                    "language": lang_meta.get("detected_language", "English"),
                    "userId": req.user_id,
                },
                timeout=3,
            )
        except Exception as e:
            print(f"[AI Service] Background backend query logging notice: {e}")

        return ChatResponse(
            answer=answer,
            detected_language=lang_meta.get("detected_language", "English"),
            detected_script=lang_meta.get("detected_script", "English"),
            english_translation=search_query,
            context=context_docs,
            detected_condition=condition,
            pincode=pincode,
        )
    except Exception as err:
        print(f"[AI Service] Chat error: {err}")
        raise HTTPException(status_code=500, detail=str(err))

@app.post("/triage", response_model=TriageResponse)
async def triage_endpoint(req: TriageRequest):
    """
    Analyzes consultation transcript and returns 4-level triage severity.
    """
    transcript = req.transcript.strip()
    if not transcript:
        raise HTTPException(status_code=400, detail="Transcript is required")

    # Simple heuristic triage classifier fallback
    lower = transcript.lower()
    if any(k in lower for k in ["chest pain", "heart attack", "stroke", "unconscious", "cannot breathe", "bleeding profusely"]):
        severity = "Critical"
    elif any(k in lower for k in ["high fever", "fracture", "blood", "severe pain", "disoriented", "dehydrated"]):
        severity = "High"
    elif any(k in lower for k in ["rash", "vomiting", "mild fever", "cough", "infection", "headache"]):
        severity = "Medium"
    else:
        severity = "Low"

    return TriageResponse(
        severity=severity,
        summary=f"Case triaged as {severity} severity based on symptoms evaluated.",
    )
