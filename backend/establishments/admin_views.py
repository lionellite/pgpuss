from rest_framework import generics, permissions
from django.shortcuts import get_object_or_404

from accounts.models import UserRole
from .models import Establishment, Service
from .serializers import EstablishmentSerializer, ServiceSerializer


class IsAdminPlateforme(permissions.BasePermission):
    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and getattr(request.user, "role", None) == UserRole.ADMIN_PLATEFORME
        )


class AdminEstablishmentListCreateView(generics.ListCreateAPIView):
    queryset = Establishment.objects.select_related("region").prefetch_related("services").order_by("name")
    serializer_class = EstablishmentSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminPlateforme]
    filterset_fields = ["region", "type", "is_active", "operational_status"]
    search_fields = ["name", "address"]


class AdminEstablishmentDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Establishment.objects.select_related("region").prefetch_related("services")
    serializer_class = EstablishmentSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminPlateforme]


class AdminServiceListCreateView(generics.ListCreateAPIView):
    serializer_class = ServiceSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminPlateforme]

    def get_queryset(self):
        est_id = self.kwargs["establishment_id"]
        get_object_or_404(Establishment, pk=est_id)
        return Service.objects.filter(establishment_id=est_id).order_by("name")

    def perform_create(self, serializer):
        serializer.save(establishment_id=self.kwargs["establishment_id"])


class AdminServiceDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Service.objects.select_related("establishment")
    serializer_class = ServiceSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminPlateforme]
