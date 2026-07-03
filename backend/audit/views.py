from django_filters import rest_framework as filters
from rest_framework import generics, permissions
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import AuditLog
from .permissions import IsAuditReader
from .serializers import AuditLogSerializer


class AuditLogFilter(filters.FilterSet):
    event_type = filters.CharFilter(field_name='event_type')
    action = filters.CharFilter(field_name='action', lookup_expr='icontains')
    actor_role = filters.CharFilter(field_name='actor_role')
    resource_type = filters.CharFilter(field_name='resource_type')
    resource_id = filters.CharFilter(field_name='resource_id')
    resource_label = filters.CharFilter(field_name='resource_label', lookup_expr='icontains')
    created_after = filters.DateTimeFilter(field_name='created_at', lookup_expr='gte')
    created_before = filters.DateTimeFilter(field_name='created_at', lookup_expr='lte')

    class Meta:
        model = AuditLog
        fields = [
            'event_type', 'action', 'actor_role', 'resource_type',
            'resource_id', 'resource_label', 'created_after', 'created_before',
        ]


class AuditLogListView(generics.ListAPIView):
    """Journal d'audit immuable — lecture seule (admin + ministère)."""
    serializer_class = AuditLogSerializer
    permission_classes = [permissions.IsAuthenticated, IsAuditReader]
    filterset_class = AuditLogFilter
    search_fields = ['action', 'actor_label', 'resource_label', 'resource_id']
    ordering_fields = ['sequence', 'created_at', 'event_type', 'action']
    ordering = ['-sequence']

    def get_queryset(self):
        return AuditLog.objects.select_related('actor').all()


class AuditLogDetailView(generics.RetrieveAPIView):
    serializer_class = AuditLogSerializer
    permission_classes = [permissions.IsAuthenticated, IsAuditReader]
    queryset = AuditLog.objects.select_related('actor').all()


class AuditChainVerifyView(APIView):
    """Vérifie l'intégrité de la chaîne de hachage du journal."""
    permission_classes = [permissions.IsAuthenticated, IsAuditReader]

    def get(self, request):
        limit = request.query_params.get('limit')
        limit_int = int(limit) if limit and limit.isdigit() else None
        result = AuditLog.verify_chain(limit=limit_int)
        return Response(result)
