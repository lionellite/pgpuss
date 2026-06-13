import hashlib
import hmac
import json

from django.test import TestCase
from rest_framework.test import APIClient

from complaints.models import Complaint
from complaints.whatsapp_parser import (
    normalize_whatsapp_sender,
    parse_incoming_message,
    verify_openwa_signature,
)


class WhatsAppParserTests(TestCase):
    def test_parse_openwa_message(self):
        payload = {
            "event": "message.received",
            "sessionId": "sess_test",
            "data": {
                "from": "22997123456@c.us",
                "chatId": "22997123456@c.us",
                "body": "Je veux déposer une PLAINTE",
                "isGroup": False,
            },
        }
        parsed = parse_incoming_message(payload)
        self.assertIsNotNone(parsed)
        self.assertEqual(parsed.sender, "22997123456")
        self.assertEqual(parsed.source, "openwa")

    def test_ignore_openwa_group_messages(self):
        payload = {
            "event": "message.received",
            "data": {"from": "123@g.us", "body": "PLAINTE", "isGroup": True},
        }
        self.assertIsNone(parse_incoming_message(payload))

    def test_normalize_sender(self):
        self.assertEqual(normalize_whatsapp_sender("22997123456@c.us"), "22997123456")

    def test_verify_openwa_signature(self):
        body = b'{"event":"message.received"}'
        secret = "test-secret"
        signature = "sha256=" + hmac.new(secret.encode(), body, hashlib.sha256).hexdigest()
        self.assertTrue(verify_openwa_signature(body, signature, secret))
        self.assertFalse(verify_openwa_signature(body, "sha256=bad", secret))


class WhatsAppWebhookTests(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_openwa_webhook_creates_complaint(self):
        payload = {
            "event": "message.received",
            "sessionId": "sess_test",
            "data": {
                "from": "22997123456@c.us",
                "chatId": "22997123456@c.us",
                "body": "PLAINTE : mauvais accueil à l'hôpital",
                "isGroup": False,
            },
        }
        response = self.client.post(
            "/api/complaints/webhooks/whatsapp/",
            data=json.dumps(payload),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(Complaint.objects.count(), 1)
        self.assertEqual(response.json()["source"], "openwa")
        self.assertEqual(Complaint.objects.first().complainant_phone, "22997123456")

    def test_meta_webhook_still_works(self):
        payload = {
            "entry": [{
                "changes": [{
                    "value": {
                        "messages": [{
                            "from": "22997111111",
                            "text": {"body": "PLAINTE urgente"},
                        }],
                    },
                }],
            }],
        }
        response = self.client.post("/api/complaints/webhooks/whatsapp/", payload, format="json")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(Complaint.objects.count(), 1)

    def test_simple_fallback_still_works(self):
        response = self.client.post(
            "/api/complaints/webhooks/whatsapp/",
            {"from": "22997222222", "text": "PLAINTE test"},
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(Complaint.objects.count(), 1)

    def test_non_complaint_message_ignored(self):
        payload = {
            "event": "message.received",
            "data": {"from": "229@c.us", "body": "Bonjour", "isGroup": False},
        }
        response = self.client.post("/api/complaints/webhooks/whatsapp/", payload, format="json")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(Complaint.objects.count(), 0)
