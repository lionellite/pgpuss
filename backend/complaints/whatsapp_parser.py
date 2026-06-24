"""
Parsing des payloads WhatsApp (OpenWA, Meta Cloud API, format simplifié).
"""

from __future__ import annotations

import hashlib
import hmac
from dataclasses import dataclass


@dataclass
class WhatsAppIncomingMessage:
    sender: str
    message: str
    chat_id: str | None = None
    source: str = "unknown"
    session_id: str | None = None


def normalize_whatsapp_sender(sender: str | None) -> str:
    if not sender:
        return "Inconnu"
    return sender.split("@")[0]


def extract_text(value: dict) -> str:
    if not isinstance(value, dict):
        return ""
    text = value.get("text")
    if isinstance(text, dict):
        return text.get("body") or ""
    if isinstance(text, str):
        return text
    return ""


def parse_openwa_payload(data: dict) -> WhatsAppIncomingMessage | None:
    if data.get("event") != "message.received":
        return None

    msg_data = data.get("data") or {}
    if msg_data.get("isGroup") or msg_data.get("fromMe"):
        return None

    sender = msg_data.get("from") or msg_data.get("chatId")
    if not sender:
        return None

    return WhatsAppIncomingMessage(
        sender=normalize_whatsapp_sender(sender),
        message=(msg_data.get("body") or "").strip(),
        chat_id=msg_data.get("chatId") or msg_data.get("from"),
        source="openwa",
        session_id=data.get("sessionId"),
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
        if not sender and not message:
            return None

        return WhatsAppIncomingMessage(
            sender=normalize_whatsapp_sender(sender),
            message=(message or "").strip(),
            chat_id=sender,
            source="meta",
        )
    except (IndexError, KeyError, TypeError):
        return None


def parse_simple_payload(data: dict) -> WhatsAppIncomingMessage | None:
    sender = data.get("from")
    message = data.get("text")
    if sender is None and message is None:
        return None

    return WhatsAppIncomingMessage(
        sender=normalize_whatsapp_sender(sender),
        message=(message or "").strip(),
        chat_id=sender,
        source="simple",
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

    # Calculate expected hash
    expected_hash = hmac.new(
        secret.encode("utf-8"),
        raw_body,
        hashlib.sha256,
    ).hexdigest()

    # OpenWA might send with or without 'sha256=' prefix depending on version
    if signature.startswith("sha256="):
        signature = signature[7:]
    
    return hmac.compare_digest(expected_hash, signature)
