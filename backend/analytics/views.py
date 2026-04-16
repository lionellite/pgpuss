from rest_framework import generics, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from django.db.models import Count, Avg, Q, F, ExpressionWrapper, fields
from django.db.models.functions import TruncMonth
from django.utils import timezone
from datetime import timedelta
from complaints.models import Complaint, ComplaintStatus, Category
from complaints.serializers import ComplaintListSerializer
from .models import SatisfactionSurvey
from .serializers import SatisfactionSurveySerializer


class DashboardView(APIView):
    """Tableau de bord avec KPIs"""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        qs = Complaint.objects.all()

        # Filter by establishment for non-admin users
        if user.role in ['AGENT_RECEPTION', 'GESTIONNAIRE_SERVICE', 'DIRECTEUR']:
            qs = qs.filter(establishment=user.establishment)

        now = timezone.now()
        thirty_days_ago = now - timedelta(days=30)

        open_statuses = [
            ComplaintStatus.DEPOSEE, ComplaintStatus.ENREGISTREE,
            ComplaintStatus.CLASSIFIEE, ComplaintStatus.AFFECTEE,
            ComplaintStatus.EN_INSTRUCTION, ComplaintStatus.ESCALADEE,
            ComplaintStatus.CONTESTEE
        ]

        # Optimization: Use conditional aggregation to fetch multiple counts in a single query
        counts = qs.aggregate(
            total=Count('id'),
            open_count=Count('id', filter=Q(status__in=open_statuses)),
            resolved=Count('id', filter=Q(status=ComplaintStatus.RESOLUE)),
            overdue=Count('id', filter=Q(is_overdue=True))
        )
        total = counts['total']
        open_count = counts['open_count']
        resolved = counts['resolved']
        overdue = counts['overdue']

        # Optimization: Calculate average resolution time in the database
        avg_resolution_data = qs.filter(resolved_at__isnull=False).aggregate(
            avg_time=Avg(F('resolved_at') - F('created_at'))
        )
        avg_resolution_td = avg_resolution_data['avg_time']
        if avg_resolution_td:
            avg_resolution = round(avg_resolution_td.total_seconds() / 3600, 1)
        else:
            avg_resolution = 0

        # Satisfaction average
        satisfaction_avg = SatisfactionSurvey.objects.aggregate(avg=Avg('rating'))['avg'] or 0

        # By status
        by_status = dict(qs.values_list('status').annotate(count=Count('id')).values_list('status', 'count'))

        # By priority
        by_priority = dict(qs.values_list('priority').annotate(count=Count('id')).values_list('priority', 'count'))

        # By category (top 8)
        by_category = list(
            qs.filter(category__isnull=False)
            .values('category__name')
            .annotate(count=Count('id'))
            .order_by('-count')[:8]
        )

        # By month (last 12 months)
        by_month = list(
            qs.filter(created_at__gte=now - timedelta(days=365))
            .annotate(month=TruncMonth('created_at'))
            .values('month')
            .annotate(count=Count('id'))
            .order_by('month')
        )
        # Serialize months
        by_month = [{'month': m['month'].strftime('%Y-%m'), 'count': m['count']} for m in by_month]

        # By channel
        by_channel = dict(qs.values_list('channel').annotate(count=Count('id')).values_list('channel', 'count'))

        # By establishment (top 10)
        by_establishment = list(
            qs.filter(establishment__isnull=False)
            .values('establishment__name')
            .annotate(count=Count('id'))
            .order_by('-count')[:10]
        )

        # Optimization: Use select_related to avoid N+1 queries in Recent complaints
        recent_qs = qs.select_related('category', 'establishment', 'assigned_to')[:5]
        recent = ComplaintListSerializer(recent_qs, many=True).data

        return Response({
            'total_complaints': total,
            'open_complaints': open_count,
            'resolved_complaints': resolved,
            'overdue_complaints': overdue,
            'avg_resolution_time': avg_resolution,
            'satisfaction_avg': round(satisfaction_avg, 1),
            'complaints_by_status': by_status,
            'complaints_by_priority': by_priority,
            'complaints_by_category': by_category,
            'complaints_by_month': by_month,
            'complaints_by_channel': by_channel,
            'complaints_by_establishment': by_establishment,
            'recent_complaints': recent,
        })


class SatisfactionCreateView(generics.CreateAPIView):
    """Soumettre une enquête de satisfaction"""
    serializer_class = SatisfactionSurveySerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class SatisfactionListView(generics.ListAPIView):
    """Liste des enquêtes de satisfaction"""
    serializer_class = SatisfactionSurveySerializer
    permission_classes = [permissions.IsAuthenticated]
    queryset = SatisfactionSurvey.objects.all()


class PublicStatsView(APIView):
    """Statistiques publiques pour la landing page"""
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        total = Complaint.objects.count()
        resolved = Complaint.objects.filter(status__in=[
            ComplaintStatus.RESOLUE, ComplaintStatus.CLOTURE_PROVISOIRE,
            ComplaintStatus.CLOTURE_DEFINITIVE
        ]).count()
        satisfaction = SatisfactionSurvey.objects.aggregate(avg=Avg('rating'))['avg'] or 0

        return Response({
            'total_complaints': total,
            'resolved_complaints': resolved,
            'resolution_rate': round((resolved / total * 100) if total > 0 else 0, 1),
            'satisfaction_avg': round(satisfaction, 1),
        })
