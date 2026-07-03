import logging
import re

from django.utils import timezone

from .models import (
    WhatsAppSession,
    Complaint,
    ComplaintStatus,
    ComplaintChannel,
    ComplaintHistory,
    Category,
)
from .openwa_client import OpenWAClient
from .whatsapp_media import apply_draft_media_to_complaint
from .whatsapp_parser import (
    WhatsAppIncomingMessage,
    extract_ticket_number,
    is_attachment_message,
    is_voice_message,
    media_to_draft_dict,
)

logger = logging.getLogger(__name__)

MAX_ATTACHMENTS = 5

CATEGORIES_MAP = {
    "1": "Qualité des soins",
    "2": "Médicaments",
    "3": "Facturation & frais",
    "4": "Accueil & comportement",
    "5": "Infrastructure & hygiène",
    "6": "Confidentialité",
    "7": "Autre",
}

TRACK_KEYWORDS = {"suivi", "suivre", "statut", "tracking", "ticket", "dossier"}
COMPLAINT_KEYWORDS = {"plainte", "deposer", "déposer", "signaler", "reclamation", "réclamation"}
CANCEL_KEYWORDS = {"annuler", "quitter", "stop", "menu"}
MEDIA_DONE_KEYWORDS = {"terminé", "termine", "fini", "passer", "suite", "continuer", "suivant"}
VOICE_DESCRIPTION_FALLBACK = "Plainte déposée par message vocal WhatsApp."


def get_category_text():
    lines = ["Quelle est la catégorie de votre problème ? (Répondez par le numéro)"]
    for k, v in CATEGORIES_MAP.items():
        lines.append(f"{k}. {v}")
    return "\n".join(lines)


def get_welcome_text() -> str:
    return (
        "Bienvenue sur la plateforme PGP-USS Santé Bénin. 🏥\n\n"
        "Que souhaitez-vous faire ?\n"
        "1. Déposer une plainte\n"
        "2. Suivre une plainte (avec votre numéro de ticket)\n\n"
        "Répondez par *1* ou *2*.\n"
        "Vous pouvez aussi envoyer directement votre numéro de ticket (ex: PGP-2026-AB1234)."
    )


def handle_incoming_message(incoming: WhatsAppIncomingMessage):
    phone = incoming.sender
    chat_id = incoming.chat_id

    if not phone or not chat_id:
        return

    session = WhatsAppSession.objects.filter(phone_number=phone).first()
    if session and session.is_expired:
        session.delete()
        session = None

    text = (incoming.message or "").strip()
    text_lower = text.lower()

    if not session:
        if text_lower in CANCEL_KEYWORDS:
            return

        ticket = extract_ticket_number(text)
        if ticket:
            _send_text(chat_id, build_tracking_response(ticket))
            return

        if _matches_any(text_lower, TRACK_KEYWORDS):
            session = WhatsAppSession.objects.create(
                phone_number=phone,
                state="AWAITING_TRACK_TICKET",
            )
            _send_text(
                chat_id,
                "Entrez votre numéro de ticket (ex: PGP-2026-AB1234) pour consulter l'état de votre plainte.",
            )
            return

        session = WhatsAppSession.objects.create(phone_number=phone, state="START")

    response_text = process_state(session, incoming, phone)
    if response_text:
        _send_text(chat_id, response_text)


def process_state(session: WhatsAppSession, incoming: WhatsAppIncomingMessage, phone: str) -> str:
    state = session.state
    data = session.draft_data
    text = (incoming.message or "").strip()
    text_lower = text.lower()

    if text_lower in CANCEL_KEYWORDS:
        session.delete()
        return "Processus annulé.\n\n" + get_welcome_text()

    if state == "AWAITING_TRACK_TICKET":
        ticket = extract_ticket_number(text)
        if not ticket:
            return (
                "Numéro de ticket invalide.\n"
                "Format attendu : PGP-2026-AB1234\n"
                "Réessayez ou tapez 'stop' pour annuler."
            )
        session.delete()
        return build_tracking_response(ticket)

    if state == "START":
        if text == "2" or _matches_any(text_lower, TRACK_KEYWORDS):
            session.state = "AWAITING_TRACK_TICKET"
            session.save()
            return (
                "Entrez votre numéro de ticket (ex: PGP-2026-AB1234) pour consulter l'état de votre plainte."
            )
        if text == "1" or _matches_any(text_lower, COMPLAINT_KEYWORDS) or text_lower in ("bonjour", "salut", "hello"):
            session.state = "AWAITING_ESTABLISHMENT"
            session.save()
            return (
                "Nous allons enregistrer votre plainte.\n\n"
                "Dans quel hôpital ou centre de santé l'incident s'est-il produit ?\n"
                "(Tapez simplement le nom de l'établissement)"
            )
        return get_welcome_text()

    elif state == "AWAITING_ESTABLISHMENT":
        if len(text) < 2:
            return "Veuillez entrer un nom d'établissement valide."
        data["establishment"] = text
        session.draft_data = data
        session.state = "AWAITING_CATEGORY"
        session.save()
        return get_category_text()

    elif state == "AWAITING_CATEGORY":
        cat_name = CATEGORIES_MAP.get(text)
        if not cat_name:
            cat_name = "Autre"
            for k, v in CATEGORIES_MAP.items():
                if v.lower() in text_lower:
                    cat_name = v
                    break

        data["category"] = cat_name
        session.draft_data = data
        session.state = "AWAITING_TITLE"
        session.save()
        return "Donnez un titre court à votre plainte (ex: 'Mauvais accueil aux urgences')."

    elif state == "AWAITING_TITLE":
        if len(text) < 2:
            return "Veuillez donner un titre un peu plus précis."
        data["title"] = text
        session.draft_data = data
        session.state = "AWAITING_DESCRIPTION"
        session.save()
        return (
            "Décrivez le problème en détail.\n"
            "• Envoyez un *message texte*, ou\n"
            "• Enregistrez un *message vocal* 🎤\n\n"
            "Vous pourrez ajouter des pièces jointes à l'étape suivante."
        )

    elif state == "AWAITING_DESCRIPTION":
        if is_voice_message(incoming) and incoming.media and incoming.media.data:
            data["voice"] = media_to_draft_dict(incoming.media)
            if text:
                data["description"] = text
            elif not data.get("description"):
                data["description"] = VOICE_DESCRIPTION_FALLBACK
            session.draft_data = data
            session.state = "AWAITING_MEDIA"
            session.save()
            return _media_step_prompt(data)
        if is_attachment_message(incoming):
            return (
                "Pour déposer une pièce jointe, terminez d'abord la description.\n"
                "Envoyez un texte ou un message vocal décrivant votre problème."
            )
        if len(text) < 2:
            return (
                "Veuillez décrire votre problème par texte ou par message vocal 🎤."
            )
        data["description"] = text
        session.draft_data = data
        session.state = "AWAITING_MEDIA"
        session.save()
        return _media_step_prompt(data)

    elif state == "AWAITING_MEDIA":
        if text in ("1", "2") or _matches_any(text_lower, MEDIA_DONE_KEYWORDS):
            session.draft_data = data
            session.state = "AWAITING_IDENTITY"
            session.save()
            return (
                "Voulez-vous déposer cette plainte de façon ANONYME ?\n"
                "1. Oui, rester anonyme\n"
                "2. Non, je vais donner mon nom complet"
            )

        if is_attachment_message(incoming) and incoming.media and incoming.media.data:
            attachments = list(data.get("attachments") or [])
            if len(attachments) >= MAX_ATTACHMENTS:
                return (
                    f"Maximum {MAX_ATTACHMENTS} pièces jointes atteint.\n"
                    "Tapez 'terminé' ou '1' pour continuer."
                )
            attachments.append(media_to_draft_dict(incoming.media))
            data["attachments"] = attachments
            session.draft_data = data
            session.save()
            remaining = MAX_ATTACHMENTS - len(attachments)
            return (
                f"✅ Pièce jointe reçue ({len(attachments)}/{MAX_ATTACHMENTS}).\n"
                f"Envoyez une autre pièce jointe ou tapez 'terminé' / '1' pour continuer"
                f" ({remaining} restante(s))."
            )

        if is_voice_message(incoming):
            return (
                "Les messages vocaux doivent être envoyés à l'étape de description.\n"
                "Envoyez une photo, un PDF ou un document, ou tapez 'passer' / '1' pour continuer."
            )

        return _media_step_prompt(data, remind=True)

    elif state == "AWAITING_IDENTITY":
        if "1" in text or "oui" in text_lower or "anonyme" in text_lower:
            data["is_anonymous"] = True
            session.draft_data = data
            session.state = "CONFIRMATION"
            session.save()
            return build_confirmation_text(data)
        if "2" in text or "non" in text_lower or "nom" in text_lower:
            data["is_anonymous"] = False
            session.draft_data = data
            session.state = "AWAITING_NAME"
            session.save()
            return "Quel est votre nom complet ?"
        return "Veuillez répondre par 1 (Oui) ou 2 (Non)."

    elif state == "AWAITING_NAME":
        if len(text) < 2:
            return "Veuillez entrer votre nom."
        data["name"] = text
        session.draft_data = data
        session.state = "CONFIRMATION"
        session.save()
        return build_confirmation_text(data)

    elif state == "CONFIRMATION":
        if "1" in text or "oui" in text_lower or "confirme" in text_lower or "valide" in text_lower:
            try:
                ticket_number, warnings = create_complaint_from_data(data, phone)
                session.delete()
                lines = [
                    "✅ Votre plainte a été enregistrée avec succès !",
                    "",
                    f"Votre numéro de ticket est : *{ticket_number}*",
                    "",
                    "Conservez-le précieusement pour suivre l'avancement de votre dossier.",
                    "Pour consulter le statut, renvoyez ce numéro de ticket sur WhatsApp.",
                ]
                if warnings:
                    lines.append("")
                    lines.append("⚠️ Certains fichiers n'ont pas pu être enregistrés :")
                    lines.extend(f"• {w}" for w in warnings)
                return "\n".join(lines)
            except Exception as e:
                logger.error("Error creating complaint from bot: %s", e)
                return (
                    "Une erreur technique s'est produite lors de l'enregistrement de votre plainte. "
                    "Veuillez réessayer plus tard."
                )
        if "2" in text or "non" in text_lower or "annule" in text_lower or "corriger" in text_lower:
            session.delete()
            return "Plainte annulée. Vous pouvez recommencer à tout moment en envoyant un message."
        return "Veuillez confirmer par '1' (Oui) ou '2' (Non, annuler)."

    return "Je n'ai pas compris. Pour annuler la procédure en cours, tapez 'stop'."


def _media_step_prompt(data: dict, remind: bool = False) -> str:
    attachments = data.get("attachments") or []
    voice_note = " (message vocal inclus)" if data.get("voice") else ""
    prefix = "Description enregistrée" + voice_note + ".\n\n" if not remind else ""
    count = len(attachments)
    count_line = f"\nPièces jointes reçues : {count}/{MAX_ATTACHMENTS}." if count else ""
    return (
        f"{prefix}"
        "Souhaitez-vous ajouter des pièces jointes (photos, PDF, documents) ?\n"
        "• Envoyez vos fichiers un par un (max 5)\n"
        "• Tapez *terminé* ou *1* quand vous avez fini\n"
        "• Tapez *passer* ou *2* pour continuer sans pièce jointe"
        f"{count_line}"
    )


def build_confirmation_text(data: dict) -> str:
    desc_short = data.get("description", "")
    if len(desc_short) > 60:
        desc_short = desc_short[:60] + "..."

    lines = [
        "📋 *Voici le récapitulatif de votre plainte :*",
        f"🏥 Établissement : {data.get('establishment', '')}",
        f"🏷️ Catégorie : {data.get('category', '')}",
        f"📌 Titre : {data.get('title', '')}",
        f"📝 Description : {desc_short}",
    ]
    if data.get("voice"):
        lines.append("🎤 Message vocal : Oui")
    attachments = data.get("attachments") or []
    if attachments:
        lines.append(f"📎 Pièces jointes : {len(attachments)} fichier(s)")
    if data.get("is_anonymous"):
        lines.append("👤 Identité : Anonyme")
    else:
        lines.append(f"👤 Nom : {data.get('name', '')}")

    lines.append("\nSouhaitez-vous valider et envoyer cette plainte ?")
    lines.append("1. Oui, je confirme l'envoi")
    lines.append("2. Non, je veux annuler")

    return "\n".join(lines)


def build_tracking_response(ticket_number: str) -> str:
    complaint = Complaint.objects.filter(ticket_number=ticket_number.upper()).first()
    if not complaint:
        return (
            f"Aucune plainte trouvée pour le ticket *{ticket_number.upper()}*.\n"
            "Vérifiez le numéro et réessayez."
        )

    if complaint.establishment:
        establishment_name = complaint.establishment.name
    else:
        establishment_name = complaint.establishment_name_manual or "Non renseigné"

    lines = [
        f"📋 *Suivi de plainte — {complaint.ticket_number}*",
        f"📌 Titre : {complaint.title}",
        f"🏥 Établissement : {establishment_name}",
        f"📊 Statut : *{complaint.get_status_display()}*",
        f"⚡ Priorité : {complaint.get_priority_display()}",
        f"📅 Déposée le : {timezone.localtime(complaint.created_at).strftime('%d/%m/%Y à %H:%M')}",
    ]

    if complaint.info_request_open and complaint.info_request_notes:
        lines.append(f"\n⚠️ *Complément demandé :*\n{complaint.info_request_notes}")

    history = list(complaint.history.all().order_by("timestamp")[:5])
    if history:
        lines.append("\n🕐 *Dernières étapes :*")
        for entry in history:
            ts = timezone.localtime(entry.timestamp).strftime("%d/%m/%Y %H:%M")
            detail = entry.action
            if entry.new_status:
                detail = f"{entry.action} → {entry.new_status}"
            lines.append(f"• {ts} — {detail}")

    lines.append("\nPour déposer une nouvelle plainte, envoyez un message.")
    return "\n".join(lines)


def create_complaint_from_data(data: dict, phone: str) -> tuple[str, list[str]]:
    cat_name = data.get("category", "")
    cat_obj = Category.objects.filter(name__icontains=cat_name).first()

    complaint = Complaint.objects.create(
        title=data.get("title", "Plainte WhatsApp"),
        description=data.get("description", ""),
        category=cat_obj,
        channel=ComplaintChannel.CHATBOT,
        status=ComplaintStatus.SOUMISE,
        is_anonymous=data.get("is_anonymous", False),
        complainant_name=data.get("name", "") if not data.get("is_anonymous") else "",
        complainant_phone=phone,
        establishment_name_manual=data.get("establishment", ""),
        social_raw_message=data.get("description", ""),
        social_source="whatsapp",
        social_sender_id=phone,
    )
    complaint.perform_nlp_analysis()
    complaint.save()

    ComplaintHistory.objects.create(
        complaint=complaint,
        action="Plainte soumise via WhatsApp",
        new_status=ComplaintStatus.SOUMISE,
        notes="Dépôt via chatbot WhatsApp",
    )

    warnings = apply_draft_media_to_complaint(complaint, data)
    return complaint.ticket_number, warnings


def _send_text(chat_id: str, text: str) -> None:
    client = OpenWAClient()
    if client.is_configured:
        client.send_text(chat_id, text)


def _matches_any(text: str, keywords: set[str]) -> bool:
    normalized = re.sub(r"[^a-zàâäéèêëïîôùûüç0-9\s]", " ", text)
    tokens = set(normalized.split())
    return bool(tokens & keywords) or any(kw in text for kw in keywords)
