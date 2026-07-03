from django.db.models.signals import post_save
from django.dispatch import receiver

from complaints.models import Complaint, ComplaintHistory

from .services import log_complaint_event


@receiver(post_save, sender=Complaint)
def audit_complaint_created(sender, instance, created, **kwargs):
    if not created:
        return
    log_complaint_event(
        'Plainte créée',
        complaint=instance,
        actor=getattr(instance, 'complainant', None),
        new_status=instance.status,
        metadata={
            'channel': instance.channel,
            'title': instance.title,
            'is_anonymous': instance.is_anonymous,
        },
    )


@receiver(post_save, sender=ComplaintHistory)
def audit_complaint_history(sender, instance, created, **kwargs):
    if not created:
        return
    log_complaint_event(
        instance.action,
        actor=instance.actor,
        complaint=instance.complaint,
        old_status=instance.old_status,
        new_status=instance.new_status,
        notes=instance.notes,
    )
