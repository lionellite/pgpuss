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

    Supporte trois modes :
    - Volume partagé : fichier dans /shared/media (recommandé pour Docker)
    - Ancien : base64 dans le champ ``data``
    - URL locale : URL locale OpenWA dans le champ ``url`` (fallback)
    """
    # --- Mode volume partagé Docker (recommandé) ---
    url = media.get("url")
    if url:
        import os
        import re
        
        # Essaie d'extraire un identifiant de fichier depuis l'URL
        file_id_match = re.search(r'[?&]id=([^&]+)', url)
        filename_from_url = media.get("filename") or ""
        
        # Cherche le fichier dans le volume partagé
        shared_media_path = "/shared/media"
        if os.path.exists(shared_media_path):
            # Cherche le fichier le plus récent correspondant au type MIME
            mimetype = (media.get("mimetype") or "application/octet-stream").strip()
            
            # Liste tous les fichiers du volume partagé triés par date de modification
            all_files = []
            for root, dirs, files in os.walk(shared_media_path):
                for file in files:
                    file_path = os.path.join(root, file)
                    try:
                        stat = os.stat(file_path)
                        all_files.append((file_path, stat.st_mtime, stat.st_size))
                    except OSError:
                        continue
            
            # Trie par date de modification (plus récent en premier)
            all_files.sort(key=lambda x: x[1], reverse=True)
            
            # Essaie de trouver un fichier correspondant
            for file_path, mtime, size in all_files:
                file = os.path.basename(file_path)
                
                # Vérifie si le fichier correspond à l'ID ou au nom
                match = False
                if file_id_match:
                    file_id = file_id_match.group(1)
                    if file_id in file or file.startswith(file_id):
                        match = True
                if filename_from_url and filename_from_url in file:
                    match = True
                
                # Si pas de correspondance précise, prend le fichier le plus récent
                # du bon type MIME (basé sur l'extension)
                if not match and all_files.index((file_path, mtime, size)) == 0:
                    match = True
                
                if match:
                    try:
                        with open(file_path, 'rb') as f:
                            raw_bytes = f.read()
                        filename = (filename_from_url or "").strip() or file
                        logger.info("Fichier lu depuis volume partagé: %s (taille: %d octets)", file_path, len(raw_bytes))
                        return InMemoryUpload(raw_bytes, filename, mimetype)
                    except Exception as exc:
                        logger.warning("Impossible de lire le fichier %s: %s", file_path, exc)
                        continue
        
        # --- Mode URL locale (fallback - téléchargement HTTP) ---
        try:
            import urllib.request as _req
            with _req.urlopen(url, timeout=30) as resp:
                raw_bytes = resp.read()
            if raw_bytes:
                mimetype = (media.get("mimetype") or "application/octet-stream").strip()
                filename = (media.get("filename") or "").strip() or _default_filename(mimetype)
                logger.info("Fichier téléchargé depuis URL: %s", url)
                return InMemoryUpload(raw_bytes, filename, mimetype)
        except Exception as exc:
            logger.warning("Impossible de télécharger le média depuis %s: %s", url, exc)
            # Essaie le fallback base64 si présent
            raw_bytes = None

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
        err = _response_error(save_attachment(complaint, uploaded, from_whatsapp=True))
        if err:
            warnings.append(f"Pièce jointe {idx} : {err}")

    return warnings
