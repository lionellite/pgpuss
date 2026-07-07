import os
import django
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from accounts.models import User, UserRole
from complaints.models import Complaint
from accounts.roles import filter_complaints_for_user
from django.db.models import Count, Avg
from django.db.models.functions import TruncMonth
from datetime import timedelta
from django.utils import timezone

now = timezone.now()
user = User.objects.filter(role=UserRole.PFZS).first()
if not user:
    print("No PFZS user found")
    exit()

qs = filter_complaints_for_user(user, Complaint.objects.all())
print(f"PFZS user: {user.email}")
print(f"Total complaints for PFZS: {qs.count()}")

try:
    total_complaints = qs.count()
    open_complaints = qs.filter(status__in=['SOUMISE', 'ACCUSEE', 'AFFECTEE', 'EN_TRAITEMENT']).count()
    
    # By category (top 8)
    by_category = list(
        qs.filter(category__isnull=False)
        .values('category__name')
        .annotate(count=Count('id'))
        .order_by('-count')[:8]
    )
    print("Category OK")
    
    # By month
    by_month = list(
        qs.filter(created_at__gte=now - timedelta(days=365))
        .annotate(month=TruncMonth('created_at'))
        .values('month')
        .annotate(count=Count('id'))
        .order_by('month')
    )
    print("Month OK")
    
    # By channel
    by_channel = dict(qs.values_list('channel').annotate(count=Count('id')).values_list('channel', 'count'))
    print("Channel OK")
    
    # By establishment
    by_establishment = list(
        qs.filter(establishment__isnull=False)
        .values('establishment__name')
        .annotate(count=Count('id'))
        .order_by('-count')[:10]
    )
    print("Establishment OK")
    
    print("SUCCESS")
except Exception as e:
    import traceback
    traceback.print_exc()
