Write-Host "Starting Donut FastAPI Server..." -ForegroundColor Green
Write-Host ""

# Check if virtual environment exists
if (-not (Test-Path "venv")) {
    Write-Host "Creating virtual environment..." -ForegroundColor Yellow
    python -m venv venv
}

# Activate virtual environment
Write-Host "Activating virtual environment..." -ForegroundColor Yellow
& "venv\Scripts\Activate.ps1"

# Install/update dependencies
Write-Host "Installing dependencies..." -ForegroundColor Yellow
pip install -r requirements.txt

# Check if .env file exists
if (-not (Test-Path ".env")) {
    Write-Host "Creating .env file template..." -ForegroundColor Yellow
    @"
MONGO_URI=your_mongodb_connection_string_here
JWT_SECRET_KEY=your_jwt_secret_key_here
GEMINI_API_KEY=your_gemini_api_key_here
"@ | Out-File -FilePath ".env" -Encoding UTF8
    
    Write-Host ""
    Write-Host "Please edit .env file with your actual credentials before starting the server." -ForegroundColor Red
    Read-Host "Press Enter to continue"
    exit 1
}

# Start the server
Write-Host "Starting FastAPI server..." -ForegroundColor Green
Write-Host "Server will be available at: http://localhost:8000" -ForegroundColor Cyan
Write-Host "Swagger UI will be available at: http://localhost:8000/docs" -ForegroundColor Cyan
Write-Host ""
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000

Read-Host "Press Enter to exit" 