from rest_framework import generics, permissions, status
from rest_framework.response import Response
from django.utils import timezone
from accounts.models import UserRole
from .models import PlatformReport, PlatformReportStatus
from .serializers import (
    PlatformReportSerializer,
    PlatformReportCreateSerializer,
    PlatformReportAdminSerializer,
)


class PlatformReportCreateView(generics.CreateAPIView):
    """
    Soumettre un signalement de dysfonctionnement.
    Accessible à tous (connecté ou non).
    """
    serializer_class = PlatformReportCreateSerializer
    permission_classes = [permissions.AllowAny]

    def perform_create(self, serializer):
        reporter = self.request.user if self.request.user.is_authenticated else None
        serializer.save(reporter=reporter)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        return Response({
            'message': 'Votre signalement a été enregistré. '
                       'L\'équipe technique en prendra connaissance dans les meilleurs délais.',
            'report': PlatformReportSerializer(serializer.instance).data,
        }, status=status.HTTP_201_CREATED)


class PlatformReportListView(generics.ListAPIView):
    """
    Liste des signalements (ADMIN_PLATEFORME uniquement).
    """
    serializer_class = PlatformReportSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['status', 'category']
    search_fields = ['title', 'description', 'reporter_name']
    ordering_fields = ['created_at', 'status']

    def get_queryset(self):
        if self.request.user.role != UserRole.ADMIN_PLATEFORME:
            return PlatformReport.objects.none()
        return PlatformReport.objects.select_related('reporter', 'resolved_by').all()


class PlatformReportDetailView(generics.RetrieveUpdateAPIView):
    """
    Détail et mise à jour d'un signalement (ADMIN_PLATEFORME uniquement).
    PATCH : modifier statut + notes admin.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        if self.request.method in ['PATCH', 'PUT']:
            return PlatformReportAdminSerializer
        return PlatformReportSerializer

    def get_queryset(self):
        if self.request.user.role != UserRole.ADMIN_PLATEFORME:
            return PlatformReport.objects.none()
        return PlatformReport.objects.select_related('reporter', 'resolved_by').all()

    def perform_update(self, serializer):
        data = {}
        new_status = serializer.validated_data.get('status')
        if new_status in [PlatformReportStatus.RESOLU, PlatformReportStatus.FERME]:
            data['resolved_at'] = timezone.now()
            data['resolved_by'] = self.request.user
        serializer.save(**data)
