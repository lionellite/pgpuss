from __future__ import annotations

from typing import Any

from django.http import HttpRequest

from .models import AuditEventType, AuditLog


def _client_ip(request: HttpRequest | None) -> str | None:
    if not request:
        return None
    forwarded = request.META.get('HTTP_X_FORWARDED_FOR')
    if forwarded:
        return forwarded.split(',')[0].strip()
    return request.META.get('REMOTE_ADDR')


def _client_user_agent(request: HttpRequest | None) -> str:
    if not request:
        return ''
    return (request.META.get('HTTP_USER_AGENT') or '')[:500]


def log_audit_event(
    *,
    event_type: str,
    action: str,
    request: HttpRequest | None = None,
    actor=None,
    actor_role: str = '',
    actor_label: str = '',
    resource_type: str = '',
    resource_id: str = '',
    resource_label: str = '',
    old_value: dict | None = None,
    new_value: dict | None = None,
    metadata: dict | None = None,
) -> AuditLog:
    """Enregistre une entrée immuable dans le journal d'audit."""
    if actor and not actor_label:
        actor_label = getattr(actor, 'full_name', None) or str(actor)
    if actor and not actor_role:
        actor_role = getattr(actor, 'role', '') or ''

    last = AuditLog.objects.order_by('-sequence').only('entry_hash').first()
    prev_hash = last.entry_hash if last else ''

    return AuditLog.objects.create(
        event_type=event_type,
        action=action,
        actor=actor,
        actor_role=actor_role,
        actor_label=actor_label,
        resource_type=resource_type,
        resource_id=str(resource_id) if resource_id else '',
        resource_label=resource_label,
        old_value=old_value,
        new_value=new_value,
        metadata=metadata or {},
        ip_address=_client_ip(request),
        user_agent=_client_user_agent(request),
        prev_hash=prev_hash,
    )


def log_auth_event(action: str, *, request=None, actor=None, metadata: dict | None = None) -> AuditLog:
    return log_audit_event(
        event_type=AuditEventType.AUTH,
        action=action,
        request=request,
        actor=actor,
        resource_type='session',
        resource_id=str(getattr(actor, 'pk', '')) if actor else '',
        resource_label=actor_label(actor),
        metadata=metadata,
    )


def log_complaint_event(
    action: str,
    *,
    request=None,
    actor=None,
    complaint=None,
    old_status: str = '',
    new_status: str = '',
    notes: str = '',
    metadata: dict | None = None,
) -> AuditLog:
    meta = dict(metadata or {})
    if notes:
        meta['notes'] = notes
    return log_audit_event(
        event_type=AuditEventType.COMPLAINT,
        action=action,
        request=request,
        actor=actor,
        resource_type='complaint',
        resource_id=str(getattr(complaint, 'pk', '')) if complaint else '',
        resource_label=getattr(complaint, 'ticket_number', '') if complaint else '',
        old_value={'status': old_status} if old_status else None,
        new_value={'status': new_status} if new_status else None,
        metadata=meta,
    )


def log_user_event(
    action: str,
    *,
    request=None,
    actor=None,
    target_user=None,
    old_value: dict | None = None,
    new_value: dict | None = None,
    metadata: dict | None = None,
) -> AuditLog:
    return log_audit_event(
        event_type=AuditEventType.USER,
        action=action,
        request=request,
        actor=actor,
        resource_type='user',
        resource_id=str(getattr(target_user, 'pk', '')) if target_user else '',
        resource_label=actor_label(target_user),
        old_value=old_value,
        new_value=new_value,
        metadata=metadata,
    )


def log_export_event(action: str, *, request=None, actor=None, metadata: dict | None = None) -> AuditLog:
    return log_audit_event(
        event_type=AuditEventType.EXPORT,
        action=action,
        request=request,
        actor=actor,
        resource_type='analytics',
        metadata=metadata,
    )


def actor_label(user) -> str:
    if not user:
        return ''
    return getattr(user, 'full_name', None) or getattr(user, 'email', None) or str(user.pk)
