"""
Client léger pour l'API OpenWA (envoi de messages WhatsApp).
"""

from __future__ import annotations

import json
import logging
import urllib.error
import urllib.request
from typing import Any

from django.conf import settings

logger = logging.getLogger(__name__)


class OpenWAClient:
    def __init__(
        self,
        base_url: str | None = None,
        api_key: str | None = None,
        session_id: str | None = None,
    ) -> None:
        self.base_url = (base_url or getattr(settings, "OPENWA_API_URL", "")).rstrip("/")
        self.api_key = api_key or getattr(settings, "OPENWA_API_KEY", "")
        self.session_id = session_id or getattr(settings, "OPENWA_SESSION_ID", "")

    @property
    def is_configured(self) -> bool:
        return bool(self.base_url and self.api_key and self.session_id)

    def send_text(self, chat_id: str, text: str) -> dict[str, Any] | None:
        if not self.is_configured:
            logger.debug("OpenWA non configuré — message non envoyé")
            return None

        url = f"{self.base_url}/sessions/{self.session_id}/messages/send-text"
        payload = {"chatId": chat_id, "text": text}
        body = json.dumps(payload).encode("utf-8")

        request = urllib.request.Request(
            url,
            data=body,
            method="POST",
            headers={
                "Content-Type": "application/json",
                "X-API-Key": self.api_key,
            },
        )

        try:
            with urllib.request.urlopen(request, timeout=15) as response:
                return json.loads(response.read().decode("utf-8"))
        except urllib.error.HTTPError as exc:
            error_body = exc.read().decode("utf-8", errors="replace")
            logger.warning("OpenWA HTTP %s: %s", exc.code, error_body)
        except Exception as exc:
            logger.warning("Échec envoi OpenWA: %s", exc)

        return None
