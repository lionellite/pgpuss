from django.db import models
from django.utils.translation import gettext_lazy as _
import uuid


class Region(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100, unique=True)
    code = models.CharField(max_length=10, unique=True)

    class Meta:
        ordering = ['name']
        verbose_name = 'Région'

    def __str__(self):
        return self.name


class ZoneSanitaire(models.Model):
    """
    Zone Sanitaire : niveau 2 de la pyramide sanitaire béninoise.
    Regroupe plusieurs communes sous une Direction Départementale de la Santé (DDS).
    Exemple : Zone Sanitaire Bembéréké-Sinendé (département du Borgou).
    """
    id = models.UUIDField(primary_key=True, default=__import__('uuid').uuid4, editable=False)
    name = models.CharField(max_length=200, verbose_name='Nom de la zone sanitaire')
    code = models.CharField(max_length=20, unique=True, verbose_name='Code')
    region = models.ForeignKey(
        Region,
        on_delete=models.CASCADE,
        related_name='zones_sanitaires',
        verbose_name='Département (DDS)',
    )
    communes = models.TextField(
        blank=True,
        help_text='Liste des communes couvertes, séparées par des virgules.',
        verbose_name='Communes couvertes',
    )
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['region', 'name']
        verbose_name = 'Zone Sanitaire'
        verbose_name_plural = 'Zones Sanitaires'

    def __str__(self):
        return f"{self.name} ({self.region.name})"


class EstablishmentType(models.TextChoices):
    CHU = 'CHU', 'Centre Hospitalier Universitaire'
    CHR = 'CHR', 'Centre Hospitalier Régional'
    HZ = 'HZ', 'Hôpital de Zone'
    CS = 'CS', 'Centre de Santé'
    PRIVE = 'PRIVE', 'Établissement Privé'
    PHARMACIE = 'PHARMACIE', 'Pharmacie'
    LABORATOIRE = 'LABORATOIRE', 'Laboratoire'


class EstablishmentOperationalStatus(models.TextChoices):
    """Statut de fonctionnement affiché aux usagers et agents."""
    OPERATIONAL = 'OPERATIONAL', 'Opérationnel'
    LIMITED = 'LIMITED', 'Service limité / partiel'
    CLOSED_TEMP = 'CLOSED_TEMP', 'Fermeture temporaire'
    CLOSED_PERM = 'CLOSED_PERM', 'Fermeture définitive / transféré'


class Establishment(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    type = models.CharField(max_length=20, choices=EstablishmentType.choices)
    region = models.ForeignKey(Region, on_delete=models.CASCADE, related_name='establishments')
    zone_sanitaire = models.ForeignKey(
        ZoneSanitaire,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='establishments',
        verbose_name='Zone Sanitaire',
        help_text='Zone sanitaire à laquelle appartient cet établissement.',
    )
    address = models.TextField(blank=True)
    phone = models.CharField(max_length=20, blank=True)
    email = models.EmailField(blank=True)
    latitude = models.DecimalField(max_digits=10, decimal_places=7, null=True, blank=True)
    longitude = models.DecimalField(max_digits=10, decimal_places=7, null=True, blank=True)
    is_active = models.BooleanField(default=True)
    operational_status = models.CharField(
        max_length=20,
        choices=EstablishmentOperationalStatus.choices,
        default=EstablishmentOperationalStatus.OPERATIONAL,
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['name']
        verbose_name = 'Établissement'

    def __str__(self):
        return f"{self.name} ({self.get_type_display()})"


class Service(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    establishment = models.ForeignKey(Establishment, on_delete=models.CASCADE, related_name='services')
    head = models.ForeignKey(
        'accounts.User', on_delete=models.SET_NULL,
        null=True, blank=True, related_name='headed_services'
    )
    is_active = models.BooleanField(default=True)
    operational_status = models.CharField(
        max_length=20,
        choices=EstablishmentOperationalStatus.choices,
        default=EstablishmentOperationalStatus.OPERATIONAL,
    )

    class Meta:
        ordering = ['name']

    def __str__(self):
        return f"{self.name} - {self.establishment.name}"
