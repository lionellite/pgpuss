"""
Commande de seed pour peupler la base avec des données de démonstration.
Usage: python manage.py seed_data
"""
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from establishments.models import Region, Establishment, Service
from complaints.models import Category, Complaint, ComplaintHistory, ComplaintStatus, ComplaintPriority, ComplaintChannel
from notifications.models import Notification
from analytics.models import SatisfactionSurvey
from django.utils import timezone
from datetime import timedelta
import random

User = get_user_model()


class Command(BaseCommand):
    help = 'Peuple la base de données avec des données de démonstration'

    def handle(self, *args, **options):
        self.stdout.write('🌱 Création des données de démonstration...')

        # Regions
        regions_data = [
            ('Alibori', 'ALI'), ('Atacora', 'ATA'), ('Atlantique', 'ATL'),
            ('Borgou', 'BOR'), ('Collines', 'COL'), ('Couffo', 'COU'),
            ('Donga', 'DON'), ('Littoral', 'LIT'), ('Mono', 'MON'),
            ('Ouémé', 'OUE'), ('Plateau', 'PLA'), ('Zou', 'ZOU'),
        ]
        regions = []
        for name, code in regions_data:
            r, _ = Region.objects.get_or_create(name=name, defaults={'code': code})
            regions.append(r)
        self.stdout.write(f'  ✅ {len(regions)} régions créées')

        # Establishments
        establishments_data = [
            ('CHU de Cotonou (CNHU-HKM)', 'CHU', 'LIT'),
            ('CHU de Parakou', 'CHU', 'BOR'),
            ('CHR Borgou-Alibori', 'CHR', 'BOR'),
            ('CHR Ouémé-Plateau', 'CHR', 'OUE'),
            ('CHR Mono-Couffo', 'CHR', 'MON'),
            ('CHR Atacora-Donga', 'CHR', 'ATA'),
            ('Hôpital de Zone de Cotonou 5', 'HZ', 'LIT'),
            ('Hôpital de Zone d\'Abomey-Calavi', 'HZ', 'ATL'),
            ('Hôpital de Zone de Lokossa', 'HZ', 'MON'),
            ('Centre de Santé de Godomey', 'CS', 'ATL'),
            ('Centre de Santé d\'Akpro-Missérété', 'CS', 'OUE'),
            ('Centre de Santé de Djougou', 'CS', 'DON'),
            ('Clinique Atinkanmey', 'PRIVE', 'LIT'),
            ('Polyclinique Atinkanmey', 'PRIVE', 'LIT'),
        ]
        establishments = []
        region_map = {r.code: r for r in regions}
        for name, etype, rcode in establishments_data:
            e, _ = Establishment.objects.get_or_create(
                name=name,
                defaults={'type': etype, 'region': region_map[rcode]}
            )
            establishments.append(e)
        self.stdout.write(f'  ✅ {len(establishments)} établissements créés')

        # Services
        services_names = [
            'Urgences', 'Médecine Générale', 'Chirurgie', 'Pédiatrie',
            'Maternité', 'Pharmacie', 'Laboratoire', 'Radiologie',
            'Cardiologie', 'Ophtalmologie', 'Administration'
        ]
        services = []
        for est in establishments[:6]:
            for sname in random.sample(services_names, min(5, len(services_names))):
                s, _ = Service.objects.get_or_create(
                    name=sname, establishment=est
                )
                services.append(s)
        self.stdout.write(f'  ✅ {len(services)} services créés')

        # Categories
        categories_data = [
            ('Qualité des soins', '🏥', [
                'Diagnostic', 'Traitement', 'Suivi médical', 'Erreur médicale'
            ]),
            ('Comportement du personnel', '👤', [
                'Maltraitance', 'Discrimination', 'Incivilité', 'Négligence'
            ]),
            ('Attente et délais', '⏰', [
                'Files d\'attente', 'Rendez-vous', 'Urgences', 'Retards'
            ]),
            ('Facturation et coûts', '💰', [
                'Tarification', 'Remboursement', 'Surfacturation', 'Abus'
            ]),
            ('Conditions d\'accueil', '🏢', [
                'Hygiène', 'Confort', 'Signalétique', 'Accessibilité'
            ]),
            ('Disponibilité des médicaments', '💊', [
                'Ruptures de stock', 'Qualité', 'Substitution'
            ]),
            ('Confidentialité', '🔒', [
                'Secret médical', 'Données personnelles', 'Divulgation'
            ]),
            ('Accès aux soins', '🚑', [
                'Discrimination à l\'accès', 'Refus de soins', 'Orientation'
            ]),
        ]
        categories = []
        for cat_name, icon, subcats in categories_data:
            cat, _ = Category.objects.get_or_create(
                name=cat_name, parent=None,
                defaults={'icon': icon, 'order': len(categories)}
            )
            categories.append(cat)
            for sub_name in subcats:
                sub, _ = Category.objects.get_or_create(
                    name=sub_name, parent=cat,
                    defaults={'icon': icon}
                )
        self.stdout.write(f'  ✅ {len(categories)} catégories créées')

        # Users
        admin, _ = User.objects.get_or_create(
            email='admin@pgpuss.bj',
            defaults={
                'first_name': 'Admin',
                'last_name': 'National',
                'role': 'ADMIN_NATIONAL',
                'is_staff': True,
                'is_superuser': True,
            }
        )
        admin.set_password('admin123')
        admin.save()

        agent, _ = User.objects.get_or_create(
            email='agent@pgpuss.bj',
            defaults={
                'first_name': 'Kouassi',
                'last_name': 'Agbossou',
                'role': 'AGENT_RECEPTION',
                'establishment': establishments[0],
            }
        )
        agent.set_password('agent123')
        agent.save()

        gestionnaire, _ = User.objects.get_or_create(
            email='gestionnaire@pgpuss.bj',
            defaults={
                'first_name': 'Amina',
                'last_name': 'Dossou',
                'role': 'GESTIONNAIRE_SERVICE',
                'establishment': establishments[0],
            }
        )
        gestionnaire.set_password('gest123')
        gestionnaire.save()

        directeur, _ = User.objects.get_or_create(
            email='directeur@pgpuss.bj',
            defaults={
                'first_name': 'Dr. Patrice',
                'last_name': 'Houngbédji',
                'role': 'DIRECTEUR',
                'establishment': establishments[0],
            }
        )
        directeur.set_password('dir123')
        directeur.save()

        usager, _ = User.objects.get_or_create(
            email='usager@pgpuss.bj',
            defaults={
                'first_name': 'Fidèle',
                'last_name': 'Adjahouinou',
                'role': 'USAGER',
                'phone': '+229 97 00 00 01',
            }
        )
        usager.set_password('usager123')
        usager.save()

        usager2, _ = User.objects.get_or_create(
            email='marie@example.com',
            defaults={
                'first_name': 'Marie',
                'last_name': 'Tokpo',
                'role': 'USAGER',
                'phone': '+229 96 00 00 02',
            }
        )
        usager2.set_password('usager123')
        usager2.save()

        self.stdout.write('  ✅ Utilisateurs de démo créés')

        # Complaints
        complaints_data = [
            {
                'title': 'Attente excessive aux urgences du CNHU',
                'description': 'J\'ai attendu plus de 6 heures aux urgences du CNHU sans être pris en charge. Mon enfant avait de la fièvre élevée et personne ne nous a donné d\'informations sur le délai d\'attente.',
                'category': categories[2],  # Attente et délais
                'priority': 'P2',
                'status': ComplaintStatus.EN_INSTRUCTION,
                'establishment': establishments[0],
                'complainant': usager,
                'assigned_to': agent,
                'channel': 'WEB',
            },
            {
                'title': 'Médicaments prescrits non disponibles',
                'description': 'Après consultation, les 3 médicaments prescrits par le médecin n\'étaient pas disponibles à la pharmacie de l\'hôpital. On m\'a demandé d\'aller les acheter dehors à un prix plus élevé.',
                'category': categories[5],
                'priority': 'P3',
                'status': ComplaintStatus.AFFECTEE,
                'establishment': establishments[0],
                'complainant': usager2,
                'assigned_to': gestionnaire,
                'channel': 'WEB',
            },
            {
                'title': 'Personnel irrespectueux à l\'accueil',
                'description': 'L\'agent d\'accueil du centre de santé m\'a parlé de manière très irrespectueuse lorsque j\'ai demandé des informations sur les horaires de consultation.',
                'category': categories[1],
                'priority': 'P3',
                'status': ComplaintStatus.DEPOSEE,
                'establishment': establishments[9],
                'complainant': usager,
                'channel': 'WEB',
            },
            {
                'title': 'Surfacturation lors d\'une consultation',
                'description': 'On m\'a facturé 25 000 FCFA pour une simple consultation alors que le tarif officiel est de 5 000 FCFA. Aucun reçu ne m\'a été remis.',
                'category': categories[3],
                'priority': 'P2',
                'status': ComplaintStatus.RESOLUE,
                'establishment': establishments[6],
                'complainant': usager2,
                'assigned_to': agent,
                'resolution_notes': 'Après vérification, une erreur de facturation a été confirmée. Le patient a été remboursé de la différence.',
                'channel': 'WEB',
            },
            {
                'title': 'Conditions d\'hygiène déplorables',
                'description': 'Les toilettes de l\'hôpital sont dans un état d\'insalubrité avancé. Les salles d\'attente ne sont pas nettoyées régulièrement.',
                'category': categories[4],
                'priority': 'P4',
                'status': ComplaintStatus.CLOTURE_PROVISOIRE,
                'establishment': establishments[2],
                'complainant': usager,
                'assigned_to': gestionnaire,
                'channel': 'WEB',
            },
            {
                'title': 'Divulgation de mon diagnostic médical',
                'description': 'Une infirmière a révélé mon diagnostic médical à voix haute devant d\'autres patients dans la salle d\'attente, violant ainsi le secret médical.',
                'category': categories[6],
                'priority': 'P1',
                'status': ComplaintStatus.ESCALADEE,
                'establishment': establishments[0],
                'complainant': usager2,
                'assigned_to': directeur,
                'channel': 'WEB',
            },
            {
                'title': 'Refus de soins sans motif valable',
                'description': 'Le médecin de garde a refusé de me prendre en charge prétextant que mon cas n\'était pas urgent, alors que je souffrais de douleurs abdominales intenses.',
                'category': categories[7],
                'priority': 'P2',
                'status': ComplaintStatus.EN_INSTRUCTION,
                'establishment': establishments[3],
                'is_anonymous': True,
                'assigned_to': agent,
                'channel': 'WEB',
            },
            {
                'title': 'Erreur de prescription médicamenteuse',
                'description': 'Le médecin m\'a prescrit un médicament auquel je suis allergique, information pourtant mentionnée dans mon dossier médical.',
                'category': categories[0],
                'priority': 'P1',
                'status': ComplaintStatus.RESOLUE,
                'establishment': establishments[1],
                'complainant': usager,
                'assigned_to': directeur,
                'resolution_notes': 'Enquête interne menée. Le médecin a reçu un rappel. Procédure de double vérification mise en place.',
                'channel': 'WEB',
            },
        ]

        now = timezone.now()
        for i, cdata in enumerate(complaints_data):
            cat = cdata.pop('category')
            c, created = Complaint.objects.get_or_create(
                title=cdata['title'],
                defaults={
                    **cdata,
                    'category': cat,
                    'created_at': now - timedelta(days=random.randint(1, 60)),
                }
            )
            if created:
                ComplaintHistory.objects.create(
                    complaint=c,
                    action='Dépôt de la plainte',
                    new_status=ComplaintStatus.DEPOSEE,
                    actor=c.complainant,
                    notes=f'Plainte déposée via le portail web'
                )
                if c.status != ComplaintStatus.DEPOSEE:
                    ComplaintHistory.objects.create(
                        complaint=c,
                        action=f'Statut mis à jour: {c.get_status_display()}',
                        old_status=ComplaintStatus.DEPOSEE,
                        new_status=c.status,
                        actor=c.assigned_to or admin,
                        notes='Traitement en cours'
                    )

        self.stdout.write(f'  ✅ {len(complaints_data)} plaintes de démo créées')

        # Satisfaction surveys for resolved complaints
        resolved = Complaint.objects.filter(status__in=[ComplaintStatus.RESOLUE, ComplaintStatus.CLOTURE_PROVISOIRE, ComplaintStatus.CLOTURE_DEFINITIVE])
        for comp in resolved:
            if comp.complainant and not SatisfactionSurvey.objects.filter(complaint=comp).exists():
                SatisfactionSurvey.objects.create(
                    complaint=comp,
                    user=comp.complainant,
                    rating=random.randint(3, 5),
                    nps_score=random.randint(6, 10),
                    comment='Merci pour le traitement de ma plainte.'
                )

        # Notifications
        for comp in Complaint.objects.all()[:5]:
            if comp.complainant:
                Notification.objects.get_or_create(
                    user=comp.complainant,
                    complaint=comp,
                    type='IN_APP',
                    defaults={
                        'title': f'Mise à jour de votre plainte {comp.ticket_number}',
                        'message': f'Votre plainte "{comp.title}" a été mise à jour. Statut actuel: {comp.get_status_display()}.',
                    }
                )

        self.stdout.write(self.style.SUCCESS('🎉 Données de démonstration créées avec succès!'))
        self.stdout.write('')
        self.stdout.write('  Comptes de démo:')
        self.stdout.write('  ─────────────────────────────────────────')
        self.stdout.write('  Admin:        admin@pgpuss.bj / admin123')
        self.stdout.write('  Agent:        agent@pgpuss.bj / agent123')
        self.stdout.write('  Gestionnaire: gestionnaire@pgpuss.bj / gest123')
        self.stdout.write('  Directeur:    directeur@pgpuss.bj / dir123')
        self.stdout.write('  Usager:       usager@pgpuss.bj / usager123')
        self.stdout.write('  Usager 2:     marie@example.com / usager123')
