import os
import json
from dotenv import load_dotenv
from google import genai
from PIL import Image
import io
import logging
import random
from gtts import gTTS

logger = logging.getLogger("gemini_utils")

load_dotenv()
client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

# Array of concerned expressions for low health ratings
CONCERNED_EXPRESSIONS = [
    "yikes",
    "ruh-roh", 
    "uh-oh",
    "hmm",
    "interesting...",
    "well then",
    "oh?",
    "okay...",
    "alrighty",
    "so that happened",
    "huh",
    "curious",
    "that's something",
    "well, okay",
    "noted",
    "oh, I see",
    "that's one way to go",
    "got it",
    "huh, okay",
    "well, that's different",
    "if you say so",
    "alright then",
    "oh boy",
    "oh man",
    "whoops"
]

def analyze_image(image_bytes: bytes):
    """
    Analyzes image bytes directly by loading them into a PIL Image object.

    Args:
        image_bytes: The raw bytes of the image to be analyzed.
    
    Returns:
        JSON response from Gemini analysis.
    """
    logger.info("\n--- [START IMAGE ANALYSIS] ---")
    try:
        logger.info(f"[ANALYSIS] Received {len(image_bytes) / 1024:.2f} KB of image data.")
        
        logger.info("[ANALYSIS] Step 1: Loading bytes into a PIL Image object...")
        image = Image.open(io.BytesIO(image_bytes))
        logger.info(f"[ANALYSIS] Step 1 SUCCESS: Image loaded. Format: {image.format}, Size: {image.size}")
        
        # Food analysis prompt
        food_prompt = """
    Analyze this food image and return a JSON response with the following structure:
    {
        "food_name": "Name of the food item",
        "estimated_size": "estimated product size (100g, 100mL, etc.)",
        "nutrition_data": {
            "calories": "estimated calories per serving",
            "protein": "protein content in grams",
            "carbohydrates": "carbohydrate content in grams",
            "fat": "fat content in grams",
            "fiber": "fiber content in grams",
            "sugar": "sugar content in grams",
            "sodium": "sodium content in mg",
            "vitamin_c": "vitamin C content in mg",
            "calcium": "calcium content in mg",
            "iron": "iron content in mg"
        },
        "ingredients": [
            "list of main ingredients",
            "typically found in this food"
        ]
    }

    Please provide realistic estimates based on what you can see in the image.
    Make sure that the ingredients and values are based off of Ontario, Canada.
    If you cannot determine certain values, use "unknown" for that field.
    
    Return only the JSON response, no additional text.
    """

        logger.info("[ANALYSIS] Step 2: Sending request to Google Gemini API for food analysis...")
        food_response = client.models.generate_content(
                model="gemini-2.5-flash-lite-preview-06-17", contents=[food_prompt, image]
        )
        logger.info("[ANALYSIS] Step 2 SUCCESS: Received food analysis from Gemini.")

        food_response_text = clean_response(food_response.text)
        logger.info(f"[ANALYSIS DEBUG] Food analysis response: {food_response_text}")

        try:
            result = json.loads(food_response_text)
            logger.info("[ANALYSIS] Step 3 SUCCESS: Food analysis JSON parsed.")
            
            # Debug: Print the result structure
            logger.info(f"[ANALYSIS DEBUG] Result keys: {list(result.keys())}")
            logger.info(f"[ANALYSIS DEBUG] Food name: {result.get('food_name')}")
            logger.info(f"[ANALYSIS DEBUG] Estimated size: {result.get('estimated_size')}")
            
            logger.info("--- [END IMAGE ANALYSIS] ---\n")
            return result
                
        except json.JSONDecodeError:
            logger.warning("[ANALYSIS ERROR] Food analysis returned malformed JSON.")
            return {"raw_response": food_response_text}

    except Exception as e:
        logger.error(f"[ANALYSIS CRITICAL ERROR] An exception occurred: {e}")
        logger.info("--- [END IMAGE ANALYSIS WITH ERROR] ---\n")
        return {"error": str(e)}


def analyze_ingredient(ingredient_name):
    """
    Analyze an ingredient and provide pronunciation, common products, and health consensus.
    """
    prompt = f"""
    Analyze the food ingredient "{ingredient_name}" and return a JSON response with the following structure.
    Use easily readable phonetics (e.g., "SO-dee-um BEN-zoh-ate").
    Do NOT use paragraphs; keep all descriptions brief and to the point.
    Add a relevant emoji (✅, ⚠️, ❌) to the beginning of the text for 'safety_status' and 'health_concerns'.

    Example for "Sodium Benzoate":
    {{
        "name": "Sodium Benzoate",
        "pronunciation": "SO-dee-um BEN-zoh-ate",
        "commonly_found_in": "Soda, salad dressings, fruit juices",
        "purpose": "Preservative to prevent spoilage from bacteria and fungi.",
        "natural_or_synthetic": "Synthetic",
        "safety_status": "✅ Generally recognized as safe (GRAS) by the FDA in small doses.",
        "health_concerns": "⚠️ Can convert to benzene (a carcinogen) in the presence of vitamin C. May be linked to hyperactivity in children.",
        "recommended_intake": "Limit intake, especially in combination with vitamin C."
    }}

    Now, provide the analysis for the ingredient: "{ingredient_name}".
    Return ONLY the JSON response, with no additional text.
    """

    try:
        response = client.models.generate_content(
            model="gemini-2.5-flash-lite-preview-06-17", 
            contents=[prompt]
        )

        response_text = clean_response(response.text)

        try:
            return json.loads(response_text)
        except json.JSONDecodeError:
            logger.warning("[WARNING] Gemini returned malformed JSON.")
            return {"raw_response": response_text}

    except Exception as e:
        logger.error(f"[ERROR] Failed to analyze ingredient: {e}")
        return {"error": str(e)}


def clean_response(response_text):
    # Remove markdown code fences if present
    if response_text.startswith("```json"):
        response_text = response_text[len("```json") :]

    if response_text.endswith("```"):
        response_text = response_text[:-3]

    return response_text.strip()

def get_pronunciation_audio(ingredient_name: str, is_concerned: bool = False):
    """
    Generate pronunciation audio for an ingredient using text-to-speech.
    
    Args:
        ingredient_name: The name of the ingredient to pronounce
        is_concerned: If True, adds a concerned expression after pronunciation
    
    Returns:
        Audio bytes in MP3 format
    """
    try:
        # Get pronunciation from Gemini
        pronunciation_prompt = f"""
        Provide ONLY the phonetic pronunciation for the ingredient "{ingredient_name}".
        Use simple, clear phonetics that are easy to read aloud.
        Examples:
        - "Sodium Benzoate" -> "SO-dee-um BEN-zoh-ate"
        - "Monosodium Glutamate" -> "MON-oh-SO-dee-um GLOO-tuh-mate"
        - "Aspartame" -> "AS-par-tame"
        
        Return ONLY the pronunciation, no additional text or formatting.
        """
        
        response = client.models.generate_content(
            model="gemini-2.5-flash-lite-preview-06-17",
            contents=[pronunciation_prompt]
        )
        
        pronunciation = clean_response(response.text).strip()
        
        # Construct the text to speak
        if is_concerned:
            concerned_expression = random.choice(CONCERNED_EXPRESSIONS)
            text_to_speak = f"{pronunciation}. {concerned_expression}"
        else:
            text_to_speak = pronunciation
        
        # Generate audio using gTTS
        tts = gTTS(text=text_to_speak, lang='en', slow=False)
        
        # Save to bytes buffer
        audio_buffer = io.BytesIO()
        tts.write_to_fp(audio_buffer)
        audio_buffer.seek(0)
        
        return audio_buffer.getvalue()
        
    except Exception as e:
        logger.error(f"[ERROR] Failed to generate pronunciation audio: {e}")
        raise e
