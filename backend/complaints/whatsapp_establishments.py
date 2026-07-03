"""Helpers référentiel établissements pour le chatbot WhatsApp."""
from __future__ import annotations

from establishments.models import (
    Establishment,
    EstablishmentOperationalStatus,
    Region,
    Service,
)

PAGE_SIZE = 12
MANUAL_CHOICE = 'manual'
NEXT_PAGE_CHOICE = 'next'


def active_establishments_qs(region_id: str):
    return Establishment.objects.filter(
        region_id=region_id,
        is_active=True,
        operational_status=EstablishmentOperationalStatus.OPERATIONAL,
    ).order_by('name')


def get_regions() -> list[Region]:
    return list(Region.objects.order_by('name'))


def get_establishment_page(region_id: str, page: int = 0) -> tuple[list[Establishment], int]:
    qs = active_establishments_qs(region_id)
    total = qs.count()
    items = list(qs[page * PAGE_SIZE:(page + 1) * PAGE_SIZE])
    return items, total


def search_establishments(region_id: str, query: str, limit: int = 10) -> list[Establishment]:
    q = query.strip()
    if len(q) < 2:
        return []
    return list(
        active_establishments_qs(region_id).filter(name__icontains=q)[:limit]
    )


def get_services(establishment_id: str) -> list[Service]:
    return list(
        Service.objects.filter(
            establishment_id=establishment_id,
            is_active=True,
            operational_status=EstablishmentOperationalStatus.OPERATIONAL,
        ).order_by('name')
    )


def format_regions_prompt() -> str:
    regions = get_regions()
    if not regions:
        return (
            "Le référentiel des départements n'est pas disponible.\n"
            "Tapez le nom de votre hôpital ou centre de santé :"
        )
    lines = [
        "Dans quel *département* l'incident s'est-il produit ?",
        "Répondez par le numéro :",
        "",
    ]
    for idx, region in enumerate(regions, start=1):
        lines.append(f"{idx}. {region.name}")
    lines.append("")
    lines.append("0. Mon établissement n'est pas dans la liste (saisie manuelle)")
    return "\n".join(lines)


def format_establishments_prompt(region_name: str, establishments: list[Establishment], page: int, total: int) -> str:
    lines = [
        f"Établissements dans *{region_name}* (page {page + 1}) :",
        "Répondez par le numéro :",
        "",
    ]
    for idx, est in enumerate(establishments, start=1):
        type_label = est.get_type_display() if hasattr(est, 'get_type_display') else est.type
        lines.append(f"{idx}. {est.name} ({type_label})")
    lines.append("")
    lines.append("0. Saisir le nom manuellement")
    if (page + 1) * PAGE_SIZE < total:
        lines.append("99. Page suivante ▶")
    if page > 0:
        lines.append("98. Page précédente ◀")
    return "\n".join(lines)


def format_services_prompt(establishment_name: str, services: list[Service]) -> str:
    lines = [
        f"Services disponibles à *{establishment_name}* :",
        "Répondez par le numéro (optionnel) :",
        "",
    ]
    for idx, svc in enumerate(services, start=1):
        lines.append(f"{idx}. {svc.name}")
    lines.append("")
    lines.append("0. Passer / non applicable")
    return "\n".join(lines)


def parse_numeric_choice(text: str, max_value: int) -> int | str | None:
    raw = (text or '').strip()
    if not raw.isdigit():
        return None
    value = int(raw)
    if value == 0:
        return MANUAL_CHOICE
    if value == 99:
        return NEXT_PAGE_CHOICE
    if value == 98:
        return 'prev'
    if 1 <= value <= max_value:
        return value
    return None


def resolve_region_choice(text: str) -> Region | str | None:
    regions = get_regions()
    choice = parse_numeric_choice(text, len(regions))
    if choice == MANUAL_CHOICE:
        return MANUAL_CHOICE
    if isinstance(choice, int):
        return regions[choice - 1]
    return None


def resolve_establishment_choice(text: str, establishments: list[Establishment]) -> Establishment | str | None:
    choice = parse_numeric_choice(text, len(establishments))
    if choice in (MANUAL_CHOICE, NEXT_PAGE_CHOICE, 'prev'):
        return choice
    if isinstance(choice, int):
        return establishments[choice - 1]
    return None


def resolve_service_choice(text: str, services: list[Service]) -> Service | str | None:
    choice = parse_numeric_choice(text, len(services))
    if choice == MANUAL_CHOICE:
        return 'skip'
    if isinstance(choice, int):
        return services[choice - 1]
    return None


def establishment_summary(data: dict) -> str:
    if data.get('establishment_name'):
        summary = data['establishment_name']
        if data.get('region_name'):
            summary = f"{summary} ({data['region_name']})"
        if data.get('service_name'):
            summary = f"{summary} — {data['service_name']}"
        return summary
    manual = (data.get('establishment_name_manual') or '').strip()
    if manual:
        region = data.get('region_name') or data.get('manual_region_hint') or ''
        if region:
            return f"{manual} ({region}) — non répertorié"
        return f"{manual} (non répertorié)"
    return "Non renseigné"
