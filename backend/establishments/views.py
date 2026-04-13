from rest_framework import generics, permissions
from .models import Region, Establishment, Service
from .serializers import (
    RegionSerializer, EstablishmentSerializer,
    EstablishmentListSerializer, ServiceSerializer
)


class RegionListView(generics.ListAPIView):
    queryset = Region.objects.all()
    serializer_class = RegionSerializer
    permission_classes = [permissions.AllowAny]


class EstablishmentListView(generics.ListAPIView):
    queryset = Establishment.objects.filter(is_active=True)
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
        establishment_id = self.kwargs.get('establishment_id')
        if establishment_id:
            return Service.objects.filter(establishment_id=establishment_id, is_active=True)
        return Service.objects.filter(is_active=True)
