"""
Tâches Celery pour le traitement asynchrone des webhooks WhatsApp (bot_engine).

Principe :
  1. Le webhook entrant est reçu en < 100ms par Django.
  2. Django place la tâche dans Redis (broker).
  3. Le worker Celery traite la tâche en arrière-plan (parsing et enregistrement des médias, etc.)
  4. Le résultat (message de réponse WhatsApp) est envoyé à l'utilisateur depuis le worker.
"""
import logging

from celery import shared_task
from django.conf import settings

logger = logging.getLogger(__name__)


@shared_task(
    bind=True,
    max_retries=3,
    default_retry_delay=30,
    name='complaints.tasks.process_whatsapp_webhook',
)
def process_whatsapp_webhook(self, payload: dict):
    """
    Traite un webhook entrant d'OpenWA de manière asynchrone.

    `payload` est le dict JSON brut reçu par le webhook Django.
    """
    try:
        from .whatsapp_parser import parse_incoming_message
        from .bot_engine import handle_incoming_message

        incoming = parse_incoming_message(payload)
        if incoming is None:
            logger.info("[Celery] Webhook ignoré (message non pertinent)")
            return

        logger.info(
            "[Celery] Traitement message WhatsApp depuis %s (type: %s)",
            incoming.sender,
            incoming.message_type,
        )
        handle_incoming_message(incoming)

    except Exception as exc:
        logger.error(
            "[Celery] Erreur lors du traitement du webhook WhatsApp: %s",
            exc,
            exc_info=True,
        )
        # Réessai automatique avec backoff exponentiel
        raise self.retry(exc=exc, countdown=30 * (self.request.retries + 1))


@shared_task(
    name='complaints.tasks.send_whatsapp_message',
    max_retries=3,
    default_retry_delay=10,
)
def send_whatsapp_message(chat_id: str, text: str):
    """
    Envoie un message texte WhatsApp en arrière-plan.
    Utile pour les notifications asynchrones (ex: confirmation d'une plainte traitée).
    """
    try:
        from .openwa_client import send_message
        send_message(chat_id, text)
        logger.info("[Celery] Message WhatsApp envoyé à %s", chat_id)
    except Exception as exc:
        logger.error("[Celery] Échec envoi WhatsApp à %s: %s", chat_id, exc)
        raise
