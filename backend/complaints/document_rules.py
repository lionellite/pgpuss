"""Rôles autorisés à rédiger chaque type de document ; obligatoire ou non."""
from accounts.models import UserRole
from .models import ComplaintDocumentType


def rules_for(doc_type: str) -> dict:
    """Retourne {allowed_roles: list[str], is_required: bool}."""
    r = DOCUMENT_MATRIX.get(doc_type, {"roles": [UserRole.ADMIN_PLATEFORME], "required": False})
    return {"allowed_roles": r["roles"], "is_required": r["required"]}


DOCUMENT_MATRIX = {
    ComplaintDocumentType.FICHE_PLAINTE: {
        "roles": [UserRole.USAGER, UserRole.PFE, UserRole.ADMIN_PLATEFORME],
        "required": True,
    },
    ComplaintDocumentType.RECEPISSE_ACCUSATION: {
        "roles": [UserRole.PFE, UserRole.ADMIN_PLATEFORME],
        "required": True,
    },
    ComplaintDocumentType.FICHE_QUALIFICATION: {
        "roles": [UserRole.PFE, UserRole.ADMIN_PLATEFORME],
        "required": True,
    },
    ComplaintDocumentType.BON_AFFECTATION: {
        "roles": [UserRole.PFE, UserRole.ADMIN_PLATEFORME],
        "required": True,
    },
    ComplaintDocumentType.JOURNAL_INSTRUCTION: {
        "roles": [
            UserRole.PFE,
            UserRole.AGENT_INTERNE,
            UserRole.DDS,
            UserRole.ADMIN_PLATEFORME,
        ],
        "required": False,
    },
    ComplaintDocumentType.RAPPORT_RESOLUTION: {
        "roles": [UserRole.PFE, UserRole.AGENT_INTERNE, UserRole.DIRECTEUR_EST, UserRole.ADMIN_PLATEFORME],
        "required": True,
    },
    ComplaintDocumentType.DOSSIER_ESCALADE: {
        "roles": [
            UserRole.PFE,
            UserRole.DIRECTEUR_EST,
            UserRole.USAGER,
            UserRole.DDS,
            UserRole.ADMIN_PLATEFORME,
        ],
        "required": True,
    },
    ComplaintDocumentType.DECISION_ARBITRAGE: {
        "roles": [UserRole.DDS, UserRole.DQSS, UserRole.CABINET, UserRole.ADMIN_PLATEFORME],
        "required": True,
    },
    ComplaintDocumentType.FICHE_CLOTURE: {
        "roles": [UserRole.PFE, UserRole.DDS, UserRole.DQSS, UserRole.CABINET, UserRole.ADMIN_PLATEFORME],
        "required": True,
    },
}
