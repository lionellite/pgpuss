from rest_framework import permissions

from .roles import is_readonly_role


class DenyReadOnlyOnWrite(permissions.BasePermission):
    """Bloque toute écriture pour le rôle Auditeur (lecture seule)."""

    message = 'Accès lecture seule — rôle auditeur / superviseur.'

    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        user = request.user
        if not user or not user.is_authenticated:
            return False
        return not is_readonly_role(getattr(user, 'role', None))
