import os
import json
from dotenv import load_dotenv
from PIL import Image
from google import genai

load_dotenv()
client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))


def analyze_image(image_path):
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
        image = Image.open(image_path)

        response = client.models.generate_content(
                model="gemini-2.5-flash-lite-preview-06-17", contents=[prompt, image]
        )

        if response.usage_metadata:
            print(f"Prompt Tokens: {response.usage_metadata.prompt_token_count}")
            print(f"Output Tokens: {response.usage_metadata.candidates_token_count}")
            print(f"Total Tokens: {response.usage_metadata.total_token_count}")
        else:
            print("Usage metadata not available in this response.")

        response_text = clean_response(response.text)

        # Optional: Try parsing the result as JSON
        try:
            return json.loads(response_text)
        except json.JSONDecodeError:
            print("[WARNING] Gemini returned malformed JSON. Raw response returned.")
            return {"raw_response": response_text}

    except Exception as e:
        print(f"[ERROR] Failed to analyze image: {e}")
        return {"error": str(e)}


def clean_response(response_text):
    # Remove markdown code fences if present
    if response_text.startswith("```json"):
        response_text = response_text[len("```json"):]

    if response_text.endswith("```"):
        response_text = response_text[:-3]

    return response_text.strip()
