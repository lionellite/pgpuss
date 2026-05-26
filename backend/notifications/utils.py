import logging

from django.conf import settings
from django.core.mail import send_mail
import requests

from .models import Notification, NotificationType

logger = logging.getLogger(__name__)


def notify_user(user, title, message, complaint=None, send_email_alert=True):
    """
    Notification intégrée (in-app) + alerte email si configurée.
    """
    if user:
        Notification.objects.create(
            user=user,
            title=title,
            message=message,
            complaint=complaint,
            type=NotificationType.IN_APP,
        )

    if not send_email_alert or not user or not getattr(user, "email", None):
        return

    if not getattr(settings, "EMAIL_ALERTS_ENABLED", True):
        return

    subject = f"[PGP-USS] {title}"
    body_lines = [message.strip()]
    if complaint:
        body_lines.append(f"Dossier : {complaint.ticket_number}")
    body = "\n\n".join(body_lines)

    try:
        send_mail(
            subject,
            body,
            getattr(settings, "DEFAULT_FROM_EMAIL", "noreply@pgpuss.local"),
            [user.email],
            fail_silently=False,
        )
    except Exception as exc:
        logger.warning("Échec envoi email notification: %s", exc)


def send_sms_alert(phone: str, message: str) -> bool:
    """
    Envoi SMS via webhook configurable.
    Mode par défaut = mock (gratuit) : journalise uniquement.
    """
    phone = (phone or "").strip()
    if not phone:
        return False

    mode = (getattr(settings, "SMS_PROVIDER_MODE", "mock") or "mock").lower()
    if mode == "mock":
        logger.info("SMS mock -> %s : %s", phone, message)
        return True

    webhook = getattr(settings, "SMS_WEBHOOK_URL", "") or ""
    if not webhook:
        logger.warning("SMS webhook manquant (SMS_PROVIDER_MODE=%s).", mode)
        return False

    payload = {
        "to": phone,
        "message": message,
        "sender": getattr(settings, "SMS_SENDER", "PGP-USS"),
    }
    try:
        r = requests.post(webhook, json=payload, timeout=10)
        r.raise_for_status()
        return True
    except Exception as exc:
        logger.warning("Échec envoi SMS: %s", exc)
        return False


def notify_complaint_contact(complaint, title: str, message: str):
    """
    Notifie le plaignant via canaux disponibles :
    - in-app + email si compte lié
    - email direct (plainte anonyme / sans compte)
    - SMS si numéro disponible
    """
    user = getattr(complaint, "complainant", None)
    if user:
        notify_user(user, title, message, complaint=complaint, send_email_alert=True)

    # Email direct (même sans compte)
    target_email = (getattr(complaint, "complainant_email", "") or "").strip()
    if target_email and (not user or target_email.lower() != (getattr(user, "email", "") or "").lower()):
        if getattr(settings, "EMAIL_ALERTS_ENABLED", True):
            try:
                send_mail(
                    f"[PGP-USS] {title}",
                    f"{message}\n\nDossier : {complaint.ticket_number}",
                    getattr(settings, "DEFAULT_FROM_EMAIL", "noreply@pgpuss.local"),
                    [target_email],
                    fail_silently=False,
                )
            except Exception as exc:
                logger.warning("Échec envoi email direct: %s", exc)

    phone = (getattr(complaint, "complainant_phone", "") or "").strip()
    if phone:
        send_sms_alert(phone, f"{title} - Dossier {complaint.ticket_number}. {message}")
