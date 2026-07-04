"""
Seed des 34 zones sanitaires officielles du Bénin.
Décret n° 2022-148 du 02 mars 2022.

Copiez-collez ce fichier sur le VPS puis exécutez :
  docker compose exec backend python manage.py shell < /scripts/seed_zones_vps.py
OU copiez le contenu et collez-le dans :
  docker compose exec backend python manage.py shell
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
    # (nom, code, region_code, communes, hôpital_de_zone, type_hôpital)
    # ALIBORI
    ("Zone Sanitaire Banikoara", "ZS-ALI-1", "ALI", "Banikoara", "Hôpital de Zone de Banikoara", "HZ"),
    ("Zone Sanitaire Gogounou/Ségbana", "ZS-ALI-2", "ALI", "Gogounou, Ségbana", "Hôpital de Zone de Gogounou", "HZ"),
    ("Zone Sanitaire Kandi/Malanville/Karimama", "ZS-ALI-3", "ALI", "Kandi, Malanville, Karimama", "Hôpital de Zone de Kandi", "HZ"),
    # ATACORA
    ("Zone Sanitaire Cobly/Boukoumbé/Matéri/Tanguiéta", "ZS-ATA-1", "ATA", "Cobly, Boukoumbé, Matéri, Tanguiéta", "Hôpital Saint-Jean de Dieu de Tanguiéta", "HZ"),
    ("Zone Sanitaire Kérou/Kouandé/Péhunco", "ZS-ATA-2", "ATA", "Kérou, Kouandé, Péhunco", "Hôpital de Zone de Kouandé", "HZ"),
    ("Zone Sanitaire Djougou/Copargo/Ouaké", "ZS-ATA-3", "ATA", "Djougou, Copargo, Ouaké", "Hôpital de Zone de Djougou", "HZ"),
    # ATLANTIQUE
    ("Zone Sanitaire Abomey-Calavi/So-Ava", "ZS-ATL-1", "ATL", "Abomey-Calavi, So-Ava", "Hôpital de Zone d'Abomey-Calavi", "HZ"),
    ("Zone Sanitaire Allada/Kpomassè/Toffo", "ZS-ATL-2", "ATL", "Allada, Kpomassè, Toffo", "Hôpital de Zone d'Allada", "HZ"),
    ("Zone Sanitaire Ouidah/Kpomassè", "ZS-ATL-3", "ATL", "Ouidah, Kpomassè", "Hôpital de Zone de Ouidah", "HZ"),
    ("Zone Sanitaire Tori-Bossito/Zê", "ZS-ATL-4", "ATL", "Tori-Bossito, Zê", "Centre de Santé de Tori-Bossito", "CS"),
    # BORGOU
    ("Zone Sanitaire Parakou/N'Dali", "ZS-BOR-1", "BOR", "Parakou, N'Dali", "CHU de Parakou", "CHU"),
    ("Zone Sanitaire Bembéréké/Sinendé", "ZS-BOR-2", "BOR", "Bembéréké, Sinendé", "Hôpital de Zone de Bembéréké", "HZ"),
    ("Zone Sanitaire Nikki/Kalalé/Pèrèrè", "ZS-BOR-3", "BOR", "Nikki, Kalalé, Pèrèrè", "Hôpital de Zone de Nikki", "HZ"),
    ("Zone Sanitaire Tchaourou", "ZS-BOR-4", "BOR", "Tchaourou", "Hôpital de Zone de Tchaourou", "HZ"),
    # COLLINES
    ("Zone Sanitaire Dassa-Zoumè/Glazoué", "ZS-COL-1", "COL", "Dassa-Zoumè, Glazoué", "Hôpital de Zone de Dassa-Zoumè", "HZ"),
    ("Zone Sanitaire Bantè/Savalou", "ZS-COL-2", "COL", "Bantè, Savalou", "Hôpital de Zone de Savalou", "HZ"),
    ("Zone Sanitaire Ouèssè/Savè", "ZS-COL-3", "COL", "Ouèssè, Savè", "Hôpital de Zone de Savè", "HZ"),
    # COUFFO
    ("Zone Sanitaire Aplahoué/Djakotomè/Dogbo", "ZS-COU-1", "COU", "Aplahoué, Djakotomè, Dogbo", "Hôpital de Zone d'Aplahoué", "HZ"),
    ("Zone Sanitaire Klouékanmè/Lalo/Toviklin", "ZS-COU-2", "COU", "Klouékanmè, Lalo, Toviklin", "Hôpital de Zone de Klouékanmè", "HZ"),
    # DONGA
    ("Zone Sanitaire Bassila", "ZS-DON-1", "DON", "Bassila", "Hôpital de Zone de Bassila", "HZ"),
    ("Zone Sanitaire Natitingou/Boukoumbé", "ZS-DON-2", "DON", "Natitingou, Boukoumbé", "CHR Atacora-Donga (Natitingou)", "CHR"),
    # LITTORAL
    ("Zone Sanitaire Cotonou 1/2/3", "ZS-LIT-1", "LIT", "Cotonou 1er, Cotonou 2e, Cotonou 3e", "CHU de Cotonou (CNHU-HKM)", "CHU"),
    ("Zone Sanitaire Cotonou 4/5/6", "ZS-LIT-2", "LIT", "Cotonou 4e, Cotonou 5e, Cotonou 6e", "Hôpital de la Mère et de l'Enfant - Lagune", "HZ"),
    # MONO
    ("Zone Sanitaire Lokossa/Athiémé", "ZS-MON-1", "MON", "Lokossa, Athiémé", "Hôpital de Zone de Lokossa", "HZ"),
    ("Zone Sanitaire Comè/Bopa/Grand-Popo/Houéyogbé", "ZS-MON-2", "MON", "Comè, Bopa, Grand-Popo, Houéyogbé", "Hôpital de Zone de Comè", "HZ"),
    # OUÉMÉ
    ("Zone Sanitaire Porto-Novo/Aguégués/Sèmè-Kpodji", "ZS-OUE-1", "OUE", "Porto-Novo, Aguégués, Sèmè-Kpodji", "CHD Ouémé-Plateau (Porto-Novo)", "CHR"),
    ("Zone Sanitaire Adjohoun/Dangbo/Bonou", "ZS-OUE-2", "OUE", "Adjohoun, Dangbo, Bonou", "Hôpital de Zone d'Adjohoun", "HZ"),
    ("Zone Sanitaire Akpro-Missérété/Avrankou/Adjarra", "ZS-OUE-3", "OUE", "Akpro-Missérété, Avrankou, Adjarra", "Hôpital de Zone d'Akpro-Missérété", "HZ"),
    ("Zone Sanitaire Ifangni/Sakété/Kétou/Pobè", "ZS-OUE-4", "OUE", "Ifangni, Sakété, Kétou, Pobè", "Hôpital de Zone de Sakété", "HZ"),
    # PLATEAU
    ("Zone Sanitaire Adja-Ouèrè/Kétou/Pobè", "ZS-PLA-1", "PLA", "Adja-Ouèrè, Kétou, Pobè", "Hôpital de Zone de Pobè", "HZ"),
    ("Zone Sanitaire Ifangni/Sakété", "ZS-PLA-2", "PLA", "Ifangni, Sakété", "Hôpital de Zone d'Ifangni", "HZ"),
    # ZOU
    ("Zone Sanitaire Abomey/Agbangnizoun/Zogbodomey", "ZS-ZOU-1", "ZOU", "Abomey, Agbangnizoun, Zogbodomey", "Hôpital de Zone d'Abomey", "HZ"),
    ("Zone Sanitaire Bohicon/Zakpota/Zogbodomey", "ZS-ZOU-2", "ZOU", "Bohicon, Zakpota, Zogbodomey", "Hôpital de Zone de Bohicon", "HZ"),
    ("Zone Sanitaire Covè/Ouinhi/Za-Kpota/Djidja", "ZS-ZOU-3", "ZOU", "Covè, Ouinhi, Za-Kpota, Djidja", "Hôpital de Zone de Covè", "HZ"),
]

zones_created = 0
hospitals_created = 0

for name, code, rcode, communes, hz_name, hz_type in ZONES_DATA:
    region = region_map[rcode]
    z, created = ZoneSanitaire.objects.update_or_create(
        code=code,
        defaults={"name": name, "region": region, "communes": communes, "is_active": True},
    )
    if created:
        zones_created += 1
        print(f"  ✓ {name}")

    hz, hz_created = Establishment.objects.get_or_create(
        name=hz_name,
        defaults={"type": hz_type, "region": region, "zone_sanitaire": z, "is_active": True},
    )
    if not hz_created and not hz.zone_sanitaire:
        hz.zone_sanitaire = z
        hz.save(update_fields=["zone_sanitaire"])
    if hz_created:
        hospitals_created += 1

print(f"\n🎉 {zones_created} zones créées, {hospitals_created} hôpitaux créés")
print(f"   Total zones : {ZoneSanitaire.objects.count()}")
print(f"   Total hôpitaux : {Establishment.objects.count()}")
