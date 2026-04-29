from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from django.conf import settings
from .models import Complaint, ComplaintStatus, ComplaintChannel
import os

class WhatsAppWebhookView(APIView):
    """
    Webhook pour l'intégration WhatsApp (simulé / prêt pour Twilio ou Meta API)
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        # Logique de réception de message WhatsApp
        data = request.data
        sender = data.get('from', 'Inconnu')
        message = data.get('text', '')

        # Simulation de création de plainte via WhatsApp
        if "PLAINTE" in message.upper():
            complaint = Complaint.objects.create(
                title=f"Plainte WhatsApp de {sender}",
                description=message,
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
    Webhook pour Facebook Messenger
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        # Vérification du webhook par Facebook
        mode = request.GET.get('hub.mode')
        token = request.GET.get('hub.verify_token')
        challenge = request.GET.get('hub.challenge')

        verify_token = os.environ.get('FB_VERIFY_TOKEN', 'pgpuss_secret_token_change_me')

        if mode and token == verify_token:
            return Response(int(challenge), status=200)
        return Response("Forbidden", status=403)

    def post(self, request):
        # Logique de traitement des messages Messenger
        # Ici il faudrait vérifier la signature X-Hub-Signature pour la sécurité
        return Response("EVENT_RECEIVED", status=200)

class MobileAPIView(APIView):
    """
    Endpoints spécifiques pour l'application mobile
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        # Liste des plaintes de l'utilisateur mobile
        from .serializers import ComplaintListSerializer
        complaints = Complaint.objects.filter(complainant=request.user)
        serializer = ComplaintListSerializer(complaints, many=True)
        return Response(serializer.data)
