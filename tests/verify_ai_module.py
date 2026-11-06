"""
Verification Test for Module 4: Multilingual Chatbot & Regional Tagging
"""

import sys
import os

current_dir = os.path.dirname(os.path.abspath(__file__))
modules_dir = os.path.abspath(os.path.join(current_dir, "../modules"))
if modules_dir not in sys.path:
    sys.path.insert(0, modules_dir)

from multilingual_chatbot import RegionalTagger, LanguageDetector

def test_regional_tagger():
    print("--- Testing Module 4: Regional Tagger ---")
    
    # 1. Test condition extraction
    query1 = "Mujhe 3 din se tez bukhar aur thand lag rahi hai"
    cond1 = RegionalTagger.extract_condition(query1)
    assert cond1 == "fever", f"Expected fever, got {cond1}"
    print(f"✓ Correctly extracted condition '{cond1}' from Hindi Romanized query.")

    query2 = "Patient has acute dengue fever symptoms with low platelets"
    cond2 = RegionalTagger.extract_condition(query2)
    assert cond2 == "dengue", f"Expected dengue, got {cond2}"
    print(f"✓ Correctly extracted condition '{cond2}' from clinical report.")

    # 2. Test pincode extraction
    text_with_pin = "Emergency near Indiranagar Bangalore 560038"
    extracted_pin = RegionalTagger.extract_pincode(text_with_pin)
    assert extracted_pin == "560038", f"Expected 560038, got {extracted_pin}"
    print(f"✓ Correctly extracted Indian postal pincode '{extracted_pin}'.")

    # 3. Test fallback
    fallback_pin = RegionalTagger.extract_pincode("No code mentioned", fallback_pincode="560001")
    assert fallback_pin == "560001"
    print(f"✓ Fallback pincode applied successfully: {fallback_pin}")

    print("\n🎉 MODULE 4 TEST PASSED SUCCESSFULLY! 🎉\n")

if __name__ == "__main__":
    test_regional_tagger()
