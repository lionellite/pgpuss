"""
Vues dédiées au Call Center (136) pour le traitement des plaintes sociales.

Flux :
 1. Un usager envoie un message WhatsApp ou Facebook contenant le mot « PLAINTE ».
 2. Le webhook social crée une Complaint avec :
       - status = SOUMISE
       - pending_call_center_completion = True
       - social_raw_message = message brut
       - social_source = 'whatsapp' | 'facebook' | ...
 3. L'agent call center (AGENT_CALL_CENTER) :
       a. Liste les plaintes sociales en attente  → GET  /complaints/callcenter/social-inbox/
       b. Consulte le détail (message brut + audio) → GET  /complaints/callcenter/social-inbox/<pk>/
       c. Finalise la plainte en complétant les    → POST /complaints/callcenter/social-inbox/<pk>/complete/
          champs manquants (établissement, catégorie, titre, description, etc.)
 4. Après complétion :
       - pending_call_center_completion → False
       - call_center_completed_at      → now()
       - call_center_agent             → request.user
       - channel                       → CALL_CENTER  (puisque le call center a complété)
       - Un historique est créé.
"""
from __future__ import annotations

from django.utils import timezone
from rest_framework import generics, permissions, serializers, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404

from accounts.models import UserRole
from establishments.models import Establishment
from .models import (
    Category,
    Complaint,
    ComplaintChannel,
    ComplaintHistory,
    ComplaintStatus,
)
from .serializers import ComplaintDetailSerializer


# ---------------------------------------------------------------------------
# Permission helpers
# ---------------------------------------------------------------------------

class IsCallCenterAgent(permissions.BasePermission):
    """Réservé aux agents call center et aux admins plateforme."""
    message = "Accès réservé aux agents Call Center (136) et aux administrateurs."

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        return request.user.role in (
            UserRole.AGENT_CALL_CENTER,
            UserRole.ADMIN_PLATEFORME,
        )


# ---------------------------------------------------------------------------
# Serializers locaux
# ---------------------------------------------------------------------------

class SocialComplaintInboxSerializer(serializers.ModelSerializer):
    """Version allégée pour la liste des plaintes sociales en attente."""
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    channel_display = serializers.CharField(source='get_channel_display', read_only=True)
    voice_file_url = serializers.SerializerMethodField()

    class Meta:
        model = Complaint
        fields = [
            'id', 'ticket_number', 'title', 'status', 'status_display',
            'channel', 'channel_display',
            'social_source', 'social_sender_id', 'social_raw_message',
            'complainant_name', 'complainant_phone',
            'pending_call_center_completion',
            'created_at', 'updated_at',
            'voice_file_url',
        ]

    def get_voice_file_url(self, obj):
        stored = (getattr(obj, 'voice_media_url', None) or '').strip()
        if stored:
            return stored
        if not obj.voice_file:
            return None
        url = obj.voice_file.url
        try:
            if 'res.cloudinary.com' in url and '/upload/' in url and not url.lower().endswith('.mp3'):
                url = url.replace('/upload/', '/upload/f_mp3/', 1)
        except Exception:
            pass
        request = self.context.get('request')
        if url.startswith(('http://', 'https://')):
            return url
        if request:
            return request.build_absolute_uri(url)
        return url


class SocialComplaintCompleteSerializer(serializers.Serializer):
    """
    Données envoyées par l'agent call center pour compléter une plainte sociale.
    Tous les champs sont optionnels sauf 'establishment' OU 'establishment_name_manual'
    et 'category', qui deviennent obligatoires à la finalisation.
    """
    # Identification de l'établissement
    establishment = serializers.PrimaryKeyRelatedField(
        queryset=Establishment.objects.all(),
        required=False,
        allow_null=True,
    )
    establishment_name_manual = serializers.CharField(
        required=False, allow_blank=True, default='',
    )
    establishment_address_manual = serializers.CharField(
        required=False, allow_blank=True, default='',
    )

    # Classification
    category = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(),
        required=False,
        allow_null=True,
    )
    subcategory = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(),
        required=False,
        allow_null=True,
    )
    priority = serializers.ChoiceField(
        choices=[('P1', 'P1'), ('P2', 'P2'), ('P3', 'P3'), ('P4', 'P4'), ('P5', 'P5')],
        required=False,
    )

    # Contenu
    title = serializers.CharField(required=False, allow_blank=True, max_length=300)
    description = serializers.CharField(required=False, allow_blank=True)

    # Identité plaignant
    complainant_name = serializers.CharField(required=False, allow_blank=True, max_length=200)
    complainant_phone = serializers.CharField(required=False, allow_blank=True, max_length=20)
    complainant_email = serializers.EmailField(required=False, allow_blank=True)

    # Notes internes de l'agent
    agent_notes = serializers.CharField(required=False, allow_blank=True)

    def validate(self, attrs):
        establishment = attrs.get('establishment')
        manual_name = (attrs.get('establishment_name_manual') or '').strip()

        if establishment and manual_name:
            raise serializers.ValidationError(
                'Indiquez soit un établissement de la liste, soit un nom manuel, pas les deux.'
            )
        if not establishment and not manual_name:
            raise serializers.ValidationError(
                {'establishment': "Sélectionnez un établissement ou saisissez son nom."}
            )

        if not attrs.get('category'):
            raise serializers.ValidationError(
                {'category': 'Sélectionnez un type de plainte.'}
            )

        attrs['establishment_name_manual'] = manual_name
        if manual_name:
            attrs['establishment'] = None

        return attrs


# ---------------------------------------------------------------------------
# Vues
# ---------------------------------------------------------------------------

class SocialComplaintInboxView(generics.ListAPIView):
    """
    GET /complaints/callcenter/social-inbox/

    Retourne les plaintes reçues via WhatsApp ou Facebook
    qui sont en attente de complétion par un agent call center.

    Query params :
      ?completed=true  → inclure aussi les plaintes déjà complétées (défaut : false)
      ?source=whatsapp | facebook  → filtrer par canal social
    """
    serializer_class = SocialComplaintInboxSerializer
    permission_classes = [permissions.IsAuthenticated, IsCallCenterAgent]

    def get_queryset(self):
        qs = Complaint.objects.filter(
            channel=ComplaintChannel.CHATBOT,
        ).select_related('category', 'establishment', 'call_center_agent')

        include_completed = self.request.query_params.get('completed', 'false').lower() == 'true'
        if not include_completed:
            qs = qs.filter(pending_call_center_completion=True)

        source = self.request.query_params.get('source', '').strip().lower()
        if source:
            qs = qs.filter(social_source__icontains=source)

        ordering = self.request.query_params.get('ordering', '-created_at')
        allowed = {'created_at', '-created_at', 'updated_at', '-updated_at'}
        if ordering not in allowed:
            ordering = '-created_at'
        return qs.order_by(ordering)


class SocialComplaintDetailView(APIView):
    """
    GET /complaints/callcenter/social-inbox/<pk>/

    Retourne le détail complet d'une plainte sociale en attente,
    y compris le message brut et l'URL audio si disponible.
    """
    permission_classes = [permissions.IsAuthenticated, IsCallCenterAgent]

    def get(self, request, pk):
        complaint = get_object_or_404(
            Complaint.objects.select_related(
                'category', 'subcategory', 'establishment', 'service',
                'assigned_to', 'complainant', 'call_center_agent',
            ).prefetch_related('attachments', 'history'),
            pk=pk,
            channel=ComplaintChannel.CHATBOT,
        )
        serializer = ComplaintDetailSerializer(complaint, context={'request': request})
        data = serializer.data

        # Enrichir avec les champs sociaux spécifiques
        data['social_raw_message'] = complaint.social_raw_message
        data['social_source'] = complaint.social_source
        data['social_sender_id'] = complaint.social_sender_id
        data['pending_call_center_completion'] = complaint.pending_call_center_completion
        data['call_center_completed_at'] = (
            complaint.call_center_completed_at.isoformat()
            if complaint.call_center_completed_at else None
        )
        return Response(data)


class SocialComplaintCompleteView(APIView):
    """
    POST /complaints/callcenter/social-inbox/<pk>/complete/

    L'agent call center écoute le message, remplit les champs manquants
    (établissement, catégorie, description...) et finalise la soumission.

    Après cette action :
      - pending_call_center_completion → False
      - call_center_completed_at      → now()
      - call_center_agent             → agent connecté
      - channel                       → CALL_CENTER
      - Un événement d'historique est créé.
    """
    permission_classes = [permissions.IsAuthenticated, IsCallCenterAgent]

    def post(self, request, pk):
        complaint = get_object_or_404(
            Complaint,
            pk=pk,
            channel=ComplaintChannel.CHATBOT,
        )

        if not complaint.pending_call_center_completion:
            return Response(
                {'error': 'Cette plainte a déjà été complétée par le call center.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = SocialComplaintCompleteSerializer(
            data=request.data,
            context={'request': request},
        )
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        # --- Mise à jour des champs ---
        update_fields = [
            'pending_call_center_completion',
            'call_center_completed_at',
            'call_center_agent',
            'channel',
        ]

        complaint.pending_call_center_completion = False
        complaint.call_center_completed_at = timezone.now()
        complaint.call_center_agent = request.user
        complaint.channel = ComplaintChannel.CALL_CENTER

        # Établissement
        if data.get('establishment'):
            complaint.establishment = data['establishment']
            complaint.establishment_name_manual = ''
            update_fields += ['establishment', 'establishment_name_manual']
        elif data.get('establishment_name_manual'):
            complaint.establishment = None
            complaint.establishment_name_manual = data['establishment_name_manual']
            complaint.establishment_address_manual = data.get('establishment_address_manual', '')
            update_fields += ['establishment', 'establishment_name_manual', 'establishment_address_manual']

        # Classification
        if data.get('category'):
            complaint.category = data['category']
            update_fields.append('category')
        if data.get('subcategory'):
            complaint.subcategory = data['subcategory']
            update_fields.append('subcategory')
        if data.get('priority'):
            complaint.priority = data['priority']
            update_fields.append('priority')

        # Contenu
        if data.get('title', '').strip():
            complaint.title = data['title'].strip()
            update_fields.append('title')
        if data.get('description', '').strip():
            complaint.description = data['description'].strip()
            update_fields.append('description')

        # Identité
        if data.get('complainant_name', '').strip():
            complaint.complainant_name = data['complainant_name'].strip()
            update_fields.append('complainant_name')
        if data.get('complainant_phone', '').strip():
            complaint.complainant_phone = data['complainant_phone'].strip()
            update_fields.append('complainant_phone')
        if data.get('complainant_email', '').strip():
            complaint.complainant_email = data['complainant_email'].strip()
            update_fields.append('complainant_email')

        # Recalcul NLP si catégorie pas encore définie
        if not complaint.category_id:
            complaint.perform_nlp_analysis()
            update_fields += ['category', 'priority', 'deadline']

        complaint.save(update_fields=list(set(update_fields)))

        # Historique
        agent_notes = data.get('agent_notes', '').strip()
        ComplaintHistory.objects.create(
            complaint=complaint,
            action='Complétion call center (plainte sociale)',
            old_status=ComplaintStatus.SOUMISE,
            new_status=complaint.status,
            actor=request.user,
            notes=(
                f"L'agent call center {request.user.full_name} a complété la plainte "
                f"reçue via {complaint.social_source or 'chatbot social'} "
                f"(expéditeur : {complaint.social_sender_id or 'inconnu'})."
                + (f"\n\nNotes : {agent_notes}" if agent_notes else '')
            ),
        )

        return Response(
            {
                'message': 'Plainte sociale complétée avec succès.',
                'ticket_number': complaint.ticket_number,
                'complaint_id': str(complaint.id),
                'call_center_completed_at': complaint.call_center_completed_at.isoformat(),
            },
            status=status.HTTP_200_OK,
        )
