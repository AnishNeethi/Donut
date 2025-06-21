import os
import json
from dotenv import load_dotenv
from google import genai
from PIL import Image
import io

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
        image = Image.open(io.BytesIO(image_bytes))
        
        response = client.models.generate_content(
                model="gemini-2.5-flash-lite-preview-06-17", contents=[prompt, image]
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
