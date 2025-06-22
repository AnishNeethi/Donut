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

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust for production!
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(users.router)
app.include_router(uploads.router)
