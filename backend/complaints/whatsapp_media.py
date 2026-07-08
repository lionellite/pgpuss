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
    """Décode un payload média WhatsApp et copie le fichier vers /app/media (stockage Django).

    Supporte deux modes :
    - Volume partagé : fichier dans /shared/media (OpenWA) → copié vers /app/media (Django)
    - Ancien : base64 dans le champ ``data``
    """
    import os
    import shutil
    from django.conf import settings
    
    logger.info("Début décodage média: %s", media)
    
    # --- Mode volume partagé Docker (recommandé) ---
    url = media.get("url")
    if url:
        import re
        
        # Essaie d'extraire un identifiant de fichier depuis l'URL
        file_id_match = re.search(r'[?&]id=([^&]+)', url)
        filename_from_url = media.get("filename") or ""
        
        logger.info("URL média: %s, filename: %s, file_id: %s", url, filename_from_url, file_id_match.group(1) if file_id_match else None)
        
        # Cherche le fichier dans le volume partagé OpenWA
        shared_media_path = "/shared/media"
        logger.info("Chemin volume partagé: %s, existe: %s", shared_media_path, os.path.exists(shared_media_path))
        
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
            
            logger.info("Fichiers trouvés dans volume partagé: %d", len(all_files))
            
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
                        logger.info("Match par ID: %s dans %s", file_id, file)
                if filename_from_url and filename_from_url in file:
                    match = True
                    logger.info("Match par filename: %s dans %s", filename_from_url, file)
                
                # Si pas de correspondance précise, prend le fichier le plus récent
                if not match and all_files.index((file_path, mtime, size)) == 0:
                    match = True
                    logger.info("Match par défaut (fichier le plus récent): %s", file)
                
                if match:
                    try:
                        # Copie le fichier vers le stockage Django (/app/media)
                        django_media_root = getattr(settings, 'MEDIA_ROOT', '/app/media')
                        logger.info("MEDIA_ROOT Django: %s", django_media_root)
                        
                        # Crée les sous-dossiers nécessaires (complaints/voice/ ou attachments/)
                        if mimetype.startswith("audio/"):
                            target_dir = os.path.join(django_media_root, 'complaints', 'voice')
                        else:
                            target_dir = os.path.join(django_media_root, 'attachments')
                        
                        logger.info("Dossier cible: %s", target_dir)
                        os.makedirs(target_dir, exist_ok=True)
                        
                        # Génère un nom de fichier unique
                        target_filename = filename_from_url.strip() or file
                        if not target_filename:
                            target_filename = _default_filename(mimetype)
                        
                        target_path = os.path.join(target_dir, target_filename)
                        logger.info("Chemin cible: %s", target_path)
                        
                        # Copie le fichier
                        shutil.copy2(file_path, target_path)
                        
                        # Lit le fichier copié pour le retourner
                        with open(target_path, 'rb') as f:
                            raw_bytes = f.read()
                        
                        logger.info("✅ Fichier copié avec succès de %s vers %s (taille: %d octets)", file_path, target_path, len(raw_bytes))
                        return InMemoryUpload(raw_bytes, target_filename, mimetype)
                    except Exception as exc:
                        logger.error("❌ Impossible de copier le fichier %s vers %s: %s", file_path, target_path if 'target_path' in locals() else 'target', exc)
                        continue
        else:
            logger.warning("Volume partagé %s n'existe pas", shared_media_path)

    # --- Mode base64 (rétrocompatibilité / audio court) ---
    raw = media.get("data")
    if raw:
        logger.info("Mode base64 détecté, taille: %d", len(raw))
        try:
            data = base64.b64decode(raw)
            mimetype = (media.get("mimetype") or "application/octet-stream").strip()
            filename = (media.get("filename") or "").strip() or _default_filename(mimetype)
            logger.info("✅ Base64 décodé avec succès, taille: %d", len(data))
            return InMemoryUpload(data, filename, mimetype)
        except (ValueError, TypeError) as exc:
            logger.warning("Impossible de décoder le média WhatsApp (base64 invalide): %s", exc)
    else:
        logger.warning("Aucune donnée URL ou base64 trouvée dans le média")
    
    logger.error("❌ Échec du décodage du média WhatsApp")
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
