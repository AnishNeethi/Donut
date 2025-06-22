import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import users, uploads

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler()  # This ensures logs go to console
    ]
)

# Set uvicorn access logger to INFO level
logging.getLogger("uvicorn.access").setLevel(logging.INFO)
logging.getLogger("uvicorn.error").setLevel(logging.INFO)

app = FastAPI()

# Define allowed origins
allowed_origins = [
    "http://localhost:3000",
    "http://localhost:5173",  # Vite default port
    "http://localhost:8080",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:8080",
    "https://donut-backend-o6ef.onrender.com",
    "*"  # Allow all origins for development
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(users.router)
app.include_router(uploads.router)
