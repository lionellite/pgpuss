from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models
import uuid


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
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError("L'adresse email est obligatoire")
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('role', UserRole.ADMIN_PLATEFORME)
        return self.create_user(email, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=20, blank=True, null=True)
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    role = models.CharField(max_length=30, choices=UserRole.choices, default=UserRole.USAGER)
    avatar = models.ImageField(upload_to='avatars/', blank=True, null=True)
    departement = models.CharField(max_length=100, blank=True, null=True, help_text="Pour DDS")
    language_pref = models.CharField(max_length=5, default='fr')
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # Optional: link to establishment
    establishment = models.ForeignKey(
        'establishments.Establishment',
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='staff_members'
    )

    objects = UserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['first_name', 'last_name']

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Utilisateur'
        verbose_name_plural = 'Utilisateurs'

    def __str__(self):
        return f"{self.first_name} {self.last_name} ({self.email})"

    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}"

    @property
    def is_admin(self):
        return self.role == UserRole.ADMIN_PLATEFORME

    @property
    def is_agent(self):
        return self.role != UserRole.USAGER
