from django.contrib import admin

from .models import AuditLog


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ('sequence', 'created_at', 'event_type', 'action', 'actor_label', 'resource_label')
    list_filter = ('event_type', 'actor_role', 'resource_type')
    search_fields = ('action', 'actor_label', 'resource_label', 'resource_id', 'entry_hash')
    readonly_fields = (
        'id', 'sequence', 'event_type', 'action', 'actor', 'actor_role', 'actor_label',
        'resource_type', 'resource_id', 'resource_label',
        'old_value', 'new_value', 'metadata', 'ip_address', 'user_agent',
        'prev_hash', 'entry_hash', 'created_at',
    )
    ordering = ('-sequence',)

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False
