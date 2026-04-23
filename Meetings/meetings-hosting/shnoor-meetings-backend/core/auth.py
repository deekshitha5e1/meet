import json
import os
from dataclasses import dataclass
from typing import Any, Optional
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from dotenv import load_dotenv
from fastapi import Header, HTTPException

load_dotenv()

SUPABASE_URL = (os.getenv("SUPABASE_URL") or "").rstrip("/")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY")


class SupabaseAuthError(Exception):
    def __init__(self, detail: str, status_code: int = 401):
        super().__init__(detail)
        self.detail = detail
        self.status_code = status_code


@dataclass
class AuthenticatedUser:
    user_id: str
    email: Optional[str]
    name: str
    profile_picture: Optional[str] = None


def _require_supabase_auth_config():
    if not SUPABASE_URL or not SUPABASE_ANON_KEY:
        raise SupabaseAuthError(
            "Supabase Auth is not configured. Set SUPABASE_URL and SUPABASE_ANON_KEY.",
            status_code=500,
        )


def validate_shnoor_email(email: str) -> bool:
    """Validate that email is from @shnoor.com domain"""
    if not email:
        return False
    return email.lower().endswith("@shnoor.com")


def extract_bearer_token(authorization: Optional[str]) -> str:
    if not authorization:
        raise SupabaseAuthError("Missing Authorization header")

    scheme, _, token = authorization.partition(" ")
    if scheme.lower() != "bearer" or not token.strip():
        raise SupabaseAuthError("Invalid Authorization header")

    return token.strip()


def _read_supabase_user(access_token: str) -> dict[str, Any]:
    _require_supabase_auth_config()

    request = Request(
        f"{SUPABASE_URL}/auth/v1/user",
        headers={
            "apikey": SUPABASE_ANON_KEY,
            "Authorization": f"Bearer {access_token}",
        },
        method="GET",
    )

    try:
        with urlopen(request, timeout=10) as response:
            return json.loads(response.read().decode("utf-8"))
    except HTTPError as exc:
        if exc.code in {401, 403}:
            raise SupabaseAuthError("Invalid or expired Supabase access token") from exc
        raise SupabaseAuthError("Supabase Auth verification failed", status_code=502) from exc
    except (URLError, OSError, json.JSONDecodeError) as exc:
        raise SupabaseAuthError("Unable to verify Supabase access token", status_code=502) from exc


def get_authenticated_user(access_token: str) -> AuthenticatedUser:
    if not access_token:
        raise SupabaseAuthError("Missing Supabase access token")

    payload = _read_supabase_user(access_token)
    user_id = payload.get("id")
    email = payload.get("email")
    metadata = payload.get("user_metadata") or {}

    if not user_id:
        raise SupabaseAuthError("Supabase token did not include a user id")

    if not validate_shnoor_email(email):
        raise SupabaseAuthError(
            f"Access denied. Only @shnoor.com users are allowed. Got: {email}",
            status_code=403,
        )

    name = (
        metadata.get("full_name")
        or metadata.get("name")
        or metadata.get("user_name")
        or email
        or "Guest"
    )

    return AuthenticatedUser(
        user_id=str(user_id),
        email=email,
        name=name,
        profile_picture=metadata.get("avatar_url") or metadata.get("picture"),
    )


def get_current_user(authorization: Optional[str] = Header(default=None)) -> AuthenticatedUser:
    try:
        access_token = extract_bearer_token(authorization)
        return get_authenticated_user(access_token)
    except SupabaseAuthError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.detail) from exc

