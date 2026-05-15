from __future__ import annotations

from django.utils import timezone

from .document_rules import rules_for
from .models import (
    Complaint,
    ComplaintDocument,
    ComplaintDocumentType,
)


def _base_payload(complaint: Complaint) -> dict:
    return {
        "ticket_number": complaint.ticket_number,
        "created_at": complaint.created_at.isoformat() if complaint.created_at else None,
        "updated_at": complaint.updated_at.isoformat() if complaint.updated_at else None,
        "status": complaint.status,
        "priority": complaint.priority,
        "channel": complaint.channel,
        "establishment": {
            "id": str(complaint.establishment_id) if complaint.establishment_id else None,
            "name": getattr(complaint.establishment, "name", None),
        },
        "complainant": {
            "is_anonymous": complaint.is_anonymous,
            "user_id": str(complaint.complainant_id) if complaint.complainant_id else None,
            "name": complaint.complainant_name or getattr(complaint.complainant, "full_name", None),
            "phone": complaint.complainant_phone or getattr(complaint.complainant, "phone", None),
            "email": complaint.complainant_email or getattr(complaint.complainant, "email", None),
        },
        "complaint": {
            "title": complaint.title,
            "description": complaint.description,
            "category": getattr(complaint.category, "name", None),
            "subcategory": getattr(complaint.subcategory, "name", None),
            "service": getattr(complaint.service, "name", None),
        },
    }


def generate_document(
    *,
    complaint: Complaint,
    doc_type: str,
    actor,
    extra: dict | None = None,
) -> ComplaintDocument:
    """
    Génère et archive un document obligatoire (structure JSON).
    """
    payload = _base_payload(complaint)
    payload["generated_at"] = timezone.now().isoformat()
    payload["generated_by"] = {
        "user_id": str(actor.id) if actor else None,
        "name": getattr(actor, "full_name", None) if actor else None,
        "role": getattr(actor, "role", None) if actor else None,
    }
    if extra:
        payload.update(extra)

    meta = rules_for(doc_type)
    payload.setdefault("allowed_roles", meta["allowed_roles"])
    payload.setdefault("is_required", meta["is_required"])

    return ComplaintDocument.objects.create(
        complaint=complaint,
        doc_type=doc_type,
        created_by=actor if actor and getattr(actor, "is_authenticated", False) else None,
        payload=payload,
    )


def ensure_singleton_document(
    *,
    complaint: Complaint,
    doc_type: str,
    actor,
    extra: dict | None = None,
) -> ComplaintDocument:
    """
    Pour les documents “uniques” par étape (ex: fiche plainte, récépissé),
    évite les doublons en cas de retry.
    """
    existing = ComplaintDocument.objects.filter(complaint=complaint, doc_type=doc_type).first()
    if existing:
        return existing
    return generate_document(complaint=complaint, doc_type=doc_type, actor=actor, extra=extra)

