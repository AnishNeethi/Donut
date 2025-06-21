import os
import json
import time
import logging
import sys
from dotenv import load_dotenv
from PIL import Image
from google import genai
import io

# Configure logging to output to stdout for Render
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
    stream=sys.stdout,
)

load_dotenv()
client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))


def compress_image(image_path, max_size=96, quality=40):
    """
    Compress an image to reduce file size while maintaining readability.
    
    Args:
        image_path: Path to the original image
        max_size: Maximum dimension (width or height) in pixels
        quality: JPEG quality (1-100) for compression
    
    Returns:
        PIL Image object that's been compressed
    """
    start_time = time.time()
    try:
        # Open the image
        with Image.open(image_path) as img:
            logging.info(f"[COMPRESSION] Original image: {img.size} ({img.mode})")
            
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
            logging.info(f"[COMPRESSION] Resized to: {new_width}x{new_height}")
            
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
            
            compression_time = time.time() - start_time
            logging.info(f"[COMPRESSION] File size: {original_size/1024:.1f}KB -> {compressed_size/1024:.1f}KB (quality={quality})")
            logging.info(f"[COMPRESSION] Compression ratio: {compressed_size/original_size*100:.1f}%")
            logging.info(f"[COMPRESSION] Compression time: {compression_time*1000:.1f}ms")
            
            return compressed_img
            
    except Exception as e:
        logging.error(f"[COMPRESSION ERROR] Failed to compress image: {e}. Using original image.")
        return Image.open(image_path)


def analyze_image(image_path, max_size=96, quality=40):
    """
    Analyze a food image with automatic compression for better performance.
    
    Args:
        image_path: Path to the image file
        max_size: Maximum dimension for compression (default: 96px)
        quality: JPEG quality for compression (default: 40)
    
    Returns:
        JSON response from Gemini analysis
    """
    total_start_time = time.time()
    logging.info(f"[ANALYSIS] Starting image analysis: {image_path}")
    
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
        compression_start = time.time()
        compressed_image = compress_image(image_path, max_size=max_size, quality=quality)
        compression_time = time.time() - compression_start
        logging.info(f"[ANALYSIS] Compression completed in {compression_time*1000:.1f}ms")

        # Send to Gemini
        gemini_start = time.time()
        logging.info(f"[ANALYSIS] Sending to Gemini...")
        response = client.models.generate_content(
                model="gemini-2.5-flash-lite-preview-06-17", contents=[prompt, compressed_image]
        )
        gemini_time = time.time() - gemini_start
        logging.info(f"[ANALYSIS] Gemini response received in {gemini_time*1000:.1f}ms")

        if response.usage_metadata:
            logging.info(f"[ANALYSIS] Prompt Tokens: {response.usage_metadata.prompt_token_count}")
            logging.info(f"[ANALYSIS] Output Tokens: {response.usage_metadata.candidates_token_count}")
            logging.info(f"[ANALYSIS] Total Tokens: {response.usage_metadata.total_token_count}")
        else:
            logging.info("[ANALYSIS] Usage metadata not available in this response.")

        response_text = clean_response(response.text)

        # Optional: Try parsing the result as JSON
        try:
            total_time = time.time() - total_start_time
            logging.info(f"[ANALYSIS] Total analysis time: {total_time*1000:.1f}ms")
            return json.loads(response_text)
        except json.JSONDecodeError:
            logging.warning("[ANALYSIS WARNING] Gemini returned malformed JSON. Raw response returned.")
            return {"raw_response": response_text}

    except Exception as e:
        logging.error(f"[ANALYSIS ERROR] Failed to analyze image: {e}")
        return {"error": str(e)}


def analyze_ingredient(ingredient_name):
    """
    Analyze an ingredient and provide pronunciation, common products, and health consensus.
    
    Args:
        ingredient_name: Name of the ingredient to analyze
    
    Returns:
        JSON response with pronunciation, common products, and health consensus
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

        if response.usage_metadata:
            logging.info(f"Prompt Tokens: {response.usage_metadata.prompt_token_count}")
            logging.info(f"Output Tokens: {response.usage_metadata.candidates_token_count}")
            logging.info(f"Total Tokens: {response.usage_metadata.total_token_count}")
        else:
            logging.info("Usage metadata not available in this response.")

        response_text = clean_response(response.text)

        # Try parsing the result as JSON
        try:
            return json.loads(response_text)
        except json.JSONDecodeError:
            logging.warning("[WARNING] Gemini returned malformed JSON. Raw response returned.")
            return {"raw_response": response_text}

    except Exception as e:
        logging.error(f"[ERROR] Failed to analyze ingredient: {e}")
        return {"error": str(e)}


def clean_response(response_text):
    # Remove markdown code fences if present
    if response_text.startswith("```json"):
        response_text = response_text[len("```json"):]

    if response_text.endswith("```"):
        response_text = response_text[:-3]

    return response_text.strip()
