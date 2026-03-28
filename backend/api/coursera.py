from fastapi import APIRouter
from urllib.parse import quote
import os
import requests
from datetime import datetime, timedelta

router = APIRouter(prefix="/coursera")


@router.get("/connect/{user_id}")
def connect_coursera(user_id: str):
    scope = "view_profile view_enrollments"

    auth_url = (
        "https://accounts.coursera.org/oauth2/v1/auth"
        f"?client_id={CLIENT_ID}"
        f"&response_type=code"
        f"&redirect_uri={quote(REDIRECT_URI)}"
        f"&scope={quote(scope)}"
        f"&access_type=offline"
        f"&state={user_id}"
    )

    return {"auth_url": auth_url}

