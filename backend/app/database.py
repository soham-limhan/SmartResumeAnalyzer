"""Firebase initialization and Firestore client."""

import json
import base64
import os
import logging

import firebase_admin
from firebase_admin import credentials, firestore

from app.config import settings

logger = logging.getLogger(__name__)

_db = None


def init_firebase():
    """Initialize Firebase Admin SDK and Firestore client."""
    global _db

    if firebase_admin._apps:
        logger.info("Firebase already initialized.")
        _db = firestore.client()
        return

    try:
        # Priority 1: base64-encoded credentials from env (production)
        if settings.firebase_credentials_base64:
            cred_dict = json.loads(
                base64.b64decode(settings.firebase_credentials_base64)
            )
            cred = credentials.Certificate(cred_dict)
            logger.info("[FIREBASE] Using base64-encoded credentials (production)")

        # Priority 2: local JSON key file (development)
        elif os.path.exists(settings.firebase_credentials_path):
            cred = credentials.Certificate(settings.firebase_credentials_path)
            logger.info(f"[FIREBASE] Using key file: {settings.firebase_credentials_path}")

        else:
            raise FileNotFoundError(
                f"No Firebase credentials found. "
                f"Set SMARTRESUME_FIREBASE_CREDENTIALS_BASE64 env var "
                f"or place firebase-key.json at: {settings.firebase_credentials_path}"
            )

        firebase_admin.initialize_app(cred)
        _db = firestore.client()
        logger.info("[FIREBASE] Firestore client initialized successfully")

    except Exception as e:
        logger.error(f"[FIREBASE] Initialization failed: {e}")
        raise


def get_db():
    """Get the Firestore client instance."""
    if _db is None:
        init_firebase()
    return _db
