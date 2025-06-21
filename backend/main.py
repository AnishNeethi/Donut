from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import users, uploads

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust for production!
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(users.router)
app.include_router(uploads.router)
