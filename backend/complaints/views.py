from rest_framework import generics, permissions, status
from rest_framework.exceptions import PermissionDenied
from rest_framework.parsers import JSONParser, MultiPartParser, FormParser
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.decorators import api_view, permission_classes
from django.conf import settings
from django.utils import timezone
from datetime import timedelta
from django.db.models import Count, Q
from django.shortcuts import get_object_or_404
from django.contrib.auth import get_user_model
from django.views.decorators.cache import cache_page
from django.utils.decorators import method_decorator
from django.utils.crypto import salted_hmac
import secrets
from accounts.models import UserRole
from accounts.roles import (
    filter_complaints_for_user,
    user_can_view_complaint,
    assignable_roles_for_pfe,
    is_readonly_role,
)
from accounts.permissions import DenyReadOnlyOnWrite
from .media_upload import save_attachment, save_voice_file, storage_error_response
from .models import (
    Category, Complaint, Attachment, ComplaintHistory,
    Escalation, ComplaintStatus, ComplaintDocumentType, ComplaintDocument
)
from notifications.utils import notify_user, notify_complaint_contact
from .documents import ensure_singleton_document, generate_document
from .serializers import (
    CategorySerializer, ComplaintCreateSerializer,
    ComplaintListSerializer, ComplaintDetailSerializer,
    AttachmentSerializer, ComplaintHistorySerializer,
    ComplaintActionSerializer, ComplaintDocumentSerializer,
    ComplaintDocumentUpdateSerializer,
)

User = get_user_model()


def user_can_view_complaint_documents(user, complaint) -> bool:
    """Accès lecture aux documents du dossier (même périmètre que la liste)."""
    return user_can_view_complaint(user, complaint)


@method_decorator(cache_page(60 * 5), name='dispatch')
class CategoryListView(generics.ListAPIView):
    """Liste des catégories de plaintes"""
    queryset = Category.objects.filter(parent=None).prefetch_related('subcategories')
    serializer_class = CategorySerializer
    permission_classes = [permissions.AllowAny]


class ComplaintCreateView(generics.CreateAPIView):
    """
    Dépôt d'une nouvelle plainte.
    - Réservé aux USAGERS (avec compte) ou aux visiteurs anonymes.
    - Les agents, PFE, directeurs, etc. ne peuvent PAS déposer de plainte.
    - Si anonyme : téléphone et email entièrement facultatifs.
    """
    serializer_class = ComplaintCreateSerializer
    permission_classes = [permissions.AllowAny]
    parser_classes = [JSONParser, MultiPartParser, FormParser]

    def create(self, request, *args, **kwargs):
        # Bloquer les agents/staff connectés — SAUF les agents call center
        if request.user.is_authenticated and request.user.role not in [
            UserRole.USAGER, UserRole.AGENT_CALL_CENTER
        ]:
            return Response(
                {'error': 'Le dépôt de plainte est réservé aux usagers et aux agents call center.'},
                status=status.HTTP_403_FORBIDDEN
            )

        # Validation anonymat : téléphone et email entièrement facultatifs
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        complaint = serializer.save()

        # Si l'agent call center est connecté, forcer le canal et enregistrer l'agent
        if request.user.is_authenticated and request.user.role == UserRole.AGENT_CALL_CENTER:
            complaint.channel = 'CALL_CENTER'
            complaint.call_center_agent = request.user
            complaint.save(update_fields=['channel', 'call_center_agent'])

        # Médias : en production serverless, envoyer via POST .../deposit-media/ (un fichier à la fois)
        is_json = request.content_type and 'application/json' in request.content_type
        if not is_json and not getattr(settings, 'FAST_COMPLAINT_CREATE', False):
            vf = request.FILES.get('voice_file')
            if vf:
                err = save_voice_file(complaint, vf)
                if err:
                    return err
            for f in request.FILES.getlist('attachments'):
                err = save_attachment(complaint, f)
                if err:
                    return err

        if not getattr(settings, 'FAST_COMPLAINT_CREATE', False):
            ensure_singleton_document(
                complaint=complaint,
                doc_type=ComplaintDocumentType.FICHE_PLAINTE,
                actor=request.user if request.user.is_authenticated else None,
                extra={"document": {"title": "Fiche de plainte"}},
            )

        return Response({
            'message': 'Votre plainte a été enregistrée avec succès.',
            'ticket_number': complaint.ticket_number,
            'complaint_id': str(complaint.id),
            'upload_token': complaint.media_upload_token,
            'complaint': ComplaintListSerializer(complaint).data,
        }, status=status.HTTP_201_CREATED)


class ComplaintDepositMediaView(APIView):
    """
    Envoi des médias après création JSON (contourne la limite Vercel ~4,5 Mo).
    Header : X-Upload-Token: <upload_token> renvoyé à la création.
    Un seul fichier par requête : voice_file OU attachment.
    """
    permission_classes = [permissions.AllowAny]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request, pk):
        complaint = get_object_or_404(Complaint, pk=pk)
        token = (request.headers.get('X-Upload-Token') or request.data.get('upload_token') or '').strip()
        if not token or token != complaint.media_upload_token:
            return Response(
                {'error': 'Jeton de téléversement invalide ou expiré.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        vf = request.FILES.get('voice_file')
        att = request.FILES.get('attachment')
        if vf and att:
            return Response(
                {'error': 'Envoyez un seul fichier par requête (vocal ou pièce jointe).'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if not vf and not att:
            return Response(
                {'error': 'Fichier manquant (voice_file ou attachment).'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            if vf:
                err = save_voice_file(complaint, vf)
            else:
                err = save_attachment(complaint, att)
            if err:
                return err
        except Exception as exc:
            return storage_error_response(exc)

        return Response({
            'message': 'Fichier enregistré.',
            'has_voice': bool(complaint.voice_file),
            'attachment_count': complaint.attachments.count(),
        })


class StorageHealthView(APIView):
    """
    Diagnostic simple de stockage (utile pour vérifier Cloudinary sur Vercel).
    Ne fait aucun upload, retourne seulement la présence de la configuration.
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        import os
        from django.conf import settings
        configured = bool(getattr(settings, 'CLOUDINARY_URL', '').strip() or os.environ.get('CLOUDINARY_URL', '').strip())
        return Response({
            'cloudinary_configured': configured,
            'fast_complaint_create': bool(getattr(settings, 'FAST_COMPLAINT_CREATE', False)),
            'max_upload_bytes': int(getattr(settings, 'VERCEL_MAX_UPLOAD_BYTES', 4 * 1024 * 1024)),
        })


class ComplaintListView(generics.ListAPIView):
    """
    Liste des plaintes filtrée selon le rôle :
    - USAGER : ses propres plaintes
    - PFE / DIRECTEUR_EST : plaintes de leur établissement
    - DDS : plaintes de leur zone/département (par défaut : escaladées)
    - DQSS / CABINET : toutes (par défaut : escaladées à leur niveau)
    - ADMIN : tout sans filtre
    Paramètre ?scope=all pour les rôles supérieurs pour voir TOUTES les plaintes
    de leur périmètre, pas seulement les escaladées.
    """
    serializer_class = ComplaintListSerializer
    permission_classes = [permissions.IsAuthenticated, DenyReadOnlyOnWrite]
    filterset_fields = ['status', 'priority', 'category', 'establishment', 'channel', 'is_anonymous']
    search_fields = ['ticket_number', 'title', 'description']
    ordering_fields = ['created_at', 'updated_at', 'priority', 'status', 'ticket_number']
    ordering = ['-created_at']

    def get_queryset(self):
        qs = filter_complaints_for_user(self.request.user, Complaint.objects.all())
        return qs.select_related(
            'category', 'establishment', 'assigned_to'
        ).annotate(
            attachments_count_annotated=Count('attachments')
        )


class ComplaintDetailView(generics.RetrieveUpdateAPIView):
    """Détail d'une plainte"""
    serializer_class = ComplaintDetailSerializer
    permission_classes = [permissions.IsAuthenticated, DenyReadOnlyOnWrite]

    def get_queryset(self):
        return Complaint.objects.select_related(
            'category', 'subcategory', 'establishment', 'service',
            'assigned_to', 'complainant'
        ).prefetch_related('attachments', 'history', 'escalations')

    def get_object(self):
        obj = super().get_object()
        if not user_can_view_complaint(self.request.user, obj):
            raise PermissionDenied('Vous n\'avez pas accès à ce dossier.')
        return obj

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context


class ComplaintTrackView(APIView):
    """Suivi d'une plainte par numéro de ticket (public)"""
    permission_classes = [permissions.AllowAny]

    def get(self, request, ticket_number):
        complaint = get_object_or_404(Complaint, ticket_number=ticket_number.upper())
        if complaint.establishment:
            establishment_name = complaint.establishment.name
        elif complaint.establishment_name_manual:
            establishment_name = complaint.establishment_name_manual
        else:
            establishment_name = None
        # Return limited info for public tracking
        data = {
            'ticket_number': complaint.ticket_number,
            'title': complaint.title,
            'description': complaint.description,
            'status': complaint.status,
            'status_display': complaint.get_status_display(),
            'priority': complaint.priority,
            'priority_display': complaint.get_priority_display(),
            'category_name': complaint.category.name if complaint.category else None,
            'created_at': complaint.created_at,
            'updated_at': complaint.updated_at,
            'info_request_open': complaint.info_request_open,
            'info_request_notes': complaint.info_request_notes if complaint.info_request_open else "",
            'needs_call_center_assistance': complaint.needs_call_center_assistance,
            'establishment_name': establishment_name,
            'establishment_address': (
                complaint.establishment.address if complaint.establishment
                else complaint.establishment_address_manual or None
            ),
            'timeline': [
                {
                    'action': h.action,
                    'status': h.new_status,
                    'timestamp': h.timestamp,
                    'notes': h.notes if not complaint.is_anonymous else ''
                }
                for h in complaint.history.all().order_by('timestamp')
            ]
        }
        return Response(data)


def _hash_public_code(code: str) -> str:
    return salted_hmac("complaint-public-access", code).hexdigest()


def _generate_public_code() -> str:
    return f"{secrets.randbelow(1000000):06d}"


class ComplaintAcknowledgeView(APIView):
    """Accuser réception d'une plainte (Action PFE)"""
    permission_classes = [permissions.IsAuthenticated, DenyReadOnlyOnWrite]

    def post(self, request, pk):
        complaint = get_object_or_404(Complaint, pk=pk)
        if request.user.role != UserRole.PFE:
             return Response({'error': "Action réservée au Point Focal Établissement."}, status=403)
        if complaint.status != ComplaintStatus.SOUMISE:
            return Response({'error': "Seules les plaintes SOUMISES peuvent être accusées réception."}, status=400)

        old_status = complaint.status
        complaint.status = ComplaintStatus.ACCUSEE
        complaint.registered_at = timezone.now()
        complaint.save()

        ComplaintHistory.objects.create(
            complaint=complaint, action='Accusé de réception',
            old_status=old_status, new_status=ComplaintStatus.ACCUSEE, actor=request.user
        )
        # Document: récépissé
        ensure_singleton_document(
            complaint=complaint,
            doc_type=ComplaintDocumentType.RECEPISSE_ACCUSATION,
            actor=request.user,
            extra={"document": {"title": "Récépissé accusé de réception", "delay_target_hours": 48}},
        )
        return Response({'message': 'Accusé de réception envoyé.'})


class ComplaintQualifyView(APIView):
    """Qualifier / Catégoriser une plainte (Action PFE)"""
    permission_classes = [permissions.IsAuthenticated, DenyReadOnlyOnWrite]

    def post(self, request, pk):
        complaint = get_object_or_404(Complaint, pk=pk)
        if request.user.role != UserRole.PFE:
             return Response({'error': "Action réservée au PFE."}, status=403)
        if complaint.status != ComplaintStatus.ACCUSEE:
            return Response({'error': "La plainte doit être ACCUSÉE avant qualification."}, status=400)

        serializer = ComplaintActionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        old_status = complaint.status
        complaint.status = ComplaintStatus.INSTRUITE
        if serializer.validated_data.get('priority'):
            complaint.priority = serializer.validated_data['priority']
        complaint.classified_at = timezone.now()
        complaint.save()

        ComplaintHistory.objects.create(
            complaint=complaint, action='Plainte qualifiée / instruite',
            old_status=old_status, new_status=ComplaintStatus.INSTRUITE,
            actor=request.user, notes=request.data.get('notes', '')
        )
        # Document: fiche qualification
        ensure_singleton_document(
            complaint=complaint,
            doc_type=ComplaintDocumentType.FICHE_QUALIFICATION,
            actor=request.user,
            extra={
                "document": {
                    "title": "Fiche de qualification",
                    "category": getattr(complaint.category, "name", None),
                    "priority": complaint.priority,
                    "deadline_target": complaint.deadline.isoformat() if complaint.deadline else None,
                }
            },
        )
        return Response({'message': 'Plainte qualifiée.'})


class ComplaintAssignView(APIView):
    """Affecter une plainte à un agent interne ou PNUSS établissement (Action PFE)"""
    permission_classes = [permissions.IsAuthenticated, DenyReadOnlyOnWrite]

    def post(self, request, pk):
        complaint = get_object_or_404(Complaint, pk=pk)
        if request.user.role != UserRole.PFE:
             return Response({'error': "Seul le PFE peut affecter une plainte."}, status=403)
        if complaint.status != ComplaintStatus.INSTRUITE:
            return Response({'error': "La plainte doit être INSTRUITE avant affectation."}, status=400)

        serializer = ComplaintActionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        assigned_to_id = serializer.validated_data.get('assigned_to')
        if assigned_to_id:
            agent = get_object_or_404(User, pk=assigned_to_id)
            allowed_roles = assignable_roles_for_pfe()
            if agent.role not in allowed_roles:
                return Response({
                    'error': "Affectation possible uniquement vers un agent interne ou un représentant PNUSS."
                }, status=400)
            est_id = complaint.establishment_id or request.user.establishment_id
            if est_id and agent.establishment_id and agent.establishment_id != est_id:
                return Response({'error': "La personne affectée doit appartenir au même établissement."}, status=400)
            if agent.role == UserRole.PNUSS and agent.establishment_id and est_id and agent.establishment_id != est_id:
                return Response({'error': "Le représentant PNUSS doit être rattaché à cet établissement."}, status=400)
            label = 'Agent interne' if agent.role == UserRole.AGENT_INTERNE else 'Médiation PNUSS'
            old_status = complaint.status
            complaint.assigned_to = agent
            complaint.status = ComplaintStatus.AFFECTEE
            complaint.assigned_at = timezone.now()
            complaint.save()

            ComplaintHistory.objects.create(
                complaint=complaint, action=f'Affectée ({label}) à {agent.full_name}',
                old_status=old_status, new_status=ComplaintStatus.AFFECTEE,
                actor=request.user, notes=serializer.validated_data.get('notes', '')
            )
            notify_user(agent, "Nouvelle affectation", f"Dossier {complaint.ticket_number}", complaint)
            # Document: bon d'affectation
            generate_document(
                complaint=complaint,
                doc_type=ComplaintDocumentType.BON_AFFECTATION,
                actor=request.user,
                extra={
                    "document": {
                        "title": "Bon d'affectation",
                        "assigned_to": {"id": str(agent.id), "name": agent.full_name, "role": agent.role},
                        "assigned_at": complaint.assigned_at.isoformat() if complaint.assigned_at else None,
                        "deadline": complaint.deadline.isoformat() if complaint.deadline else None,
                    }
                },
            )

        return Response({'message': 'Affectation réussie.'})


class ComplaintRequestInfoView(APIView):
    """Demander un complément d'information (Action PFE)"""

    permission_classes = [permissions.IsAuthenticated, DenyReadOnlyOnWrite]

    def post(self, request, pk):
        complaint = get_object_or_404(Complaint, pk=pk)
        if request.user.role != UserRole.PFE:
            return Response({'error': "Action réservée au PFE."}, status=403)
        if complaint.status != ComplaintStatus.SOUMISE:
            return Response({'error': "Le complément d'information se demande depuis SOUMISE."}, status=400)

        notes = request.data.get("notes", "").strip()
        if not notes:
            return Response({'error': "Le champ notes est obligatoire."}, status=400)

        complaint.info_request_open = True
        complaint.info_request_notes = notes
        complaint.info_request_at = timezone.now()
        complaint.save(update_fields=["info_request_open", "info_request_notes", "info_request_at", "updated_at"])

        ComplaintHistory.objects.create(
            complaint=complaint,
            action="Demande de complément",
            old_status=complaint.status,
            new_status=complaint.status,
            actor=request.user,
            notes=notes,
        )
        if complaint.needs_call_center_assistance:
            # Cas illettrisme/handicap: orienter vers le call center.
            call_agents = User.objects.filter(role=UserRole.AGENT_CALL_CENTER, is_active=True)[:20]
            for agent in call_agents:
                notify_user(
                    agent,
                    "Complément à collecter (call center)",
                    f"Dossier {complaint.ticket_number}: contactez l'usager et saisissez le complément.",
                    complaint,
                    send_email_alert=False,
                )

        notify_complaint_contact(
            complaint,
            "Complément demandé",
            f"Un complément est requis pour votre plainte. Détail : {notes}",
        )
        return Response({"message": "Demande de complément enregistrée."})


class ComplaintProvideInfoView(APIView):
    """Usager: compléter une plainte suite à demande du PFE"""

    permission_classes = [permissions.IsAuthenticated, DenyReadOnlyOnWrite]

    def post(self, request, pk):
        complaint = get_object_or_404(Complaint, pk=pk)
        if request.user.role != UserRole.USAGER or complaint.complainant_id != request.user.id:
            return Response({'error': "Non autorisé."}, status=403)

        info = request.data.get("info", "").strip()
        if not info:
            return Response({'error': "Le champ info est obligatoire."}, status=400)

        # Ajout non destructif: on garde description + append (audit)
        complaint.description = f"{complaint.description}\n\n[Complément usager] {timezone.now().strftime('%Y-%m-%d %H:%M')} — {info}"
        complaint.info_request_open = False
        complaint.save(update_fields=["description", "info_request_open", "updated_at"])

        ComplaintHistory.objects.create(
            complaint=complaint,
            action="Complément d'information fourni",
            old_status=complaint.status,
            new_status=complaint.status,
            actor=request.user,
            notes=info,
        )
        for f in request.FILES.getlist("attachments"):
            err = save_attachment(complaint, f)
            if err:
                return err

        # Notifier les responsables du dossier
        if complaint.assigned_to:
            notify_user(complaint.assigned_to, "Complément reçu", f"Dossier {complaint.ticket_number}", complaint)
        if complaint.establishment_id:
            pfes = User.objects.filter(role=UserRole.PFE, establishment_id=complaint.establishment_id, is_active=True)[:20]
            for pfe in pfes:
                notify_user(pfe, "Complément reçu", f"Dossier {complaint.ticket_number}", complaint, send_email_alert=False)
        return Response({"message": "Complément enregistré."})


class ComplaintPublicRequestAccessCodeView(APIView):
    """
    Public: demander un code de vérification pour accéder aux compléments
    d'une plainte sans compte (envoi SMS/email selon contacts disponibles).
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request, ticket_number):
        complaint = get_object_or_404(Complaint, ticket_number=ticket_number.upper())
        if complaint.complainant_id:
            return Response({"error": "Utilisez votre compte pour répondre au complément."}, status=400)
        if not complaint.info_request_open:
            return Response({"error": "Aucune demande de complément en attente."}, status=400)

        code = _generate_public_code()
        complaint.public_access_code_hash = _hash_public_code(code)
        complaint.public_access_code_expires_at = timezone.now() + timedelta(minutes=15)
        complaint.save(update_fields=["public_access_code_hash", "public_access_code_expires_at", "updated_at"])

        notify_complaint_contact(
            complaint,
            "Code de vérification",
            f"Votre code d'accès temporaire est: {code}. Il expire dans 15 minutes.",
        )
        return Response({"message": "Code envoyé par SMS/email."})


class ComplaintPublicVerifyAccessCodeView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request, ticket_number):
        complaint = get_object_or_404(Complaint, ticket_number=ticket_number.upper())
        code = (request.data.get("code") or "").strip()
        if not code:
            return Response({"error": "Code requis."}, status=400)
        if not complaint.public_access_code_hash or not complaint.public_access_code_expires_at:
            return Response({"error": "Aucun code actif."}, status=400)
        if complaint.public_access_code_expires_at < timezone.now():
            return Response({"error": "Code expiré."}, status=400)
        if complaint.public_access_code_hash != _hash_public_code(code):
            return Response({"error": "Code invalide."}, status=400)
        return Response({"message": "Code valide."})


class ComplaintPublicProvideInfoView(APIView):
    permission_classes = [permissions.AllowAny]
    parser_classes = [JSONParser, MultiPartParser, FormParser]

    def post(self, request, ticket_number):
        complaint = get_object_or_404(Complaint, ticket_number=ticket_number.upper())
        if not complaint.info_request_open:
            return Response({"error": "Aucune demande de complément en attente."}, status=400)

        code = (request.data.get("code") or "").strip()
        info = (request.data.get("info") or "").strip()
        if not code or not info:
            return Response({"error": "Champs requis: code, info."}, status=400)
        if not complaint.public_access_code_hash or not complaint.public_access_code_expires_at:
            return Response({"error": "Aucun code actif."}, status=400)
        if complaint.public_access_code_expires_at < timezone.now():
            return Response({"error": "Code expiré."}, status=400)
        if complaint.public_access_code_hash != _hash_public_code(code):
            return Response({"error": "Code invalide."}, status=400)

        complaint.description = f"{complaint.description}\n\n[Complément public] {timezone.now().strftime('%Y-%m-%d %H:%M')} — {info}"
        complaint.info_request_open = False
        complaint.public_access_code_hash = ""
        complaint.public_access_code_expires_at = None
        complaint.save(update_fields=[
            "description", "info_request_open", "public_access_code_hash",
            "public_access_code_expires_at", "updated_at",
        ])

        ComplaintHistory.objects.create(
            complaint=complaint,
            action="Complément public fourni",
            old_status=complaint.status,
            new_status=complaint.status,
            actor=None,
            notes=info,
        )
        for f in request.FILES.getlist("attachments"):
            err = save_attachment(complaint, f)
            if err:
                return err
        return Response({"message": "Complément enregistré."})


class ComplaintAcceptAssignmentView(APIView):
    """Accepter l'affectation (Action Agent Interne)"""

    permission_classes = [permissions.IsAuthenticated, DenyReadOnlyOnWrite]

    def post(self, request, pk):
        complaint = get_object_or_404(Complaint, pk=pk)
        if complaint.assigned_to_id != request.user.id:
            return Response({'error': "Non autorisé."}, status=403)
        if request.user.role not in (UserRole.AGENT_INTERNE, UserRole.PNUSS):
            return Response({'error': "Non autorisé."}, status=403)
        if complaint.status != ComplaintStatus.AFFECTEE:
            return Response({'error': "Seules les plaintes AFFECTÉES peuvent être acceptées."}, status=400)

        ComplaintHistory.objects.create(
            complaint=complaint,
            action="Affectation acceptée",
            old_status=complaint.status,
            new_status=complaint.status,
            actor=request.user,
            notes=request.data.get("notes", ""),
        )
        return Response({"message": "Affectation acceptée."})


class ComplaintRefuseAssignmentView(APIView):
    """Agent interne: refuser / réorienter une affectation"""

    permission_classes = [permissions.IsAuthenticated, DenyReadOnlyOnWrite]

    def post(self, request, pk):
        complaint = get_object_or_404(Complaint, pk=pk)
        if request.user.role != UserRole.AGENT_INTERNE or complaint.assigned_to_id != request.user.id:
            return Response({'error': "Non autorisé."}, status=403)
        if complaint.status != ComplaintStatus.AFFECTEE:
            return Response({'error': "Refus possible uniquement à l'état AFFECTÉE."}, status=400)

        reason = request.data.get("reason", "").strip()
        if not reason:
            return Response({'error': "Le champ reason est obligatoire."}, status=400)

        # Retour au PFE: on enlève l'affectation et revient à INSTRUITE
        old_status = complaint.status
        complaint.assigned_to = None
        complaint.status = ComplaintStatus.INSTRUITE
        complaint.save(update_fields=["assigned_to", "status", "updated_at"])

        ComplaintHistory.objects.create(
            complaint=complaint,
            action="Affectation refusée / réorientée",
            old_status=old_status,
            new_status=ComplaintStatus.INSTRUITE,
            actor=request.user,
            notes=reason,
        )
        return Response({"message": "Refus enregistré, dossier renvoyé au PFE."})


class ComplaintStartInvestigationView(APIView):
    """Démarrer l'investigation (Action Agent Interne)"""
    permission_classes = [permissions.IsAuthenticated, DenyReadOnlyOnWrite]

    def post(self, request, pk):
        complaint = get_object_or_404(Complaint, pk=pk)
        if (
            complaint.assigned_to != request.user
            and request.user.role not in (UserRole.PFE, UserRole.PNUSS)
        ):
            return Response({'error': "Non autorisé."}, status=403)
        if complaint.status not in [ComplaintStatus.AFFECTEE, ComplaintStatus.INSTRUITE]:
            return Response({'error': "Le traitement démarre depuis AFFECTÉE (ou INSTRUITE pour traitement direct PFE)."}, status=400)

        old_status = complaint.status
        complaint.status = ComplaintStatus.EN_TRAITEMENT
        complaint.save()

        ComplaintHistory.objects.create(
            complaint=complaint, action='Début du traitement / Investigation',
            old_status=old_status, new_status=ComplaintStatus.EN_TRAITEMENT, actor=request.user
        )
        # Document: journal (créé une fois, puis on ajoute des entrées via logs)
        ensure_singleton_document(
            complaint=complaint,
            doc_type=ComplaintDocumentType.JOURNAL_INSTRUCTION,
            actor=request.user,
            extra={"document": {"title": "Journal d'instruction"}},
        )
        return Response({'message': 'Traitement démarré.'})


class ComplaintInvestigationLogView(APIView):
    """Agent interne: documenter les investigations (journal d'instruction)."""

    permission_classes = [permissions.IsAuthenticated, DenyReadOnlyOnWrite]

    def post(self, request, pk):
        complaint = get_object_or_404(Complaint, pk=pk)
        if is_readonly_role(request.user.role):
            return Response({'error': 'Accès lecture seule.'}, status=403)
        if not user_can_view_complaint(request.user, complaint):
            return Response({'error': "Non autorisé."}, status=403)
        allowed = {UserRole.AGENT_INTERNE, UserRole.PFE, UserRole.PNUSS, UserRole.PFZS}
        if request.user.role not in allowed and complaint.assigned_to_id != request.user.id:
            return Response({'error': "Non autorisé."}, status=403)
        if complaint.status not in (ComplaintStatus.EN_TRAITEMENT, ComplaintStatus.ESCALADEE):
            return Response({'error': "Le journal se renseigne en EN_TRAITEMENT ou ESCALADÉE."}, status=400)

        entry = request.data.get("entry", "").strip()
        if not entry:
            return Response({'error': "Le champ entry est obligatoire."}, status=400)

        ComplaintHistory.objects.create(
            complaint=complaint,
            action="Journal d'instruction",
            old_status=complaint.status,
            new_status=complaint.status,
            actor=request.user,
            notes=entry,
        )
        generate_document(
            complaint=complaint,
            doc_type=ComplaintDocumentType.JOURNAL_INSTRUCTION,
            actor=request.user,
            extra={"entry": entry},
        )
        return Response({"message": "Entrée ajoutée au journal."})


class ComplaintRequestExtensionView(APIView):
    """Agent interne: demander une extension de délai."""

    permission_classes = [permissions.IsAuthenticated, DenyReadOnlyOnWrite]

    def post(self, request, pk):
        complaint = get_object_or_404(Complaint, pk=pk)
        if request.user.role != UserRole.AGENT_INTERNE or complaint.assigned_to_id != request.user.id:
            return Response({'error': "Non autorisé."}, status=403)
        if complaint.status != ComplaintStatus.EN_TRAITEMENT:
            return Response({'error': "Extension possible en EN_TRAITEMENT."}, status=400)

        until = request.data.get("until")
        reason = request.data.get("reason", "").strip()
        if not until or not reason:
            return Response({'error': "Champs obligatoires: until, reason."}, status=400)

        try:
            # ISO string expected
            until_dt = timezone.datetime.fromisoformat(until.replace("Z", "+00:00"))
        except Exception:
            return Response({'error': "Format until invalide (ISO attendu)."}, status=400)

        complaint.extension_requested_until = until_dt
        complaint.extension_reason = reason
        complaint.save(update_fields=["extension_requested_until", "extension_reason", "updated_at"])

        ComplaintHistory.objects.create(
            complaint=complaint,
            action="Demande d'extension de délai",
            old_status=complaint.status,
            new_status=complaint.status,
            actor=request.user,
            notes=f"Jusqu'au {until_dt.isoformat()} — {reason}",
        )
        return Response({"message": "Demande d'extension enregistrée."})


class ComplaintResolveView(APIView):
    """Proposer une résolution (Action Agent ou PFE)"""
    permission_classes = [permissions.IsAuthenticated, DenyReadOnlyOnWrite]

    def post(self, request, pk):
        complaint = get_object_or_404(Complaint, pk=pk)
        if request.user.role not in [UserRole.PFE, UserRole.AGENT_INTERNE, UserRole.DIRECTEUR_EST] and complaint.assigned_to != request.user:
            return Response({'error': "Non autorisé."}, status=403)
        if complaint.status not in [ComplaintStatus.EN_TRAITEMENT, ComplaintStatus.AFFECTEE]:
            return Response({'error': "La résolution se propose depuis EN_TRAITEMENT (ou AFFECTÉE)."}, status=400)
        serializer = ComplaintActionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        old_status = complaint.status
        complaint.status = ComplaintStatus.RESOLUE
        complaint.resolution_notes = serializer.validated_data.get('resolution_notes', '')
        complaint.corrective_actions = serializer.validated_data.get('corrective_actions', '')
        complaint.resolution_accepted = None
        complaint.resolution_ack_notes = ''
        complaint.resolution_ack_at = None
        complaint.resolved_at = timezone.now()
        complaint.save()

        ComplaintHistory.objects.create(
            complaint=complaint, action='Résolution proposée',
            old_status=old_status, new_status=ComplaintStatus.RESOLUE,
            actor=request.user, notes=complaint.resolution_notes
        )
        if complaint.complainant:
            notify_user(complaint.complainant, "Résolution proposée", f"Une réponse a été apportée à votre plainte.", complaint)

        # Document: rapport de résolution
        generate_document(
            complaint=complaint,
            doc_type=ComplaintDocumentType.RAPPORT_RESOLUTION,
            actor=request.user,
            extra={
                "document": {
                    "title": "Rapport de résolution",
                    "resolution_notes": complaint.resolution_notes,
                    "corrective_actions": complaint.corrective_actions,
                    "resolved_at": complaint.resolved_at.isoformat() if complaint.resolved_at else None,
                }
            },
        )

        return Response({'message': 'Résolution enregistrée.'})


class ComplaintAcknowledgeResolutionView(APIView):
    """Usager: accepter ou contester une résolution proposée."""

    permission_classes = [permissions.IsAuthenticated, DenyReadOnlyOnWrite]

    def post(self, request, pk):
        complaint = get_object_or_404(Complaint, pk=pk)
        if request.user.role != UserRole.USAGER or complaint.complainant_id != request.user.id:
            return Response({'error': "Non autorisé."}, status=403)
        if complaint.status != ComplaintStatus.RESOLUE:
            return Response({'error': "Action possible uniquement lorsque la plainte est RÉSOLUE."}, status=400)

        accepted = request.data.get("accepted")
        notes = request.data.get("notes", "").strip()
        if accepted is None:
            return Response({'error': "Champ obligatoire: accepted (true/false)."}, status=400)

        complaint.resolution_accepted = bool(accepted)
        complaint.resolution_ack_notes = notes
        complaint.resolution_ack_at = timezone.now()
        complaint.save(update_fields=["resolution_accepted", "resolution_ack_notes", "resolution_ack_at", "updated_at"])

        ComplaintHistory.objects.create(
            complaint=complaint,
            action="Accusé réception de la résolution" if complaint.resolution_accepted else "Résolution contestée",
            old_status=complaint.status,
            new_status=complaint.status,
            actor=request.user,
            notes=notes,
        )

        # Si contestée, on escalade automatiquement
        if not complaint.resolution_accepted:
            Escalation.objects.create(
                complaint=complaint,
                from_user=request.user,
                to_user=None,
                reason=notes or "Contestation de la résolution.",
            )
            old_status = complaint.status
            complaint.status = ComplaintStatus.ESCALADEE
            complaint.save(update_fields=["status", "updated_at"])
            ComplaintHistory.objects.create(
                complaint=complaint,
                action='Escalade (suite contestation usager)',
                old_status=old_status,
                new_status=ComplaintStatus.ESCALADEE,
                actor=request.user,
                notes=notes or "Contestation de la résolution.",
            )
            generate_document(
                complaint=complaint,
                doc_type=ComplaintDocumentType.DOSSIER_ESCALADE,
                actor=request.user,
                extra={"document": {"title": "Dossier d'escalade", "reason": notes}},
            )

        return Response({"message": "Réponse enregistrée."})


class ComplaintValidateResolutionView(APIView):
    """Direction: valider la résolution (avant clôture / envoi officiel)."""

    permission_classes = [permissions.IsAuthenticated, DenyReadOnlyOnWrite]

    def post(self, request, pk):
        complaint = get_object_or_404(Complaint, pk=pk)
        if request.user.role != UserRole.DIRECTEUR_EST:
            return Response({'error': "Action réservée à la Direction de l'établissement."}, status=403)
        if complaint.establishment_id and request.user.establishment_id != complaint.establishment_id:
            return Response({'error': "Non autorisé (établissement)."}, status=403)
        if complaint.status != ComplaintStatus.RESOLUE:
            return Response({'error': "Validation possible uniquement à l'état RÉSOLUE."}, status=400)

        complaint.resolution_validated = True
        complaint.resolution_validated_at = timezone.now()
        complaint.resolution_validated_by = request.user
        complaint.save(update_fields=["resolution_validated", "resolution_validated_at", "resolution_validated_by", "updated_at"])

        ComplaintHistory.objects.create(
            complaint=complaint,
            action="Résolution validée (Direction)",
            old_status=complaint.status,
            new_status=complaint.status,
            actor=request.user,
            notes=request.data.get("notes", ""),
        )
        return Response({"message": "Résolution validée."})


class ComplaintRejectResolutionView(APIView):
    """Direction: infirmer / renvoyer la résolution pour correction."""

    permission_classes = [permissions.IsAuthenticated, DenyReadOnlyOnWrite]

    def post(self, request, pk):
        complaint = get_object_or_404(Complaint, pk=pk)
        if request.user.role != UserRole.DIRECTEUR_EST:
            return Response({'error': "Action réservée à la Direction de l'établissement."}, status=403)
        if complaint.establishment_id and request.user.establishment_id != complaint.establishment_id:
            return Response({'error': "Non autorisé (établissement)."}, status=403)
        if complaint.status != ComplaintStatus.RESOLUE:
            return Response({'error': "Rejet possible uniquement à l'état RÉSOLUE."}, status=400)

        reason = request.data.get("reason", "").strip()
        if not reason:
            return Response({'error': "Le champ reason est obligatoire."}, status=400)

        complaint.resolution_validated = False
        complaint.resolution_validated_at = timezone.now()
        complaint.resolution_validated_by = request.user
        # Retour en traitement
        old_status = complaint.status
        complaint.status = ComplaintStatus.EN_TRAITEMENT
        complaint.save(update_fields=["resolution_validated", "resolution_validated_at", "resolution_validated_by", "status", "updated_at"])

        ComplaintHistory.objects.create(
            complaint=complaint,
            action="Résolution rejetée (Direction) — correction demandée",
            old_status=old_status,
            new_status=ComplaintStatus.EN_TRAITEMENT,
            actor=request.user,
            notes=reason,
        )
        return Response({"message": "Résolution rejetée, dossier renvoyé en traitement."})


class ComplaintDDSAssignInspectorView(APIView):
    """DDS: affecter un inspecteur DDS à un dossier escaladé."""

    permission_classes = [permissions.IsAuthenticated, DenyReadOnlyOnWrite]

    def post(self, request, pk):
        complaint = get_object_or_404(Complaint, pk=pk)
        if request.user.role != UserRole.DDS:
            return Response({'error': "Action réservée à la DDS."}, status=403)
        if complaint.status != ComplaintStatus.ESCALADEE:
            return Response({'error': "Affectation DDS possible uniquement sur dossier ESCALADÉ."}, status=400)

        inspector_id = request.data.get("inspector_id")
        if not inspector_id:
            return Response({'error': "Champ obligatoire: inspector_id."}, status=400)

        inspector = get_object_or_404(User, pk=inspector_id)
        complaint.dds_assigned_to = inspector
        complaint.save(update_fields=["dds_assigned_to", "updated_at"])

        ComplaintHistory.objects.create(
            complaint=complaint,
            action="Inspecteur DDS affecté",
            old_status=complaint.status,
            new_status=complaint.status,
            actor=request.user,
            notes=f"{inspector.full_name} ({inspector.email})",
        )
        return Response({"message": "Inspecteur DDS affecté."})


class ComplaintDDSInvestigationView(APIView):
    """DDS: instruire / diligenter une enquête (journalisation + doc)."""

    permission_classes = [permissions.IsAuthenticated, DenyReadOnlyOnWrite]

    def post(self, request, pk):
        complaint = get_object_or_404(Complaint, pk=pk)
        if request.user.role != UserRole.DDS:
            return Response({'error': "Action réservée à la DDS."}, status=403)
        if complaint.status != ComplaintStatus.ESCALADEE:
            return Response({'error': "Instruction DDS possible uniquement sur dossier ESCALADÉ."}, status=400)

        notes = request.data.get("notes", "").strip()
        if not notes:
            return Response({'error': "Le champ notes est obligatoire."}, status=400)

        ComplaintHistory.objects.create(
            complaint=complaint,
            action="Enquête DDS diligéntée",
            old_status=complaint.status,
            new_status=complaint.status,
            actor=request.user,
            notes=notes,
        )
        generate_document(
            complaint=complaint,
            doc_type=ComplaintDocumentType.JOURNAL_INSTRUCTION,
            actor=request.user,
            extra={"dds_investigation": notes},
        )
        return Response({"message": "Enquête DDS enregistrée."})


class ComplaintNotifyPartiesView(APIView):
    """Notifier toutes les parties (in-app) — utilitaire DQSS/DDS/Cabinet."""

    permission_classes = [permissions.IsAuthenticated, DenyReadOnlyOnWrite]

    def post(self, request, pk):
        complaint = get_object_or_404(Complaint, pk=pk)
        if is_readonly_role(request.user.role):
            return Response({'error': 'Accès lecture seule.'}, status=403)
        if not user_can_view_complaint(request.user, complaint):
            return Response({'error': "Non autorisé."}, status=403)
        if request.user.role not in [
            UserRole.PFE, UserRole.PFZS, UserRole.PNUSS,
            UserRole.DDS, UserRole.DQSS, UserRole.CABINET, UserRole.ADMIN_PLATEFORME,
            UserRole.DIRECTEUR_EST,
        ]:
            return Response({'error': "Non autorisé."}, status=403)

        message = request.data.get("message", "").strip()
        if not message:
            return Response({'error': "Le champ message est obligatoire."}, status=400)

        # Usager
        if complaint.complainant_id:
            notify_user(complaint.complainant, "Notification", message, complaint)
        # Agent/PFE/Direction (si identifiables)
        if complaint.assigned_to_id:
            notify_user(complaint.assigned_to, "Notification", message, complaint)

        # Historique (piste d'audit)
        ComplaintHistory.objects.create(
            complaint=complaint,
            action="Notification envoyée (toutes parties)",
            old_status=complaint.status,
            new_status=complaint.status,
            actor=request.user,
            notes=message,
        )
        return Response({"message": "Notifications envoyées."})


class ComplaintArbitrateView(APIView):
    """Arbitrer un dossier escaladé (Action DDS ou DQSS)"""
    permission_classes = [permissions.IsAuthenticated, DenyReadOnlyOnWrite]

    def post(self, request, pk):
        complaint = get_object_or_404(Complaint, pk=pk)
        if request.user.role not in [UserRole.DDS, UserRole.DQSS, UserRole.CABINET]:
            return Response({'error': "Seule une autorité de régulation peut arbitrer."}, status=403)
        if complaint.status != ComplaintStatus.ESCALADEE:
            return Response({'error': "Seuls les dossiers ESCALADÉS peuvent être arbitrés."}, status=400)

        old_status = complaint.status
        complaint.status = ComplaintStatus.ARBITREE
        complaint.save()

        ComplaintHistory.objects.create(
            complaint=complaint, action='Arbitrage rendu',
            old_status=old_status, new_status=ComplaintStatus.ARBITREE,
            actor=request.user, notes=request.data.get('notes', 'Décision d\'arbitrage officielle.')
        )
        # Document: décision arbitrage
        generate_document(
            complaint=complaint,
            doc_type=ComplaintDocumentType.DECISION_ARBITRAGE,
            actor=request.user,
            extra={"document": {"title": "Décision d'arbitrage", "decision": request.data.get('notes', '')}},
        )
        return Response({'message': 'Arbitrage enregistré.'})


class ComplaintCloseView(APIView):
    """Clôturer définitivement un dossier — notes obligatoires (min. 30 caractères)."""
    permission_classes = [permissions.IsAuthenticated, DenyReadOnlyOnWrite]

    def post(self, request, pk):
        complaint = get_object_or_404(Complaint, pk=pk)
        if request.user.role not in [UserRole.PFE, UserRole.DDS, UserRole.DQSS,
                                     UserRole.CABINET, UserRole.ADMIN_PLATEFORME]:
            return Response({'error': 'Non autorisé.'}, status=403)
        if request.user.role == UserRole.PFE and complaint.establishment_id and request.user.establishment_id != complaint.establishment_id:
            return Response({'error': 'Le PFE ne peut clôturer que les dossiers de son établissement.'}, status=403)
        if complaint.status not in [ComplaintStatus.RESOLUE, ComplaintStatus.ARBITREE]:
            return Response({'error': 'La clôture est possible après RÉSOLUE ou ARBITRÉE.'}, status=400)
        if complaint.status == ComplaintStatus.RESOLUE and not complaint.is_anonymous and complaint.complainant_id:
            if complaint.resolution_accepted is not True:
                return Response({'error': "Clôture impossible : l'usager doit accepter la résolution."}, status=400)

        # Notes de clôture obligatoires
        notes = request.data.get('notes', '').strip()
        if not notes:
            return Response({'error': 'Le champ notes est obligatoire pour la clôture.'}, status=400)
        if len(notes) < 30:
            return Response({'error': 'Les notes de clôture doivent contenir au moins 30 caractères. '
                                      'Décrivez les actions menées et les conclusions du dossier.'}, status=400)

        old_status = complaint.status
        complaint.status = ComplaintStatus.CLOTUREE
        complaint.closed_at = timezone.now()
        complaint.save()

        ComplaintHistory.objects.create(
            complaint=complaint, action='Clôture définitive',
            old_status=old_status, new_status=ComplaintStatus.CLOTUREE,
            actor=request.user, notes=notes
        )
        generate_document(
            complaint=complaint,
            doc_type=ComplaintDocumentType.FICHE_CLOTURE,
            actor=request.user,
            extra={
                "document": {
                    "title": "Fiche de clôture",
                    "closed_at": complaint.closed_at.isoformat() if complaint.closed_at else None,
                    "motif": notes,
                    "satisfaction": complaint.resolution_ack_notes if complaint.resolution_accepted else None,
                }
            },
        )
        return Response({'message': 'Dossier clôturé.'})


class ComplaintWithdrawView(APIView):
    """Retirer une plainte (Action Usager)"""

    permission_classes = [permissions.IsAuthenticated, DenyReadOnlyOnWrite]

    def post(self, request, pk):
        complaint = get_object_or_404(Complaint, pk=pk)
        if request.user.role != UserRole.USAGER or complaint.complainant_id != request.user.id:
            return Response({'error': "Non autorisé."}, status=403)
        if complaint.status in [ComplaintStatus.CLOTUREE]:
            return Response({'error': "Impossible de retirer une plainte déjà clôturée."}, status=400)

        motif = request.data.get("motif", "").strip()
        if not motif:
            return Response({'error': "Le champ motif est obligatoire."}, status=400)

        old_status = complaint.status
        complaint.status = ComplaintStatus.REJETEE
        complaint.save(update_fields=["status", "updated_at"])

        ComplaintHistory.objects.create(
            complaint=complaint,
            action="Retrait par l'usager",
            old_status=old_status,
            new_status=ComplaintStatus.REJETEE,
            actor=request.user,
            notes=motif,
        )
        return Response({"message": "Plainte retirée."})


class ComplaintReopenView(APIView):
    """Rouvrir une plainte clôturée (Action PFE)"""

    permission_classes = [permissions.IsAuthenticated, DenyReadOnlyOnWrite]

    def post(self, request, pk):
        complaint = get_object_or_404(Complaint, pk=pk)
        if request.user.role != UserRole.PFE:
            return Response({'error': "Action réservée au PFE."}, status=403)
        if complaint.status != ComplaintStatus.CLOTUREE:
            return Response({'error': "Seules les plaintes CLÔTURÉES peuvent être rouvertes."}, status=400)

        old_status = complaint.status
        complaint.status = ComplaintStatus.INSTRUITE
        complaint.closed_at = None
        complaint.save(update_fields=["status", "closed_at", "updated_at"])

        ComplaintHistory.objects.create(
            complaint=complaint,
            action="Réouverture",
            old_status=old_status,
            new_status=ComplaintStatus.INSTRUITE,
            actor=request.user,
            notes=request.data.get("notes", ""),
        )
        return Response({"message": "Plainte rouverte."})

def _resolve_escalation_target(complaint, user):
    """
    Résout automatiquement le prochain niveau d'escalade selon la pyramide
    sanitaire béninoise et le type d'établissement concerné.

    Chaînes d'escalade :
      - PFE (zone périphérique) → PFZS → DDS → DQSS → CABINET
      - PFE (CHD)               → DDS  → DQSS → CABINET
      - PFE (national)          → DQSS → CABINET
    """
    from establishments.models import EstablishmentLevel

    User = get_user_model()

    establishment = complaint.establishment
    est_level = getattr(establishment, 'level', EstablishmentLevel.PERIPHERAL) if establishment else EstablishmentLevel.PERIPHERAL

    # ─── PFE ────────────────────────────────────────────────────────────
    if user.role == UserRole.PFE:
        if est_level == EstablishmentLevel.NATIONAL:
            # Hôpital national → escalade directe vers DQSS
            target_role = UserRole.DQSS
            skip_reason = "Établissement national — bypass DDS et PFZS."
        elif est_level == EstablishmentLevel.CHD:
            # CHD → escalade vers DDS (bypass PFZS)
            target_role = UserRole.DDS
            skip_reason = "CHD — bypass PFZS, escalade directement vers DDS."
        else:
            # Établissement périphérique → PFZS
            target_role = UserRole.PFZS
            skip_reason = None

        # Cherche un utilisateur du rôle cible dans le même département/zone
        candidates = User.objects.filter(role=target_role, is_active=True)
        if establishment:
            if target_role == UserRole.PFZS and establishment.zone_sanitaire_id:
                candidates = candidates.filter(zone_sanitaire=establishment.zone_sanitaire)
            elif target_role in (UserRole.DDS, UserRole.DQSS) and establishment.region_id:
                candidates = candidates.filter(
                    departement__iexact=establishment.region.name
                ) | candidates.filter(departement__isnull=True)
        return candidates.first(), target_role, skip_reason

    # ─── PFZS ────────────────────────────────────────────────────────────
    if user.role == UserRole.PFZS:
        candidates = User.objects.filter(role=UserRole.DDS, is_active=True)
        if user.zone_sanitaire_id:
            region = user.zone_sanitaire.region
            candidates = candidates.filter(departement__iexact=region.name)
        return candidates.first(), UserRole.DDS, None

    # ─── DDS ─────────────────────────────────────────────────────────────
    if user.role == UserRole.DDS:
        candidates = User.objects.filter(role=UserRole.DQSS, is_active=True)
        return candidates.first(), UserRole.DQSS, None

    # ─── DQSS ────────────────────────────────────────────────────────────
    if user.role == UserRole.DQSS:
        candidates = User.objects.filter(role=UserRole.CABINET, is_active=True)
        return candidates.first(), UserRole.CABINET, None

    return None, None, None


class ComplaintEscalateView(APIView):
    """
    Escalader une plainte selon la pyramide sanitaire béninoise.
    Le prochain niveau est résolu automatiquement ; raison obligatoire (≥ 10 car.).
    """
    permission_classes = [permissions.IsAuthenticated, DenyReadOnlyOnWrite]

    def get(self, request, pk):
        """Retourne la cible d'escalade suivante pour un pré-affichage UI."""
        complaint = get_object_or_404(Complaint, pk=pk)
        target_user, target_role, skip_reason = _resolve_escalation_target(complaint, request.user)
        return Response({
            'next_level_role': target_role,
            'next_level_role_display': UserRole(target_role).label if target_role else None,
            'next_level_user': str(target_user) if target_user else None,
            'skip_reason': skip_reason,
            'can_escalate': target_role is not None,
        })

    def post(self, request, pk):
        complaint = get_object_or_404(Complaint, pk=pk)
        allowed_roles = [
            UserRole.USAGER, UserRole.PFE, UserRole.PFZS, UserRole.PNUSS,
            UserRole.DIRECTEUR_EST, UserRole.DDS, UserRole.DQSS, UserRole.CABINET,
            UserRole.ADMIN_PLATEFORME,
        ]
        if request.user.role not in allowed_roles:
            return Response({'error': 'Non autorisé.'}, status=403)
        if request.user.role == UserRole.USAGER and complaint.complainant_id != request.user.id:
            return Response({'error': 'Vous ne pouvez escalader que vos propres plaintes.'}, status=403)
        if request.user.role == UserRole.PFE and complaint.establishment_id and request.user.establishment_id != complaint.establishment_id:
            return Response({'error': 'Le PFE ne peut escalader que les dossiers de son établissement.'}, status=403)
        if complaint.status not in [
            ComplaintStatus.INSTRUITE,
            ComplaintStatus.AFFECTEE,
            ComplaintStatus.EN_TRAITEMENT,
            ComplaintStatus.RESOLUE,
            ComplaintStatus.ESCALADEE,
        ]:
            return Response({'error': 'Escalade possible depuis INSTRUITE / AFFECTÉE / EN_TRAITEMENT / RÉSOLUE / ESCALADÉE.'}, status=400)

        kind = (request.data.get('kind') or '').strip().upper()
        reason = (request.data.get('reason') or request.data.get('notes') or '').strip()
        notes = (request.data.get('notes') or reason).strip()
        if not reason:
            return Response({'error': "La raison de l'escalade est obligatoire (min. 10 caractères)."}, status=400)
        if len(reason) < 10:
            return Response({'error': "La raison de l'escalade doit contenir au moins 10 caractères."}, status=400)

        # Résolution automatique du prochain niveau de la pyramide
        # Un `to_user` explicite reste accepté (admin plateforme, cas particulier)
        to_user_id = request.data.get('to_user')
        if to_user_id:
            to_user = get_object_or_404(get_user_model(), pk=to_user_id)
        else:
            to_user, target_role, skip_reason = _resolve_escalation_target(complaint, request.user)

        old_status = complaint.status
        complaint.status = ComplaintStatus.ESCALADEE
        complaint.save()

        Escalation.objects.create(
            complaint=complaint,
            from_user=request.user,
            to_user=to_user,
            reason=reason
        )
        action_label = 'Escalade de la plainte'
        if kind in ('SECOND_DEGREE_APPEAL', 'APPEAL_2', 'RECOURS_2'):
            action_label = 'Recours (2e degré)'

        ComplaintHistory.objects.create(
            complaint=complaint,
            action=action_label,
            old_status=old_status,
            new_status=ComplaintStatus.ESCALADEE,
            actor=request.user,
            notes=notes
        )
        try:
            generate_document(
                complaint=complaint,
                doc_type=ComplaintDocumentType.DOSSIER_ESCALADE,
                actor=request.user,
                extra={
                    "document": {
                        "title": "Dossier d'escalade",
                        "reason": reason,
                        "history_snapshot_count": complaint.history.count(),
                    }
                },
            )
        except Exception:
            pass
        return Response({
            'message': 'Plainte escaladée avec succès.',
            'escalated_to': str(to_user) if to_user else 'Non assigné',
        })



class ComplaintDocumentsView(generics.ListAPIView):
    """Liste des documents générés pour une plainte."""

    serializer_class = ComplaintDocumentSerializer
    permission_classes = [permissions.IsAuthenticated, DenyReadOnlyOnWrite]

    def get_queryset(self):
        complaint = get_object_or_404(Complaint, pk=self.kwargs['pk'])
        if not user_can_view_complaint_documents(self.request.user, complaint):
            return ComplaintDocument.objects.none()
        return ComplaintDocument.objects.filter(complaint=complaint).order_by('-created_at')


class ComplaintDocumentDetailView(generics.RetrieveUpdateAPIView):
    """Lecture et mise à jour du corps d'un document (rôles autorisés ou admin plateforme)."""

    permission_classes = [permissions.IsAuthenticated, DenyReadOnlyOnWrite]

    def get_serializer_class(self):
        if self.request.method in ('PATCH', 'PUT'):
            return ComplaintDocumentUpdateSerializer
        return ComplaintDocumentSerializer

    def get_object(self):
        complaint = get_object_or_404(Complaint, pk=self.kwargs['pk'])
        if not user_can_view_complaint_documents(self.request.user, complaint):
            raise PermissionDenied()
        return get_object_or_404(
            ComplaintDocument,
            pk=self.kwargs['doc_id'],
            complaint=complaint,
        )

    def perform_update(self, serializer):
        doc = serializer.instance
        allowed = doc.payload.get('allowed_roles') or []
        role = getattr(self.request.user, 'role', None)
        if role != UserRole.ADMIN_PLATEFORME and role not in allowed:
            raise PermissionDenied('Vous ne pouvez pas rédiger ce type de document.')
        serializer.save(last_edited_by=self.request.user)


class ComplaintAttachmentView(generics.ListCreateAPIView):
    """Pièces jointes d'une plainte"""
    serializer_class = AttachmentSerializer
    permission_classes = [permissions.IsAuthenticated, DenyReadOnlyOnWrite]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_queryset(self):
        return Attachment.objects.filter(complaint_id=self.kwargs['pk'])

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context

    def perform_create(self, serializer):
        complaint = get_object_or_404(Complaint, pk=self.kwargs['pk'])
        serializer.save(complaint=complaint)


class ComplaintHistoryView(generics.ListAPIView):
    """Historique d'une plainte"""
    serializer_class = ComplaintHistorySerializer
    permission_classes = [permissions.IsAuthenticated, DenyReadOnlyOnWrite]

    def get_queryset(self):
        return ComplaintHistory.objects.filter(complaint_id=self.kwargs['pk'])


class MyScopeView(APIView):
    """
    Retourne les établissements, zones et services accessibles selon le rôle.
    Utilisé par l'onglet de navigation dans le frontend/mobile.
    """
    permission_classes = [permissions.IsAuthenticated, DenyReadOnlyOnWrite]

    def get(self, request):
        from establishments.models import Establishment, Region
        from establishments.serializers import EstablishmentSerializer

        user = request.user
        data = {
            'role': user.role,
            'role_display': user.get_role_display(),
            'scope': 'global',
            'establishments': [],
            'regions': [],
        }

        if user.role in [UserRole.PFE, UserRole.DIRECTEUR_EST, UserRole.AGENT_INTERNE]:
            if user.establishment:
                data['scope'] = 'establishment'
                data['establishments'] = EstablishmentSerializer([user.establishment], many=True).data
            else:
                data['scope'] = 'none'

        elif user.role == UserRole.PNUSS:
            from accounts.roles import pnuss_level
            level = pnuss_level(user)
            data['pnuss_level'] = level
            if level == 'establishment' and user.establishment:
                data['scope'] = 'establishment'
                data['establishments'] = EstablishmentSerializer([user.establishment], many=True).data
            elif level == 'zone' and user.zone_sanitaire_id:
                data['scope'] = 'zone'
                ests = Establishment.objects.filter(zone_sanitaire=user.zone_sanitaire)
                data['establishments'] = EstablishmentSerializer(ests, many=True).data
            elif level == 'department' and user.departement:
                data['scope'] = 'department'
                data['departement'] = user.departement
                ests = Establishment.objects.filter(region__name=user.departement)
                data['establishments'] = EstablishmentSerializer(ests, many=True).data
            else:
                data['scope'] = 'national'

        elif user.role == UserRole.PFZS:
            data['scope'] = 'zone'
            if user.zone_sanitaire_id:
                ests = Establishment.objects.filter(zone_sanitaire=user.zone_sanitaire)
                data['establishments'] = EstablishmentSerializer(ests, many=True).data

        elif user.role == UserRole.AUDITEUR:
            from accounts.roles import pnuss_level
            level = pnuss_level(user) if user.establishment_id or user.zone_sanitaire_id or user.departement else 'national'
            data['scope'] = level if level != 'national' else 'national'
            data['read_only'] = True

        elif user.role == UserRole.DDS:
            data['scope'] = 'department'
            data['departement'] = user.departement
            if user.departement:
                ests = Establishment.objects.filter(region__name=user.departement)
                data['establishments'] = EstablishmentSerializer(ests, many=True).data

        elif user.role in [UserRole.DQSS, UserRole.CABINET, UserRole.ADMIN_PLATEFORME]:
            data['scope'] = 'national'
            regions = Region.objects.all()
            data['regions'] = [{'id': str(r.id), 'name': r.name} for r in regions]
            data['establishments'] = EstablishmentSerializer(
                Establishment.objects.select_related('region').all(), many=True
            ).data

        return Response(data)
