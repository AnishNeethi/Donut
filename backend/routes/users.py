from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from db import users_collection
from models import UserCreate, UserLogin
from auth import decode_access_token, create_access_token, hash_password, verify_password
from datetime import datetime, timedelta

router = APIRouter()
security = HTTPBearer()

@router.post("/register")
async def register(email: str, password: str):
    try:
        # Check if user already exists
        existing_user = users_collection.find_one({"email": email})
        if existing_user:
            raise HTTPException(status_code=400, detail="User already exists")
        
        # Hash password and create user
        hashed_password = hash_password(password)
        user = {
            "email": email,
            "password": hashed_password,
            "created_at": datetime.utcnow()
        }
        users_collection.insert_one(user)
        
        return {"message": "User registered successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/login")
async def login(email: str, password: str):
    try:
        # Find user
        user = users_collection.find_one({"email": email})
        if not user:
            raise HTTPException(status_code=401, detail="Invalid credentials")
        
        # Verify password
        if not verify_password(password, user["password"]):
            raise HTTPException(status_code=401, detail="Invalid credentials")
        
        # Create access token
        access_token = create_access_token(data={"sub": email})
        return {"access_token": access_token, "token_type": "bearer"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
