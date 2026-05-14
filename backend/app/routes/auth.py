"""Authentication API routes."""

from fastapi import APIRouter, Depends

from app.services.auth import require_auth

router = APIRouter()


@router.get("/auth/me")
async def get_current_user_profile(user: dict = Depends(require_auth)):
    """Return the current authenticated user's profile.

    This validates the Firebase ID token and returns user info.
    """
    return {
        "uid": user["uid"],
        "email": user["email"],
        "name": user["name"],
        "picture": user.get("picture", ""),
    }
