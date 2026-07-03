from rest_framework import serializers

from .models import AuditLog


class AuditLogSerializer(serializers.ModelSerializer):
    event_type_display = serializers.CharField(source='get_event_type_display', read_only=True)
    actor_name = serializers.SerializerMethodField()

    class Meta:
        model = AuditLog
        fields = [
            'id', 'sequence', 'event_type', 'event_type_display', 'action',
            'actor', 'actor_role', 'actor_label', 'actor_name',
            'resource_type', 'resource_id', 'resource_label',
            'old_value', 'new_value', 'metadata',
            'ip_address', 'user_agent', 'prev_hash', 'entry_hash', 'created_at',
        ]
        read_only_fields = fields

    def get_actor_name(self, obj):
        return obj.actor_label or (obj.actor.full_name if obj.actor else '')
