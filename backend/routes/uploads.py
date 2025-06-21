from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from fastapi.responses import JSONResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from db import uploads_collection
from auth import decode_access_token
from gemini_utils import analyze_image
import os
import tempfile
from datetime import datetime

router = APIRouter()
security = HTTPBearer()

@router.post("/upload")
async def upload_image(
    file: UploadFile = File(...),
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    try:
        # Extract token and decode user email
        token = credentials.credentials
        current_user = decode_access_token(token)
        if not current_user:
            raise HTTPException(status_code=401, detail="Invalid token")

        # Read uploaded file content
        file_content = await file.read()
        
        # Save to temp file for analysis
        with tempfile.NamedTemporaryFile(delete=False, suffix=f".{file.filename.split('.')[-1]}") as temp_file:
            temp_file.write(file_content)
            temp_file_path = temp_file.name
        
        try:
            # Analyze image using Gemini
            analysis_result = analyze_image(temp_file_path)
            
            # Save to MongoDB with timestamp
            uploads_collection.insert_one({
                "user_email": current_user,
                "filename": file.filename,
                "analysis": analysis_result,
                "timestamp": datetime.utcnow()
            })
            
            return JSONResponse(content=analysis_result)
        finally:
            os.unlink(temp_file_path)

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
