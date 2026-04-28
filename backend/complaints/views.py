from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.decorators import api_view, permission_classes
from django.utils import timezone
from django.db.models import Count
from django.shortcuts import get_object_or_404
from django.contrib.auth import get_user_model
from .models import (
    Category, Complaint, Attachment, ComplaintHistory,
    Escalation, ComplaintStatus
)
from notifications.utils import notify_user
from .serializers import (
    CategorySerializer, ComplaintCreateSerializer,
    ComplaintListSerializer, ComplaintDetailSerializer,
    AttachmentSerializer, ComplaintHistorySerializer,
    ComplaintActionSerializer
)

User = get_user_model()


class CategoryListView(generics.ListAPIView):
    """Liste des catégories de plaintes"""
    queryset = Category.objects.filter(parent=None)
    serializer_class = CategorySerializer
    permission_classes = [permissions.AllowAny]


class ComplaintCreateView(generics.CreateAPIView):
    """Dépôt d'une nouvelle plainte"""
    serializer_class = ComplaintCreateSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        complaint = serializer.save()
        return Response({
            'message': 'Votre plainte a été enregistrée avec succès.',
            'ticket_number': complaint.ticket_number,
            'complaint': ComplaintListSerializer(complaint).data
        }, status=status.HTTP_201_CREATED)


class ComplaintListView(generics.ListAPIView):
    """Liste des plaintes (filtrée selon le rôle)"""
    serializer_class = ComplaintListSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['status', 'priority', 'category', 'establishment', 'channel', 'is_anonymous']
    search_fields = ['ticket_number', 'title', 'description']
    ordering_fields = ['created_at', 'updated_at', 'priority', 'status']

    def get_queryset(self):
        user = self.request.user
        qs = Complaint.objects.all()

        if user.role == 'USAGER':
            qs = qs.filter(complainant=user)
        elif user.role in ['AGENT_RECEPTION', 'GESTIONNAIRE_SERVICE', 'DIRECTEUR']:
            qs = qs.filter(establishment=user.establishment)
        elif user.role in ['ADMIN_NATIONAL', 'AUDITEUR', 'RESPONSABLE_QUALITE']:
            pass  # All complaints
        elif user.role == 'MEDIATEUR':
            qs = qs.filter(status=ComplaintStatus.CONTESTEE)

        # Optimization: Use select_related for foreign keys and annotate with attachment count
        # to avoid N+1 queries when rendering the list.
        return qs.select_related(
            'category', 'establishment', 'assigned_to'
        ).annotate(
            attachments_count_annotated=Count('attachments')
        )


class ComplaintDetailView(generics.RetrieveUpdateAPIView):
    """Détail d'une plainte"""
    serializer_class = ComplaintDetailSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        qs = Complaint.objects.all()

        if user.role == 'USAGER':
            qs = qs.filter(complainant=user)
        elif user.role in ['AGENT_RECEPTION', 'GESTIONNAIRE_SERVICE', 'DIRECTEUR']:
            qs = qs.filter(establishment=user.establishment)
        elif user.role == 'MEDIATEUR':
            qs = qs.filter(status=ComplaintStatus.CONTESTEE)
        elif user.role in ['ADMIN_NATIONAL', 'AUDITEUR', 'RESPONSABLE_QUALITE']:
            pass

        return qs.select_related(
            'category', 'subcategory', 'establishment', 'service',
            'assigned_to', 'complainant'
        ).prefetch_related('attachments', 'history', 'escalations')


class ComplaintTrackView(APIView):
    """Suivi d'une plainte par numéro de ticket (public)"""
    permission_classes = [permissions.AllowAny]

    def get(self, request, ticket_number):
        complaint = get_object_or_404(Complaint, ticket_number=ticket_number.upper())
        # Return limited info for public tracking
        data = {
            'ticket_number': complaint.ticket_number,
            'title': complaint.title,
            'status': complaint.status,
            'status_display': complaint.get_status_display(),
            'priority': complaint.priority,
            'priority_display': complaint.get_priority_display(),
            'created_at': complaint.created_at,
            'updated_at': complaint.updated_at,
            'establishment_name': complaint.establishment.name if complaint.establishment else None,
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


class ComplaintAcknowledgeView(APIView):
    """Accuser réception d'une plainte (Action PFE)"""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        complaint = get_object_or_404(Complaint, pk=pk)
        if request.user.role != 'PFE':
             return Response({'error': "Action réservée au Point Focal Établissement."}, status=403)

        old_status = complaint.status
        complaint.status = ComplaintStatus.ACCUSEE
        complaint.registered_at = timezone.now()
        complaint.save()

        ComplaintHistory.objects.create(
            complaint=complaint, action='Accusé de réception',
            old_status=old_status, new_status=ComplaintStatus.ACCUSEE, actor=request.user
        )
        return Response({'message': 'Accusé de réception envoyé.'})


class ComplaintQualifyView(APIView):
    """Qualifier / Catégoriser une plainte (Action PFE)"""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        complaint = get_object_or_404(Complaint, pk=pk)
        if request.user.role != 'PFE':
             return Response({'error': "Action réservée au PFE."}, status=403)

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
        return Response({'message': 'Plainte qualifiée.'})


class ComplaintAssignView(APIView):
    """Affecter une plainte à un agent interne (Action PFE)"""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        complaint = get_object_or_404(Complaint, pk=pk)

        # Permission check: Only admin or establishment managers can assign
        if not (request.user.role in ['ADMIN_NATIONAL', 'DIRECTEUR', 'GESTIONNAIRE_SERVICE']):
            return Response(
                {'error': "Vous n'êtes pas autorisé à affecter cette plainte."},
                status=status.HTTP_403_FORBIDDEN
            )

        # For non-national admin, check if complaint belongs to their establishment
        if request.user.role != 'ADMIN_NATIONAL' and complaint.establishment != request.user.establishment:
            return Response(
                {'error': "Vous n'êtes pas autorisé à affecter une plainte d'un autre établissement."},
                status=status.HTTP_403_FORBIDDEN
            )

        serializer = ComplaintActionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        assigned_to_id = serializer.validated_data.get('assigned_to')
        if assigned_to_id:
            agent = get_object_or_404(User, pk=assigned_to_id)
            old_status = complaint.status
            complaint.assigned_to = agent
            complaint.status = ComplaintStatus.AFFECTEE
            complaint.assigned_at = timezone.now()
            complaint.save()

            ComplaintHistory.objects.create(
                complaint=complaint, action=f'Affectée à {agent.full_name}',
                old_status=old_status, new_status=ComplaintStatus.AFFECTEE,
                actor=request.user, notes=serializer.validated_data.get('notes', '')
            )
            notify_user(agent, "Nouvelle affectation", f"Dossier {complaint.ticket_number}", complaint)

        return Response({'message': 'Affectation réussie.'})


class ComplaintStartInvestigationView(APIView):
    """Démarrer l'investigation (Action Agent Interne)"""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        complaint = get_object_or_404(Complaint, pk=pk)
        if complaint.assigned_to != request.user and request.user.role != 'PFE':
            return Response({'error': "Non autorisé."}, status=403)

        old_status = complaint.status
        complaint.status = ComplaintStatus.EN_TRAITEMENT
        complaint.save()

        ComplaintHistory.objects.create(
            complaint=complaint, action='Début du traitement / Investigation',
            old_status=old_status, new_status=ComplaintStatus.EN_TRAITEMENT, actor=request.user
        )
        return Response({'message': 'Traitement démarré.'})


class ComplaintResolveView(APIView):
    """Proposer une résolution (Action Agent ou PFE)"""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        complaint = get_object_or_404(Complaint, pk=pk)

        # Permission check
        if not (request.user == complaint.assigned_to or
                request.user.role in ['ADMIN_NATIONAL', 'DIRECTEUR', 'GESTIONNAIRE_SERVICE']):
             return Response(
                 {'error': "Vous n'êtes pas autorisé à résoudre cette plainte."},
                 status=status.HTTP_403_FORBIDDEN
             )

        serializer = ComplaintActionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        old_status = complaint.status
        complaint.status = ComplaintStatus.RESOLUE
        complaint.resolution_notes = serializer.validated_data.get('resolution_notes', '')
        complaint.resolved_at = timezone.now()
        complaint.save()

        ComplaintHistory.objects.create(
            complaint=complaint, action='Résolution proposée',
            old_status=old_status, new_status=ComplaintStatus.RESOLUE,
            actor=request.user, notes=complaint.resolution_notes
        )
        if complaint.complainant:
            notify_user(complaint.complainant, "Résolution proposée", f"Une réponse a été apportée à votre plainte.", complaint)

        return Response({'message': 'Résolution enregistrée.'})


class ComplaintEscalateView(APIView):
    """Escalader à l'échelon supérieur (PFE -> Direction, ou Direction -> DDS)"""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        complaint = get_object_or_404(Complaint, pk=pk)

        # Permission check
        if not (request.user == complaint.assigned_to or
                request.user.role in ['ADMIN_NATIONAL', 'DIRECTEUR', 'GESTIONNAIRE_SERVICE']):
             return Response(
                 {'error': "Vous n'êtes pas autorisé à clôturer cette plainte."},
                 status=status.HTTP_403_FORBIDDEN
             )

        notes = request.data.get('notes', '')
        old_status = complaint.status
        complaint.status = ComplaintStatus.ESCALADEE
        complaint.save()

        ComplaintHistory.objects.create(
            complaint=complaint, action='Escalade du dossier',
            old_status=old_status, new_status=ComplaintStatus.ESCALADEE,
            actor=request.user, notes=reason
        )
        return Response({'message': 'Dossier escaladé.'})


class ComplaintArbitrateView(APIView):
    """Arbitrer un dossier escaladé (Action DDS ou DQSS)"""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        complaint = get_object_or_404(Complaint, pk=pk)

        # Permission check: Only the complainant can contest
        if complaint.complainant != request.user:
            return Response(
                {'error': "Seul l'auteur de la plainte peut contester sa clôture."},
                status=status.HTTP_403_FORBIDDEN
            )

        reason = request.data.get('reason', '')

        if complaint.status != ComplaintStatus.CLOTURE_PROVISOIRE:
            return Response(
                {'error': 'Seules les plaintes en clôture provisoire peuvent être contestées.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        old_status = complaint.status
        complaint.status = ComplaintStatus.ARBITREE
        complaint.save()

        ComplaintHistory.objects.create(
            complaint=complaint, action='Arbitrage rendu',
            old_status=old_status, new_status=ComplaintStatus.ARBITREE,
            actor=request.user, notes=request.data.get('notes', 'Décision d\'arbitrage officielle.')
        )
        return Response({'message': 'Arbitrage enregistré.'})


class ComplaintCloseView(APIView):
    """Clôturer définitivement (Action PFE)"""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        complaint = get_object_or_404(Complaint, pk=pk)
        old_status = complaint.status
        complaint.status = ComplaintStatus.CLOTUREE
        complaint.closed_at = timezone.now()
        complaint.save()

        ComplaintHistory.objects.create(
            complaint=complaint, action='Clôture définitive',
            old_status=old_status, new_status=ComplaintStatus.CLOTUREE,
            actor=request.user, notes=request.data.get('notes', '')
        )
        return Response({'message': 'Dossier clôturé.'})


class ComplaintEscalateView(APIView):
    """Escalader une plainte"""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        complaint = get_object_or_404(Complaint, pk=pk)

        # Permission check
        if not (request.user == complaint.assigned_to or
                request.user.role in ['ADMIN_NATIONAL', 'DIRECTEUR', 'GESTIONNAIRE_SERVICE']):
             return Response(
                 {'error': "Vous n'êtes pas autorisé à escalader cette plainte."},
                 status=status.HTTP_403_FORBIDDEN
             )

        reason = request.data.get('reason', '')
        to_user_id = request.data.get('to_user')

        to_user = get_object_or_404(User, pk=to_user_id) if to_user_id else None
        old_status = complaint.status
        complaint.status = ComplaintStatus.ESCALADEE
        complaint.save()

        Escalation.objects.create(
            complaint=complaint,
            from_user=request.user,
            to_user=to_user,
            reason=reason
        )

        ComplaintHistory.objects.create(
            complaint=complaint,
            action='Escalade de la plainte',
            old_status=old_status,
            new_status=ComplaintStatus.ESCALADEE,
            actor=request.user,
            notes=reason
        )

        return Response({'message': 'Plainte escaladée avec succès.'})


class ComplaintAttachmentView(generics.ListCreateAPIView):
    """Pièces jointes d'une plainte"""
    serializer_class = AttachmentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Attachment.objects.filter(complaint_id=self.kwargs['pk'])

    def perform_create(self, serializer):
        complaint = get_object_or_404(Complaint, pk=self.kwargs['pk'])
        serializer.save(complaint=complaint)


class ComplaintHistoryView(generics.ListAPIView):
    """Historique d'une plainte"""
    serializer_class = ComplaintHistorySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return ComplaintHistory.objects.filter(complaint_id=self.kwargs['pk'])
