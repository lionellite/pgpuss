from rest_framework import generics, permissions

from establishments.admin_views import IsAdminPlateforme
from .models import PriorityLevel, RoleWorkflowPermission
from .serializers import PriorityLevelSerializer, RoleWorkflowPermissionSerializer


class AdminPriorityLevelListCreateView(generics.ListCreateAPIView):
    queryset = PriorityLevel.objects.all().order_by("order", "code")
    serializer_class = PriorityLevelSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminPlateforme]


class AdminPriorityLevelDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = PriorityLevel.objects.all()
    serializer_class = PriorityLevelSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminPlateforme]


class AdminRolePermissionListCreateView(generics.ListCreateAPIView):
    queryset = RoleWorkflowPermission.objects.all().order_by("role")
    serializer_class = RoleWorkflowPermissionSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminPlateforme]


class AdminRolePermissionDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = RoleWorkflowPermission.objects.all()
    serializer_class = RoleWorkflowPermissionSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminPlateforme]
