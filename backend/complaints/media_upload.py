"""Validation et enregistrement des médias de dépôt (hors corps JSON principal)."""
import logging
import os

from django.conf import settings
from rest_framework import status
from rest_framework.response import Response

from .models import Attachment, Complaint

logger = logging.getLogger(__name__)


def _max_bytes():
    return getattr(settings, 'VERCEL_MAX_UPLOAD_BYTES', 4 * 1024 * 1024)


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


def _cloudinary_upload(uploaded_file, *, folder: str, resource_type: str = 'auto'):
    """Upload direct via l'API Cloudinary (fiable sur Vercel serverless)."""
    import cloudinary.uploader

    _ensure_cloudinary_sdk()
    uploaded_file.seek(0)
    return cloudinary.uploader.upload(
        uploaded_file,
        folder=folder,
        resource_type=resource_type,
        use_filename=True,
        unique_filename=True,
        overwrite=False,
    )


def _assign_cloudinary_file(file_field, result: dict):
    """Associe un résultat Cloudinary à un FileField (MediaCloudinaryStorage)."""
    public_id = result.get('public_id') or ''
    fmt = result.get('format')
    name = f'{public_id}.{fmt}' if fmt else public_id
    file_field.name = name


def save_voice_file(complaint: Complaint, uploaded_file) -> Response | None:
    missing = _require_cloudinary()
    if missing:
        return missing

    if complaint.voice_file:
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
        result = _cloudinary_upload(
            uploaded_file,
            folder=folder,
            resource_type='video',
        )
        _assign_cloudinary_file(complaint.voice_file, result)
        complaint.save(update_fields=['voice_file'])
    else:
        complaint.voice_file = uploaded_file
        complaint.save(update_fields=['voice_file'])
    return None


def save_attachment(complaint: Complaint, uploaded_file) -> Response | None:
    missing = _require_cloudinary()
    if missing:
        return missing

    if uploaded_file.size > _max_bytes():
        return Response(
            {'error': f'La pièce jointe ne doit pas dépasser {_max_bytes() // (1024 * 1024)} Mo.'},
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
        result = _cloudinary_upload(uploaded_file, folder=folder, resource_type='auto')
        att = Attachment(
            complaint=complaint,
            file_name=file_name,
            file_type=ct,
            file_size=getattr(uploaded_file, 'size', 0) or 0,
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
