from passlib.context import CryptContext
from jose import jwt
import os

# Support both bcrypt and sha256_crypt for transition period
pwd_context = CryptContext(schemes=["bcrypt", "sha256_crypt"], deprecated="auto")
SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = "HS256"

def hash_password(password: str) -> str:
    # Use sha256_crypt for new passwords
    return pwd_context.hash(password, scheme="sha256_crypt")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(email: str) -> str:
    payload = {"sub": email}
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

def decode_access_token(token: str) -> str:
    payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    return payload.get("sub")
