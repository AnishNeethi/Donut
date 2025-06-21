from fastapi import APIRouter, HTTPException
from db import users_collection
from models import UserCreate, UserLogin
from auth import hash_password, verify_password, create_access_token

router = APIRouter()

@router.post("/register")
def register(user: UserCreate):
    if users_collection.find_one({"email": user.email}):
        raise HTTPException(status_code=400, detail="Email already registered")
    users_collection.insert_one({
        "email": user.email,
        "password": hash_password(user.password)
    })
    return {"msg": "User registered successfully"}

@router.post("/login")
def login(user: UserLogin):
    record = users_collection.find_one({"email": user.email})
    if not record or not verify_password(user.password, record["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_access_token(user.email)
    return {"access_token": token, "token_type": "bearer"}
