import base64
import hashlib
import hmac
import json
import secrets
import time

from fastapi import Depends, Header, HTTPException, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.session import get_db
from app.models import User


PASSWORD_ITERATIONS = 210_000
TOKEN_TTL_SECONDS = 60 * 60 * 24 * 7


def hash_password(password: str) -> str:
    salt = secrets.token_hex(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode(), salt.encode(), PASSWORD_ITERATIONS)
    return f"pbkdf2_sha256${PASSWORD_ITERATIONS}${salt}${digest.hex()}"


def verify_password(password: str, stored_hash: str) -> bool:
    try:
        algorithm, iterations, salt, expected = stored_hash.split("$", 3)
    except ValueError:
        return False

    if algorithm != "pbkdf2_sha256":
        return False

    digest = hashlib.pbkdf2_hmac("sha256", password.encode(), salt.encode(), int(iterations)).hex()
    return hmac.compare_digest(digest, expected)


def create_token(user: User) -> str:
    payload = {
        "sub": user.id,
        "email": user.email,
        "exp": int(time.time()) + TOKEN_TTL_SECONDS,
    }
    encoded_payload = b64encode(json.dumps(payload, separators=(",", ":")).encode())
    signature = sign(encoded_payload)
    return f"{encoded_payload}.{signature}"


def decode_token(token: str) -> dict:
    try:
        encoded_payload, signature = token.split(".", 1)
    except ValueError as exc:
        raise credentials_error() from exc

    if not hmac.compare_digest(sign(encoded_payload), signature):
        raise credentials_error()

    try:
        payload = json.loads(b64decode(encoded_payload).decode())
    except (json.JSONDecodeError, UnicodeDecodeError) as exc:
        raise credentials_error() from exc

    if payload.get("exp", 0) < int(time.time()):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Session expired.")

    return payload


def get_current_user(
    authorization: str | None = Header(default=None),
    db: Session = Depends(get_db),
) -> User:
    if not authorization or not authorization.startswith("Bearer "):
        raise credentials_error()

    payload = decode_token(authorization.removeprefix("Bearer ").strip())
    user = db.get(User, payload.get("sub"))
    if not user:
        raise credentials_error()
    return user


def credentials_error() -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Sign in required.",
        headers={"WWW-Authenticate": "Bearer"},
    )


def sign(value: str) -> str:
    digest = hmac.new(settings.secret_key.encode(), value.encode(), hashlib.sha256).digest()
    return b64encode(digest)


def b64encode(value: bytes) -> str:
    return base64.urlsafe_b64encode(value).decode().rstrip("=")


def b64decode(value: str) -> bytes:
    padding = "=" * (-len(value) % 4)
    return base64.urlsafe_b64decode(value + padding)

