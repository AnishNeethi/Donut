import os
import json
from dotenv import load_dotenv
from PIL import Image
from google import genai
import io

load_dotenv()
client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))


def compress_image(image_path, max_size=1024, quality=85):
    """
    Compress an image to reduce file size while maintaining readability.
    
    Args:
        image_path: Path to the original image
        max_size: Maximum dimension (width or height) in pixels
        quality: JPEG quality (1-100) for compression
    
    Returns:
        PIL Image object that's been compressed
    """
    try:
        # Open the image
        with Image.open(image_path) as img:
            # Convert to RGB if necessary (for JPEG compatibility)
            if img.mode in ('RGBA', 'LA', 'P'):
                # Create a white background for transparent images
                background = Image.new('RGB', img.size, (255, 255, 255))
                if img.mode == 'P':
                    img = img.convert('RGBA')
                background.paste(img, mask=img.split()[-1] if img.mode == 'RGBA' else None)
                img = background
            elif img.mode != 'RGB':
                img = img.convert('RGB')
            
            # Calculate new dimensions while maintaining aspect ratio
            width, height = img.size
            if width > height:
                if width > max_size:
                    new_width = max_size
                    new_height = int(height * (max_size / width))
                else:
                    new_width, new_height = width, height
            else:
                if height > max_size:
                    new_height = max_size
                    new_width = int(width * (max_size / height))
                else:
                    new_width, new_height = width, height
            
            # Resize if necessary
            if (new_width, new_height) != (width, height):
                img = img.resize((new_width, new_height), Image.Resampling.LANCZOS)
            
            # Compress by saving to bytes with quality setting
            output_buffer = io.BytesIO()
            img.save(output_buffer, format='JPEG', quality=quality, optimize=True)
            output_buffer.seek(0)
            
            # Create a new PIL Image from the compressed bytes
            compressed_img = Image.open(output_buffer)
            
            print(f"Image compressed: {width}x{height} -> {new_width}x{new_height}")
            print(f"File size reduced with quality={quality}")
            
            return compressed_img
            
    except Exception as e:
        print(f"[WARNING] Failed to compress image: {e}. Using original image.")
        return Image.open(image_path)


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
        # Compress the image before analysis
        compressed_image = compress_image(image_path)

        response = client.models.generate_content(
                model="gemini-2.5-flash-lite-preview-06-17", contents=[prompt, compressed_image]
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


def analyze_image_with_compression(image_path, max_size=1024, quality=85):
    """
    Analyze an image with automatic compression for better performance.
    
    Args:
        image_path: Path to the image file
        max_size: Maximum dimension for compression (default: 1024px)
        quality: JPEG quality for compression (default: 85)
    
    Returns:
        JSON response from Gemini analysis
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
        # Compress the image with specified parameters
        compressed_image = compress_image(image_path, max_size=max_size, quality=quality)

        response = client.models.generate_content(
                model="gemini-2.5-flash-lite-preview-06-17", contents=[prompt, compressed_image]
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
