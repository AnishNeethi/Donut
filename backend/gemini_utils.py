import os
import json
from dotenv import load_dotenv
from google import genai

load_dotenv()
client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))


def analyze_image(image_bytes: bytes):
    """
    Analyzes image bytes directly.

    Args:
        image_bytes: The raw bytes of the image to be analyzed.
    
    Returns:
        JSON response from Gemini analysis.
    """
    prompt = """
    Analyze this food image and return a JSON response with the following structure:
    {
        "food_name": "Name of the food item",
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
    Make sure that the ingridents and values are based off of Ontario, Canada.
    If you cannot determine certain values, use "unknown" for that field.
    Return only the JSON response, no additional text.
    """

    try:
        image_part = {
            "mime_type": "image/jpeg", # Assume frontend sends JPEG
            "data": image_bytes,
        }
        
        response = client.models.generate_content(
                model="gemini-2.5-flash-lite-preview-06-17", contents=[prompt, image_part]
        )

        response_text = clean_response(response.text)

        try:
            return json.loads(response_text)
        except json.JSONDecodeError:
            print("[WARNING] Gemini returned malformed JSON.")
            return {"raw_response": response_text}

    except Exception as e:
        print(f"[ERROR] Failed to analyze image: {e}")
        return {"error": str(e)}


def analyze_ingredient(ingredient_name):
    """
    Analyze an ingredient and provide pronunciation, common products, and health consensus.
    """
    prompt = f"""
    Analyze the ingredient "{ingredient_name}" and return a JSON response with the following structure:
    {{
        "ingredient_name": "{ingredient_name}",
        "pronunciation": "How to pronounce this ingredient (phonetic spelling)",
        "common_products": [
            "List of common food products",
            "where this ingredient is typically found"
        ],
        "health_consensus": {{
            "safety": "General safety assessment (safe/unsafe/controversial)",
            "healthiness": "Health assessment (healthy/unhealthy/neutral)",
            "notes": "Additional health-related notes or warnings",
            "recommendation": "General recommendation for consumption"
        }}
    }}

    Please provide accurate information based on scientific consensus and common knowledge.
    Focus on food safety and nutritional aspects relevant to consumers.
    Return only the JSON response, no additional text.
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
            print("[WARNING] Gemini returned malformed JSON.")
            return {"raw_response": response_text}

    except Exception as e:
        print(f"[ERROR] Failed to analyze ingredient: {e}")
        return {"error": str(e)}


def clean_response(response_text):
    # Remove markdown code fences if present
    if response_text.startswith("```json"):
        response_text = response_text[len("```json"):]

    if response_text.endswith("```"):
        response_text = response_text[:-3]

    return response_text.strip()
