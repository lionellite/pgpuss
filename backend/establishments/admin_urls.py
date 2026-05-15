from django.urls import path
from .admin_views import (
    AdminEstablishmentListCreateView,
    AdminEstablishmentDetailView,
    AdminServiceListCreateView,
    AdminServiceDetailView,
)

urlpatterns = [
    path("", AdminEstablishmentListCreateView.as_view(), name="admin_establishment_list"),
    # Routes plus spécifiques avant `<uuid:pk>/` pour éviter les collisions
    path("<uuid:establishment_id>/services/", AdminServiceListCreateView.as_view(), name="admin_service_list"),
    path("services/<uuid:pk>/", AdminServiceDetailView.as_view(), name="admin_service_detail"),
    path("<uuid:pk>/", AdminEstablishmentDetailView.as_view(), name="admin_establishment_detail"),
]
