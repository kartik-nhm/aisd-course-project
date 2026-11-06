"""
Module 4: Multilingual Medical AI Chatbot
File: responder.py

Contextual medical response generation with empathetic multilingual output
and mandatory clinical safety disclaimers.
"""

import os

CLINICAL_DISCLAIMER = (
    "\n\n---\n*Disclaimer: I am an AI medical assistant, not a licensed physician. "
    "This guidance is for informational purposes only. In case of high fever, difficulty breathing, "
    "or severe symptoms, please consult a registered doctor immediately.*"
)

SYSTEM_PROMPT = """You are a compassionate, clinical AI medical assistant on the Smart Telehealth Platform.
Your goal is to guide patients with clear, clinically accurate, and empathetic medical advice based on retrieved medical context.

GUIDELINES:
1. Context Usage: Use the provided medical reference context to inform your answer.
2. Multilingual Output:
   - If the user asked in Romanized Hindi/Urdu (Hinglish), reply in warm, natural conversational Hinglish.
   - If the user asked in Romanized Kannada (Kanglish), reply in conversational Kanglish or clean English with Kannada greetings.
   - If the user asked in standard English, reply in clear, patient-friendly English.
3. Structure:
   - Acknowledge symptoms with empathy.
   - Mention probable reasons cautiously (never make a definitive diagnostic claim).
   - Provide safe home care, hydration, or over-the-counter supportive tips.
   - Highlight red flags when they MUST see a doctor.
4. Keep answers concise, bulleted where appropriate, and reassuring.
"""

class ChatbotResponder:
    def __init__(self):
        self.google_key = os.getenv("GOOGLE_API_KEY")
        self.groq_key = os.getenv("GROQ_API_KEY")
        self._llm = None
        self._init_llm()

    def _init_llm(self):
        try:
            if self.google_key:
                from langchain_google_genai import ChatGoogleGenerativeAI
                self._llm = ChatGoogleGenerativeAI(
                    model=os.getenv("GEMINI_MODEL", "gemini-2.5-flash"),
                    google_api_key=self.google_key,
                    temperature=0.3
                )
            elif self.groq_key:
                from langchain_groq import ChatGroq
                self._llm = ChatGroq(
                    model=os.getenv("GROQ_COMPLEX_MODEL", "llama-3.3-70b-versatile"),
                    groq_api_key=self.groq_key,
                    temperature=0.3
                )
        except ImportError:
            print("[ChatbotResponder] langchain packages not installed. Running in mock/informational mode.")
            self._llm = None

    def generate_response(self, user_question: str, language_meta: dict, context_docs: list) -> str:
        if not self._llm:
            return (
                "Hello! Please ensure you remain well-hydrated and rest. "
                "Since AI service keys are not fully configured, please speak directly to a registered doctor."
                + CLINICAL_DISCLAIMER
            )

        context_block = "\n".join(f"- {doc}" for doc in context_docs)
        lang = language_meta.get("detected_language", "English")
        script = language_meta.get("detected_script", "English")

        prompt = f"""{SYSTEM_PROMPT}

RELEVANT CLINICAL CONTEXT:
{context_block}

PATIENT LANGUAGE DETAILS:
- Language: {lang}
- Script: {script}

USER QUERY:
"{user_question}"

Please provide your helpful, empathetic response:
"""

        try:
            res = self._llm.invoke(prompt)
            return res.content.strip() + CLINICAL_DISCLAIMER
        except Exception as e:
            print(f"[ChatbotResponder] Generation error: {e}")
            return (
                "We are experiencing high medical assistant load. "
                "Please consult a doctor or retry in a moment."
                + CLINICAL_DISCLAIMER
            )
