from rest_framework import serializers
from django.utils import timezone
from .models import (
    Category, Complaint, Attachment, ComplaintHistory,
    Escalation,     ComplaintStatus, ComplaintDocument,
    PriorityLevel, RoleWorkflowPermission,
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
    """Serializer pour le dépôt de plainte (usager ou agent call center)"""
    class Meta:
        model = Complaint
        fields = [
            'title', 'description', 'category', 'subcategory',
            'is_anonymous', 'complainant_name', 'complainant_phone',
            'complainant_email', 'establishment', 'establishment_name_manual',
            'establishment_address_manual', 'service', 'channel',
        ]

    def validate(self, attrs):
        request = self.context.get('request')
        raw = getattr(request, 'data', {}) if request else {}
        manual_name = (raw.get('establishment_name_manual') or attrs.get('establishment_name_manual') or '').strip()
        manual_address = (raw.get('establishment_address_manual') or attrs.get('establishment_address_manual') or '').strip()
        establishment = attrs.get('establishment')
        if establishment == '':
            attrs['establishment'] = None
            establishment = None

        if establishment and manual_name:
            raise serializers.ValidationError(
                'Indiquez soit un établissement de la liste, soit un nom manuel, pas les deux.'
            )
        if not establishment and not manual_name:
            raise serializers.ValidationError(
                {'establishment': 'Sélectionnez un établissement ou saisissez son nom.'}
            )

        attrs['establishment_name_manual'] = manual_name
        attrs['establishment_address_manual'] = manual_address
        if manual_name:
            attrs['establishment'] = None

        is_anonymous = attrs.get('is_anonymous', False)
        if is_anonymous in (True, 'true', '1', 'True'):
            phone = (attrs.get('complainant_phone') or '').strip()
            if not phone:
                raise serializers.ValidationError(
                    {'complainant_phone': 'Le numéro de téléphone est obligatoire pour un dépôt anonyme.'}
                )

        mode = (raw.get('description_mode') or 'text').strip().lower()
        desc = (attrs.get('description') or '').strip()
        has_voice_in_request = bool(request and request.FILES.get('voice_file'))

        if mode == 'voice':
            if has_voice_in_request and desc and desc != Complaint.VOICE_DESCRIPTION_PLACEHOLDER:
                raise serializers.ValidationError(
                    {'description': 'En mode vocal, ne saisissez pas de description textuelle.'}
                )
            attrs['description'] = Complaint.VOICE_DESCRIPTION_PLACEHOLDER
        else:
            if has_voice_in_request:
                raise serializers.ValidationError(
                    {'description': 'Choisissez soit une description texte, soit un message vocal.'}
                )
            if not desc:
                raise serializers.ValidationError(
                    {'description': 'La description est obligatoire en mode texte.'}
                )
            attrs['description'] = desc

        return attrs

    def create(self, validated_data):
        request = self.context.get('request')
        if request and request.user and request.user.is_authenticated:
            validated_data['complainant'] = request.user
        validated_data['status'] = ComplaintStatus.SOUMISE
        complaint = super().create(validated_data)

        import secrets
        complaint.media_upload_token = secrets.token_urlsafe(32)
        complaint.save(update_fields=['media_upload_token'])

        # NLP léger : saute si catégorie déjà choisie
        complaint.perform_nlp_analysis()
        complaint.save()

        # Create history entry
        ComplaintHistory.objects.create(
            complaint=complaint,
            action='Dépôt de la plainte',
            new_status=complaint.status,
            actor=complaint.complainant,
            notes=f'Plainte déposée via {complaint.get_channel_display()}.'
        )
        return complaint


class ComplaintListSerializer(serializers.ModelSerializer):
    """Serializer léger pour les listes"""
    category_name = serializers.CharField(source='category.name', read_only=True, default=None)
    establishment_name = serializers.CharField(source='establishment.name', read_only=True, default=None)
    assigned_to_name = serializers.CharField(source='assigned_to.full_name', read_only=True, default=None)
    call_center_agent_name = serializers.CharField(source='call_center_agent.full_name', read_only=True, default=None)
    zone_sanitaire_name = serializers.SerializerMethodField()
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
            'call_center_agent_name', 'zone_sanitaire_name',
            'is_anonymous', 'is_overdue', 'attachment_count',
            'created_at', 'updated_at', 'deadline'
        ]

    def get_zone_sanitaire_name(self, obj):
        if obj.establishment and obj.establishment.zone_sanitaire:
            return obj.establishment.zone_sanitaire.name
        return None


class ComplaintDetailSerializer(serializers.ModelSerializer):
    """Serializer complet pour le détail"""
    category_name = serializers.CharField(source='category.name', read_only=True, default=None)
    subcategory_name = serializers.CharField(source='subcategory.name', read_only=True, default=None)
    establishment_name = serializers.CharField(source='establishment.name', read_only=True, default=None)
    service_name = serializers.CharField(source='service.name', read_only=True, default=None)
    assigned_to_name = serializers.CharField(source='assigned_to.full_name', read_only=True, default=None)
    call_center_agent_name = serializers.CharField(source='call_center_agent.full_name', read_only=True, default=None)
    zone_sanitaire_name = serializers.SerializerMethodField()
    complainant_display = serializers.SerializerMethodField()
    voice_file_url = serializers.SerializerMethodField()
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
            'zone_sanitaire_name',
            'assigned_to', 'assigned_to_name',
            'call_center_agent', 'call_center_agent_name',
            'resolution_notes', 'corrective_actions',
            'resolution_accepted', 'resolution_ack_notes', 'resolution_ack_at',
            'resolution_validated', 'resolution_validated_at',
            'voice_file_url',
            'created_at', 'updated_at', 'registered_at', 'classified_at',
            'assigned_at', 'resolved_at', 'closed_at',
            'deadline', 'is_overdue',
            'attachments', 'history', 'escalations'
        ]

    def get_voice_file_url(self, obj):
        if not obj.voice_file:
            return None
        request = self.context.get('request')
        url = obj.voice_file.url
        if request:
            return request.build_absolute_uri(url)
        return url

    def get_complainant_display(self, obj):
        if obj.is_anonymous:
            return 'Anonyme'
        if obj.complainant:
            return obj.complainant.full_name
        return obj.complainant_name or 'Non identifié'

    def get_zone_sanitaire_name(self, obj):
        if obj.establishment and obj.establishment.zone_sanitaire:
            return obj.establishment.zone_sanitaire.name
        return None


class ComplaintActionSerializer(serializers.Serializer):
    """Serializer pour les actions sur une plainte"""
    notes = serializers.CharField(required=False, allow_blank=True)
    assigned_to = serializers.UUIDField(required=False)
    priority = serializers.ChoiceField(choices=[('P1','P1'),('P2','P2'),('P3','P3'),('P4','P4'),('P5','P5')], required=False)
    resolution_notes = serializers.CharField(required=False, allow_blank=True)
    corrective_actions = serializers.CharField(required=False, allow_blank=True)


class ComplaintDocumentSerializer(serializers.ModelSerializer):
    created_by_name = serializers.CharField(source='created_by.full_name', read_only=True, default=None)
    last_edited_by_name = serializers.CharField(source='last_edited_by.full_name', read_only=True, default=None)
    doc_type_display = serializers.CharField(source='get_doc_type_display', read_only=True)
    allowed_roles = serializers.SerializerMethodField()
    is_required = serializers.SerializerMethodField()

    class Meta:
        model = ComplaintDocument
        fields = [
            'id', 'doc_type', 'doc_type_display', 'created_at', 'updated_at',
            'created_by', 'created_by_name', 'last_edited_by', 'last_edited_by_name',
            'payload', 'body', 'status',
            'allowed_roles', 'is_required',
        ]

    def get_allowed_roles(self, obj):
        return obj.payload.get('allowed_roles') or []

    def get_is_required(self, obj):
        return bool(obj.payload.get('is_required'))


class ComplaintDocumentUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = ComplaintDocument
        fields = ['body', 'status']
        extra_kwargs = {
            'status': {'required': False},
        }


class PriorityLevelSerializer(serializers.ModelSerializer):
    class Meta:
        model = PriorityLevel
        fields = ['id', 'code', 'label', 'hours_target', 'order', 'is_active']


class RoleWorkflowPermissionSerializer(serializers.ModelSerializer):
    class Meta:
        model = RoleWorkflowPermission
        fields = ['id', 'role', 'permissions', 'updated_at']
        read_only_fields = ['updated_at']
