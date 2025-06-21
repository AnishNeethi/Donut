import os
import json
from dotenv import load_dotenv
from PIL import Image
from google import genai
import io

load_dotenv()
client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))


def compress_image(image_path, max_size=256, quality=60):
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
            print(f"Original image: {img.size} ({img.mode})")
            
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
            
            original_width, original_height = img.size
            
            # Always resize to max_size for maximum compression
            if original_width > original_height:
                new_width = max_size
                new_height = int(original_height * (max_size / original_width))
            else:
                new_height = max_size
                new_width = int(original_width * (max_size / original_height))
            
            # Resize the image
            img = img.resize((new_width, new_height), Image.Resampling.LANCZOS)
            print(f"Resized to: {new_width}x{new_height}")
            
            # Compress by saving to bytes with quality setting
            output_buffer = io.BytesIO()
            img.save(output_buffer, format='JPEG', quality=quality, optimize=True)
            output_buffer.seek(0)
            
            # Create a new PIL Image from the compressed bytes
            compressed_img = Image.open(output_buffer)
            
            # Get file size info
            original_size = os.path.getsize(image_path)
            output_buffer.seek(0, 2)  # Seek to end
            compressed_size = output_buffer.tell()
            
            print(f"File size: {original_size/1024:.1f}KB -> {compressed_size/1024:.1f}KB (quality={quality})")
            print(f"Compression ratio: {compressed_size/original_size*100:.1f}%")
            
            return compressed_img
            
    except Exception as e:
        print(f"[WARNING] Failed to compress image: {e}. Using original image.")
        return Image.open(image_path)


def analyze_image(image_path, max_size=256, quality=60):
    """
    Analyze a food image with automatic compression for better performance.
    
    Args:
        image_path: Path to the image file
        max_size: Maximum dimension for compression (default: 256px)
        quality: JPEG quality for compression (default: 60)
    
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
