import os
import django
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from complaints.models import Complaint, Escalation
from accounts.models import User
from complaints.serializers import ComplaintDetailSerializer

complaint = Complaint.objects.first()
user = User.objects.first()

if complaint and user:
    # Create an escalation
    Escalation.objects.create(complaint=complaint, from_user=user, to_user=user, reason="Test reason")
    data = ComplaintDetailSerializer(complaint).data
    print(data.get('escalations'))
else:
    print("No data")
