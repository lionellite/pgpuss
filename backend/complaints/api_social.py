from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from django.conf import settings
from .models import Complaint, ComplaintStatus, ComplaintChannel
import os


def _get_verify_token(env_key: str, fallback: str) -> str:
    return os.environ.get(env_key) or getattr(settings, env_key, None) or fallback


def _extract_text(value: dict) -> str:
    # Meta payloads: text.message / messages[].text.body, etc.
    if not isinstance(value, dict):
        return ""
    text = value.get("text")
    if isinstance(text, dict):
        return text.get("body") or ""
    if isinstance(text, str):
        return text
    return ""


class WhatsAppWebhookView(APIView):
    """
    Webhook WhatsApp (Meta Cloud API / Twilio).

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
        data = request.data or {}

        # 1) Meta WhatsApp Cloud API shape
        # entry[].changes[].value.messages[] (text.body) + contacts[] (wa_id)
        sender = None
        message = ""
        try:
            entry = (data.get("entry") or [])[0]
            change = (entry.get("changes") or [])[0]
            value = change.get("value") or {}
            msg = (value.get("messages") or [])[0] if value.get("messages") else None
            if msg:
                sender = msg.get("from") or sender
                message = _extract_text(msg)
        except Exception:
            # 2) Fallback: format simplifié {from, text}
            sender = data.get("from") or sender
            message = data.get("text") or message

        sender = sender or "Inconnu"

        # Création de plainte via WhatsApp
        if "PLAINTE" in (message or "").upper():
            complaint = Complaint.objects.create(
                title=f"Plainte WhatsApp de {sender}",
                description=message or "",
                channel=ComplaintChannel.CHATBOT,
                status=ComplaintStatus.SOUMISE,
                complainant_phone=sender
            )
            complaint.perform_nlp_analysis()
            complaint.save()
            return Response({"message": "Plainte enregistrée via WhatsApp", "ticket": complaint.ticket_number})

        return Response({"status": "received"})

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
