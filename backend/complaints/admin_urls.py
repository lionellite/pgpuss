from django.urls import path

from .admin_views import (
    AdminPriorityLevelListCreateView,
    AdminPriorityLevelDetailView,
    AdminRolePermissionListCreateView,
    AdminRolePermissionDetailView,
)

urlpatterns = [
    path("priority-levels/", AdminPriorityLevelListCreateView.as_view(), name="admin_priority_levels"),
    path("priority-levels/<uuid:pk>/", AdminPriorityLevelDetailView.as_view(), name="admin_priority_level_detail"),
    path("role-permissions/", AdminRolePermissionListCreateView.as_view(), name="admin_role_permissions"),
    path("role-permissions/<uuid:pk>/", AdminRolePermissionDetailView.as_view(), name="admin_role_permission_detail"),
]
