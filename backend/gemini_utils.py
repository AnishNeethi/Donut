import os
import json
from dotenv import load_dotenv
from google import genai
from PIL import Image
import io
import logging
import random
from google.cloud import texttospeech

# Load environment variables
load_dotenv()

# Initialize clients with credentials
# Gemini client
client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
# Google Cloud TTS client, which will automatically find the application default credentials
tts_client = texttospeech.TextToSpeechClient()

logger = logging.getLogger("gemini_utils")

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
    Generate pronunciation audio for an ingredient using Google Cloud Text-to-Speech.
    
    Args:
        ingredient_name: The name of the ingredient to pronounce
        is_concerned: If True, adds a concerned expression and modifies voice prosody
    
    Returns:
        Audio bytes in MP3 format
    """
    try:
        # Step 1: Construct the text to speak directly from the ingredient name.
        # We no longer ask Gemini for phonetics, as the TTS engine is very capable.
        text_to_speak = ingredient_name
        if is_concerned:
            # Add a random concerned expression for more variety
            concerned_expression = random.choice(CONCERNED_EXPRESSIONS)
            text_to_speak = f"{ingredient_name}. {concerned_expression}"

        # Step 2: Generate audio using Google Cloud TTS for higher quality
        # The tts_client is already initialized globally
        
        # If concerned, wrap in SSML for prosody changes
        if is_concerned:
            # Studio voices do not support the 'pitch' attribute, but we can slow the rate.
            ssml_text = f'<speak><prosody rate="slow">{text_to_speak}</prosody></speak>'
            synthesis_input = texttospeech.SynthesisInput(ssml=ssml_text)
        else:
            synthesis_input = texttospeech.SynthesisInput(text=text_to_speak)

        # Build the voice request, select the language code ("en-US") and the voice name
        # Using a high-quality Studio voice
        voice = texttospeech.VoiceSelectionParams(
            language_code="en-US", 
            name="en-US-Studio-O"
        )

        # Select the type of audio file you want
        audio_config = texttospeech.AudioConfig(
            audio_encoding=texttospeech.AudioEncoding.MP3
        )

        # Perform the text-to-speech request
        # The SDK will automatically use the project_id from the environment if available
        # or from the gcloud config.
        response = tts_client.synthesize_speech(
            input=synthesis_input, voice=voice, audio_config=audio_config
        )
        
        return response.audio_content
        
    except Exception as e:
        logger.error(f"[ERROR] Failed to generate pronunciation audio: {e}")
        raise e
