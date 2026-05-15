from rest_framework import serializers
from .models import Notification


class NotificationSerializer(serializers.ModelSerializer):
    complaint_ticket = serializers.CharField(source='complaint.ticket_number', read_only=True, default=None)

    class Meta:
        model = Notification
        fields = ['id', 'user', 'complaint', 'complaint_ticket', 'type', 'title', 'message', 'is_read', 'created_at']
        read_only_fields = ['id', 'created_at']
