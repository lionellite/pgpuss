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
from establishments.models import Region, ZoneSanitaire, Establishment, Service
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

        # ── 1) Référentiel géographique : 12 départements ──
        regions_data = [
            ("Alibori", "ALI"), ("Atacora", "ATA"), ("Atlantique", "ATL"),
            ("Borgou", "BOR"), ("Collines", "COL"), ("Couffo", "COU"),
            ("Donga", "DON"), ("Littoral", "LIT"), ("Mono", "MON"),
            ("Ouémé", "OUE"), ("Plateau", "PLA"), ("Zou", "ZOU"),
        ]
        regions = []
        for name, code in regions_data:
            r, _ = Region.objects.get_or_create(name=name, defaults={"code": code})
            regions.append(r)
        region_map = {r.code: r for r in regions}
        self.stdout.write(f"  ✓ {len(regions)} départements")

        # ── 2) Zones Sanitaires (exemples réels du Bénin) ──
        zones_data = [
            ("Zone Sanitaire Cotonou 1-2-3", "ZS-LIT-1", "LIT", "Cotonou 1, Cotonou 2, Cotonou 3"),
            ("Zone Sanitaire Cotonou 4-5-6", "ZS-LIT-2", "LIT", "Cotonou 4, Cotonou 5, Cotonou 6"),
            ("Zone Sanitaire Abomey-Calavi/So-Ava", "ZS-ATL-1", "ATL", "Abomey-Calavi, So-Ava"),
            ("Zone Sanitaire Allada/Kpomassè/Toffo", "ZS-ATL-2", "ATL", "Allada, Kpomassè, Toffo"),
            ("Zone Sanitaire Parakou/N'Dali", "ZS-BOR-1", "BOR", "Parakou, N'Dali"),
            ("Zone Sanitaire Bembéréké/Sinendé", "ZS-BOR-2", "BOR", "Bembéréké, Sinendé"),
            ("Zone Sanitaire Nikki/Kalalé/Pèrèrè", "ZS-BOR-3", "BOR", "Nikki, Kalalé, Pèrèrè"),
            ("Zone Sanitaire Lokossa/Athiémé", "ZS-MON-1", "MON", "Lokossa, Athiémé"),
        ]
        zone_map = {}
        for name, code, rcode, communes in zones_data:
            z, _ = ZoneSanitaire.objects.get_or_create(
                code=code,
                defaults={"name": name, "region": region_map[rcode], "communes": communes},
            )
            zone_map[code] = z
        self.stdout.write(f"  ✓ {len(zone_map)} zones sanitaires")

        # ── 3) Établissements ──
        establishments_data = [
            ("CHU de Cotonou (CNHU-HKM)", "CHU", "LIT", "ZS-LIT-1"),
            ("CHU de Parakou", "CHU", "BOR", "ZS-BOR-1"),
            ("CHR Borgou-Alibori", "CHR", "BOR", "ZS-BOR-1"),
            ("CHR Ouémé-Plateau", "CHR", "OUE", None),
            ("CHR Mono-Couffo", "CHR", "MON", "ZS-MON-1"),
            ("CHR Atacora-Donga", "CHR", "ATA", None),
            ("Hôpital de Zone d'Abomey-Calavi", "HZ", "ATL", "ZS-ATL-1"),
            ("Hôpital de Zone de Lokossa", "HZ", "MON", "ZS-MON-1"),
            ("Centre de Santé de Godomey", "CS", "ATL", "ZS-ATL-1"),
        ]
        establishments = []
        for name, etype, rcode, zcode in establishments_data:
            zone = zone_map.get(zcode) if zcode else None
            e, _ = Establishment.objects.get_or_create(
                name=name,
                defaults={"type": etype, "region": region_map[rcode], "zone_sanitaire": zone},
            )
            if zone and not e.zone_sanitaire:
                e.zone_sanitaire = zone
                e.save(update_fields=["zone_sanitaire"])
            establishments.append(e)
        self.stdout.write(f"  ✓ {len(establishments)} établissements")

        # Services
        services_names = [
            "Urgences", "Médecine Générale", "Chirurgie", "Pédiatrie", "Maternité",
            "Pharmacie", "Laboratoire", "Radiologie", "Administration",
        ]
        for est in establishments[:5]:
            for sname in random.sample(services_names, k=5):
                Service.objects.get_or_create(name=sname, establishment=est)

        # ── 4) Catégories de plaintes ──
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
                name=name, parent=None, defaults={"icon": icon, "order": idx},
            )
            top_categories.append(cat)
            for sub_name in subcats:
                Category.objects.get_or_create(name=sub_name, parent=cat, defaults={"icon": icon})
        self.stdout.write(f"  ✓ {len(top_categories)} catégories")

        # ── 5) Comptes institutionnels ──

        # Admin plateforme
        admin, _ = User.objects.get_or_create(
            email="admin@pgpuss.bj",
            defaults={
                "first_name": "Admin", "last_name": "PGP-USS",
                "role": UserRole.ADMIN_PLATEFORME,
                "is_staff": True, "is_superuser": True,
            },
        )
        _set_password(admin, "admin123")
        if not admin.is_superuser or not admin.is_staff or admin.role != UserRole.ADMIN_PLATEFORME:
            admin.is_superuser = True
            admin.is_staff = True
            admin.role = UserRole.ADMIN_PLATEFORME
            admin.save(update_fields=["is_superuser", "is_staff", "role"])

        # PFE — CHU Cotonou
        pfe, _ = User.objects.get_or_create(
            email="pfe@pgpuss.bj",
            defaults={
                "first_name": "Narcisse", "last_name": "Agossou",
                "role": UserRole.PFE, "establishment": establishments[0],
            },
        )
        _set_password(pfe, "pfe123")

        # Agent interne — CHU Cotonou
        agent_interne, _ = User.objects.get_or_create(
            email="agent.interne@pgpuss.bj",
            defaults={
                "first_name": "Rodrigue", "last_name": "Gnangnan",
                "role": UserRole.AGENT_INTERNE, "establishment": establishments[0],
            },
        )
        _set_password(agent_interne, "agent123")

        # Directeur — CHU Cotonou
        directeur, _ = User.objects.get_or_create(
            email="directeur@pgpuss.bj",
            defaults={
                "first_name": "Dr. Sylvain", "last_name": "Dossou",
                "role": UserRole.DIRECTEUR_EST, "establishment": establishments[0],
            },
        )
        _set_password(directeur, "dir123")

        # PFZS — Zone Sanitaire Cotonou 1-2-3
        pfzs, _ = User.objects.get_or_create(
            email="pfzs@pgpuss.bj",
            defaults={
                "first_name": "Aurélie", "last_name": "Boco",
                "role": UserRole.PFZS,
                "zone_sanitaire": zone_map.get("ZS-LIT-1"),
            },
        )
        _set_password(pfzs, "pfzs123")

        # DDS — Littoral
        dds, _ = User.objects.get_or_create(
            email="dds@pgpuss.bj",
            defaults={
                "first_name": "Dr. Florent", "last_name": "Zannou",
                "role": UserRole.DDS, "departement": "Littoral",
            },
        )
        _set_password(dds, "dds123")

        # DQSS — National
        dqss, _ = User.objects.get_or_create(
            email="dqss@pgpuss.bj",
            defaults={
                "first_name": "DQSS", "last_name": "National",
                "role": UserRole.DQSS,
            },
        )
        _set_password(dqss, "dqss123")

        # Cabinet — Ministère
        cabinet, _ = User.objects.get_or_create(
            email="cabinet@pgpuss.bj",
            defaults={
                "first_name": "Cabinet", "last_name": "Ministère Santé",
                "role": UserRole.CABINET,
            },
        )
        _set_password(cabinet, "cab123")

        # Agent Call Center 136
        agent_cc, _ = User.objects.get_or_create(
            email="callcenter@pgpuss.bj",
            defaults={
                "first_name": "Élodie", "last_name": "Hounsou",
                "role": UserRole.AGENT_CALL_CENTER,
            },
        )
        _set_password(agent_cc, "cc136")

        # PNUSS — niveau zone (Cotonou 1-2-3)
        pnuss_zone, _ = User.objects.get_or_create(
            email="pnuss.zone@pgpuss.bj",
            defaults={
                "first_name": "Serge", "last_name": "Alowanou",
                "role": UserRole.PNUSS,
                "zone_sanitaire": zone_map.get("ZS-LIT-1"),
            },
        )
        _set_password(pnuss_zone, "pnuss123")

        # PNUSS — niveau national
        pnuss_nat, _ = User.objects.get_or_create(
            email="pnuss.national@pgpuss.bj",
            defaults={
                "first_name": "PNUSS", "last_name": "National",
                "role": UserRole.PNUSS,
            },
        )
        _set_password(pnuss_nat, "pnuss_nat123")

        # Usager (email + téléphone)
        usager, _ = User.objects.get_or_create(
            email="usager@pgpuss.bj",
            defaults={
                "first_name": "Fidèle", "last_name": "Adjahouinou",
                "role": UserRole.USAGER, "phone": "+22997000001",
            },
        )
        _set_password(usager, "usager123")

        # Usager (téléphone uniquement — sans email)
        usager_tel, _ = User.objects.get_or_create(
            phone="+22961000002",
            defaults={
                "first_name": "Aline", "last_name": "Tchégoun",
                "role": UserRole.USAGER,
            },
        )
        _set_password(usager_tel, "usager456")

        self.stdout.write(f"  ✓ 13 comptes créés/mis à jour")

        # ── 6) Plaintes de démonstration ──
        now = timezone.now()

        def make_complaint(
            *, title, description, category, priority, status,
            establishment, complainant, assigned_to=None,
            channel=ComplaintChannel.WEB, call_center_agent=None,
            complainant_name="", complainant_phone="",
            history=None, resolved=False, closed=False,
        ):
            defaults = {
                "description": description,
                "category": category,
                "priority": priority,
                "status": status,
                "establishment": establishment,
                "complainant": complainant,
                "assigned_to": assigned_to,
                "channel": channel,
                "call_center_agent": call_center_agent,
                "complainant_name": complainant_name,
                "complainant_phone": complainant_phone,
                "created_at": now - timedelta(days=random.randint(1, 30)),
            }
            comp, created = Complaint.objects.get_or_create(title=title, defaults=defaults)
            if not created:
                return comp

            comp.perform_nlp_analysis()
            comp.save(update_fields=["deadline", "priority"])

            if history:
                prev = ""
                for action, new_st, actor, notes in history:
                    ComplaintHistory.objects.create(
                        complaint=comp, action=action,
                        old_status=prev, new_status=new_st,
                        actor=actor, notes=notes,
                    )
                    prev = new_st

            if resolved:
                comp.status = ComplaintStatus.RESOLUE
                comp.resolved_at = timezone.now()
                comp.save(update_fields=["status", "resolved_at"])
            if closed:
                comp.status = ComplaintStatus.CLOTUREE
                comp.closed_at = timezone.now()
                comp.save(update_fields=["status", "closed_at"])

            if comp.complainant:
                Notification.objects.get_or_create(
                    user=comp.complainant, complaint=comp,
                    type=NotificationType.IN_APP,
                    defaults={
                        "title": f"Plainte {comp.ticket_number}",
                        "message": f"Statut : {comp.get_status_display()}",
                    },
                )
            return comp

        # Plainte 1 : cycle complet — clôturée
        c1 = make_complaint(
            title="Mauvais accueil à l'entrée",
            description="L'agent d'accueil a été irrespectueux et a refusé de m'orienter.",
            category=top_categories[1],
            priority=ComplaintPriority.P4_NORMAL,
            status=ComplaintStatus.EN_TRAITEMENT,
            establishment=establishments[0],
            complainant=usager,
            assigned_to=agent_interne,
            history=[
                ("Soumission", ComplaintStatus.SOUMISE, usager, "Plainte soumise via portail web"),
                ("Accusé de réception", ComplaintStatus.ACCUSEE, pfe, "Récépissé envoyé à l'usager"),
                ("Qualification", ComplaintStatus.INSTRUITE, pfe, "Catégorie P2 — Accueil & comportement"),
                ("Affectation", ComplaintStatus.AFFECTEE, pfe, "Assignée à l'agent interne"),
                ("Début traitement", ComplaintStatus.EN_TRAITEMENT, agent_interne, "Investigation interne lancée"),
            ],
            resolved=True, closed=True,
        )

        # Plainte 2 : cas critique — escalade DDS
        c2 = make_complaint(
            title="Incident grave aux urgences du CNHU",
            description="Décès suspect survenu après un retard de prise en charge aux urgences.",
            category=top_categories[6],
            priority=ComplaintPriority.P1_CRITIQUE,
            status=ComplaintStatus.ESCALADEE,
            establishment=establishments[0],
            complainant=usager,
            assigned_to=directeur,
            history=[
                ("Soumission", ComplaintStatus.SOUMISE, usager, "Plainte déposée en ligne"),
                ("Accusé de réception", ComplaintStatus.ACCUSEE, pfe, "Dossier d'urgence ouvert"),
                ("Qualification", ComplaintStatus.INSTRUITE, pfe, "Cas critique P7 — priorité maximale"),
                ("Escalade DDS", ComplaintStatus.ESCALADEE, directeur,
                 "Transmis à la DDS Littoral — dépasse le périmètre de l'établissement"),
                ("Arbitrage DDS", ComplaintStatus.ARBITREE, dds,
                 "Décision contraignante rendue. Enquête départementale déclenchée."),
            ],
            closed=True,
        )

        # Plainte 3 : Call Center 136 — transcription par l'agent
        c3 = make_complaint(
            title="Attente excessive à la pharmacie du CHU",
            description=(
                "L'usager signale avoir attendu plus de 3 heures à la pharmacie "
                "du CHU de Cotonou pour obtenir ses médicaments prescrits. "
                "Transcription fidèle de l'appel reçu au 136."
            ),
            category=top_categories[5],
            priority=ComplaintPriority.P3_ELEVE,
            status=ComplaintStatus.SOUMISE,
            establishment=establishments[0],
            complainant=None,
            complainant_name="Mme Célestine Akpokpo",
            complainant_phone="+22967123456",
            channel=ComplaintChannel.CALL_CENTER,
            call_center_agent=agent_cc,
            history=[
                ("Réception appel 136", ComplaintStatus.SOUMISE, agent_cc,
                 "Plainte transcrite par l'agent call center suite à l'appel de Mme Akpokpo au 136."),
            ],
        )

        # Plainte 4 : usager sans email (téléphone seul), via mobile
        c4 = make_complaint(
            title="Refus de soins sans explication à l'HZ Abomey-Calavi",
            description="Le personnel soignant a refusé de m'examiner sans me donner de raison valable.",
            category=top_categories[2],
            priority=ComplaintPriority.P2_URGENT,
            status=ComplaintStatus.ACCUSEE,
            establishment=establishments[6],
            complainant=usager_tel,
            channel=ComplaintChannel.MOBILE,
            history=[
                ("Soumission mobile", ComplaintStatus.SOUMISE, usager_tel,
                 "Plainte soumise via l'application mobile (usager sans email)"),
                ("Accusé de réception", ComplaintStatus.ACCUSEE, None, "Accusé de réception automatique"),
            ],
        )

        self.stdout.write(f"  ✓ 4 plaintes de démonstration")

        # Satisfaction (plainte clôturée uniquement)
        for comp in [c1]:
            if comp.complainant and not SatisfactionSurvey.objects.filter(complaint=comp).exists():
                SatisfactionSurvey.objects.create(
                    complaint=comp,
                    user=comp.complainant,
                    rating=random.randint(3, 5),
                    nps_score=random.randint(6, 10),
                    comment="Merci pour le traitement rapide et professionnel.",
                )

        # ── Récapitulatif ──
        self.stdout.write("")
        self.stdout.write(self.style.SUCCESS("  🎉 Seed workflow Bénin terminé avec succès !"))
        self.stdout.write("")
        self.stdout.write("  ╔═══════════════════════════════════════════════════════════╗")
        self.stdout.write("  ║              COMPTES DE DÉMONSTRATION PGP-USS             ║")
        self.stdout.write("  ╠════════════════════╦══════════════════════════╦═══════════╣")
        self.stdout.write("  ║  Rôle              ║  Identifiant             ║  Mot passe║")
        self.stdout.write("  ╠════════════════════╬══════════════════════════╬═══════════╣")
        self.stdout.write("  ║  Admin plateforme  ║  admin@pgpuss.bj         ║  admin123 ║")
        self.stdout.write("  ║  PFE (Cotonou)     ║  pfe@pgpuss.bj           ║  pfe123   ║")
        self.stdout.write("  ║  Agent interne     ║  agent.interne@pgpuss.bj ║  agent123 ║")
        self.stdout.write("  ║  Directeur         ║  directeur@pgpuss.bj     ║  dir123   ║")
        self.stdout.write("  ║  PFZS (ZS Cotonou) ║  pfzs@pgpuss.bj          ║  pfzs123  ║")
        self.stdout.write("  ║  DDS Littoral      ║  dds@pgpuss.bj           ║  dds123   ║")
        self.stdout.write("  ║  DQSS              ║  dqss@pgpuss.bj          ║  dqss123  ║")
        self.stdout.write("  ║  Cabinet           ║  cabinet@pgpuss.bj       ║  cab123   ║")
        self.stdout.write("  ║  Call Center 136   ║  callcenter@pgpuss.bj    ║  cc136    ║")
        self.stdout.write("  ║  PNUSS Zone        ║  pnuss.zone@pgpuss.bj    ║  pnuss123 ║")
        self.stdout.write("  ║  PNUSS National    ║  pnuss.national@pgpuss.bj║  pnuss_nat123║")
        self.stdout.write("  ║  Usager (email)    ║  usager@pgpuss.bj        ║  usager123║")
        self.stdout.write("  ║  Usager (tél seul) ║  +22961000002            ║  usager456║")
        self.stdout.write("  ╚════════════════════╩══════════════════════════╩═══════════╝")
