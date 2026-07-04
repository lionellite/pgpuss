"""Enregistrement des médias WhatsApp (audio, pièces jointes) sur la plateforme."""
from __future__ import annotations

import base64
import io
import logging

from rest_framework.response import Response

from .media_upload import save_attachment, save_voice_file
from .models import Complaint

logger = logging.getLogger(__name__)


class InMemoryUpload:
    """Adaptateur fichier en mémoire compatible avec media_upload."""

    def __init__(self, data: bytes, name: str, content_type: str):
        self._io = io.BytesIO(data)
        self.name = name
        self.content_type = content_type
        self.size = len(data)

    def seek(self, pos: int, whence: int = 0) -> int:
        return self._io.seek(pos, whence)

    def read(self, n: int = -1) -> bytes:
        return self._io.read(n)


def _decode_media_payload(media: dict) -> InMemoryUpload | None:
    """Décode un payload média WhatsApp.

    Supporte deux modes :
    - Ancien : base64 dans le champ ``data``
    - Nouveau (recommandé) : URL locale OpenWA dans le champ ``url``
    """
    # --- Mode URL (fichier sauvegardé sur le disque OpenWA) ---
    url = media.get("url")
    if url:
        try:
            import urllib.request as _req
            with _req.urlopen(url, timeout=30) as resp:
                raw_bytes = resp.read()
        except Exception as exc:
            logger.warning("Impossible de télécharger le média depuis %s: %s", url, exc)
            # Essaie le fallback base64 si présent
            raw_bytes = None

        if raw_bytes:
            mimetype = (media.get("mimetype") or "application/octet-stream").strip()
            filename = (media.get("filename") or "").strip() or _default_filename(mimetype)
            return InMemoryUpload(raw_bytes, filename, mimetype)

    # --- Mode base64 (rétrocompatibilité / audio court) ---
    raw = media.get("data")
    if not raw:
        return None
    try:
        data = base64.b64decode(raw)
    except (ValueError, TypeError):
        logger.warning("Impossible de décoder le média WhatsApp (base64 invalide)")
        return None
    if not data:
        return None
    mimetype = (media.get("mimetype") or "application/octet-stream").strip()
    filename = (media.get("filename") or "").strip() or _default_filename(mimetype)
    return InMemoryUpload(data, filename, mimetype)



def _default_filename(mimetype: str) -> str:
    if mimetype.startswith("audio/"):
        ext = mimetype.split("/")[-1] or "ogg"
        return f"message_vocal.{ext}"
    if mimetype.startswith("image/"):
        ext = mimetype.split("/")[-1] or "jpg"
        return f"photo.{ext}"
    if mimetype == "application/pdf":
        return "document.pdf"
    return "piece_jointe"


def _response_error(result: Response | None) -> str | None:
    if result is None:
        return None
    payload = result.data if isinstance(result.data, dict) else {}
    return payload.get("error") or "Erreur lors de l'enregistrement du fichier."


def apply_draft_media_to_complaint(complaint: Complaint, draft_data: dict) -> list[str]:
    """Transfère les médias du brouillon WhatsApp vers la plainte. Retourne les avertissements."""
    warnings: list[str] = []

    voice = draft_data.get("voice")
    if isinstance(voice, dict):
        uploaded = _decode_media_payload(voice)
        if uploaded:
            err = _response_error(save_voice_file(complaint, uploaded))
            if err:
                warnings.append(f"Message vocal : {err}")
        else:
            warnings.append("Le message vocal n'a pas pu être enregistré.")

    attachments = draft_data.get("attachments") or []
    if not isinstance(attachments, list):
        attachments = []

    for idx, att in enumerate(attachments, start=1):
        if not isinstance(att, dict):
            continue
        uploaded = _decode_media_payload(att)
        if not uploaded:
            warnings.append(f"Pièce jointe {idx} : fichier illisible.")
            continue
        err = _response_error(save_attachment(complaint, uploaded))
        if err:
            warnings.append(f"Pièce jointe {idx} : {err}")

    return warnings
