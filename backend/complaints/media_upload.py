"""Validation et enregistrement des médias de dépôt (hors corps JSON principal)."""
import logging
import os

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


def save_voice_file(complaint: Complaint, uploaded_file) -> Response | None:
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

    complaint.voice_file = uploaded_file
    complaint.save(update_fields=['voice_file'])
    return None


def save_attachment(complaint: Complaint, uploaded_file, from_whatsapp: bool = False) -> Response | None:
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
    code = 'STORAGE_UPLOAD_FAILED'
    hint = "Impossible d'enregistrer le fichier sur le disque."
    payload = {'error': hint, 'error_code': code}
    if settings.DEBUG:
        payload['detail'] = str(exc)
    else:
        payload['detail'] = exc.__class__.__name__
    return Response(payload, status=status.HTTP_503_SERVICE_UNAVAILABLE)
