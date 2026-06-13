from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from django.conf import settings
from .models import Complaint, ComplaintStatus, ComplaintChannel
from .openwa_client import OpenWAClient
from .whatsapp_parser import parse_incoming_message, verify_openwa_signature
import os


def _get_verify_token(env_key: str, fallback: str) -> str:
    return os.environ.get(env_key) or getattr(settings, env_key, None) or fallback


def _get_openwa_webhook_secret() -> str:
    return os.environ.get("OPENWA_WEBHOOK_SECRET") or getattr(settings, "OPENWA_WEBHOOK_SECRET", "") or ""


def _send_whatsapp_confirmation(chat_id: str | None, ticket_number: str) -> None:
    if not chat_id:
        return

    client = OpenWAClient()
    if not client.is_configured:
        return

    site_name = getattr(settings, "SITE_NAME", "PGP-USS")
    message = (
        f"Votre plainte a bien été enregistrée sur {site_name}.\n"
        f"Numéro de ticket : {ticket_number}\n"
        "Conservez ce numéro pour suivre l'avancement de votre dossier."
    )
    client.send_text(chat_id, message)


class WhatsAppWebhookView(APIView):
    """
    Webhook WhatsApp (OpenWA / Meta Cloud API / Twilio).

    - GET: vérification webhook (Meta)
    - POST: réception messages et création de plainte si déclencheur détecté
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        mode = request.GET.get("hub.mode")
        token = request.GET.get("hub.verify_token")
        challenge = request.GET.get("hub.challenge")

        verify_token = _get_verify_token("WA_VERIFY_TOKEN", "pgpuss_wa_verify_token_change_me")
        if mode == "subscribe" and token == verify_token:
            return Response(int(challenge), status=200)
        return Response("Forbidden", status=403)

    def post(self, request):
        raw_body = request.body
        secret = _get_openwa_webhook_secret()
        signature = request.headers.get("X-OpenWA-Signature")

        if secret and not verify_openwa_signature(raw_body, signature, secret):
            return Response({"error": "Invalid signature"}, status=status.HTTP_403_FORBIDDEN)

        data = request.data or {}
        incoming = parse_incoming_message(data)
        if not incoming:
            return Response({"status": "ignored"})

        if "PLAINTE" not in (incoming.message or "").upper():
            return Response({"status": "received"})

        complaint = Complaint.objects.create(
            title=f"Plainte WhatsApp de {incoming.sender}",
            description=incoming.message or "",
            channel=ComplaintChannel.CHATBOT,
            status=ComplaintStatus.SOUMISE,
            complainant_phone=incoming.sender,
        )
        complaint.perform_nlp_analysis()
        complaint.save()

        _send_whatsapp_confirmation(incoming.chat_id, complaint.ticket_number)

        return Response({
            "message": "Plainte enregistrée via WhatsApp",
            "ticket": complaint.ticket_number,
            "source": incoming.source,
        })


class FacebookWebhookView(APIView):
    """
    Webhook Facebook Messenger.
    - GET: vérification webhook (Meta)
    - POST: parsing minimal "entry/messaging" pour collecte de plaintes
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        # Vérification du webhook par Facebook
        mode = request.GET.get('hub.mode')
        token = request.GET.get('hub.verify_token')
        challenge = request.GET.get('hub.challenge')

        verify_token = _get_verify_token("FB_VERIFY_TOKEN", "pgpuss_fb_verify_token_change_me")

        if mode and token == verify_token:
            return Response(int(challenge), status=200)
        return Response("Forbidden", status=403)

    def post(self, request):
        data = request.data or {}

        # Format attendu (simplifié):
        # { "entry": [ { "messaging": [ { "sender": {"id":..}, "message": {"text":..}} ] } ] }
        created = []
        for entry in data.get("entry", []) or []:
            for event in entry.get("messaging", []) or []:
                sender_id = ((event.get("sender") or {}).get("id")) or "Inconnu"
                msg = (event.get("message") or {})
                text = msg.get("text") or ""

                if "PLAINTE" in text.upper():
                    complaint = Complaint.objects.create(
                        title=f"Plainte Facebook de {sender_id}",
                        description=text,
                        channel=ComplaintChannel.CHATBOT,
                        status=ComplaintStatus.SOUMISE,
                        complainant_name=f"FB:{sender_id}",
                    )
                    complaint.perform_nlp_analysis()
                    complaint.save()
                    created.append(complaint.ticket_number)

        return Response({"status": "EVENT_RECEIVED", "tickets": created}, status=200)
