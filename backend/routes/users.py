from fastapi import APIRouter, HTTPException, Depends, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from db import users_collection
from models import UserCreate, UserLogin
from auth import decode_access_token, create_access_token, hash_password, verify_password
from datetime import datetime, timedelta
import logging

router = APIRouter()
security = HTTPBearer()

@router.post("/register")
async def register(user: UserCreate):
    try:
        print(f"Received registration request for email: {user.email}")
        
        # Check if user already exists
        existing_user = users_collection.find_one({"email": user.email})
        if existing_user:
            raise HTTPException(status_code=400, detail="User already exists")
        
        # Hash password and create user
        hashed_password = hash_password(user.password)
        user_data = {
            "email": user.email,
            "password": hashed_password,
            "created_at": datetime.utcnow()
        }
        users_collection.insert_one(user_data)
        
        print(f"User {user.email} registered successfully")
        return {"message": "User registered successfully"}
    except Exception as e:
        print(f"Registration error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/login")
async def login(user: UserLogin):
    try:
        # Find user
        db_user = users_collection.find_one({"email": user.email})
        if not db_user:
            raise HTTPException(status_code=401, detail="Invalid credentials")
        
        # Verify password
        if not verify_password(user.password, db_user["password"]):
            raise HTTPException(status_code=401, detail="Invalid credentials")
        
        # Create access token
        access_token = create_access_token(user.email)
        return {"access_token": access_token, "token_type": "bearer"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
