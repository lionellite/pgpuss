from rest_framework import serializers
from django.utils import timezone
from .models import (
    Category, Complaint, Attachment, ComplaintHistory,
    Escalation, ComplaintStatus
)


class CategorySerializer(serializers.ModelSerializer):
    subcategories = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = ['id', 'name', 'parent', 'icon', 'description', 'order', 'subcategories']

    def get_subcategories(self, obj):
        if obj.parent is None:
            children = obj.subcategories.all()
            return CategorySerializer(children, many=True).data
        return []


class AttachmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Attachment
        fields = ['id', 'complaint', 'file', 'file_name', 'file_type', 'file_size', 'uploaded_at']
        read_only_fields = ['id', 'uploaded_at', 'file_name', 'file_type', 'file_size']

    def create(self, validated_data):
        f = validated_data.get('file')
        if f:
            validated_data['file_name'] = f.name
            validated_data['file_type'] = f.content_type or ''
            validated_data['file_size'] = f.size
        return super().create(validated_data)


class ComplaintHistorySerializer(serializers.ModelSerializer):
    actor_name = serializers.CharField(source='actor.full_name', read_only=True, default='Système')

    class Meta:
        model = ComplaintHistory
        fields = ['id', 'action', 'old_status', 'new_status', 'actor', 'actor_name', 'notes', 'timestamp']


class EscalationSerializer(serializers.ModelSerializer):
    from_user_name = serializers.CharField(source='from_user.full_name', read_only=True, default=None)
    to_user_name = serializers.CharField(source='to_user.full_name', read_only=True, default=None)

    class Meta:
        model = Escalation
        fields = ['id', 'complaint', 'from_user', 'from_user_name', 'to_user', 'to_user_name', 'reason', 'escalated_at']


class ComplaintCreateSerializer(serializers.ModelSerializer):
    """Serializer pour le dépôt de plainte (usager)"""
    class Meta:
        model = Complaint
        fields = [
            'title', 'description', 'category', 'subcategory',
            'is_anonymous', 'complainant_name', 'complainant_phone',
            'complainant_email', 'establishment', 'service', 'channel'
        ]

    def create(self, validated_data):
        request = self.context.get('request')
        if request and request.user and request.user.is_authenticated:
            validated_data['complainant'] = request.user
        validated_data['status'] = ComplaintStatus.DEPOSEE
        complaint = super().create(validated_data)

        # Perform NLP Analysis (Simulated)
        complaint.perform_nlp_analysis()
        complaint.save()

        # Create history entry
        ComplaintHistory.objects.create(
            complaint=complaint,
            action='Dépôt et classification automatique (IA)',
            new_status=complaint.status,
            actor=complaint.complainant,
            notes=f'Plainte déposée via {complaint.get_channel_display()}. Catégorisée automatiquement.'
        )
        return complaint


class ComplaintListSerializer(serializers.ModelSerializer):
    """Serializer léger pour les listes"""
    category_name = serializers.CharField(source='category.name', read_only=True, default=None)
    establishment_name = serializers.CharField(source='establishment.name', read_only=True, default=None)
    assigned_to_name = serializers.CharField(source='assigned_to.full_name', read_only=True, default=None)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    priority_display = serializers.CharField(source='get_priority_display', read_only=True)
    channel_display = serializers.CharField(source='get_channel_display', read_only=True)
    # Optimization: Use the annotated count if available, otherwise fallback to the subquery
    attachment_count = serializers.IntegerField(source='attachments_count_annotated', read_only=True, default=0)

    class Meta:
        model = Complaint
        fields = [
            'id', 'ticket_number', 'title', 'status', 'status_display',
            'priority', 'priority_display', 'channel', 'channel_display',
            'category_name', 'establishment_name', 'assigned_to_name',
            'is_anonymous', 'is_overdue', 'attachment_count',
            'created_at', 'updated_at', 'deadline'
        ]


class ComplaintDetailSerializer(serializers.ModelSerializer):
    """Serializer complet pour le détail"""
    category_name = serializers.CharField(source='category.name', read_only=True, default=None)
    subcategory_name = serializers.CharField(source='subcategory.name', read_only=True, default=None)
    establishment_name = serializers.CharField(source='establishment.name', read_only=True, default=None)
    service_name = serializers.CharField(source='service.name', read_only=True, default=None)
    assigned_to_name = serializers.CharField(source='assigned_to.full_name', read_only=True, default=None)
    complainant_display = serializers.SerializerMethodField()
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    priority_display = serializers.CharField(source='get_priority_display', read_only=True)
    channel_display = serializers.CharField(source='get_channel_display', read_only=True)
    attachments = AttachmentSerializer(many=True, read_only=True)
    history = ComplaintHistorySerializer(many=True, read_only=True)
    escalations = EscalationSerializer(many=True, read_only=True)

    class Meta:
        model = Complaint
        fields = [
            'id', 'ticket_number', 'title', 'description',
            'category', 'category_name', 'subcategory', 'subcategory_name',
            'priority', 'priority_display', 'status', 'status_display',
            'channel', 'channel_display',
            'is_anonymous', 'complainant', 'complainant_display',
            'complainant_name', 'complainant_phone', 'complainant_email',
            'establishment', 'establishment_name', 'service', 'service_name',
            'assigned_to', 'assigned_to_name',
            'resolution_notes', 'corrective_actions',
            'created_at', 'updated_at', 'registered_at', 'classified_at',
            'assigned_at', 'resolved_at', 'closed_at',
            'deadline', 'is_overdue',
            'attachments', 'history', 'escalations'
        ]

    def get_complainant_display(self, obj):
        if obj.is_anonymous:
            return 'Anonyme'
        if obj.complainant:
            return obj.complainant.full_name
        return obj.complainant_name or 'Non identifié'


class ComplaintActionSerializer(serializers.Serializer):
    """Serializer pour les actions sur une plainte"""
    notes = serializers.CharField(required=False, allow_blank=True)
    assigned_to = serializers.UUIDField(required=False)
    priority = serializers.ChoiceField(choices=[('P1','P1'),('P2','P2'),('P3','P3'),('P4','P4'),('P5','P5')], required=False)
    resolution_notes = serializers.CharField(required=False, allow_blank=True)
    corrective_actions = serializers.CharField(required=False, allow_blank=True)
