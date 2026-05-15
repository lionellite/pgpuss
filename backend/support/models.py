from django.db import models
from django.conf import settings
import uuid


class PlatformReportCategory(models.TextChoices):
    BUG = 'BUG', 'Bug / Erreur technique'
    PERFORMANCE = 'PERFORMANCE', 'Lenteur / Performance'
    SECURITE = 'SECURITE', 'Problème de sécurité'
    FONCTIONNALITE = 'FONCTIONNALITE', 'Fonctionnalité manquante'
    AUTRE = 'AUTRE', 'Autre'


class PlatformReportStatus(models.TextChoices):
    OUVERT = 'OUVERT', 'Ouvert'
    EN_COURS = 'EN_COURS', 'En cours de traitement'
    RESOLU = 'RESOLU', 'Résolu'
    FERME = 'FERME', 'Fermé (non reproductible)'


class PlatformReport(models.Model):
    """Signalement de dysfonctionnement de la plateforme."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    reporter = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='platform_reports'
    )
    # Pour les signalements anonymes
    reporter_name = models.CharField(max_length=200, blank=True)
    reporter_email = models.EmailField(blank=True)
    reporter_phone = models.CharField(max_length=20, blank=True)

    category = models.CharField(
        max_length=20,
        choices=PlatformReportCategory.choices,
        default=PlatformReportCategory.BUG
    )
    title = models.CharField(max_length=300)
    description = models.TextField()

    # Contexte technique (optionnel)
    page_url = models.CharField(max_length=500, blank=True, help_text="URL ou écran où le problème est apparu")
    device_info = models.CharField(max_length=300, blank=True, help_text="Appareil / navigateur / version app")

    status = models.CharField(
        max_length=20,
        choices=PlatformReportStatus.choices,
        default=PlatformReportStatus.OUVERT
    )
    admin_notes = models.TextField(blank=True, help_text="Notes internes de l'administrateur")
    resolved_at = models.DateTimeField(null=True, blank=True)
    resolved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='resolved_reports'
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Signalement plateforme'
        verbose_name_plural = 'Signalements plateforme'

    def __str__(self):
        return f"[{self.category}] {self.title[:60]}"
