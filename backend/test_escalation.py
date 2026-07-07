import os
import django
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from accounts.models import User, UserRole
from complaints.models import Complaint, ComplaintStatus
from establishments.models import Establishment
from complaints.views import _resolve_escalation_target

pfe = User.objects.filter(role=UserRole.PFE).first()
complaint = Complaint.objects.filter(establishment=pfe.establishment).first()

if not complaint:
    print("No complaint found for PFE's establishment")
else:
    to_user, target_role, skip_reason = _resolve_escalation_target(complaint, pfe)
    print(f"PFE Escalation Target Role: {target_role}")
    print(f"PFE Escalation Target User: {to_user} (Role: {to_user.role if to_user else 'None'})")

