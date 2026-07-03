import hashlib
import hmac
import json
from unittest.mock import patch

from django.test import TestCase
from rest_framework.test import APIClient

from complaints.bot_engine import build_tracking_response, create_complaint_from_data, process_state
from complaints.models import Complaint, WhatsAppSession
from complaints.whatsapp_parser import (
    WhatsAppIncomingMessage,
    WhatsAppMedia,
    extract_ticket_number,
    is_attachment_message,
    is_voice_message,
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

    def test_parse_openwa_message_with_media(self):
        payload = {
            "event": "message.received",
            "data": {
                "from": "22997123456@c.us",
                "chatId": "22997123456@c.us",
                "body": "",
                "type": "ptt",
                "hasMedia": True,
                "isGroup": False,
                "media": {
                    "mimetype": "audio/ogg",
                    "filename": "voice.ogg",
                    "data": "YWJj",
                },
            },
        }
        parsed = parse_incoming_message(payload)
        self.assertIsNotNone(parsed)
        self.assertTrue(parsed.has_media)
        self.assertTrue(is_voice_message(parsed))
        self.assertEqual(parsed.media.mimetype, "audio/ogg")

    def test_is_attachment_message(self):
        incoming = WhatsAppIncomingMessage(
            sender="229",
            message="",
            has_media=True,
            message_type="image",
            media=WhatsAppMedia(mimetype="image/jpeg", data="abc"),
        )
        self.assertTrue(is_attachment_message(incoming))

    def test_extract_ticket_number(self):
        self.assertEqual(extract_ticket_number("PGP-2026-AB1234"), "PGP-2026-AB1234")
        self.assertEqual(extract_ticket_number("Mon ticket PGP-2026-XY9876 merci"), "PGP-2026-XY9876")
        self.assertIsNone(extract_ticket_number("Bonjour"))

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


class WhatsAppBotEngineTests(TestCase):
    def setUp(self):
        self.phone = "22997123456"
        self.incoming = lambda text, **kwargs: WhatsAppIncomingMessage(
            sender=self.phone,
            message=text,
            chat_id=f"{self.phone}@c.us",
            **kwargs,
        )

    def test_start_menu_then_establishment(self):
        session = WhatsAppSession.objects.create(phone_number=self.phone, state="START")
        response = process_state(session, self.incoming("1"), self.phone)
        self.assertIn("hôpital", response.lower())
        session.refresh_from_db()
        self.assertEqual(session.state, "AWAITING_ESTABLISHMENT")

    def test_tracking_unknown_ticket(self):
        response = build_tracking_response("PGP-2026-ZZ9999")
        self.assertIn("Aucune plainte trouvée", response)

    def test_tracking_existing_complaint(self):
        Complaint.objects.create(
            title="Test",
            description="Desc",
            ticket_number="PGP-2026-AB1234",
            complainant_phone=self.phone,
        )
        response = build_tracking_response("PGP-2026-AB1234")
        self.assertIn("PGP-2026-AB1234", response)
        self.assertIn("Soumise", response)

    @patch("complaints.bot_engine.apply_draft_media_to_complaint", return_value=[])
    def test_create_complaint_with_voice_draft(self, _mock_media):
        data = {
            "establishment": "CHU Cotonou",
            "category": "Autre",
            "title": "Test vocal",
            "description": "Plainte vocale",
            "is_anonymous": True,
            "voice": {"mimetype": "audio/ogg", "data": "YWJj", "filename": "v.ogg"},
        }
        ticket, warnings = create_complaint_from_data(data, self.phone)
        self.assertTrue(ticket.startswith("PGP-"))
        self.assertEqual(warnings, [])
        self.assertEqual(Complaint.objects.filter(ticket_number=ticket).count(), 1)


class WhatsAppWebhookTests(TestCase):
    def setUp(self):
        self.client = APIClient()

    @patch("complaints.bot_engine.OpenWAClient.send_text")
    def test_openwa_webhook_starts_bot_flow(self, mock_send):
        payload = {
            "event": "message.received",
            "sessionId": "sess_test",
            "data": {
                "from": "22997123456@c.us",
                "chatId": "22997123456@c.us",
                "body": "Bonjour",
                "isGroup": False,
            },
        }
        response = self.client.post(
            "/api/complaints/webhooks/whatsapp/",
            data=json.dumps(payload),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(Complaint.objects.count(), 0)
        self.assertTrue(WhatsAppSession.objects.filter(phone_number="22997123456").exists())
        mock_send.assert_called_once()

    @patch("complaints.bot_engine.OpenWAClient.send_text")
    def test_openwa_webhook_tracks_ticket(self, mock_send):
        Complaint.objects.create(
            title="Suivi test",
            description="Desc",
            ticket_number="PGP-2026-AB1234",
            complainant_phone="22997123456",
        )
        payload = {
            "event": "message.received",
            "data": {
                "from": "22997123456@c.us",
                "chatId": "22997123456@c.us",
                "body": "PGP-2026-AB1234",
                "isGroup": False,
            },
        }
        response = self.client.post("/api/complaints/webhooks/whatsapp/", payload, format="json")
        self.assertEqual(response.status_code, 200)
        mock_send.assert_called_once()
        sent_text = mock_send.call_args[0][1]
        self.assertIn("PGP-2026-AB1234", sent_text)
        self.assertIn("Soumise", sent_text)

    @patch("complaints.bot_engine.OpenWAClient.send_text")
    def test_meta_webhook_starts_bot(self, mock_send):
        payload = {
            "entry": [{
                "changes": [{
                    "value": {
                        "messages": [{
                            "from": "22997111111",
                            "text": {"body": "Bonjour"},
                        }],
                    },
                }],
            }],
        }
        response = self.client.post("/api/complaints/webhooks/whatsapp/", payload, format="json")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(Complaint.objects.count(), 0)
        mock_send.assert_called_once()

    @patch("complaints.bot_engine.OpenWAClient.send_text")
    def test_simple_fallback_starts_bot(self, mock_send):
        response = self.client.post(
            "/api/complaints/webhooks/whatsapp/",
            {"from": "22997222222", "text": "1"},
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(Complaint.objects.count(), 0)
        mock_send.assert_called_once()
