from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from fastapi.responses import JSONResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from db import uploads_collection
from auth import decode_access_token
from gemini_utils import analyze_image, analyze_ingredient
import os
import tempfile
from datetime import datetime

router = APIRouter()
security = HTTPBearer()

class IngredientRequest(BaseModel):
    ingredient_name: str

@router.post("/upload")
async def upload_image(
    file: UploadFile = File(...),
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    try:
        token = credentials.credentials
        current_user = decode_access_token(token)
        if not current_user:
            raise HTTPException(status_code=401, detail="Invalid token")

        # Read image bytes from the uploaded file (now compressed by the frontend)
        file_content = await file.read()
        
        # Directly pass the bytes to the analysis function
        analysis_result = analyze_image(file_content)
            
        # Save to MongoDB with timestamp
        uploads_collection.insert_one({
            "user_email": current_user,
            "filename": file.filename,
            "analysis": analysis_result,
            "timestamp": datetime.utcnow()
        })
            
        return JSONResponse(content=analysis_result)

    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)

@router.get("/history")
def get_history(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        token = credentials.credentials
        current_user = decode_access_token(token)
        if not current_user:
            raise HTTPException(status_code=401, detail="Invalid token")

        records = uploads_collection.find({"user_email": current_user})
        return [{"filename": r["filename"], "analysis": r["analysis"]} for r in records]
    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)

@router.post("/analyze-ingredient")
async def analyze_ingredient_endpoint(
    request: IngredientRequest,
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    try:
        # Extract token and decode user email
        token = credentials.credentials
        current_user = decode_access_token(token)
        if not current_user:
            raise HTTPException(status_code=401, detail="Invalid token")

        # Analyze ingredient using Gemini
        analysis_result = analyze_ingredient(request.ingredient_name)
        
        return analysis_result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
