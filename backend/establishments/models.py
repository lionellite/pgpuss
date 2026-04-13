from django.db import models
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


class EstablishmentType(models.TextChoices):
    CHU = 'CHU', 'Centre Hospitalier Universitaire'
    CHR = 'CHR', 'Centre Hospitalier Régional'
    HZ = 'HZ', 'Hôpital de Zone'
    CS = 'CS', 'Centre de Santé'
    PRIVE = 'PRIVE', 'Établissement Privé'
    PHARMACIE = 'PHARMACIE', 'Pharmacie'
    LABORATOIRE = 'LABORATOIRE', 'Laboratoire'


class Establishment(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    type = models.CharField(max_length=20, choices=EstablishmentType.choices)
    region = models.ForeignKey(Region, on_delete=models.CASCADE, related_name='establishments')
    address = models.TextField(blank=True)
    phone = models.CharField(max_length=20, blank=True)
    email = models.EmailField(blank=True)
    latitude = models.DecimalField(max_digits=10, decimal_places=7, null=True, blank=True)
    longitude = models.DecimalField(max_digits=10, decimal_places=7, null=True, blank=True)
    is_active = models.BooleanField(default=True)
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

    class Meta:
        ordering = ['name']

    def __str__(self):
        return f"{self.name} - {self.establishment.name}"
