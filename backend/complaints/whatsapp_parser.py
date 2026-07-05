"""
Parsing des payloads WhatsApp (OpenWA, Meta Cloud API, format simplifié).
"""

from __future__ import annotations

import hashlib
import hmac
import re
from dataclasses import dataclass, field


TICKET_NUMBER_PATTERN = re.compile(r"PGP-\d{4}-[A-Z0-9]{6}", re.IGNORECASE)


@dataclass
class WhatsAppMedia:
    mimetype: str
    filename: str | None = None
    data: str | None = None  # base64 (audio) ou None quand url est présent
    url: str | None = None   # URL locale OpenWA pour téléchargement différé


@dataclass
class WhatsAppIncomingMessage:
    sender: str
    message: str
    chat_id: str | None = None
    source: str = "unknown"
    session_id: str | None = None
    message_type: str = "chat"
    has_media: bool = False
    media: WhatsAppMedia | None = None


def normalize_whatsapp_sender(sender: str | None) -> str:
    if not sender:
        return "Inconnu"
    return sender.split("@")[0]


def extract_ticket_number(text: str) -> str | None:
    if not text:
        return None
    match = TICKET_NUMBER_PATTERN.search(text.strip())
    return match.group(0).upper() if match else None


def extract_text(value: dict) -> str:
    if not isinstance(value, dict):
        return ""
    text = value.get("text")
    if isinstance(text, dict):
        return text.get("body") or ""
    if isinstance(text, str):
        return text
    return ""


def _parse_media_block(raw: dict | None) -> WhatsAppMedia | None:
    if not isinstance(raw, dict):
        return None
    data = raw.get("data")
    mimetype = raw.get("mimetype")
    url = raw.get("url")  # URL locale OpenWA (nouvelle approche sans base64)
    if not data and not mimetype and not url:
        return None
    return WhatsAppMedia(
        mimetype=(mimetype or "application/octet-stream").strip(),
        filename=raw.get("filename"),
        data=data,
        url=url,
    )



def parse_openwa_payload(data: dict) -> WhatsAppIncomingMessage | None:
    if data.get("event") != "message.received":
        return None

    msg_data = data.get("data") or {}
    if msg_data.get("isGroup") or msg_data.get("fromMe"):
        return None

    sender = msg_data.get("from") or msg_data.get("chatId")
    if not sender:
        return None

    media = _parse_media_block(msg_data.get("media"))
    has_media = bool(msg_data.get("hasMedia") or media)

    return WhatsAppIncomingMessage(
        sender=normalize_whatsapp_sender(sender),
        message=(msg_data.get("body") or "").strip(),
        chat_id=msg_data.get("chatId") or msg_data.get("from"),
        source="openwa",
        session_id=data.get("sessionId"),
        message_type=(msg_data.get("type") or "chat").strip(),
        has_media=has_media,
        media=media,
    )


def parse_meta_payload(data: dict) -> WhatsAppIncomingMessage | None:
    try:
        entry = (data.get("entry") or [])[0]
        change = (entry.get("changes") or [])[0]
        value = change.get("value") or {}
        msg = (value.get("messages") or [])[0] if value.get("messages") else None
        if not msg:
            return None

        sender = msg.get("from")
        message = extract_text(msg)
        msg_type = msg.get("type") or "text"
        media = None
        has_media = False

        if msg_type in ("audio", "voice"):
            audio = msg.get("audio") or {}
            media = WhatsAppMedia(mimetype=audio.get("mime_type") or "audio/ogg")
            has_media = True
        elif msg_type == "image":
            image = msg.get("image") or {}
            media = WhatsAppMedia(mimetype=image.get("mime_type") or "image/jpeg")
            has_media = True
        elif msg_type == "document":
            doc = msg.get("document") or {}
            media = WhatsAppMedia(
                mimetype=doc.get("mime_type") or "application/octet-stream",
                filename=doc.get("filename"),
            )
            has_media = True

        if not sender and not message and not has_media:
            return None

        return WhatsAppIncomingMessage(
            sender=normalize_whatsapp_sender(sender),
            message=(message or "").strip(),
            chat_id=sender,
            source="meta",
            message_type=msg_type,
            has_media=has_media,
            media=media,
        )
    except (IndexError, KeyError, TypeError):
        return None


def parse_simple_payload(data: dict) -> WhatsAppIncomingMessage | None:
    sender = data.get("from")
    message = data.get("text")
    if sender is None and message is None:
        return None

    media = _parse_media_block(data.get("media"))

    return WhatsAppIncomingMessage(
        sender=normalize_whatsapp_sender(sender),
        message=(message or "").strip(),
        chat_id=sender,
        source="simple",
        message_type=(data.get("type") or "chat").strip(),
        has_media=bool(data.get("hasMedia") or media),
        media=media,
    )


def parse_incoming_message(data: dict) -> WhatsAppIncomingMessage | None:
    if not isinstance(data, dict):
        return None

    for parser in (parse_openwa_payload, parse_meta_payload, parse_simple_payload):
        parsed = parser(data)
        if parsed:
            return parsed
    return None


def verify_openwa_signature(raw_body: bytes, signature: str | None, secret: str) -> bool:
    if not secret:
        return True
    if not signature:
        return False

    expected_hash = hmac.new(
        secret.encode("utf-8"),
        raw_body,
        hashlib.sha256,
    ).hexdigest()

    if signature.startswith("sha256="):
        signature = signature[7:]

    return hmac.compare_digest(expected_hash, signature)


def is_voice_message(incoming: WhatsAppIncomingMessage) -> bool:
    if incoming.message_type in ("ptt", "audio", "voice"):
        return True
    if incoming.media and incoming.media.mimetype.startswith("audio/"):
        return True
    return False


def is_attachment_message(incoming: WhatsAppIncomingMessage) -> bool:
    if not incoming.has_media or not incoming.media:
        return False
    if is_voice_message(incoming):
        return False
    return True


def media_to_draft_dict(media: WhatsAppMedia) -> dict:
    return {
        "mimetype": media.mimetype,
        "filename": media.filename,
        "data": media.data,
        "url": media.url,  # URL locale OpenWA pour téléchargement différé
    }
