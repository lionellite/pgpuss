from django.db import models
from django.conf import settings
import uuid
import random
import string


class Category(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    parent = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True, related_name='subcategories')
    icon = models.CharField(max_length=50, blank=True, default='📋')
    description = models.TextField(blank=True)
    order = models.IntegerField(default=0)

    class Meta:
        ordering = ['order', 'name']
        verbose_name = 'Catégorie'
        verbose_name_plural = 'Catégories'

    def __str__(self):
        if self.parent:
            return f"{self.parent.name} > {self.name}"
        return self.name


class ComplaintStatus(models.TextChoices):
    DEPOSEE = 'DEPOSEE', 'Déposée'
    ENREGISTREE = 'ENREGISTREE', 'Enregistrée'
    CLASSIFIEE = 'CLASSIFIEE', 'Classifiée'
    AFFECTEE = 'AFFECTEE', 'Affectée'
    EN_INSTRUCTION = 'EN_INSTRUCTION', 'En instruction'
    RESOLUE = 'RESOLUE', 'Résolue'
    NOTIFIEE = 'NOTIFIEE', 'Notifiée'
    CLOTURE_PROVISOIRE = 'CLOTURE_PROVISOIRE', 'Clôture provisoire'
    FEEDBACK = 'FEEDBACK', 'Feedback'
    CLOTURE_DEFINITIVE = 'CLOTURE_DEFINITIVE', 'Clôture définitive'
    CONTESTEE = 'CONTESTEE', 'Contestée'
    ESCALADEE = 'ESCALADEE', 'Escaladée'
    REJETEE = 'REJETEE', 'Rejetée'


class ComplaintPriority(models.TextChoices):
    P1_CRITIQUE = 'P1', 'P1 — Critique (4h)'
    P2_URGENT = 'P2', 'P2 — Urgent (24h)'
    P3_ELEVE = 'P3', 'P3 — Élevé (72h)'
    P4_NORMAL = 'P4', 'P4 — Normal (7 jours)'
    P5_FAIBLE = 'P5', 'P5 — Faible (15 jours)'


class ComplaintChannel(models.TextChoices):
    WEB = 'WEB', 'Portail Web'
    MOBILE = 'MOBILE', 'Application Mobile'
    SMS = 'SMS', 'SMS'
    CHATBOT = 'CHATBOT', 'Chatbot'
    GUICHET = 'GUICHET', 'Guichet Physique'


def generate_ticket_number():
    """Generate a unique ticket number like PGP-2025-AB1234"""
    from django.utils import timezone
    year = timezone.now().year
    chars = ''.join(random.choices(string.ascii_uppercase, k=2))
    nums = ''.join(random.choices(string.digits, k=4))
    return f"PGP-{year}-{chars}{nums}"


class Complaint(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    ticket_number = models.CharField(max_length=20, unique=True, editable=False)
    
    # Content
    title = models.CharField(max_length=300)
    description = models.TextField()
    
    # Classification
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, related_name='complaints')
    subcategory = models.ForeignKey(
        Category, on_delete=models.SET_NULL, null=True, blank=True, related_name='subcategory_complaints'
    )
    priority = models.CharField(max_length=5, choices=ComplaintPriority.choices, default=ComplaintPriority.P4_NORMAL)
    status = models.CharField(max_length=25, choices=ComplaintStatus.choices, default=ComplaintStatus.DEPOSEE)
    channel = models.CharField(max_length=10, choices=ComplaintChannel.choices, default=ComplaintChannel.WEB)
    
    # Identity
    is_anonymous = models.BooleanField(default=False)
    complainant = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='complaints'
    )
    complainant_name = models.CharField(max_length=200, blank=True, help_text="Nom si dépôt anonyme ou non-inscrit")
    complainant_phone = models.CharField(max_length=20, blank=True)
    complainant_email = models.EmailField(blank=True)
    
    # Location
    establishment = models.ForeignKey(
        'establishments.Establishment', on_delete=models.SET_NULL,
        null=True, related_name='complaints'
    )
    service = models.ForeignKey(
        'establishments.Service', on_delete=models.SET_NULL,
        null=True, blank=True, related_name='complaints'
    )
    
    # Assignment
    assigned_to = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='assigned_complaints'
    )
    
    # Resolution
    resolution_notes = models.TextField(blank=True)
    corrective_actions = models.TextField(blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    registered_at = models.DateTimeField(null=True, blank=True)
    classified_at = models.DateTimeField(null=True, blank=True)
    assigned_at = models.DateTimeField(null=True, blank=True)
    resolved_at = models.DateTimeField(null=True, blank=True)
    closed_at = models.DateTimeField(null=True, blank=True)
    
    # Deadline
    deadline = models.DateTimeField(null=True, blank=True)
    is_overdue = models.BooleanField(default=False)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Plainte'

    def __str__(self):
        return f"{self.ticket_number} - {self.title[:50]}"

    def save(self, *args, **kwargs):
        if not self.ticket_number:
            self.ticket_number = generate_ticket_number()
            while Complaint.objects.filter(ticket_number=self.ticket_number).exists():
                self.ticket_number = generate_ticket_number()
        super().save(*args, **kwargs)

    @property
    def priority_hours(self):
        mapping = {'P1': 4, 'P2': 24, 'P3': 72, 'P4': 168, 'P5': 360}
        return mapping.get(self.priority, 168)


class Attachment(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    complaint = models.ForeignKey(Complaint, on_delete=models.CASCADE, related_name='attachments')
    file = models.FileField(upload_to='attachments/%Y/%m/')
    file_name = models.CharField(max_length=255)
    file_type = models.CharField(max_length=50, blank=True)
    file_size = models.IntegerField(default=0)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.file_name


class ComplaintHistory(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    complaint = models.ForeignKey(Complaint, on_delete=models.CASCADE, related_name='history')
    action = models.CharField(max_length=100)
    old_status = models.CharField(max_length=25, blank=True)
    new_status = models.CharField(max_length=25, blank=True)
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, blank=True
    )
    notes = models.TextField(blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-timestamp']
        verbose_name = 'Historique'
        verbose_name_plural = 'Historiques'

    def __str__(self):
        return f"{self.complaint.ticket_number} - {self.action}"


class Escalation(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    complaint = models.ForeignKey(Complaint, on_delete=models.CASCADE, related_name='escalations')
    from_user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, related_name='escalations_sent'
    )
    to_user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, related_name='escalations_received'
    )
    reason = models.TextField()
    escalated_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-escalated_at']

    def __str__(self):
        return f"Escalade: {self.complaint.ticket_number}"
