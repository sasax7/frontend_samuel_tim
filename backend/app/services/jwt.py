from __future__ import annotations

from datetime import datetime, timedelta, timezone

from jose import jwt

from app.core.settings import settings


def create_access_token(*, subject: str) -> str:
    now = datetime.now(timezone.utc)
    exp = now + timedelta(minutes=settings.jwt_access_ttl_minutes)

    payload = {
        "iss": settings.jwt_issuer,
        "aud": settings.jwt_audience,
        "sub": subject,
        "iat": int(now.timestamp()),
        "exp": int(exp.timestamp()),
        "type": "access",
    }

    return jwt.encode(payload, settings.jwt_secret, algorithm="HS256")
