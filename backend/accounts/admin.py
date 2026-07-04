from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ['email', 'first_name', 'last_name', 'role', 'establishment', 'zone_sanitaire', 'is_active', 'created_at']
    list_filter = ['role', 'is_active', 'created_at']
    search_fields = ['email', 'phone', 'first_name', 'last_name']
    ordering = ['-created_at']
    autocomplete_fields = ['establishment']
    fieldsets = (
        (None, {'fields': ('email', 'phone', 'password')}),
        ('Informations personnelles', {'fields': ('first_name', 'last_name', 'avatar')}),
        ('Rôle et affectation', {
            'fields': ('role', 'establishment', 'zone_sanitaire', 'departement', 'language_pref'),
            'description': (
                'PFE → sélectionner un établissement. '
                'PFZS → sélectionner une zone sanitaire. '
                'DDS → saisir le département.'
            ),
        }),
        ('Accès et sécurité', {
            'fields': ('must_change_password',),
        }),
        ('Permissions', {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
    )
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'phone', 'first_name', 'last_name', 'role',
                       'establishment', 'zone_sanitaire', 'departement',
                       'password1', 'password2'),
        }),
    )
