import logging

from django.conf import settings
from django.core.mail import send_mail

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
