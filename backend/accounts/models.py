from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models
import uuid
import secrets


class UserRole(models.TextChoices):
    USAGER = 'USAGER', 'Usager (Plaignant)'
    PFE = 'PFE', 'Point Focal Établissement'
    DIRECTEUR_EST = 'DIRECTEUR_EST', "Direction de l'Établissement"
    DDS = 'DDS', 'Direction Départementale de la Santé'
    DQSS = 'DQSS', 'DQSS / Agence Nationale Qualité'
    CABINET = 'CABINET', 'Ministère de la Santé (Cabinet)'
    AGENT_INTERNE = 'AGENT_INTERNE', 'Agent Affecté (Interne)'
    ADMIN_PLATEFORME = 'ADMIN_PLATEFORME', 'Administrateur Plateforme'


class UserManager(BaseUserManager):
    def create_user(self, password=None, email=None, phone=None, **extra_fields):
        """
        Crée un utilisateur avec email OU numéro de téléphone.
        L'un des deux est obligatoire.
        """
        if not email and not phone:
            raise ValueError("L'adresse email ou le numéro de téléphone est obligatoire.")
        if email:
            email = self.normalize_email(email)
        user = self.model(email=email, phone=phone, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email=None, phone=None, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('role', UserRole.ADMIN_PLATEFORME)
        # createsuperuser passe email en arg positionnel
        if email and not phone:
            return self.create_user(email=email, password=password, **extra_fields)
        return self.create_user(email=email, phone=phone, password=password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    # Email ET téléphone sont tous les deux optionnels, mais l'un est requis (validé au niveau serializer)
    email = models.EmailField(unique=True, null=True, blank=True)
    phone = models.CharField(max_length=20, unique=True, null=True, blank=True)

    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100, blank=True)
    role = models.CharField(max_length=30, choices=UserRole.choices, default=UserRole.USAGER)
    avatar = models.ImageField(upload_to='avatars/', blank=True, null=True)

    # Pour les DDS : département de compétence
    departement = models.CharField(max_length=100, blank=True, null=True,
                                   help_text="Département de compétence (pour rôle DDS)")
    language_pref = models.CharField(max_length=5, default='fr')
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # Lien vers un établissement (pour PFE, DIRECTEUR_EST, AGENT_INTERNE)
    establishment = models.ForeignKey(
        'establishments.Establishment',
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='staff_members'
    )

    # Reset de mot de passe initié par l'admin
    password_reset_token = models.CharField(max_length=64, blank=True, null=True, editable=False)
    password_reset_expires = models.DateTimeField(null=True, blank=True)
    must_change_password = models.BooleanField(default=False,
                                               help_text="Force l'utilisateur à changer son mdp à la prochaine connexion")

    objects = UserManager()

    # L'identifiant de connexion principal reste l'email pour la compatibilité JWT
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['first_name']

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Utilisateur'
        verbose_name_plural = 'Utilisateurs'
        # Contrainte : au moins un identifiant (email ou phone) doit être non nul
        constraints = [
            models.CheckConstraint(
                name='user_has_email_or_phone',
                condition=(
                    models.Q(email__isnull=False) | models.Q(phone__isnull=False)
                )
            )
        ]

    def __str__(self):
        identifier = self.email or self.phone or str(self.id)
        return f"{self.first_name} {self.last_name} ({identifier})"

    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}".strip()

    @property
    def is_admin(self):
        return self.role == UserRole.ADMIN_PLATEFORME

    @property
    def is_agent(self):
        return self.role != UserRole.USAGER

    def generate_password_reset_token(self):
        """Génère un token sécurisé pour la réinitialisation du mdp."""
        from django.utils import timezone
        from datetime import timedelta
        self.password_reset_token = secrets.token_urlsafe(48)
        self.password_reset_expires = timezone.now() + timedelta(hours=24)
        self.must_change_password = True
        self.save(update_fields=['password_reset_token', 'password_reset_expires', 'must_change_password'])
        return self.password_reset_token
