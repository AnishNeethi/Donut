@echo off
echo Starting Donut FastAPI Server...
echo.

REM Check if virtual environment exists
if not exist "venv" (
    echo Creating virtual environment...
    python -m venv venv
)

REM Activate virtual environment
echo Activating virtual environment...
call venv\Scripts\activate.bat

REM Install/update dependencies
echo Installing dependencies...
pip install -r requirements.txt

REM Check if .env file exists
if not exist ".env" (
    echo Creating .env file template...
    echo MONGO_URI=your_mongodb_connection_string_here > .env
    echo JWT_SECRET_KEY=your_jwt_secret_key_here >> .env
    echo GEMINI_API_KEY=your_gemini_api_key_here >> .env
    echo FOODDATA_API_KEY=your_fooddata_api_key_here >> .env
    echo.
    echo Please edit .env file with your actual credentials before starting the server.
    pause
    exit /b 1
)

REM Start the server
echo Starting FastAPI server...
echo Server will be available at: http://localhost:8000
echo Swagger UI will be available at: http://localhost:8000/docs
echo.
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000 --log-level info

pause 