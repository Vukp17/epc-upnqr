import os
import time

import jwt
from fastapi import HTTPException, Request

JWT_SECRET = os.getenv("JWT_SECRET", "change-me")
JWT_TTL_MIN = int(os.getenv("JWT_TTL_MIN", "1440"))
AUTH_USERNAME = os.getenv("AUTH_USERNAME", "admin")
AUTH_PASSWORD = os.getenv("AUTH_PASSWORD", "admin")


def create_token(username: str) -> dict[str, object]:
    expires_at = int(time.time()) + JWT_TTL_MIN * 60
    payload = {
        "sub": username,
        "exp": expires_at,
    }
    token = jwt.encode(payload, JWT_SECRET, algorithm="HS256")
    return {
        "access_token": token,
        "token_type": "Bearer",
        "expires_at": expires_at,
    }


def verify_token_from_request(request: Request) -> dict[str, object]:
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid Authorization header.")

    token = auth_header.split(" ", 1)[1].strip()
    if not token:
        raise HTTPException(status_code=401, detail="Missing token.")

    try:
        return jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
    except jwt.ExpiredSignatureError as exc:
        raise HTTPException(status_code=401, detail="Token expired.") from exc
    except jwt.InvalidTokenError as exc:
        raise HTTPException(status_code=401, detail="Invalid token.") from exc
