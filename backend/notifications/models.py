from django.db import models
from django.conf import settings
import uuid


class NotificationType(models.TextChoices):
    EMAIL = 'EMAIL', 'Email'
    SMS = 'SMS', 'SMS'
    PUSH = 'PUSH', 'Push'
    IN_APP = 'IN_APP', 'In-App'


class Notification(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='notifications')
    complaint = models.ForeignKey(
        'complaints.Complaint', on_delete=models.CASCADE,
        null=True, blank=True, related_name='notifications'
    )
    type = models.CharField(max_length=10, choices=NotificationType.choices, default=NotificationType.IN_APP)
    title = models.CharField(max_length=255)
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.title} → {self.user.email}"
