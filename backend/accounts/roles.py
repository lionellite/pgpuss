"""
Rôles, périmètres de visibilité et permissions transverses (PGP-USS).
Pyramide : Plaignant → PFE / Agent interne → PFZS → PF-DDS → PF-DQSS + PNUSS (tous niveaux).
"""
from django.db.models import Q

from .models import UserRole

# Rôles avec accès au tableau de bord agent (lecture ou écriture)
DASHBOARD_ROLES = frozenset({
    UserRole.PFE,
    UserRole.PFZS,
    UserRole.DIRECTEUR_EST,
    UserRole.DDS,
    UserRole.DQSS,
    UserRole.CABINET,
    UserRole.AGENT_INTERNE,
    UserRole.AGENT_CALL_CENTER,
    UserRole.PNUSS,
    UserRole.ADMIN_PLATEFORME,
    UserRole.AUDITEUR,
})

READ_ONLY_ROLES = frozenset({UserRole.AUDITEUR})

NATIONAL_ROLES = frozenset({
    UserRole.DQSS,
    UserRole.CABINET,
    UserRole.ADMIN_PLATEFORME,
})

# Rôles pouvant intervenir sur un dossier (médiation, journal, notification)
INTERVENANT_ROLES = frozenset({
    UserRole.PFE,
    UserRole.AGENT_INTERNE,
    UserRole.PFZS,
    UserRole.PNUSS,
    UserRole.DIRECTEUR_EST,
    UserRole.DDS,
    UserRole.DQSS,
    UserRole.CABINET,
    UserRole.ADMIN_PLATEFORME,
})


def is_readonly_role(role: str) -> bool:
    return role in READ_ONLY_ROLES


def is_dashboard_role(role: str) -> bool:
    return role in DASHBOARD_ROLES


def pnuss_level(user) -> str:
    """Niveau d'affectation PNUSS : establishment | zone | department | national."""
    if getattr(user, 'establishment_id', None):
        return 'establishment'
    if getattr(user, 'zone_sanitaire_id', None):
        return 'zone'
    if getattr(user, 'departement', None):
        return 'department'
    return 'national'


def filter_complaints_for_user(user, qs):
    """Filtre un queryset Complaint selon le rôle et le rattachement."""
    role = user.role

    if role == UserRole.USAGER:
        return qs.filter(complainant=user)

    if role in (UserRole.PFE, UserRole.DIRECTEUR_EST):
        if user.establishment_id:
            return qs.filter(establishment_id=user.establishment_id)
        return qs.none()

    if role == UserRole.AGENT_INTERNE:
        return qs.filter(assigned_to=user)

    if role == UserRole.AGENT_CALL_CENTER:
        # L'agent voit : ses plaintes traitées + toutes les plaintes sociales en attente
        from django.db.models import Q
        return qs.filter(
            Q(call_center_agent=user) |
            Q(pending_call_center_completion=True)
        )

    if role == UserRole.PFZS:
        if user.zone_sanitaire_id:
            return qs.filter(establishment__zone_sanitaire_id=user.zone_sanitaire_id)
        return qs.none()

    if role == UserRole.PNUSS:
        if user.establishment_id:
            return qs.filter(establishment_id=user.establishment_id)
        if user.zone_sanitaire_id:
            return qs.filter(establishment__zone_sanitaire_id=user.zone_sanitaire_id)
        if user.departement:
            return qs.filter(establishment__region__name=user.departement)
        return qs  # national : toutes les plaintes

    if role == UserRole.DDS:
        if user.departement:
            return qs.filter(establishment__region__name=user.departement)
        return qs.none()

    if role in NATIONAL_ROLES:
        return qs

    if role == UserRole.AUDITEUR:
        if user.establishment_id:
            return qs.filter(establishment_id=user.establishment_id)
        if user.zone_sanitaire_id:
            return qs.filter(establishment__zone_sanitaire_id=user.zone_sanitaire_id)
        if user.departement:
            return qs.filter(establishment__region__name=user.departement)
        return qs  # auditeur national

    return qs.none()


def user_can_view_complaint(user, complaint) -> bool:
    """Vérifie l'accès lecture à une plainte."""
    if not user.is_authenticated:
        return False
    return filter_complaints_for_user(user, type(complaint).objects.filter(pk=complaint.pk)).exists()


def assignable_roles_for_pfe():
    """Cibles d'affectation par le PFE (même établissement)."""
    return (UserRole.AGENT_INTERNE, UserRole.PNUSS)


def escalation_target_roles_for(actor_role: str):
    """Rôles cibles d'escalade selon l'acteur (hiérarchie)."""
    mapping = {
        UserRole.PFE: (UserRole.PFZS, UserRole.PNUSS),
        UserRole.DIRECTEUR_EST: (UserRole.PFZS, UserRole.DDS, UserRole.PNUSS),
        UserRole.PFZS: (UserRole.DDS, UserRole.PNUSS),
        UserRole.PNUSS: (UserRole.PFZS, UserRole.DDS, UserRole.DQSS),
        UserRole.DDS: (UserRole.DQSS, UserRole.CABINET),
        UserRole.DQSS: (UserRole.CABINET,),
        UserRole.CABINET: (UserRole.DQSS,),
    }
    return mapping.get(actor_role, ())
