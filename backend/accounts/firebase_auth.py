"""Vérification des tokens Firebase Authentication (OTP SMS côté client)."""
from __future__ import annotations

import json
import logging
import os

logger = logging.getLogger(__name__)

_firebase_initialized = False


def _init_firebase():
    global _firebase_initialized
    if _firebase_initialized:
        return True
    try:
        import firebase_admin
        from firebase_admin import credentials
    except ImportError:
        logger.warning("firebase-admin non installé — OTP Firebase indisponible.")
        return False

    if firebase_admin._apps:
        _firebase_initialized = True
        return True

    cred_json = os.environ.get("FIREBASE_SERVICE_ACCOUNT_JSON", "").strip()
    cred_path = os.environ.get("GOOGLE_APPLICATION_CREDENTIALS", "").strip()
    try:
        if cred_json:
            cred = credentials.Certificate(json.loads(cred_json))
        elif cred_path:
            cred = credentials.Certificate(cred_path)
        else:
            logger.warning("Firebase : aucune credential configurée.")
            return False
        firebase_admin.initialize_app(cred)
        _firebase_initialized = True
        return True
    except Exception as exc:
        logger.warning("Initialisation Firebase échouée: %s", exc)
        return False


def verify_firebase_id_token(id_token: str) -> dict:
    """
    Vérifie un ID token Firebase et retourne les claims (phone_number, uid, …).
    """
    if not id_token:
        raise ValueError("Token Firebase manquant.")
    if not _init_firebase():
        raise RuntimeError(
            "Firebase Authentication non configuré. "
            "Définissez FIREBASE_SERVICE_ACCOUNT_JSON ou GOOGLE_APPLICATION_CREDENTIALS."
        )
    from firebase_admin import auth

    return auth.verify_id_token(id_token, check_revoked=True)
