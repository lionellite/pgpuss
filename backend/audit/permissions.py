from rest_framework import permissions

from accounts.models import UserRole


class IsAuditReader(permissions.BasePermission):
    """Lecture seule du journal : administrateur plateforme et ministère (Cabinet)."""

    message = 'Accès réservé à l\'administrateur plateforme et au ministère.'

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.method not in permissions.SAFE_METHODS:
            return False
        return request.user.role in (UserRole.ADMIN_PLATEFORME, UserRole.CABINET)
