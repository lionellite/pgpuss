"""Validation et enregistrement des médias de dépôt (hors corps JSON principal)."""
import logging
import os
import uuid

from django.conf import settings
from rest_framework import status
from rest_framework.response import Response

from .models import Attachment, Complaint

logger = logging.getLogger(__name__)


def _max_bytes():
    """Limite upload pour le mode serverless (Vercel) - 4 Mo par défaut."""
    return getattr(settings, 'VERCEL_MAX_UPLOAD_BYTES', 4 * 1024 * 1024)


def _max_bytes_whatsapp():
    """Limite upload pour les pièces jointes WhatsApp - 50 Mo par défaut sur VPS."""
    return getattr(settings, 'WHATSAPP_MAX_UPLOAD_BYTES', 50 * 1024 * 1024)


def _is_serverless():
    return getattr(settings, 'FAST_COMPLAINT_CREATE', False) or os.environ.get('VERCEL', '').lower() in (
        '1', 'true',
    )


def _cloudinary_url():
    return (getattr(settings, 'CLOUDINARY_URL', '') or os.environ.get('CLOUDINARY_URL', '')).strip()


def _require_cloudinary() -> Response | None:
    """Sur Vercel, le disque local est inutilisable — Cloudinary est obligatoire."""
    if _cloudinary_url():
        return None
    if _is_serverless():
        return Response(
            {
                'error': (
                    'Le stockage de fichiers n\'est pas configuré sur le serveur. '
                    'Ajoutez la variable CLOUDINARY_URL dans les paramètres Vercel du backend, '
                    'puis redéployez. Voir docs/CLOUDINARY.md.'
                ),
                'error_code': 'CLOUDINARY_NOT_CONFIGURED',
            },
            status=status.HTTP_503_SERVICE_UNAVAILABLE,
        )
    return None


def _ensure_cloudinary_sdk():
    import cloudinary

    url = _cloudinary_url()
    if not url:
        raise RuntimeError('CLOUDINARY_URL manquant')
    cloudinary.config(cloudinary_url=url, secure=True)


def _cloudinary_upload(uploaded_file, *, folder: str, resource_type: str = 'auto', force_format: str | None = None):
    """Upload direct via l'API Cloudinary (public_id court pour éviter varchar(100))."""
    import cloudinary.uploader

    _ensure_cloudinary_sdk()
    uploaded_file.seek(0)
    public_id = f'{folder}/{uuid.uuid4().hex}'
    kwargs = {
        'public_id': public_id,
        'resource_type': resource_type,
        'type': 'upload',
        'access_mode': 'public',
        'use_filename': False,
        'unique_filename': False,
        'overwrite': False,
    }
    if force_format:
        kwargs['format'] = force_format
    return cloudinary.uploader.upload(uploaded_file, **kwargs)


def _assign_cloudinary_file(file_field, result: dict):
    """Associe un résultat Cloudinary à un FileField (nom court, max 255)."""
    public_id = result.get('public_id') or ''
    fmt = result.get('format')
    name = f'{public_id}.{fmt}' if fmt else public_id
    file_field.name = name[:255]


def _secure_url(result: dict) -> str:
    return (result.get('secure_url') or result.get('url') or '').strip()


def save_voice_file(complaint: Complaint, uploaded_file) -> Response | None:
    missing = _require_cloudinary()
    if missing:
        return missing

    if complaint.voice_file or complaint.voice_media_url:
        return Response(
            {'error': 'Un message vocal est déjà enregistré pour cette plainte.'},
            status=status.HTTP_400_BAD_REQUEST,
        )
    if uploaded_file.size > _max_bytes():
        return Response(
            {'error': f'Le fichier vocal ne doit pas dépasser {_max_bytes() // (1024 * 1024)} Mo.'},
            status=status.HTTP_400_BAD_REQUEST,
        )
    ct = getattr(uploaded_file, 'content_type', '') or ''
    if not any(ct.startswith(p) for p in ('audio/', 'video/', 'application/octet-stream')):
        return Response(
            {'error': 'Le fichier vocal doit être un fichier audio.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    folder = f'complaints/voice/{complaint.id}'
    if _cloudinary_url():
        # Toujours convertir en mp3 pour lecture <audio> dans tous les navigateurs.
        result = _cloudinary_upload(
            uploaded_file,
            folder=folder,
            resource_type='video',
            force_format='mp3',
        )
        _assign_cloudinary_file(complaint.voice_file, result)
        complaint.voice_media_url = _secure_url(result)
        complaint.save(update_fields=['voice_file', 'voice_media_url'])
    else:
        complaint.voice_file = uploaded_file
        complaint.save(update_fields=['voice_file'])
    return None


def save_attachment(complaint: Complaint, uploaded_file, from_whatsapp: bool = False) -> Response | None:
    missing = _require_cloudinary()
    if missing:
        return missing

    max_size = _max_bytes_whatsapp() if from_whatsapp else _max_bytes()
    if uploaded_file.size > max_size:
        return Response(
            {'error': f'La pièce jointe ne doit pas dépasser {max_size // (1024 * 1024)} Mo.'},
            status=status.HTTP_400_BAD_REQUEST,
        )
    ct = getattr(uploaded_file, 'content_type', '') or ''
    allowed = (
        'image/', 'application/pdf', 'audio/', 'video/',
        'application/msword', 'application/vnd.openxmlformats',
        'application/octet-stream',
    )
    if not any(ct.startswith(a) for a in allowed):
        return Response(
            {'error': 'Type de fichier non autorisé.'},
            status=status.HTTP_400_BAD_REQUEST,
        )
    if complaint.attachments.count() >= 5:
        return Response(
            {'error': 'Maximum 5 pièces jointes par plainte.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    file_name = getattr(uploaded_file, 'name', '') or 'piece_jointe'
    folder = f'attachments/{complaint.id}'

    if _cloudinary_url():
        # video/ et audio/ → resource_type='video' (Cloudinary traite audio via video)
        is_media = ct.startswith('audio/') or ct.startswith('video/')
        resource_type = 'video' if is_media else 'auto'
        result = _cloudinary_upload(uploaded_file, folder=folder, resource_type=resource_type)
        att = Attachment(
            complaint=complaint,
            file_name=file_name,
            file_type=ct or (result.get('format') or ''),
            file_size=getattr(uploaded_file, 'size', 0) or 0,
            media_url=_secure_url(result),
        )
        _assign_cloudinary_file(att.file, result)
        att.save()
    else:
        Attachment.objects.create(
            complaint=complaint,
            file=uploaded_file,
            file_name=file_name,
            file_type=ct,
            file_size=getattr(uploaded_file, 'size', 0) or 0,
        )
    return None


def storage_error_response(exc: Exception) -> Response:
    logger.exception('Échec enregistrement média plainte')
    code = 'CLOUDINARY_UPLOAD_FAILED'
    hint = (
        'Impossible d\'enregistrer le fichier sur Cloudinary. '
        'Vérifiez CLOUDINARY_URL sur Vercel (clé, secret, nom du cloud).'
    )
    if not _cloudinary_url():
        code = 'CLOUDINARY_NOT_CONFIGURED'
        hint = (
            'CLOUDINARY_URL n\'est pas définie sur le serveur. '
            'Configurez-la dans Vercel puis redéployez.'
        )
    payload = {'error': hint, 'error_code': code}
    if settings.DEBUG:
        payload['detail'] = str(exc)
    else:
        payload['detail'] = exc.__class__.__name__
    return Response(payload, status=status.HTTP_503_SERVICE_UNAVAILABLE)
