"""Routage des plaintes : PFE (établissement connu) ou Call Center (établissement non référencé)."""
from __future__ import annotations

import logging

from accounts.models import User, UserRole
from notifications.utils import notify_user

from .models import Complaint, ComplaintHistory

logger = logging.getLogger(__name__)


def notify_pfe_for_complaint(complaint: Complaint) -> int:
    if not complaint.establishment_id:
        return 0
    recipients = User.objects.filter(
        establishment_id=complaint.establishment_id,
        role__in=(UserRole.PFE, UserRole.DIRECTEUR_EST),
        is_active=True,
    )
    count = 0
    for user in recipients:
        notify_user(
            user,
            'Nouvelle plainte reçue',
            (
                f'Une plainte ({complaint.ticket_number}) a été déposée '
                f'concernant votre établissement ({complaint.establishment.name}).'
            ),
            complaint=complaint,
        )
        count += 1
    return count


def notify_call_center_for_complaint(complaint: Complaint) -> int:
    agents = User.objects.filter(role=UserRole.AGENT_CALL_CENTER, is_active=True)
    count = 0
    for agent in agents:
        notify_user(
            agent,
            'Plainte à traiter — Call Center',
            (
                f'Plainte {complaint.ticket_number} en attente de qualification '
                f'(établissement non référencé ou à confirmer).'
            ),
            complaint=complaint,
        )
        count += 1
    return count


def notify_pfzs_for_zone(complaint: Complaint, zone) -> int:
    if not zone:
        return 0
    recipients = User.objects.filter(
        zone_sanitaire_id=zone.pk,
        role=UserRole.PFZS,
        is_active=True,
    )
    count = 0
    for user in recipients:
        notify_user(
            user,
            'Plainte orientée vers votre zone',
            (
                f'Le call center a orienté la plainte {complaint.ticket_number} '
                f'vers la zone sanitaire {zone.name}.'
            ),
            complaint=complaint,
        )
        count += 1
    return count


def apply_complaint_routing(complaint: Complaint, *, actor=None, skip_history: bool = False) -> str:
    """
    Applique le routage selon la présence d'un établissement référencé.
    Retourne : 'pfe' | 'call_center'
    """
    if complaint.establishment_id:
        complaint.pending_call_center_completion = False
        complaint.needs_call_center_assistance = False
        complaint.save(update_fields=['pending_call_center_completion', 'needs_call_center_assistance'])
        notify_pfe_for_complaint(complaint)
        if not skip_history:
            ComplaintHistory.objects.create(
                complaint=complaint,
                action='Routage vers PFE établissement',
                new_status=complaint.status,
                actor=actor,
                notes=f'Établissement référencé : {complaint.establishment.name}',
            )
        return 'pfe'

    complaint.pending_call_center_completion = True
    complaint.needs_call_center_assistance = True
    complaint.save(update_fields=['pending_call_center_completion', 'needs_call_center_assistance'])
    notify_call_center_for_complaint(complaint)
    if not skip_history:
        manual = (complaint.establishment_name_manual or '').strip()
        ComplaintHistory.objects.create(
            complaint=complaint,
            action='Routage vers Call Center 136',
            new_status=complaint.status,
            actor=actor,
            notes=(
                f'Établissement saisi manuellement : {manual}'
                if manual else
                'Établissement non référencé — traitement call center requis.'
            ),
        )
    return 'call_center'
