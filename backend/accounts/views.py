from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.exceptions import PermissionDenied
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.shortcuts import get_object_or_404
from .models import UserRole
from .serializers import (
    UserRegistrationSerializer,
    UserSerializer,
    AdminUserUpdateSerializer,
    UserProfileUpdateSerializer,
    ChangePasswordSerializer,
    PhoneLoginSerializer,
    AdminPasswordResetSerializer,
    PFEStaffCreateSerializer,
    PFEStaffUpdateSerializer,
)

User = get_user_model()


class RegisterView(generics.CreateAPIView):
    """Inscription d'un nouvel usager (email OU téléphone)."""
    queryset = User.objects.all()
    permission_classes = [permissions.AllowAny]
    serializer_class = UserRegistrationSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        user = serializer.save()
        return Response({
            'message': 'Compte créé avec succès.',
            'user': UserSerializer(user).data
        }, status=status.HTTP_201_CREATED)


class FirebasePhoneAuthView(APIView):
    """
    Connexion / inscription via Firebase Authentication (OTP SMS côté client).
    Le client envoie l'id_token obtenu après vérification OTP Firebase.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        from .firebase_auth import verify_firebase_id_token

        import secrets

        id_token = (request.data.get('id_token') or '').strip()
        if not id_token:
            return Response({'error': 'Le champ id_token est obligatoire.'}, status=400)

        try:
            claims = verify_firebase_id_token(id_token)
        except RuntimeError as exc:
            return Response({'error': str(exc)}, status=503)
        except Exception:
            return Response({'error': 'Token Firebase invalide ou expiré.'}, status=401)

        phone = (claims.get('phone_number') or '').strip()
        if not phone:
            return Response({'error': 'Le token ne contient pas de numéro de téléphone vérifié.'}, status=400)

        phone_normalized = phone.replace(' ', '').replace('-', '').replace('.', '')
        user = User.objects.filter(phone=phone_normalized).first()
        if not user:
            user = User.objects.create_user(
                phone=phone_normalized,
                email=None,
                password=secrets.token_urlsafe(24),
                first_name=(request.data.get('first_name') or 'Usager').strip()[:100],
                last_name=(request.data.get('last_name') or '').strip()[:100],
                role=UserRole.USAGER,
            )

        refresh = RefreshToken.for_user(user)
        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': UserSerializer(user).data,
            'message': 'Authentification Firebase réussie.',
        })


class PhoneLoginView(APIView):
    """
    Connexion par email OU numéro de téléphone.
    Retourne un JWT access + refresh identique à /api/auth/login/.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = PhoneLoginSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']

        refresh = RefreshToken.for_user(user)
        try:
            from audit.services import log_auth_event
            log_auth_event(
                'Connexion réussie',
                request=request,
                actor=user,
                metadata={'method': 'phone_or_email'},
            )
        except Exception:
            pass
        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': UserSerializer(user).data,
            'must_change_password': user.must_change_password,
        })


class ProfileView(generics.RetrieveUpdateAPIView):
    """Profil de l'utilisateur connecté."""
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user

    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return UserProfileUpdateSerializer
        return UserSerializer


class ChangePasswordView(APIView):
    """Changement de mot de passe (utilisateur connecté)."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        user = request.user
        user.set_password(serializer.validated_data['new_password'])
        user.must_change_password = False
        user.password_reset_token = None
        user.password_reset_expires = None
        user.save()
        return Response({'message': 'Mot de passe modifié avec succès.'})


# ───────────────────────────────────────────────────────────────
# Administration des utilisateurs (ADMIN_PLATEFORME uniquement)
# ───────────────────────────────────────────────────────────────

class IsAdminPlateforme(permissions.BasePermission):
    """Permission : réservé à l'administrateur plateforme."""
    def has_permission(self, request, view):
        return (
            request.user and
            request.user.is_authenticated and
            request.user.role == UserRole.ADMIN_PLATEFORME
        )


class UserCreateView(generics.CreateAPIView):
    """Création d'utilisateur.
    - ADMIN_PLATEFORME : peut créer tous types d'utilisateurs.
    - PNUSS national   : peut créer des agents PNUSS de structures.
    - PFZS             : peut créer des agents internes pour les établissements de sa zone.
    - DDS              : peut créer des agents internes pour les établissements de son département.
    - PFE              : peut créer des agents internes de son établissement.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        role = self.request.user.role
        if role == UserRole.ADMIN_PLATEFORME:
            return AdminUserUpdateSerializer
        if role in [UserRole.PFE, UserRole.PFZS, UserRole.DDS]:
            return PFEStaffCreateSerializer
        if role == UserRole.PNUSS:
            return PFEStaffCreateSerializer
        raise PermissionDenied("Création d'utilisateur non autorisée.")

    def create(self, request, *args, **kwargs):
        role = request.user.role

        if role == UserRole.ADMIN_PLATEFORME:
            serializer = AdminUserUpdateSerializer(data=request.data, context={'request': request})
            serializer.is_valid(raise_exception=True)
            user = serializer.save()
            # Définir le mot de passe si fourni
            password = request.data.get('password')
            if password:
                user.set_password(password)
                user.must_change_password = True
                user.save(update_fields=['password', 'must_change_password'])
            return Response({
                'message': 'Utilisateur créé avec succès.',
                'user': UserSerializer(user).data,
            }, status=status.HTTP_201_CREATED)

        if role in [UserRole.PFE, UserRole.PFZS, UserRole.DDS, UserRole.PNUSS]:
            serializer = PFEStaffCreateSerializer(data=request.data, context={'request': request})
            serializer.is_valid(raise_exception=True)
            user = serializer.save()
            return Response({
                'message': 'Agent créé avec succès.',
                'user': UserSerializer(user).data,
            }, status=status.HTTP_201_CREATED)

        return Response({'error': 'Non autorisé.'}, status=status.HTTP_403_FORBIDDEN)


class UserListView(generics.ListAPIView):
    """
    Liste des utilisateurs.
    - ADMIN_PLATEFORME : tous les utilisateurs
    - DIRECTEUR_EST / PFE : uniquement leur établissement
    - Autres : uniquement leur propre profil
    """
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['role', 'is_active', 'establishment']
    search_fields = ['first_name', 'last_name', 'email', 'phone']

    def get_queryset(self):
        user = self.request.user
        if user.role == UserRole.ADMIN_PLATEFORME:
            return User.objects.select_related('establishment', 'zone_sanitaire').all()
        elif user.role in [UserRole.DIRECTEUR_EST, UserRole.PFE]:
            return User.objects.filter(establishment=user.establishment)
        elif user.role == UserRole.PFZS:
            # PFZS : voit les agents des établissements de sa zone sanitaire
            if user.zone_sanitaire_id:
                return User.objects.filter(establishment__zone_sanitaire=user.zone_sanitaire)
            return User.objects.filter(id=user.id)
        elif user.role == UserRole.PNUSS:
            if user.establishment_id:
                return User.objects.filter(establishment_id=user.establishment_id)
            if user.zone_sanitaire_id:
                return User.objects.filter(establishment__zone_sanitaire=user.zone_sanitaire)
            if user.departement:
                return User.objects.filter(establishment__region__name=user.departement)
            return User.objects.select_related('establishment', 'zone_sanitaire').all()
        elif user.role == UserRole.AUDITEUR:
            return User.objects.filter(id=user.id)
        return User.objects.filter(id=user.id)


class UserDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Détail d'un utilisateur.
    PATCH : modifier infos/rôle (admin uniquement)
    DELETE : désactiver le compte (admin uniquement)
    """
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        user = self.request.user
        if self.request.method in ['PUT', 'PATCH']:
            if user.role == UserRole.ADMIN_PLATEFORME:
                return AdminUserUpdateSerializer
            if user.role == UserRole.PFE:
                return PFEStaffUpdateSerializer
        return UserSerializer

    def get_queryset(self):
        user = self.request.user
        if user.role == UserRole.ADMIN_PLATEFORME:
            return User.objects.select_related('establishment', 'zone_sanitaire').all()
        elif user.role in [UserRole.DIRECTEUR_EST, UserRole.PFE]:
            if user.establishment_id:
                return User.objects.filter(establishment=user.establishment)
            return User.objects.filter(id=user.id)
        elif user.role == UserRole.PFZS:
            if user.zone_sanitaire_id:
                return User.objects.filter(establishment__zone_sanitaire=user.zone_sanitaire)
            return User.objects.filter(id=user.id)
        return User.objects.filter(id=user.id)

    def update(self, request, *args, **kwargs):
        target = self.get_object()
        if request.user.role == UserRole.PFE:
            if target.role != UserRole.AGENT_INTERNE or target.establishment_id != request.user.establishment_id:
                return Response(
                    {'error': 'Vous ne pouvez modifier que les agents internes de votre établissement.'},
                    status=status.HTTP_403_FORBIDDEN,
                )
            serializer = PFEStaffUpdateSerializer(target, data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)
            serializer.save()
            return Response(UserSerializer(target).data)
        if request.user.role != UserRole.ADMIN_PLATEFORME:
            return Response(
                {'error': "Modification réservée à l'administrateur plateforme ou au PFE."},
                status=status.HTTP_403_FORBIDDEN
            )
        response = super().update(request, *args, **kwargs)
        try:
            from audit.services import log_user_event
            log_user_event(
                'Utilisateur modifié',
                request=request,
                actor=request.user,
                target_user=target,
                new_value={'role': target.role, 'is_active': target.is_active},
            )
        except Exception:
            pass
        return response

    def destroy(self, request, *args, **kwargs):
        """Soft-delete : désactive le compte sans le supprimer."""
        if request.user.role != UserRole.ADMIN_PLATEFORME:
            return Response(
                {'error': "Suppression réservée à l'administrateur plateforme."},
                status=status.HTTP_403_FORBIDDEN
            )
        user = self.get_object()
        if user == request.user:
            return Response(
                {'error': "Vous ne pouvez pas supprimer votre propre compte."},
                status=status.HTTP_400_BAD_REQUEST
            )
        hard_delete = request.query_params.get('hard', 'false').lower() == 'true'
        if hard_delete:
            user.delete()
            return Response({'message': 'Compte supprimé définitivement.'}, status=status.HTTP_204_NO_CONTENT)
        else:
            user.is_active = False
            user.save(update_fields=['is_active'])
            try:
                from audit.services import log_user_event
                log_user_event(
                    'Compte utilisateur désactivé',
                    request=request,
                    actor=request.user,
                    target_user=user,
                    new_value={'is_active': False},
                )
            except Exception:
                pass
            return Response({'message': 'Compte désactivé.'})


class AdminResetPasswordView(APIView):
    """
    ADMIN : initier un reset de mot de passe pour un utilisateur.
    Peut définir un nouveau mot de passe directement,
    ou générer un token à transmettre à l'utilisateur.
    """
    permission_classes = [IsAdminPlateforme]

    def post(self, request, pk):
        target_user = get_object_or_404(User, pk=pk)
        serializer = AdminPasswordResetSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        new_password = serializer.validated_data.get('new_password')

        if new_password:
            # Définir directement le nouveau mdp
            try:
                validate_password(new_password, user=target_user)
            except ValidationError as e:
                return Response({'error': list(e.messages)}, status=400)
            target_user.set_password(new_password)
            target_user.must_change_password = True
            target_user.password_reset_token = None
            target_user.save()
            return Response({
                'message': f'Mot de passe défini pour {target_user.full_name}. '
                           f'L\'utilisateur devra le changer à la prochaine connexion.'
            })
        else:
            # Générer un token de réinitialisation
            token = target_user.generate_password_reset_token()
            return Response({
                'message': f'Token de réinitialisation généré pour {target_user.full_name}.',
                'token': token,
                'expires_at': target_user.password_reset_expires,
                'note': 'Transmettez ce token à l\'utilisateur pour qu\'il réinitialise son mot de passe.'
            })


class RolesListView(APIView):
    """Liste des rôles disponibles (admin et agents)."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if request.user.role != UserRole.ADMIN_PLATEFORME:
            return Response({'error': 'Accès réservé à l\'administrateur.'}, status=403)
        roles = [
            {'code': role.value, 'label': role.label}
            for role in UserRole
        ]
        return Response(roles)
