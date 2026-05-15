from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth import get_user_model
from .models import UserRole
from .serializers import (
    UserRegistrationSerializer,
    UserSerializer,
    AdminUserUpdateSerializer,
    UserProfileUpdateSerializer,
    ChangePasswordSerializer,
)

User = get_user_model()


class RegisterView(generics.CreateAPIView):
    """Inscription d'un nouvel usager"""
    queryset = User.objects.all()
    permission_classes = [permissions.AllowAny]
    serializer_class = UserRegistrationSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response({
            'message': 'Compte créé avec succès.',
            'user': UserSerializer(user).data
        }, status=status.HTTP_201_CREATED)


class ProfileView(generics.RetrieveUpdateAPIView):
    """Profil de l'utilisateur connecté"""
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user

    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return UserProfileUpdateSerializer
        return UserSerializer


class ChangePasswordView(APIView):
    """Changement de mot de passe"""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        request.user.set_password(serializer.validated_data['new_password'])
        request.user.save()
        return Response({'message': 'Mot de passe modifié avec succès.'})


class UserListView(generics.ListAPIView):
    """Liste des utilisateurs (admin uniquement)"""
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['role', 'is_active', 'establishment']
    search_fields = ['first_name', 'last_name', 'email']

    def get_queryset(self):
        user = self.request.user
        if user.role in [UserRole.ADMIN_PLATEFORME, UserRole.DQSS, UserRole.CABINET]:
            return User.objects.all()
        elif user.role in [UserRole.DIRECTEUR_EST, UserRole.PFE]:
            return User.objects.filter(establishment=user.establishment)
        return User.objects.filter(id=user.id)


class UserDetailView(generics.RetrieveUpdateAPIView):
    """Détail d'un utilisateur (admin)"""
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        user = self.request.user
        if self.request.method in ['PUT', 'PATCH'] and user.role in [UserRole.ADMIN_PLATEFORME, UserRole.DQSS, UserRole.CABINET]:
            return AdminUserUpdateSerializer
        return UserSerializer

    def get_queryset(self):
        user = self.request.user
        if user.role in [UserRole.ADMIN_PLATEFORME, UserRole.DQSS, UserRole.CABINET]:
            return User.objects.all()
        elif user.role in [UserRole.DIRECTEUR_EST, UserRole.PFE]:
            return User.objects.filter(establishment=user.establishment)
        return User.objects.filter(id=user.id)

    def update(self, request, *args, **kwargs):
        # Empêche la “gestion users” par des non-admins
        if request.user.role not in [UserRole.ADMIN_PLATEFORME, UserRole.DQSS, UserRole.CABINET]:
            return Response({'error': "Action réservée à l'administration."}, status=status.HTTP_403_FORBIDDEN)
        return super().update(request, *args, **kwargs)
