from fastapi import FastAPI, UploadFile, File
from fastapi.responses import JSONResponse
import os
from gemini_utils import analyze_image

app = FastAPI()

UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

@app.post("/upload")
async def upload_image(file: UploadFile = File(...)):
    try:
        file_location = os.path.join(UPLOAD_FOLDER, file.filename)

        # Save uploaded image
        with open(file_location, "wb") as f:
            f.write(await file.read())

        # Analyze image using Gemini
        result = analyze_image(file_location)

        return JSONResponse(content=result)

    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)
