"""
Module 4: Multilingual Medical AI Chatbot
File: language_detector.py

Groq LLaMA-powered multi-lingual detection and query translation.
Supports English, Romanized Hindi/Urdu (Hinglish), and Romanized Kannada (Kanglish).
"""

import os
import json

DETECTION_PROMPT = """Analyze this medical patient query and extract language details:

QUERY: "{query}"

Rules:
1. Detect if the text is pure English (e.g. "I have severe throat pain"), Romanized Hindi/Urdu (e.g. "mujhe 2 din se tez bukhar hai", "gale me dard hai"), Romanized Kannada (e.g. "nanage jwara ide", "tale novu ide"), or vernacular native script.
2. If the query is already in English, the english_translation should be identical to the query.
3. If it is Romanized Hindi or Kannada, translate the medical symptoms into precise clinical English.

Return ONLY a JSON object adhering to:
{{
  "detected_language": "English | Hindi | Urdu | Kannada",
  "detected_script": "English | Romanized | Devanagari | Kannada",
  "is_vernacular": true | false,
  "english_translation": "string"
}}
"""

class LanguageDetector:
    def __init__(self, groq_api_key: str = None, model_name: str = "llama-3.1-8b-instant"):
        self.api_key = groq_api_key or os.getenv("GROQ_API_KEY")
        self.model_name = model_name
        self._llm = None

    def _get_llm(self):
        if not self._llm and self.api_key:
            try:
                from langchain_groq import ChatGroq
                self._llm = ChatGroq(model=self.model_name, groq_api_key=self.api_key, temperature=0.0)
            except ImportError:
                print("[LanguageDetector] langchain_groq not installed. Falling back to default language detection.")
                return None
        return self._llm

    def analyze_query(self, query: str) -> dict:
        llm = self._get_llm()
        if not llm:
            # Fallback if no Groq API key is configured
            return {
                "detected_language": "English",
                "detected_script": "English",
                "is_vernacular": False,
                "english_translation": query,
            }

        prompt = DETECTION_PROMPT.format(query=query)
        try:
            response = llm.invoke(prompt)
            content = response.content.strip()
            start = content.find("{")
            end = content.rfind("}")
            if start >= 0 and end > start:
                return json.loads(content[start:end + 1])
        except Exception as e:
            print(f"[LanguageDetector] Error during detection: {e}")

        return {
            "detected_language": "English",
            "detected_script": "English",
            "is_vernacular": False,
            "english_translation": query,
        }
