from rest_framework import generics, permissions
from .models import Region, ZoneSanitaire, Establishment, Service, EstablishmentOperationalStatus
from .serializers import (
    RegionSerializer, ZoneSanitaireSerializer, EstablishmentSerializer,
    EstablishmentListSerializer, ServiceSerializer
)


class RegionListView(generics.ListAPIView):
    queryset = Region.objects.all()
    serializer_class = RegionSerializer
    permission_classes = [permissions.AllowAny]


class ZoneSanitaireListView(generics.ListAPIView):
    """Liste des zones sanitaires, filtrable par région/département."""
    serializer_class = ZoneSanitaireSerializer
    permission_classes = [permissions.AllowAny]
    filterset_fields = ['region', 'is_active']
    search_fields = ['name', 'communes']

    def get_queryset(self):
        return ZoneSanitaire.objects.filter(is_active=True).select_related('region')


class EstablishmentListView(generics.ListAPIView):
    queryset = Establishment.objects.filter(
        is_active=True,
        operational_status=EstablishmentOperationalStatus.OPERATIONAL,
    )
    serializer_class = EstablishmentListSerializer
    permission_classes = [permissions.AllowAny]
    filterset_fields = ['type', 'region']
    search_fields = ['name', 'address']


class EstablishmentDetailView(generics.RetrieveAPIView):
    queryset = Establishment.objects.all()
    serializer_class = EstablishmentSerializer
    permission_classes = [permissions.AllowAny]


class ServiceListView(generics.ListAPIView):
    serializer_class = ServiceSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        q = Service.objects.filter(
            is_active=True,
            operational_status=EstablishmentOperationalStatus.OPERATIONAL,
        )
        establishment_id = self.kwargs.get('establishment_id')
        if establishment_id:
            return q.filter(establishment_id=establishment_id)
        return q
