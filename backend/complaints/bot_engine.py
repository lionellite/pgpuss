import logging
from .models import WhatsAppSession, Complaint, ComplaintStatus, ComplaintChannel, Category
from .openwa_client import OpenWAClient
from .whatsapp_parser import WhatsAppIncomingMessage

logger = logging.getLogger(__name__)

CATEGORIES_MAP = {
    "1": "Qualité des soins",
    "2": "Médicaments",
    "3": "Facturation & frais",
    "4": "Accueil & comportement",
    "5": "Infrastructure & hygiène",
    "6": "Confidentialité",
    "7": "Autre"
}

def get_category_text():
    lines = ["Quelle est la catégorie de votre problème ? (Répondez par le numéro)"]
    for k, v in CATEGORIES_MAP.items():
        lines.append(f"{k}. {v}")
    return "\n".join(lines)

def handle_incoming_message(incoming: WhatsAppIncomingMessage):
    phone = incoming.sender
    text = (incoming.message or "").strip()
    chat_id = incoming.chat_id

    if not phone or not chat_id:
        return

    # Delete expired sessions
    session = WhatsAppSession.objects.filter(phone_number=phone).first()
    if session and session.is_expired:
        session.delete()
        session = None

    if not session:
        # If user just sends "stop" when no session exists, do nothing
        if text.lower() in ["annuler", "quitter", "stop", "menu"]:
            return

        session = WhatsAppSession.objects.create(phone_number=phone, state='START')
    
    # Process state
    response_text = process_state(session, text, phone)
    
    # Send response
    if response_text:
        client = OpenWAClient()
        if client.is_configured:
            client.send_text(chat_id, response_text)

def process_state(session: WhatsAppSession, text: str, phone: str) -> str:
    state = session.state
    data = session.draft_data
    text_lower = text.lower()

    if text_lower in ["annuler", "quitter", "stop", "menu"]:
        session.delete()
        return "Processus annulé. Envoyez un message (ex: 'Bonjour' ou 'Plainte') pour recommencer."

    if state == 'START':
        session.state = 'AWAITING_ESTABLISHMENT'
        session.save()
        return (
            "Bienvenue sur la plateforme PGP-USS Santé Bénin. 🏥\n"
            "Nous allons enregistrer votre plainte.\n\n"
            "Pour commencer, dans quel hôpital ou centre de santé l'incident s'est-il produit ?\n"
            "(Tapez simplement le nom de l'établissement)"
        )

    elif state == 'AWAITING_ESTABLISHMENT':
        if len(text) < 2:
            return "Veuillez entrer un nom d'établissement valide."
        data['establishment'] = text
        session.draft_data = data
        session.state = 'AWAITING_CATEGORY'
        session.save()
        return get_category_text()

    elif state == 'AWAITING_CATEGORY':
        cat_name = CATEGORIES_MAP.get(text)
        if not cat_name:
            cat_name = "Autre"
            for k, v in CATEGORIES_MAP.items():
                if v.lower() in text_lower:
                    cat_name = v
                    break
            
        data['category'] = cat_name
        session.draft_data = data
        session.state = 'AWAITING_TITLE'
        session.save()
        return "Donnez un titre court à votre plainte (ex: 'Mauvais accueil aux urgences')."

    elif state == 'AWAITING_TITLE':
        if len(text) < 2:
            return "Veuillez donner un titre un peu plus précis."
        data['title'] = text
        session.draft_data = data
        session.state = 'AWAITING_DESCRIPTION'
        session.save()
        return (
            "Veuillez maintenant décrire le problème en détail.\n"
            "(Vous pouvez envoyer un long texte avec les faits précis.)"
        )

    elif state == 'AWAITING_DESCRIPTION':
        if len(text) < 2:
            return "Veuillez fournir une description de votre problème."
        data['description'] = text
        session.draft_data = data
        session.state = 'AWAITING_IDENTITY'
        session.save()
        return (
            "Voulez-vous déposer cette plainte de façon ANONYME ?\n"
            "1. Oui, rester anonyme\n"
            "2. Non, je vais donner mon nom complet"
        )

    elif state == 'AWAITING_IDENTITY':
        if "1" in text or "oui" in text_lower or "anonyme" in text_lower:
            data['is_anonymous'] = True
            session.draft_data = data
            session.state = 'CONFIRMATION'
            session.save()
            return build_confirmation_text(data)
        elif "2" in text or "non" in text_lower or "nom" in text_lower:
            data['is_anonymous'] = False
            session.draft_data = data
            session.state = 'AWAITING_NAME'
            session.save()
            return "Quel est votre nom complet ?"
        else:
            return "Veuillez répondre par 1 (Oui) ou 2 (Non)."

    elif state == 'AWAITING_NAME':
        if len(text) < 2:
            return "Veuillez entrer votre nom."
        data['name'] = text
        session.draft_data = data
        session.state = 'CONFIRMATION'
        session.save()
        return build_confirmation_text(data)

    elif state == 'CONFIRMATION':
        if "1" in text or "oui" in text_lower or "confirme" in text_lower or "valide" in text_lower:
            try:
                ticket_number = create_complaint_from_data(data, phone)
                session.delete()
                return (
                    f"✅ Votre plainte a été enregistrée avec succès !\n\n"
                    f"Votre numéro de ticket est : *{ticket_number}*\n\n"
                    "Conservez-le précieusement pour suivre l'avancement de votre dossier.\n"
                    "Vous pouvez le consulter à tout moment sur la plateforme web."
                )
            except Exception as e:
                logger.error(f"Error creating complaint from bot: {e}")
                return "Une erreur technique s'est produite lors de l'enregistrement de votre plainte. Veuillez réessayer plus tard."
        elif "2" in text or "non" in text_lower or "annule" in text_lower or "corriger" in text_lower:
            session.delete()
            return "Plainte annulée. Vous pouvez recommencer à tout moment en envoyant un message."
        else:
            return "Veuillez confirmer par '1' (Oui) ou '2' (Non, annuler)."

    return "Je n'ai pas compris. Pour annuler la procédure en cours, tapez 'stop'."

def build_confirmation_text(data: dict) -> str:
    desc_short = data.get('description', '')
    if len(desc_short) > 60:
        desc_short = desc_short[:60] + "..."

    lines = [
        "📋 *Voici le récapitulatif de votre plainte :*",
        f"🏥 Établissement : {data.get('establishment', '')}",
        f"🏷️ Catégorie : {data.get('category', '')}",
        f"📌 Titre : {data.get('title', '')}",
        f"📝 Description : {desc_short}",
    ]
    if data.get('is_anonymous'):
        lines.append("👤 Identité : Anonyme")
    else:
        lines.append(f"👤 Nom : {data.get('name', '')}")
    
    lines.append("\nSouhaitez-vous valider et envoyer cette plainte ?")
    lines.append("1. Oui, je confirme l'envoi")
    lines.append("2. Non, je veux annuler")
    
    return "\n".join(lines)

def create_complaint_from_data(data: dict, phone: str) -> str:
    cat_name = data.get('category', '')
    cat_obj = Category.objects.filter(name__icontains=cat_name).first()
    
    complaint = Complaint.objects.create(
        title=data.get('title', 'Plainte WhatsApp'),
        description=data.get('description', ''),
        category=cat_obj,
        channel=ComplaintChannel.CHATBOT,
        status=ComplaintStatus.SOUMISE,
        is_anonymous=data.get('is_anonymous', False),
        complainant_name=data.get('name', '') if not data.get('is_anonymous') else '',
        complainant_phone=phone,
        establishment_name_manual=data.get('establishment', ''),
        social_raw_message=data.get('description', ''),
        social_source='whatsapp',
        social_sender_id=phone,
    )
    complaint.perform_nlp_analysis()
    complaint.save()
    return complaint.ticket_number
