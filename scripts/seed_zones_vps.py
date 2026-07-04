"""
Seed des 34 zones sanitaires officielles du Bénin.
Décret n° 2022-148 du 02 mars 2022.

Usage (depuis le VPS):
  docker exec -i pgpuss-backend python manage.py shell < /root/pgpuss/scripts/seed_zones_vps.py
"""
from establishments.models import Region, ZoneSanitaire, Establishment, EstablishmentType

REGIONS_DATA = [
    ("Alibori", "ALI"), ("Atacora", "ATA"), ("Atlantique", "ATL"),
    ("Borgou", "BOR"), ("Collines", "COL"), ("Couffo", "COU"),
    ("Donga", "DON"), ("Littoral", "LIT"), ("Mono", "MON"),
    ("Ouémé", "OUE"), ("Plateau", "PLA"), ("Zou", "ZOU"),
]
region_map = {}
for name, code in REGIONS_DATA:
    r, _ = Region.objects.get_or_create(code=code, defaults={"name": name})
    region_map[code] = r

ZONES_DATA = [
    # ALIBORI
    ("Zone Sanitaire Malanville-Karimama", "ZS-ALI-1", "ALI", "Malanville, Karimama", "Hôpital de Zone de Malanville", "HZ"),
    ("Zone Sanitaire Kandi-Gogounou-Ségbana", "ZS-ALI-2", "ALI", "Kandi, Gogounou, Ségbana", "Hôpital de Zone de Kandi", "HZ"),
    ("Zone Sanitaire Banikoara", "ZS-ALI-3", "ALI", "Banikoara", "Hôpital de Zone de Banikoara", "HZ"),
    
    # BORGOU
    ("Zone Sanitaire Bembèrèkè-Sinendé", "ZS-BOR-1", "BOR", "Bembèrèkè, Sinendé", "Hôpital de Zone de Bembèrèkè", "HZ"),
    ("Zone Sanitaire Nikki-Kalalé-Pèrèrè", "ZS-BOR-2", "BOR", "Nikki, Kalalé, Pèrèrè", "Hôpital de Zone de Nikki", "HZ"),
    ("Zone Sanitaire Parakou-N'Dali", "ZS-BOR-3", "BOR", "Parakou, N'Dali", "CHU de Parakou", "CHU"),
    ("Zone Sanitaire Tchaourou", "ZS-BOR-4", "BOR", "Tchaourou", "Hôpital de Zone de Tchaourou", "HZ"),
    
    # ATACORA
    ("Zone Sanitaire Tanguiéta-Cobly-Matéri", "ZS-ATA-1", "ATA", "Tanguiéta, Cobly, Matéri", "Hôpital Saint-Jean de Dieu de Tanguiéta", "HZ"),
    ("Zone Sanitaire Natitingou-Boukoumbé-Toucountounai", "ZS-ATA-2", "ATA", "Natitingou, Boukoumbé, Toucountounai", "CHR Atacora-Donga", "CHR"),
    ("Zone Sanitaire Kouandé-Oussa-Péhunco-Kérou", "ZS-ATA-3", "ATA", "Kouandé, Oussa, Péhunco, Kérou", "Hôpital de Zone de Kouandé", "HZ"),
    
    # DONGA
    ("Zone Sanitaire Bassila", "ZS-DON-1", "DON", "Bassila", "Hôpital de Zone de Bassila", "HZ"),
    ("Zone Sanitaire Djougou-Copargo-Ouaké", "ZS-DON-2", "DON", "Djougou, Copargo, Ouaké", "Hôpital de Zone de Djougou", "HZ"),
    
    # ZOU
    ("Zone Sanitaire Djidja-Abomey-Agbangnizoun", "ZS-ZOU-1", "ZOU", "Djidja, Abomey, Agbangnizoun", "Hôpital de Zone d'Abomey", "HZ"),
    ("Zone Sanitaire Bohicon-Zakpota-Zogbodomey", "ZS-ZOU-2", "ZOU", "Bohicon, Zakpota, Zogbodomey", "Hôpital de Zone de Bohicon", "HZ"),
    ("Zone Sanitaire Covè-Ouinhi-Zangnado", "ZS-ZOU-3", "ZOU", "Covè, Ouinhi, Zangnado", "Hôpital de Zone de Covè", "HZ"),
    
    # COLLINES
    ("Zone Sanitaire Dassa-Zoumè-Glazoué", "ZS-COL-1", "COL", "Dassa-Zoumè, Glazoué", "Hôpital de Zone de Dassa-Zoumè", "HZ"),
    ("Zone Sanitaire Savalou-Bantè", "ZS-COL-2", "COL", "Savalou, Bantè", "Hôpital de Zone de Savalou", "HZ"),
    ("Zone Sanitaire Savè-Ouèssè", "ZS-COL-3", "COL", "Savè, Ouèssè", "Hôpital de Zone de Savè", "HZ"),
    
    # MONO
    ("Zone Sanitaire Lokossa-Athiémé", "ZS-MON-1", "MON", "Lokossa, Athiémé", "Hôpital de Zone de Lokossa", "HZ"),
    ("Zone Sanitaire Comè-Bopa-Houéyogbé-Grand-Popo", "ZS-MON-2", "MON", "Comè, Bopa, Houéyogbé, Grand-Popo", "Hôpital de Zone de Comè", "HZ"),
    
    # COUFFO
    ("Zone Sanitaire Aplahoué-Djakotomé-Dogbo", "ZS-COU-1", "COU", "Aplahoué, Djakotomé, Dogbo", "Hôpital de Zone d'Aplahoué", "HZ"),
    ("Zone Sanitaire Klouékanmè-Toviklin-Lalo", "ZS-COU-2", "COU", "Klouékanmè, Toviklin, Lalo", "Hôpital de Zone de Klouékanmè", "HZ"),
    
    # OUÉMÉ
    ("Zone Sanitaire Adjohoun-Bonou-Dangbo", "ZS-OUE-1", "OUE", "Adjohoun, Bonou, Dangbo", "Hôpital de Zone d'Adjohoun", "HZ"),
    ("Zone Sanitaire Avrankou-Adjarra-Akpro-Missérété", "ZS-OUE-2", "OUE", "Avrankou, Adjarra, Akpro-Missérété", "Hôpital de Zone d'Akpro-Missérété", "HZ"),
    ("Zone Sanitaire Porto-Novo-Aguégués-Sèmè-Podji", "ZS-OUE-3", "OUE", "Porto-Novo, Aguégués, Sèmè-Podji", "CHD Ouémé-Plateau", "CHR"),
    
    # PLATEAU
    ("Zone Sanitaire Pobè-Kétou-Adja-Ouèrè", "ZS-PLA-1", "PLA", "Pobè, Kétou, Adja-Ouèrè", "Hôpital de Zone de Pobè", "HZ"),
    ("Zone Sanitaire Sakété-Ifangni", "ZS-PLA-2", "PLA", "Sakété, Ifangni", "Hôpital de Zone de Sakété", "HZ"),
    
    # ATLANTIQUE
    ("Zone Sanitaire Allada-Toffo-Zê", "ZS-ATL-1", "ATL", "Allada, Toffo, Zê", "Hôpital de Zone d'Allada", "HZ"),
    ("Zone Sanitaire Abomey-Calavi-Sô-Ava", "ZS-ATL-2", "ATL", "Abomey-Calavi, Sô-Ava", "Hôpital de Zone d'Abomey-Calavi", "HZ"),
    ("Zone Sanitaire Ouidah-Kpomassè-Tori-Bossito", "ZS-ATL-3", "ATL", "Ouidah, Kpomassè, Tori-Bossito", "Hôpital de Zone de Ouidah", "HZ"),
    
    # LITTORAL
    ("Zone Sanitaire Cotonou 1 et 4", "ZS-LIT-1", "LIT", "Cotonou 1, Cotonou 4", "Centre de Santé Cotonou 1 et 4", "CS"),
    ("Zone Sanitaire Cotonou 2 et 3", "ZS-LIT-2", "LIT", "Cotonou 2, Cotonou 3", "CHU de Cotonou (CNHU-HKM)", "CHU"),
    ("Zone Sanitaire Cotonou 5", "ZS-LIT-3", "LIT", "Cotonou 5", "Hôpital de la Mère et de l'Enfant", "HZ"),
    ("Zone Sanitaire Cotonou 6", "ZS-LIT-4", "LIT", "Cotonou 6", "Centre de Santé Cotonou 6", "CS"),
]

# On vide les anciennes données pour être sûr de repartir à neuf
ZoneSanitaire.objects.all().delete()

zones_created = 0
hospitals_created = 0

for name, code, rcode, communes, hz_name, hz_type in ZONES_DATA:
    region = region_map[rcode]
    z, _ = ZoneSanitaire.objects.update_or_create(
        code=code,
        defaults={"name": name, "region": region, "communes": communes, "is_active": True},
    )
    zones_created += 1

    hz, hz_created = Establishment.objects.get_or_create(
        name=hz_name,
        defaults={"type": hz_type, "region": region, "zone_sanitaire": z, "is_active": True},
    )
    if not hz_created and not hz.zone_sanitaire:
        hz.zone_sanitaire = z
        hz.save(update_fields=["zone_sanitaire"])
    if hz_created:
        hospitals_created += 1

print(f"🎉 {zones_created} zones créées (avec les bons noms !), {hospitals_created} hôpitaux créés")
