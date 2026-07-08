"""Enregistrement des médias WhatsApp (audio, pièces jointes) sur la plateforme."""
from __future__ import annotations

import base64
import io
import logging
import os
import tempfile
import shutil

from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework.response import Response

from .media_upload import save_attachment, save_voice_file
from .models import Complaint

logger = logging.getLogger(__name__)


def _decode_media_payload(media: dict) -> SimpleUploadedFile | None:
    """Décode un payload média WhatsApp et retourne un SimpleUploadedFile compatible Django.

    Supporte deux modes :
    - Volume partagé : fichier dans /shared/media (OpenWA) → SimpleUploadedFile
    - Ancien : base64 dans le champ ``data`` → SimpleUploadedFile
    """
    # --- Mode volume partagé Docker (recommandé) ---
    url = media.get("url")
    if url:
        import re
        
        # Essaie d'extraire un identifiant de fichier depuis l'URL
        file_id_match = re.search(r'[?&]id=([^&]+)', url)
        filename_from_url = media.get("filename") or ""
        
        # Cherche le fichier dans le volume partagé OpenWA
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
                if not match and all_files.index((file_path, mtime, size)) == 0:
                    match = True
                
                if match:
                    try:
                        # Lit le fichier depuis le volume partagé
                        with open(file_path, 'rb') as f:
                            file_content = f.read()
                        
                        # Génère un nom de fichier unique
                        target_filename = filename_from_url.strip() or file
                        if not target_filename:
                            target_filename = _default_filename(mimetype)
                        
                        # Crée un SimpleUploadedFile compatible Django
                        uploaded_file = SimpleUploadedFile(
                            name=target_filename,
                            content=file_content,
                            content_type=mimetype
                        )
                        
                        logger.info("Fichier chargé depuis %s (taille: %d octets)", file_path, len(file_content))
                        return uploaded_file
                    except Exception as exc:
                        logger.warning("Impossible de lire le fichier %s: %s", file_path, exc)
                        continue

    # --- Mode base64 (rétrocompatibilité / audio court) ---
    raw = media.get("data")
    if raw:
        try:
            data = base64.b64decode(raw)
            mimetype = (media.get("mimetype") or "application/octet-stream").strip()
            filename = (media.get("filename") or "").strip() or _default_filename(mimetype)
            
            uploaded_file = SimpleUploadedFile(
                name=filename,
                content=data,
                content_type=mimetype
            )
            return uploaded_file
        except (ValueError, TypeError):
            logger.warning("Impossible de décoder le média WhatsApp (base64 invalide)")
    
    return None



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
