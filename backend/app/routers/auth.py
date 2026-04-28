from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from datetime import datetime
from bson import ObjectId
from app.core.database import get_db
from app.core.security import hash_password, verify_password, create_access_token, decode_token
from app.schemas.auth import UserCreate, UserLogin, TokenResponse, UserResponse

router = APIRouter(prefix="/api/auth", tags=["auth"])
bearer = HTTPBearer()

def format_user(user: dict) -> UserResponse:
    return UserResponse(
        id=str(user["_id"]),
        name=user["name"],
        email=user["email"],
        domain=user.get("domain"),
        experience=user.get("experience"),
        plan=user.get("plan", "free"),
        created_at=user.get("created_at", datetime.utcnow()),
    )

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer),
):
    payload = decode_token(credentials.credentials)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    db = get_db()
    user = await db.users.find_one({"_id": ObjectId(payload["sub"])})
    if not user or not user.get("is_active", True):
        raise HTTPException(status_code=401, detail="User not found")
    return user

@router.post("/register", response_model=TokenResponse, status_code=201)
async def register(data: UserCreate):
    db = get_db()
    existing = await db.users.find_one({"email": data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    user_doc = {
        "name": data.name,
        "email": data.email,
        "hashed_password": hash_password(data.password),
        "domain": data.domain,
        "experience": data.experience,
        "plan": "free",
        "is_active": True,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }
    result = await db.users.insert_one(user_doc)
    user_doc["_id"] = result.inserted_id

    token = create_access_token({"sub": str(result.inserted_id)})
    return TokenResponse(access_token=token, user=format_user(user_doc))

@router.post("/login", response_model=TokenResponse)
async def login(data: UserLogin):
    db = get_db()
    user = await db.users.find_one({"email": data.email})
    if not user or not verify_password(data.password, user["hashed_password"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_access_token({"sub": str(user["_id"])})
    return TokenResponse(access_token=token, user=format_user(user))

@router.get("/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    return format_user(current_user)

@router.post("/logout")
async def logout():
    return {"message": "Logged out successfully"}
