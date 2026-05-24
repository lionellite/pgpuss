"""Validation et enregistrement des médias de dépôt (hors corps JSON principal)."""
from django.conf import settings
from rest_framework import status
from rest_framework.response import Response

from .models import Attachment, Complaint


def _max_bytes():
    return getattr(settings, 'VERCEL_MAX_UPLOAD_BYTES', 4 * 1024 * 1024)


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
    if not any(ct.startswith(p) for p in ('audio/', 'video/')):
        return Response(
            {'error': 'Le fichier vocal doit être un fichier audio.'},
            status=status.HTTP_400_BAD_REQUEST,
        )
    complaint.voice_file = uploaded_file
    complaint.save(update_fields=['voice_file'])
    return None


def save_attachment(complaint: Complaint, uploaded_file) -> Response | None:
    if uploaded_file.size > _max_bytes():
        return Response(
            {'error': f'La pièce jointe ne doit pas dépasser {_max_bytes() // (1024 * 1024)} Mo.'},
            status=status.HTTP_400_BAD_REQUEST,
        )
    ct = getattr(uploaded_file, 'content_type', '') or ''
    allowed = (
        'image/', 'application/pdf', 'audio/', 'video/',
        'application/msword', 'application/vnd.openxmlformats',
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
    Attachment.objects.create(
        complaint=complaint,
        file=uploaded_file,
        file_name=getattr(uploaded_file, 'name', '') or 'piece_jointe',
        file_type=ct,
        file_size=getattr(uploaded_file, 'size', 0) or 0,
    )
    return None
