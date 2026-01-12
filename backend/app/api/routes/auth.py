from __future__ import annotations

from fastapi import APIRouter, HTTPException

from app.db.repositories import UsersRepo
from app.models.auth import LoginRequest, RegisterRequest, TokenResponse
from app.services.jwt import create_access_token
from app.services.passwords import hash_password, verify_password

router = APIRouter()

users = UsersRepo()


@router.post("/register", response_model=TokenResponse)
async def register(body: RegisterRequest):
    email = body.email.lower().strip()
    if len(body.password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters")

    existing = await users.find_by_email(email)
    if existing is not None:
        raise HTTPException(status_code=409, detail="Email already registered")

    pwd_hash = hash_password(body.password)
    user_id = await users.create(email=email, password_hash=pwd_hash)

    token = create_access_token(subject=user_id)
    return TokenResponse(access_token=token)


@router.post("/login", response_model=TokenResponse)
async def login(body: LoginRequest):
    email = body.email.lower().strip()
    u = await users.find_by_email(email)
    if u is None:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    if not verify_password(body.password, u.get("password_hash", "")):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_access_token(subject=str(u.get("_id")))
    return TokenResponse(access_token=token)
