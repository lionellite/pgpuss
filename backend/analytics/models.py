from django.db import models
from django.conf import settings
import uuid


class SatisfactionSurvey(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    complaint = models.OneToOneField('complaints.Complaint', on_delete=models.CASCADE, related_name='satisfaction')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    rating = models.IntegerField(choices=[(i, str(i)) for i in range(1, 6)])
    nps_score = models.IntegerField(choices=[(i, str(i)) for i in range(0, 11)], null=True, blank=True)
    comment = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Enquête de satisfaction'
        verbose_name_plural = 'Enquêtes de satisfaction'

    def __str__(self):
        return f"Satisfaction {self.complaint.ticket_number}: {self.rating}/5"
