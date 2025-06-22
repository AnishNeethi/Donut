import os
import json
from dotenv import load_dotenv
from google import genai
from PIL import Image
import io
from fooddata_utils import search_fooddata_product
import logging

logger = logging.getLogger("gemini_utils")

load_dotenv()
client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

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
        
        prompt = """
    Analyze this food image and return a JSON response with the following structure:
    {
        "food_name": "Name of the food item",
        "estimated_size": "estimated product size (100g, 100mL, etc.)",
        "upc_code": "12-digit UPC code (make your best guess, must be exactly 12 digits)",
        "upc_confidence": 0.85,
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

    IMPORTANT RULES:
    1. ALWAYS generate a UPC code - make your best guess based on the food type and brand if visible
    2. UPC code must be exactly 12 digits (use 000000000000 if completely unsure)
    3. UPC confidence must be a decimal between 0.0 and 1.0
    4. If you can see a clear brand name or product, confidence should be 0.7 or higher
    5. If the image is unclear or generic, confidence should be below 0.7
    6. Make sure that the ingredients and values are based off of Ontario, Canada.
    7. If you cannot determine certain values, use "unknown" for that field.

    Return only the JSON response, no additional text.
    """

        logger.info("[ANALYSIS] Step 2: Sending request to Google Gemini API...")
        response = client.models.generate_content(
                model="gemini-2.5-flash-lite-preview-06-17", contents=[prompt, image]
        )
        logger.info("[ANALYSIS] Step 2 SUCCESS: Received response from Gemini.")

        response_text = clean_response(response.text)
        logger.info("[ANALYSIS] Step 3: Response content cleaned successfully.")

        try:
            result = json.loads(response_text)
            logger.info("[ANALYSIS] Step 4 SUCCESS: JSON parsed. Analysis complete.")
            
            # Debug: Print the result structure
            logger.info(f"[ANALYSIS DEBUG] Result keys: {list(result.keys())}")
            logger.info(f"[ANALYSIS DEBUG] Food name: {result.get('food_name')}")
            logger.info(f"[ANALYSIS DEBUG] Estimated size: {result.get('estimated_size')}")
            logger.info(f"[ANALYSIS DEBUG] UPC code: {result.get('upc_code')}")
            logger.info(f"[ANALYSIS DEBUG] UPC confidence: {result.get('upc_confidence')}")
            
            # Check UPC confidence and conditionally search FoodData Central
            upc_confidence = result.get("upc_confidence", 0.0)
            if upc_confidence >= 0.7:
                logger.info(f"[ANALYSIS] Step 5: UPC confidence {upc_confidence} >= 0.7, searching FoodData Central...")
                if result.get("upc_code"):
                    search_fooddata_product(result["upc_code"])
                else:
                    logger.info("[ANALYSIS] Step 5 SKIPPED: Missing UPC code in result")
            else:
                logger.info(f"[ANALYSIS] Step 5 SKIPPED: UPC confidence {upc_confidence} < 0.7, skipping FoodData Central search")
            
            logger.info("--- [END IMAGE ANALYSIS] ---\n")
            return result
        except json.JSONDecodeError:
            logger.warning("[ANALYSIS ERROR] Gemini returned malformed JSON.")
            return {"raw_response": response_text}

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
