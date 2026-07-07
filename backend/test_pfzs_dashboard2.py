import os
import django
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from accounts.models import User
from complaints.models import Complaint
from complaints.serializers import ComplaintDetailSerializer
from accounts.roles import filter_complaints_for_user

pfzs_user = User.objects.filter(role='PFZS').first()
qs = filter_complaints_for_user(pfzs_user, Complaint.objects.all())
complaint = qs.first()
if complaint:
    data = ComplaintDetailSerializer(complaint).data
    print(data.get('escalations'))
else:
    print("No complaint found for PFZS")
