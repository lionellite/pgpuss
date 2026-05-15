"""
Seed officiel du workflow "Plateforme Santé Bénin".
Usage: python manage.py seed_benin_workflow
"""

from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta
import random

from accounts.models import UserRole
from establishments.models import Region, Establishment, Service
from complaints.models import (
    Category,
    Complaint,
    ComplaintHistory,
    ComplaintStatus,
    ComplaintPriority,
    ComplaintChannel,
)
from notifications.models import Notification, NotificationType
from analytics.models import SatisfactionSurvey


User = get_user_model()


def _set_password(user, password: str):
    user.set_password(password)
    user.save(update_fields=["password"])


class Command(BaseCommand):
    help = "Peuple la base avec référentiels & comptes du workflow Bénin"

    def handle(self, *args, **options):
        self.stdout.write("🌱 Seed workflow Bénin…")

        # 1) Référentiel géographique (12 départements)
        regions_data = [
            ("Alibori", "ALI"),
            ("Atacora", "ATA"),
            ("Atlantique", "ATL"),
            ("Borgou", "BOR"),
            ("Collines", "COL"),
            ("Couffo", "COU"),
            ("Donga", "DON"),
            ("Littoral", "LIT"),
            ("Mono", "MON"),
            ("Ouémé", "OUE"),
            ("Plateau", "PLA"),
            ("Zou", "ZOU"),
        ]
        regions = []
        for name, code in regions_data:
            r, _ = Region.objects.get_or_create(name=name, defaults={"code": code})
            regions.append(r)

        region_map = {r.code: r for r in regions}

        # 2) Établissements (échantillon)
        establishments_data = [
            ("CHU de Cotonou (CNHU-HKM)", "CHU", "LIT"),
            ("CHU de Parakou", "CHU", "BOR"),
            ("CHR Borgou-Alibori", "CHR", "BOR"),
            ("CHR Ouémé-Plateau", "CHR", "OUE"),
            ("CHR Mono-Couffo", "CHR", "MON"),
            ("CHR Atacora-Donga", "CHR", "ATA"),
            ("Hôpital de Zone d'Abomey-Calavi", "HZ", "ATL"),
            ("Hôpital de Zone de Lokossa", "HZ", "MON"),
            ("Centre de Santé de Godomey", "CS", "ATL"),
        ]
        establishments = []
        for name, etype, rcode in establishments_data:
            e, _ = Establishment.objects.get_or_create(
                name=name,
                defaults={"type": etype, "region": region_map[rcode]},
            )
            establishments.append(e)

        # Services (exemples)
        services_names = [
            "Urgences",
            "Médecine Générale",
            "Chirurgie",
            "Pédiatrie",
            "Maternité",
            "Pharmacie",
            "Laboratoire",
            "Radiologie",
            "Administration",
        ]
        for est in establishments[:5]:
            for sname in random.sample(services_names, k=min(5, len(services_names))):
                Service.objects.get_or_create(name=sname, establishment=est)

        # 3) Catégories P1..P7 (référentiel "workflow")
        categories_data = [
            ("P1 — Qualité des soins", "🏥", ["Erreur médicale", "Mauvais diagnostic", "Suivi"]),
            ("P2 — Accueil & comportement", "🧑‍⚕️", ["Discrimination", "Mauvais traitement", "Incivilité"]),
            ("P3 — Accès aux soins", "🚑", ["Refus de soin", "Liste d'attente abusive", "Orientation"]),
            ("P4 — Facturation & frais", "💰", ["Surfacturation", "Paiement informel", "Reçu absent"]),
            ("P5 — Infrastructure & hygiène", "🧼", ["Insalubrité", "Manque de matériel", "Sécurité"]),
            ("P6 — Médicaments", "💊", ["Rupture de stock", "Périmé", "Substitution"]),
            ("P7 — Urgence / cas critique", "🚨", ["Décès suspect", "Incident grave", "Risque vital"]),
        ]
        top_categories = []
        for idx, (name, icon, subcats) in enumerate(categories_data):
            cat, _ = Category.objects.get_or_create(
                name=name,
                parent=None,
                defaults={"icon": icon, "order": idx},
            )
            top_categories.append(cat)
            for sub_name in subcats:
                Category.objects.get_or_create(
                    name=sub_name,
                    parent=cat,
                    defaults={"icon": icon},
                )

        # 4) Comptes “institutionnels” (démo)
        # NOTE: On n’écrase pas les rôles si l’utilisateur existe déjà.
        admin, _ = User.objects.get_or_create(
            email="admin@pgpuss.bj",
            defaults={
                "first_name": "Admin",
                "last_name": "Plateforme",
                "role": UserRole.ADMIN_PLATEFORME,
                "is_staff": True,
                "is_superuser": True,
            },
        )
        _set_password(admin, "admin123")

        pfe, _ = User.objects.get_or_create(
            email="pfe@pgpuss.bj",
            defaults={
                "first_name": "Point",
                "last_name": "Focal",
                "role": UserRole.PFE,
                "establishment": establishments[0],
            },
        )
        _set_password(pfe, "pfe123")

        agent_interne, _ = User.objects.get_or_create(
            email="agent.interne@pgpuss.bj",
            defaults={
                "first_name": "Agent",
                "last_name": "Interne",
                "role": UserRole.AGENT_INTERNE,
                "establishment": establishments[0],
            },
        )
        _set_password(agent_interne, "agent123")

        directeur, _ = User.objects.get_or_create(
            email="directeur@pgpuss.bj",
            defaults={
                "first_name": "Direction",
                "last_name": "Etablissement",
                "role": UserRole.DIRECTEUR_EST,
                "establishment": establishments[0],
            },
        )
        _set_password(directeur, "dir123")

        dds, _ = User.objects.get_or_create(
            email="dds@pgpuss.bj",
            defaults={
                "first_name": "DDS",
                "last_name": "Littoral",
                "role": UserRole.DDS,
                "departement": "Littoral",
            },
        )
        _set_password(dds, "dds123")

        dqss, _ = User.objects.get_or_create(
            email="dqss@pgpuss.bj",
            defaults={
                "first_name": "DQSS",
                "last_name": "National",
                "role": UserRole.DQSS,
            },
        )
        _set_password(dqss, "dqss123")

        cabinet, _ = User.objects.get_or_create(
            email="cabinet@pgpuss.bj",
            defaults={
                "first_name": "Cabinet",
                "last_name": "Ministère",
                "role": UserRole.CABINET,
            },
        )
        _set_password(cabinet, "cab123")

        usager, _ = User.objects.get_or_create(
            email="usager@pgpuss.bj",
            defaults={
                "first_name": "Fidèle",
                "last_name": "Adjahouinou",
                "role": UserRole.USAGER,
                "phone": "+22997000001",
            },
        )
        _set_password(usager, "usager123")

        # 5) Plaintes de démo qui traversent le workflow
        now = timezone.now()

        def create_complaint_with_history(
            *,
            title: str,
            description: str,
            category: Category,
            priority: str,
            status: str,
            establishment: Establishment,
            complainant: User | None,
            assigned_to: User | None = None,
            channel: str = ComplaintChannel.WEB,
            history: list[tuple[str, str, User | None, str]] | None = None,
            resolved: bool = False,
            closed: bool = False,
        ):
            comp, created = Complaint.objects.get_or_create(
                title=title,
                defaults={
                    "description": description,
                    "category": category,
                    "priority": priority,
                    "status": status,
                    "establishment": establishment,
                    "complainant": complainant,
                    "assigned_to": assigned_to,
                    "channel": channel,
                    "created_at": now - timedelta(days=random.randint(1, 30)),
                },
            )
            if not created:
                return comp

            # Deadline basée sur la priorité (existant dans le modèle)
            comp.perform_nlp_analysis()
            comp.save(update_fields=["deadline", "priority"])

            if history:
                previous = ""
                for action, new_status, actor, notes in history:
                    ComplaintHistory.objects.create(
                        complaint=comp,
                        action=action,
                        old_status=previous,
                        new_status=new_status,
                        actor=actor,
                        notes=notes,
                    )
                    previous = new_status

            if resolved:
                comp.status = ComplaintStatus.RESOLUE
                comp.resolved_at = timezone.now()
                comp.save(update_fields=["status", "resolved_at"])

            if closed:
                comp.status = ComplaintStatus.CLOTUREE
                comp.closed_at = timezone.now()
                comp.save(update_fields=["status", "closed_at"])

            # Notification minimale in-app pour l’usager
            if comp.complainant:
                Notification.objects.get_or_create(
                    user=comp.complainant,
                    complaint=comp,
                    type=NotificationType.IN_APP,
                    defaults={
                        "title": f"Plainte {comp.ticket_number}",
                        "message": f"Statut: {comp.get_status_display()}",
                    },
                )
            return comp

        # Cas simple: passe par PFE -> affectation -> traitement -> résolution -> clôture
        c1 = create_complaint_with_history(
            title="Mauvais accueil à l'entrée",
            description="L'agent d'accueil a été irrespectueux et a refusé de m'orienter.",
            category=top_categories[1],
            priority=ComplaintPriority.P4_NORMAL,
            status=ComplaintStatus.EN_TRAITEMENT,
            establishment=establishments[0],
            complainant=usager,
            assigned_to=agent_interne,
            history=[
                ("Soumission", ComplaintStatus.SOUMISE, usager, "Plainte soumise via web"),
                ("Accusé de réception", ComplaintStatus.ACCUSEE, pfe, "Récépissé envoyé"),
                ("Qualification", ComplaintStatus.INSTRUITE, pfe, "Catégorisation P2"),
                ("Affectation", ComplaintStatus.AFFECTEE, pfe, "Assignée à un agent interne"),
                ("Début traitement", ComplaintStatus.EN_TRAITEMENT, agent_interne, "Investigation lancée"),
            ],
            resolved=True,
            closed=True,
        )

        # Cas critique: escalade vers DDS -> arbitrage
        c2 = create_complaint_with_history(
            title="Incident grave aux urgences",
            description="Décès suspect après un retard de prise en charge.",
            category=top_categories[6],
            priority=ComplaintPriority.P1_CRITIQUE,
            status=ComplaintStatus.ESCALADEE,
            establishment=establishments[0],
            complainant=usager,
            assigned_to=directeur,
            history=[
                ("Soumission", ComplaintStatus.SOUMISE, usager, "Plainte soumise"),
                ("Accusé de réception", ComplaintStatus.ACCUSEE, pfe, "Dossier ouvert"),
                ("Qualification", ComplaintStatus.INSTRUITE, pfe, "Cas critique P7"),
                ("Escalade", ComplaintStatus.ESCALADEE, directeur, "Transmission à la DDS"),
                ("Arbitrage", ComplaintStatus.ARBITREE, dds, "Décision contraignante rendue"),
            ],
            closed=True,
        )

        # Satisfaction (si plainte résolue)
        for comp in [c1]:
            if comp.complainant and not SatisfactionSurvey.objects.filter(complaint=comp).exists():
                SatisfactionSurvey.objects.create(
                    complaint=comp,
                    user=comp.complainant,
                    rating=random.randint(3, 5),
                    nps_score=random.randint(6, 10),
                    comment="Merci pour le traitement.",
                )

        self.stdout.write(self.style.SUCCESS("🎉 Seed workflow Bénin terminé."))
        self.stdout.write("")
        self.stdout.write("  Comptes de démo:")
        self.stdout.write("  ─────────────────────────────────────────")
        self.stdout.write("  Admin:          admin@pgpuss.bj / admin123")
        self.stdout.write("  PFE:            pfe@pgpuss.bj / pfe123")
        self.stdout.write("  Agent interne:  agent.interne@pgpuss.bj / agent123")
        self.stdout.write("  Directeur:      directeur@pgpuss.bj / dir123")
        self.stdout.write("  DDS:            dds@pgpuss.bj / dds123")
        self.stdout.write("  DQSS:           dqss@pgpuss.bj / dqss123")
        self.stdout.write("  Cabinet:        cabinet@pgpuss.bj / cab123")
        self.stdout.write("  Usager:         usager@pgpuss.bj / usager123")

