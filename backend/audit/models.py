import hashlib
import json
import uuid

from django.conf import settings
from django.db import models
from django.utils import timezone


class AuditEventType(models.TextChoices):
    AUTH = 'AUTH', 'Authentification'
    COMPLAINT = 'COMPLAINT', 'Plainte'
    USER = 'USER', 'Utilisateur'
    EXPORT = 'EXPORT', 'Export'
    SYSTEM = 'SYSTEM', 'Système'
    WEBHOOK = 'WEBHOOK', 'Webhook'


class ImmutableAuditQuerySet(models.QuerySet):
    def update(self, **kwargs):
        raise PermissionError('Les entrées du journal d\'audit sont immuables.')

    def delete(self):
        raise PermissionError('Les entrées du journal d\'audit sont immuables.')


class ImmutableAuditManager(models.Manager):
    def get_queryset(self):
        return ImmutableAuditQuerySet(self.model, using=self._db)

    def create_entry(self, **kwargs):
        return self.create(**kwargs)


class AuditLog(models.Model):
    """
    Journal d'audit append-only avec chaîne de hachage pour détecter toute altération.
    Accès en lecture seule pour ADMIN_PLATEFORME et CABINET (ministère).
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    sequence = models.PositiveBigIntegerField(unique=True, editable=False)
    event_type = models.CharField(max_length=20, choices=AuditEventType.choices, db_index=True)
    action = models.CharField(max_length=200, db_index=True)
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='audit_logs',
    )
    actor_role = models.CharField(max_length=30, blank=True, db_index=True)
    actor_label = models.CharField(max_length=200, blank=True)
    resource_type = models.CharField(max_length=50, blank=True, db_index=True)
    resource_id = models.CharField(max_length=100, blank=True, db_index=True)
    resource_label = models.CharField(max_length=300, blank=True)
    old_value = models.JSONField(null=True, blank=True)
    new_value = models.JSONField(null=True, blank=True)
    metadata = models.JSONField(default=dict, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.CharField(max_length=500, blank=True)
    prev_hash = models.CharField(max_length=64, blank=True)
    entry_hash = models.CharField(max_length=64, unique=True, editable=False)
    created_at = models.DateTimeField(default=timezone.now, editable=False, db_index=True)

    objects = ImmutableAuditManager()

    class Meta:
        ordering = ['-sequence']
        verbose_name = 'Entrée de journal d\'audit'
        verbose_name_plural = 'Journal d\'audit'

    def __str__(self):
        return f"#{self.sequence} {self.event_type} — {self.action}"

    def save(self, *args, **kwargs):
        if not self._state.adding:
            raise PermissionError('Les entrées du journal d\'audit sont immuables.')
        if not self.sequence:
            last = AuditLog.objects.order_by('-sequence').values_list('sequence', flat=True).first()
            self.sequence = (last or 0) + 1
        if not self.entry_hash:
            self.entry_hash = self._compute_hash()
        super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        raise PermissionError('Les entrées du journal d\'audit sont immuables.')

    def _compute_hash(self) -> str:
        payload = {
            'sequence': self.sequence,
            'prev_hash': self.prev_hash or '',
            'event_type': self.event_type,
            'action': self.action,
            'actor_id': str(self.actor_id) if self.actor_id else '',
            'actor_role': self.actor_role,
            'resource_type': self.resource_type,
            'resource_id': self.resource_id,
            'old_value': self.old_value,
            'new_value': self.new_value,
            'metadata': self.metadata,
            'created_at': self.created_at.isoformat() if self.created_at else '',
        }
        canonical = json.dumps(payload, sort_keys=True, ensure_ascii=False, default=str)
        return hashlib.sha256(canonical.encode('utf-8')).hexdigest()

    @classmethod
    def verify_chain(cls, limit: int | None = None) -> dict:
        qs = cls.objects.order_by('sequence')
        if limit:
            qs = qs[:limit]
        entries = list(qs)
        prev = ''
        broken_at = None
        for entry in entries:
            expected_prev = prev
            if entry.prev_hash != expected_prev:
                broken_at = entry.sequence
                break
            if entry.entry_hash != entry._compute_hash():
                broken_at = entry.sequence
                break
            prev = entry.entry_hash
        return {
            'valid': broken_at is None,
            'checked': len(entries),
            'broken_at_sequence': broken_at,
        }
