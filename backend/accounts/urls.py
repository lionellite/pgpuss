from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from . import views
from .jwt_views import SafeTokenRefreshView

urlpatterns = [
    # Inscription
    path('register/', views.RegisterView.as_view(), name='register'),

    # Connexion : par email/mdp (JWT standard) ou par téléphone/mdp
    path('login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('login/phone/', views.PhoneLoginView.as_view(), name='phone_login'),
    path('refresh/', SafeTokenRefreshView.as_view(), name='token_refresh'),

    # Profil utilisateur connecté
    path('me/', views.ProfileView.as_view(), name='profile'),
    path('change-password/', views.ChangePasswordView.as_view(), name='change_password'),

    # Administration des utilisateurs (ADMIN_PLATEFORME)
    path('users/', views.UserListView.as_view(), name='user_list'),
    path('users/<uuid:pk>/', views.UserDetailView.as_view(), name='user_detail'),
    path('users/<uuid:pk>/reset-password/', views.AdminResetPasswordView.as_view(), name='admin_reset_password'),

    # Gestion des rôles
    path('roles/', views.RolesListView.as_view(), name='roles_list'),
]
