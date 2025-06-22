import os
import requests
from dotenv import load_dotenv
import logging

logger = logging.getLogger("fooddata_utils")

load_dotenv()

def search_fooddata_product(upc_code: str):
    """
    Search for a product using FoodData Central API by UPC code and log the product details.
    
    Args:
        upc_code: 12-digit UPC code of the food item
    
    Returns:
        None (just logs to console)
    """
    logger.info(f"[FOODDATA] Function called with UPC code: '{upc_code}'")
    
    try:
        api_key = os.getenv("FOODDATA_API_KEY")
        if not api_key:
            logger.warning("[FOODDATA] No API key found. Skipping FoodData Central search.")
            return
        
        # Search for foods using FoodData Central API by UPC
        search_url = "https://api.nal.usda.gov/fdc/v1/foods/search"
        params = {
            "api_key": api_key,
            "query": upc_code,
            "pageSize": 1,  # Get top result
            "dataType": ["Foundation", "SR Legacy", "Survey (FNDDS)"]
        }
        
        logger.info(f"[FOODDATA] Searching for UPC: {upc_code}")
        response = requests.get(search_url, params=params)
        
        if response.status_code != 200:
            logger.error(f"[FOODDATA ERROR] API request failed: {response.status_code}")
            logger.error(f"[FOODDATA ERROR] Response: {response.text}")
            return
        
        data = response.json()
        
        if not data.get("foods"):
            logger.info(f"[FOODDATA] No foods found for UPC: {upc_code}")
            return
        
        # Get the best match (first result)
        best_match = data["foods"][0]
        fdc_id = best_match.get("fdcId")
        description = best_match.get("description", "Unknown Food")
        
        # Extract nutrition information
        nutrients = best_match.get("foodNutrients", [])
        nutrition_info = {}
        
        for nutrient in nutrients:
            nutrient_name = nutrient.get("nutrientName", "")
            value = nutrient.get("value", 0)
            unit = nutrient.get("unitName", "")
            
            if nutrient_name and value:
                nutrition_info[nutrient_name] = f"{value} {unit}"
        
        # Construct product URL
        product_url = f"https://fdc.nal.usda.gov/fdc-app.html#/food-details/{fdc_id}/nutrients"
        
        logger.info(f"[FOODDATA] Best match found: {description}")
        logger.info(f"[FOODDATA] FDC ID: {fdc_id}")
        logger.info(f"[FOODDATA] Product URL: {product_url}")
        
        # Log nutrition information
        if nutrition_info:
            logger.info("[FOODDATA] Nutrition Information:")
            for nutrient, value in nutrition_info.items():
                logger.info(f"[FOODDATA]   {nutrient}: {value}")
        else:
            logger.info("[FOODDATA] No nutrition information available")
        
    except Exception as e:
        logger.error(f"[FOODDATA ERROR] Exception occurred: {e}") 