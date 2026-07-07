import os
import django
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from complaints.models import Complaint, Escalation
from accounts.models import User
from complaints.serializers import ComplaintDetailSerializer
from django.utils import timezone
from datetime import timedelta

complaint = Complaint.objects.first()
user = User.objects.first()

if complaint and user:
    # Clear existing escalations
    Escalation.objects.filter(complaint=complaint).delete()
    
    # Create escalations in order
    Escalation.objects.create(complaint=complaint, from_user=user, to_user=user, reason="First", escalated_at=timezone.now() - timedelta(days=2))
    Escalation.objects.create(complaint=complaint, from_user=user, to_user=user, reason="Second", escalated_at=timezone.now() - timedelta(days=1))
    Escalation.objects.create(complaint=complaint, from_user=user, to_user=user, reason="Third")

    data = ComplaintDetailSerializer(complaint).data
    for e in data.get('escalations', []):
        print(e['reason'])
