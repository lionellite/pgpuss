from rest_framework import serializers
from .models import PlatformReport


class PlatformReportSerializer(serializers.ModelSerializer):
    reporter_name_display = serializers.SerializerMethodField()
    category_display = serializers.CharField(source='get_category_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = PlatformReport
        fields = [
            'id', 'reporter', 'reporter_name_display',
            'reporter_name', 'reporter_email', 'reporter_phone',
            'category', 'category_display',
            'title', 'description',
            'page_url', 'device_info',
            'status', 'status_display',
            'admin_notes',
            'resolved_at', 'resolved_by',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'reporter', 'status', 'admin_notes',
                            'resolved_at', 'resolved_by', 'created_at', 'updated_at']

    def get_reporter_name_display(self, obj):
        if obj.reporter:
            return obj.reporter.full_name
        return obj.reporter_name or 'Anonyme'


class PlatformReportCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = PlatformReport
        fields = [
            'category', 'title', 'description',
            'page_url', 'device_info',
            'reporter_name', 'reporter_email', 'reporter_phone',
        ]


class PlatformReportAdminSerializer(serializers.ModelSerializer):
    """Serializer admin : mise à jour statut + notes."""
    class Meta:
        model = PlatformReport
        fields = ['status', 'admin_notes']
