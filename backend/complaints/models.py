from django.db import models
from django.conf import settings
from django.utils import timezone
from datetime import timedelta
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
    SOUMISE = 'SOUMISE', 'Soumise'
    ACCUSEE = 'ACCUSEE', 'Accusée de réception'
    INSTRUITE = 'INSTRUITE', 'Instruite / Qualifiée'
    AFFECTEE = 'AFFECTEE', 'Affectée'
    EN_TRAITEMENT = 'EN_TRAITEMENT', 'En traitement / Investigation'
    RESOLUE = 'RESOLUE', 'Résolue'
    ESCALADEE = 'ESCALADEE', 'Escaladée'
    ARBITREE = 'ARBITREE', 'Arbitrée'
    CLOTUREE = 'CLOTUREE', 'Clôturée'
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
    status = models.CharField(max_length=25, choices=ComplaintStatus.choices, default=ComplaintStatus.SOUMISE)
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

    # Usager acknowledgement of proposed resolution
    resolution_accepted = models.BooleanField(null=True, blank=True)
    resolution_ack_notes = models.TextField(blank=True)
    resolution_ack_at = models.DateTimeField(null=True, blank=True)

    # Optional validation before sending to usager (Direction)
    resolution_validated = models.BooleanField(null=True, blank=True)
    resolution_validated_at = models.DateTimeField(null=True, blank=True)
    resolution_validated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='validated_resolutions'
    )

    # Optional DDS assignment (inspecteur)
    dds_assigned_to = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='dds_assigned_complaints'
    )
    extension_requested_until = models.DateTimeField(null=True, blank=True)
    extension_reason = models.TextField(blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    registered_at = models.DateTimeField(null=True, blank=True)
    classified_at = models.DateTimeField(null=True, blank=True)
    assigned_at = models.DateTimeField(null=True, blank=True)
    resolved_at = models.DateTimeField(null=True, blank=True)
    closed_at = models.DateTimeField(null=True, blank=True)

    # Plainte vocale (analphabétisme / accessibilité) — fichier audio déposé par l’usager
    voice_file = models.FileField(upload_to='complaints/voice/%Y/%m/', blank=True, null=True)
    
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
        pl = PriorityLevel.objects.filter(code=self.priority, is_active=True).first()
        if pl:
            return pl.hours_target
        mapping = {'P1': 4, 'P2': 24, 'P3': 72, 'P4': 168, 'P5': 360}
        return mapping.get(self.priority, 168)

    def perform_nlp_analysis(self):
        """
        Simulate NLP analysis to categorize and prioritize the complaint.
        """
        text = (self.title + " " + self.description).lower()

        # 1. Category Detection (Simulated)
        categories = Category.objects.filter(parent=None)
        keywords = {
            'soin': 'Qualité des soins',
            'erreur': 'Qualité des soins',
            'médicament': 'Médicaments',
            'pharmacie': 'Médicaments',
            'argent': 'Facturation & frais',
            'payé': 'Facturation & frais',
            'facture': 'Facturation & frais',
            'attente': 'Accès aux soins',
            'retard': 'Accès aux soins',
            'accueil': "Accueil & comportement",
            'propre': "Infrastructure & hygiène",
            'insulte': 'Accueil & comportement',
            'respect': 'Accueil & comportement',
            'secret': 'Confidentialité',
            'dossier': 'Confidentialité',
            'refus': 'Accès aux soins',
            'décès': 'Urgence / cas critique',
        }

        found_category = None
        for key, cat_name in keywords.items():
            if key in text:
                found_category = categories.filter(name__icontains=cat_name).first()
                if found_category:
                    break

        if found_category:
            self.category = found_category

        # 2. Priority Detection (Simulated)
        critical_keywords = ['mort', 'décès', 'urgence', 'sang', 'grave', 'critique', 'vie']
        urgent_keywords = ['douleur', 'immédiat', 'rapidement', 'urgent']

        if any(word in text for word in critical_keywords):
            self.priority = ComplaintPriority.P1_CRITIQUE
        elif any(word in text for word in urgent_keywords):
            self.priority = ComplaintPriority.P2_URGENT

        # 3. Set Deadline
        self.deadline = timezone.now() + timedelta(hours=self.priority_hours)


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


class ComplaintDocumentType(models.TextChoices):
    FICHE_PLAINTE = 'FICHE_PLAINTE', 'Fiche de plainte'
    RECEPISSE_ACCUSATION = 'RECEPISSE_ACCUSATION', 'Récépissé accusé de réception'
    FICHE_QUALIFICATION = 'FICHE_QUALIFICATION', 'Fiche de qualification'
    BON_AFFECTATION = 'BON_AFFECTATION', "Bon d'affectation"
    JOURNAL_INSTRUCTION = 'JOURNAL_INSTRUCTION', "Journal d'instruction"
    RAPPORT_RESOLUTION = 'RAPPORT_RESOLUTION', 'Rapport de résolution'
    DOSSIER_ESCALADE = 'DOSSIER_ESCALADE', "Dossier d'escalade"
    DECISION_ARBITRAGE = 'DECISION_ARBITRAGE', "Décision d'arbitrage"
    FICHE_CLOTURE = 'FICHE_CLOTURE', 'Fiche de clôture'


class ComplaintDocumentStatus(models.TextChoices):
    DRAFT = 'DRAFT', 'Brouillon'
    SUBMITTED = 'SUBMITTED', 'Soumis / Figé'


class ComplaintDocument(models.Model):
    """
    Document workflow : métadonnées JSON + corps rédigé par les acteurs habilités.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    complaint = models.ForeignKey(Complaint, on_delete=models.CASCADE, related_name='documents')
    doc_type = models.CharField(max_length=40, choices=ComplaintDocumentType.choices)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='generated_documents'
    )
    last_edited_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='edited_documents'
    )
    payload = models.JSONField(default=dict, blank=True)
    body = models.TextField(blank=True, help_text="Rédaction officielle (texte)")
    status = models.CharField(
        max_length=15,
        choices=ComplaintDocumentStatus.choices,
        default=ComplaintDocumentStatus.DRAFT,
    )

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['complaint', 'doc_type']),
        ]

    def __str__(self):
        return f"{self.complaint.ticket_number} - {self.doc_type}"

    @property
    def is_required(self) -> bool:
        return bool(self.payload.get('is_required'))

    @property
    def allowed_roles(self):
        return self.payload.get('allowed_roles') or []


class PriorityLevel(models.Model):
    """Niveaux de priorité configurables par l’admin (codes P1… reliés aux plaintes)."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    code = models.CharField(max_length=5, unique=True)
    label = models.CharField(max_length=120)
    hours_target = models.PositiveIntegerField(default=168)
    order = models.PositiveSmallIntegerField(default=0)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ['order', 'code']

    def __str__(self):
        return f"{self.code} — {self.label}"


class RoleWorkflowPermission(models.Model):
    """Autorisations fines par rôle (workflow). Éditable par l’admin plateforme."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    role = models.CharField(max_length=30, unique=True)
    permissions = models.JSONField(
        default=dict,
        help_text='Ex: {"manage_documents": true, "close_complaints": true}',
    )
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Permissions par rôle'

    def __str__(self):
        return self.role
