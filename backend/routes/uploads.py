from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, Body, Query
from fastapi.responses import JSONResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from typing import Dict, Any, Optional
from db import uploads_collection
from auth import decode_access_token
from gemini_utils import analyze_image, analyze_ingredient
import os
import tempfile
from datetime import datetime, timedelta

router = APIRouter()
security = HTTPBearer()

class IngredientRequest(BaseModel):
    ingredient_name: str

class SaveAnalysisRequest(BaseModel):
    filename: str
    analysis: Dict[str, Any]
    consumed: bool

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
            
        return JSONResponse(content=analysis_result)

    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)

@router.post("/save-analysis")
async def save_analysis(
    request: SaveAnalysisRequest,
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    try:
        token = credentials.credentials
        current_user = decode_access_token(token)
        if not current_user:
            raise HTTPException(status_code=401, detail="Invalid token")

        uploads_collection.insert_one({
            "user_email": current_user,
            "filename": request.filename,
            "analysis": request.analysis,
            "consumed": request.consumed,
            "timestamp": datetime.utcnow()
        })
            
        return {"message": "Analysis saved successfully."}

    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)

@router.get("/history")
def get_history(
    period: Optional[str] = Query(None, enum=["7d", "1m", "1y", "all"]),
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    try:
        token = credentials.credentials
        current_user = decode_access_token(token)
        if not current_user:
            raise HTTPException(status_code=401, detail="Invalid token")

        query = {"user_email": current_user}
        
        if period and period != "all":
            end_date = datetime.utcnow()
            if period == "7d":
                start_date = end_date - timedelta(days=7)
            elif period == "1m":
                start_date = end_date - timedelta(days=30) # Approximation
            elif period == "1y":
                start_date = end_date - timedelta(days=365)
            query["timestamp"] = {"$gte": start_date, "$lt": end_date}

        records = uploads_collection.find(query).sort("timestamp", -1)
        
        # Add consumed status and timestamp to the history response
        return [{
            "filename": r["filename"], 
            "analysis": r["analysis"], 
            "consumed": r.get("consumed"),
            "timestamp": r["timestamp"].isoformat() if "timestamp" in r else None
        } for r in records]
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
