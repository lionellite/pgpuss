from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from complaints.models import Category, Complaint, ComplaintStatus, ComplaintHistory
from establishments.models import Establishment, Region
from django.utils import timezone
import random

User = get_user_model()

class Command(BaseCommand):
    help = 'Peupler la base de données avec le workflow Bénin'

    def handle(self, *args, **options):
        self.stdout.write('🚀 Seed Bénin Workflow...')

        # 1. Régions
        departements = ['Littoral', 'Atlantique', 'Ouémé', 'Borgou']
        regions = []
        for d in departements:
            reg, _ = Region.objects.get_or_create(name=d, code=d[:3].upper())
            regions.append(reg)

        # 2. Catégories
        cats = [
            ('Qualité des soins', '🏥'),
            ('Accueil & comportement', '👤'),
            ('Accès aux soins', '🚑'),
            ('Facturation & frais', '💰'),
        ]
        for name, icon in cats:
            Category.objects.get_or_create(name=name, defaults={'icon': icon})

        # 3. Établissements
        est, _ = Establishment.objects.get_or_create(
            name='CNHU-HKM Cotonou',
            defaults={'type': 'CHU', 'region': regions[0]}
        )

        # 4. Users
        admin, _ = User.objects.get_or_create(
            email='admin@pgpuss.bj',
            defaults={'first_name': 'Admin', 'last_name': 'Plateforme', 'role': 'ADMIN_PLATEFORME', 'is_staff': True, 'is_superuser': True}
        )
        admin.set_password('admin123')
        admin.save()

        pfe, _ = User.objects.get_or_create(
            email='pfe@pgpuss.bj',
            defaults={'first_name': 'Jean', 'last_name': 'PFE', 'role': 'PFE', 'establishment': est}
        )
        pfe.set_password('pfe123')
        pfe.save()

        self.stdout.write(self.style.SUCCESS('✅ Seed terminé !'))
