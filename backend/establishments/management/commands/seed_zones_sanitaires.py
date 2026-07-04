"""
Seed des 34 zones sanitaires officielles du Bénin.
Basé sur le Décret n° 2022-148 du 02 mars 2022 portant organisation
de la pyramide sanitaire en République du Bénin.

Usage:
    python manage.py seed_zones_sanitaires
    python manage.py seed_zones_sanitaires --with-hospitals
"""
from django.core.management.base import BaseCommand
from establishments.models import Region, ZoneSanitaire, Establishment, EstablishmentType


class Command(BaseCommand):
    help = "Seed des 34 zones sanitaires officielles du Bénin (décret 2022-148)"

    def add_arguments(self, parser):
        parser.add_argument(
            '--with-hospitals',
            action='store_true',
            help='Crée aussi les hôpitaux de zone de référence.',
        )

    def handle(self, *args, **options):
        self.stdout.write("🏥 Seed des zones sanitaires du Bénin (décret 2022-148)...")

        # ── 1) Les 12 départements ──────────────────────────────────────────
        REGIONS = [
            ("Alibori",    "ALI"),
            ("Atacora",    "ATA"),
            ("Atlantique", "ATL"),
            ("Borgou",     "BOR"),
            ("Collines",   "COL"),
            ("Couffo",     "COU"),
            ("Donga",      "DON"),
            ("Littoral",   "LIT"),
            ("Mono",       "MON"),
            ("Ouémé",      "OUE"),
            ("Plateau",    "PLA"),
            ("Zou",        "ZOU"),
        ]
        region_map = {}
        for name, code in REGIONS:
            r, created = Region.objects.get_or_create(
                code=code, defaults={"name": name}
            )
            if created:
                self.stdout.write(f"  + Région : {name}")
            region_map[code] = r
        self.stdout.write(f"  ✓ {len(REGIONS)} départements prêts")

        # ── 2) Les 34 zones sanitaires officielles ──────────────────────────
        # Format : (nom, code, code_region, communes, hôpital_de_zone)
        ZONES = [
            # ALIBORI (3 ZS)
            (
                "Zone Sanitaire Banikoara",
                "ZS-ALI-1", "ALI",
                "Banikoara",
                "Hôpital de Zone de Banikoara",
            ),
            (
                "Zone Sanitaire Gogounou/Ségbana",
                "ZS-ALI-2", "ALI",
                "Gogounou, Ségbana",
                "Hôpital de Zone de Gogounou",
            ),
            (
                "Zone Sanitaire Kandi/Malanville/Karimama",
                "ZS-ALI-3", "ALI",
                "Kandi, Malanville, Karimama",
                "Hôpital de Zone de Kandi",
            ),

            # ATACORA (3 ZS)
            (
                "Zone Sanitaire Cobly/Boukoumbé/Matéri/Tanguiéta",
                "ZS-ATA-1", "ATA",
                "Cobly, Boukoumbé, Matéri, Tanguiéta",
                "Hôpital Saint-Jean de Dieu de Tanguiéta",
            ),
            (
                "Zone Sanitaire Kérou/Kouandé/Péhunco",
                "ZS-ATA-2", "ATA",
                "Kérou, Kouandé, Péhunco",
                "Hôpital de Zone de Kouandé",
            ),
            (
                "Zone Sanitaire Djougou/Copargo/Ouaké",
                "ZS-ATA-3", "ATA",
                "Djougou, Copargo, Ouaké",
                "Hôpital de Zone de Djougou",
            ),

            # ATLANTIQUE (5 ZS)
            (
                "Zone Sanitaire Abomey-Calavi/So-Ava",
                "ZS-ATL-1", "ATL",
                "Abomey-Calavi, So-Ava",
                "Hôpital de Zone d'Abomey-Calavi",
            ),
            (
                "Zone Sanitaire Allada/Kpomassè/Toffo",
                "ZS-ATL-2", "ATL",
                "Allada, Kpomassè, Toffo",
                "Hôpital de Zone d'Allada",
            ),
            (
                "Zone Sanitaire Ouidah/Kpomassè",
                "ZS-ATL-3", "ATL",
                "Ouidah, Kpomassè",
                "Hôpital de Zone de Ouidah",
            ),
            (
                "Zone Sanitaire Tori-Bossito/Zê",
                "ZS-ATL-4", "ATL",
                "Tori-Bossito, Zê",
                "Centre de Santé de Tori-Bossito (référence de zone)",
            ),
            (
                "Zone Sanitaire Sô-Ava/Abomey-Calavi Nord",
                "ZS-ATL-5", "ATL",
                "Sô-Ava, Abomey-Calavi Nord",
                "Hôpital de Zone de Sô-Ava",
            ),

            # BORGOU (4 ZS)
            (
                "Zone Sanitaire Parakou/N'Dali",
                "ZS-BOR-1", "BOR",
                "Parakou, N'Dali",
                "CHU de Parakou",
            ),
            (
                "Zone Sanitaire Bembéréké/Sinendé",
                "ZS-BOR-2", "BOR",
                "Bembéréké, Sinendé",
                "Hôpital de Zone de Bembéréké",
            ),
            (
                "Zone Sanitaire Nikki/Kalalé/Pèrèrè",
                "ZS-BOR-3", "BOR",
                "Nikki, Kalalé, Pèrèrè",
                "Hôpital de Zone de Nikki",
            ),
            (
                "Zone Sanitaire Tchaourou",
                "ZS-BOR-4", "BOR",
                "Tchaourou",
                "Hôpital de Zone de Tchaourou",
            ),

            # COLLINES (3 ZS)
            (
                "Zone Sanitaire Dassa-Zoumè/Glazoué",
                "ZS-COL-1", "COL",
                "Dassa-Zoumè, Glazoué",
                "Hôpital de Zone de Dassa-Zoumè",
            ),
            (
                "Zone Sanitaire Bantè/Savalou",
                "ZS-COL-2", "COL",
                "Bantè, Savalou",
                "Hôpital de Zone de Savalou",
            ),
            (
                "Zone Sanitaire Ouèssè/Savè",
                "ZS-COL-3", "COL",
                "Ouèssè, Savè",
                "Hôpital de Zone de Savè",
            ),

            # COUFFO (2 ZS)
            (
                "Zone Sanitaire Aplahoué/Djakotomè/Dogbo",
                "ZS-COU-1", "COU",
                "Aplahoué, Djakotomè, Dogbo",
                "Hôpital de Zone d'Aplahoué",
            ),
            (
                "Zone Sanitaire Klouékanmè/Lalo/Toviklin",
                "ZS-COU-2", "COU",
                "Klouékanmè, Lalo, Toviklin",
                "Hôpital de Zone de Klouékanmè",
            ),

            # DONGA (2 ZS)
            (
                "Zone Sanitaire Bassila",
                "ZS-DON-1", "DON",
                "Bassila",
                "Hôpital de Zone de Bassila",
            ),
            (
                "Zone Sanitaire Natitingou/Boukoumbé",
                "ZS-DON-2", "DON",
                "Natitingou, Boukoumbé",
                "Centre Hospitalier Régional Atacora-Donga (Natitingou)",
            ),

            # LITTORAL (2 ZS)
            (
                "Zone Sanitaire Cotonou 1/2/3",
                "ZS-LIT-1", "LIT",
                "Cotonou 1er, Cotonou 2e, Cotonou 3e",
                "CHU de Cotonou (CNHU-HKM)",
            ),
            (
                "Zone Sanitaire Cotonou 4/5/6",
                "ZS-LIT-2", "LIT",
                "Cotonou 4e, Cotonou 5e, Cotonou 6e",
                "Hôpital de la Mère et de l'Enfant (HME) - Lagune",
            ),

            # MONO (2 ZS)
            (
                "Zone Sanitaire Lokossa/Athiémé",
                "ZS-MON-1", "MON",
                "Lokossa, Athiémé",
                "Hôpital de Zone de Lokossa",
            ),
            (
                "Zone Sanitaire Comè/Bopa/Grand-Popo/Houéyogbé",
                "ZS-MON-2", "MON",
                "Comè, Bopa, Grand-Popo, Houéyogbé",
                "Hôpital de Zone de Comè",
            ),

            # OUÉMÉ (4 ZS)
            (
                "Zone Sanitaire Porto-Novo/Aguégués/Sèmè-Kpodji",
                "ZS-OUE-1", "OUE",
                "Porto-Novo, Aguégués, Sèmè-Kpodji",
                "Centre Hospitalier Départemental Ouémé-Plateau (Porto-Novo)",
            ),
            (
                "Zone Sanitaire Adjohoun/Dangbo/Bonou",
                "ZS-OUE-2", "OUE",
                "Adjohoun, Dangbo, Bonou",
                "Hôpital de Zone d'Adjohoun",
            ),
            (
                "Zone Sanitaire Akpro-Missérété/Avrankou/Adjarra",
                "ZS-OUE-3", "OUE",
                "Akpro-Missérété, Avrankou, Adjarra",
                "Hôpital de Zone d'Akpro-Missérété",
            ),
            (
                "Zone Sanitaire Ifangni/Sakété/Kétou/Pobè",
                "ZS-OUE-4", "OUE",
                "Ifangni, Sakété, Kétou, Pobè",
                "Hôpital de Zone de Sakété",
            ),

            # PLATEAU (2 ZS)
            (
                "Zone Sanitaire Adja-Ouèrè/Kétou/Pobè",
                "ZS-PLA-1", "PLA",
                "Adja-Ouèrè, Kétou, Pobè",
                "Hôpital de Zone de Pobè",
            ),
            (
                "Zone Sanitaire Ifangni/Sakété",
                "ZS-PLA-2", "PLA",
                "Ifangni, Sakété",
                "Hôpital de Zone d'Ifangni",
            ),

            # ZOU (3 ZS)
            (
                "Zone Sanitaire Abomey/Agbangnizoun/Zogbodomey",
                "ZS-ZOU-1", "ZOU",
                "Abomey, Agbangnizoun, Zogbodomey",
                "Hôpital de Zone d'Abomey",
            ),
            (
                "Zone Sanitaire Bohicon/Zakpota/Zogbodomey",
                "ZS-ZOU-2", "ZOU",
                "Bohicon, Zakpota, Zogbodomey",
                "Hôpital de Zone de Bohicon",
            ),
            (
                "Zone Sanitaire Covè/Ouinhi/Za-Kpota/Djidja",
                "ZS-ZOU-3", "ZOU",
                "Covè, Ouinhi, Za-Kpota, Djidja",
                "Hôpital de Zone de Covè",
            ),
        ]

        zones_created = 0
        zones_updated = 0
        zone_map = {}

        for name, code, rcode, communes, hz_name in ZONES:
            region = region_map[rcode]
            z, created = ZoneSanitaire.objects.update_or_create(
                code=code,
                defaults={
                    "name": name,
                    "region": region,
                    "communes": communes,
                    "is_active": True,
                },
            )
            if created:
                zones_created += 1
                self.stdout.write(f"  + {name}")
            else:
                zones_updated += 1
            zone_map[code] = (z, hz_name)

        self.stdout.write(
            f"  ✓ {zones_created} zones créées, {zones_updated} mises à jour "
            f"(total : {len(ZONES)} zones sanitaires)"
        )

        # ── 3) Hôpitaux de zone (optionnel) ────────────────────────────────
        if options['with_hospitals']:
            self.stdout.write("\n  🏨 Création des hôpitaux de zone...")
            hospitals_created = 0
            for code, (zone, hz_name) in zone_map.items():
                # Détermine le type selon le nom
                if "CHU" in hz_name:
                    etype = EstablishmentType.CHU
                elif "CHR" in hz_name or "CHD" in hz_name or "Centre Hospitalier Régional" in hz_name or "Centre Hospitalier Départemental" in hz_name:
                    etype = EstablishmentType.CHR
                else:
                    etype = EstablishmentType.HZ

                hz, created = Establishment.objects.get_or_create(
                    name=hz_name,
                    defaults={
                        "type": etype,
                        "region": zone.region,
                        "zone_sanitaire": zone,
                        "is_active": True,
                    },
                )
                # Met à jour le lien zone si l'hôpital existait déjà sans zone
                if not created and not hz.zone_sanitaire:
                    hz.zone_sanitaire = zone
                    hz.save(update_fields=["zone_sanitaire"])

                if created:
                    hospitals_created += 1
                    self.stdout.write(f"    + {hz_name} ({zone.name})")

            self.stdout.write(f"  ✓ {hospitals_created} hôpitaux de zone créés")

        # ── Récapitulatif ───────────────────────────────────────────────────
        self.stdout.write("")
        self.stdout.write(self.style.SUCCESS(
            "🎉 Seed des zones sanitaires terminé !\n"
            f"   {ZoneSanitaire.objects.count()} zones sanitaires au total dans la base."
        ))
        if not options['with_hospitals']:
            self.stdout.write(
                "   💡 Pour créer aussi les hôpitaux de zone : "
                "python manage.py seed_zones_sanitaires --with-hospitals"
            )
