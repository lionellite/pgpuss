from rest_framework import serializers
from .models import SatisfactionSurvey


class SatisfactionSurveySerializer(serializers.ModelSerializer):
    complaint_ticket = serializers.CharField(source='complaint.ticket_number', read_only=True)

    class Meta:
        model = SatisfactionSurvey
        fields = ['id', 'complaint', 'complaint_ticket', 'user', 'rating', 'nps_score', 'comment', 'created_at']
        read_only_fields = ['id', 'created_at']


class DashboardStatsSerializer(serializers.Serializer):
    total_complaints = serializers.IntegerField()
    open_complaints = serializers.IntegerField()
    resolved_complaints = serializers.IntegerField()
    overdue_complaints = serializers.IntegerField()
    avg_resolution_time = serializers.FloatField()
    satisfaction_avg = serializers.FloatField()
    complaints_by_status = serializers.DictField()
    complaints_by_priority = serializers.DictField()
    complaints_by_category = serializers.ListField()
    complaints_by_month = serializers.ListField()
    complaints_by_channel = serializers.DictField()
    complaints_by_establishment = serializers.ListField()
    recent_complaints = serializers.ListField()
