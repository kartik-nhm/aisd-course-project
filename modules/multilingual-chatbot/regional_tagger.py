"""
Module 4: Multilingual Medical AI Chatbot
File: regional_tagger.py

Extracts clinical condition tags and postal pincodes from user sessions
to feed into Module 5's Regional Pharmacy Early Alert System.
"""

import re
from typing import Optional

CONDITION_KEYWORDS = {
    "dengue": ["dengue", "platelet", "dengue fever"],
    "malaria": ["malaria", "shivering", "chills with fever"],
    "flu": ["flu", "influenza", "runny nose", "body ache", "cough and cold"],
    "covid": ["covid", "corona", "loss of smell", "loss of taste"],
    "typhoid": ["typhoid", "prolonged fever", "stomach pain with fever"],
    "cholera": ["cholera", "severe diarrhea", "watery stools"],
    "fever": ["bukhar", "jwara", "fever", "pyrexia", "tapa"],
}

class RegionalTagger:
    @staticmethod
    def extract_condition(text: str) -> str:
        clean = text.lower()
        for condition, triggers in CONDITION_KEYWORDS.items():
            for trigger in triggers:
                if trigger in clean:
                    return condition
        return "general-symptom"

    @staticmethod
    def extract_pincode(text: str, fallback_pincode: Optional[str] = None) -> Optional[str]:
        # Indian 6-digit postal code pattern
        match = re.search(r"\b[1-9][0-9]{5}\b", text)
        if match:
            return match.group(0)
        return fallback_pincode or "560001" # Default metropolitan region if unspecified
