"""
Script de peuplement de la base de données PGP-USS.
Exécution : python backend/manage.py shell < backend/scripts/populate_benin_db.py

Crée :
  - 12 régions (départements du Bénin)
  - 34 zones sanitaires
  - Établissements nationaux, CHD, HZ et CS principaux
  - Utilisateurs par rôle (PFE, PFZS, DDS, DQSS, CABINET, PNUSS, Admin, Call Center)

Mot de passe par défaut : Pgpuss2026!
"""
import django
import os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

from establishments.models import (
    Region, ZoneSanitaire, Establishment,
    EstablishmentType, EstablishmentLevel, EstablishmentOperationalStatus
)
from accounts.models import User, UserRole
from complaints.models import Category, Complaint, ComplaintStatus

PASSWORD = 'Pgpuss2026!'


def get_or_create_user(email, first_name, last_name, role,
                        establishment=None, zone=None, departement=None):
    user, created = User.objects.get_or_create(
        email=email,
        defaults=dict(
            first_name=first_name, last_name=last_name,
            role=role, is_active=True,
            establishment=establishment,
            zone_sanitaire=zone,
            departement=departement,
        )
    )
    if created:
        user.set_password(PASSWORD)
        user.must_change_password = True
        user.save()
        print(f'  [+] {role}: {email}')
    return user


print('=== Peuplement PGP-USS ===')

# ─── RÉGIONS (Départements) ─────────────────────────────────────────────────
REGIONS = [
    ('Alibori', 'AL'), ('Atacora', 'AT'), ('Atlantique', 'ATL'),
    ('Borgou', 'BO'), ('Collines', 'CO'), ('Couffo', 'CF'),
    ('Donga', 'DO'), ('Littoral', 'LI'), ('Mono', 'MO'),
    ('Ouémé', 'OU'), ('Plateau', 'PL'), ('Zou', 'ZO'),
]

regions = {}
for name, code in REGIONS:
    r, _ = Region.objects.get_or_create(code=code, defaults={'name': name})
    regions[code] = r
    print(f'  Région: {name}')

# ─── ZONES SANITAIRES ────────────────────────────────────────────────────────
ZONES = [
    # (code, name, region_code, communes)
    ('ZS-BAN', 'Banikoara', 'AL', 'Banikoara'),
    ('ZS-GOG', 'Gogounou', 'AL', 'Gogounou'),
    ('ZS-KAN', 'Kandi-Ségbana', 'AL', 'Kandi,Ségbana'),
    ('ZS-MAL', 'Karimama-Malanville', 'AL', 'Karimama,Malanville'),
    ('ZS-BOU', 'Boukoumbé', 'AT', 'Boukoumbé'),
    ('ZS-COB', 'Cobly-Matéri', 'AT', 'Cobly,Matéri'),
    ('ZS-KER', 'Kérou-Kouandé', 'AT', 'Kérou,Kouandé'),
    ('ZS-NAT', 'Natitingou-Toucountouna', 'AT', 'Natitingou,Toucountouna'),
    ('ZS-PEH', 'Péhunco-Sinendé', 'AT', 'Péhunco,Sinendé'),
    ('ZS-TAN', 'Tanguiéta', 'AT', 'Tanguiéta,Matéri'),
    ('ZS-ACA', 'Abomey-Calavi–So-Ava', 'ATL', 'Abomey-Calavi,So-Ava'),
    ('ZS-ALL', 'Allada-Toffo-Zè', 'ATL', 'Allada,Toffo,Zè'),
    ('ZS-OUI', 'Kpomassè–Ouidah–Tori', 'ATL', 'Kpomassè,Ouidah,Tori-Bossito'),
    ('ZS-BEM', 'Bembéréké-Sinendé', 'BO', 'Bembéréké,Sinendé'),
    ('ZS-KAL', 'Kalalé-N\'Dali', 'BO', 'Kalalé,N\'Dali'),
    ('ZS-NIK', 'Nikki-Kèrou', 'BO', 'Nikki,Kèrou,Pèrèrè'),
    ('ZS-PAR', 'Parakou', 'BO', 'Parakou'),
    ('ZS-TCH', 'Pèrèrè-Tchaourou', 'BO', 'Pèrèrè,Tchaourou'),
    ('ZS-BAN2', 'Bantè-Glazoué', 'CO', 'Bantè,Glazoué'),
    ('ZS-DAS', 'Dassa-Zoumé–Ouèssè', 'CO', 'Dassa-Zoumé,Ouèssè'),
    ('ZS-SAV', 'Savalou-Agbangnizoun', 'CO', 'Savalou,Agbangnizoun'),
    ('ZS-SVE', 'Savè–Ouessè', 'CO', 'Savè'),
    ('ZS-APL', 'Aplahoué-Djakotomey', 'CF', 'Aplahoué,Djakotomey'),
    ('ZS-DOG', 'Dogbo-Lalo', 'CF', 'Dogbo,Lalo'),
    ('ZS-KLO', 'Klouékanmè-Toviklin', 'CF', 'Klouékanmè,Toviklin'),
    ('ZS-BAS', 'Bassila-Copargo', 'DO', 'Bassila,Copargo'),
    ('ZS-DJO', 'Djougou-Ouaké', 'DO', 'Djougou,Ouaké'),
    ('ZS-COT1', 'Cotonou 1 (Akpakpa)', 'LI', 'Cotonou arrondissement 9-10-11'),
    ('ZS-COT2', 'Cotonou 2 (Menontin)', 'LI', 'Cotonou arrondissement 4-5-6'),
    ('ZS-COT3', 'Cotonou 3 (Jéricho)', 'LI', 'Cotonou arrondissement 12-13'),
    ('ZS-ATH', 'Athiémé-Comè', 'MO', 'Athiémé,Comè,Grand-Popo'),
    ('ZS-LOK', 'Lokossa-Athiémé', 'MO', 'Lokossa,Bopa,Houéyogbé'),
    ('ZS-PNO', 'Porto-Novo', 'OU', 'Porto-Novo,Adjarra,Akpro-Missérété'),
    ('ZS-SEM', 'Sèmè-Kpodji', 'OU', 'Sèmè-Kpodji,Avrankou,Bonou'),
    ('ZS-ABO', 'Abomey-Agbangnizoun', 'ZO', 'Abomey,Agbangnizoun'),
    ('ZS-BOH', 'Bohicon-Za-Kpota', 'ZO', 'Bohicon,Za-Kpota,Zogbodomey'),
    ('ZS-COV', 'Covè-Zagnanado', 'ZO', 'Covè,Zagnanado,Ouinhi'),
    ('ZS-DJI', 'Djidja', 'ZO', 'Djidja'),
]

zones = {}
for code, name, reg_code, communes in ZONES:
    region = regions[reg_code]
    z, _ = ZoneSanitaire.objects.get_or_create(
        code=code,
        defaults={'name': name, 'region': region, 'communes': communes, 'is_active': True}
    )
    zones[code] = z

print(f'  {ZoneSanitaire.objects.count()} zones sanitaires créées/existantes')

# ─── ÉTABLISSEMENTS NATIONAUX ────────────────────────────────────────────────
NATIONAL_ESTS = [
    ('CNHU-HKM', 'Centre National Hospitalier Universitaire Hubert Koutoukou Maga (CNHU-HKM)', 'LI'),
    ('HOMEL', 'Hôpital de la Mère et de l\'Enfant Lagune (HOMEL)', 'LI'),
    ('HIA', 'Hôpital d\'Instruction des Armées (HIA)', 'LI'),
    ('CNPP', 'Centre National de Pneumophtisiologie (CNPP)', 'LI'),
    ('CNTS', 'Centre National de Transfusion Sanguine (CNTS)', 'LI'),
    ('CNHPP', 'Centre National Hospitalier de Psychiatrie (CNHPP)', 'ATL'),
]

national_ests = {}
for code, name, reg_code in NATIONAL_ESTS:
    est, _ = Establishment.objects.get_or_create(
        name=name,
        defaults={
            'type': EstablishmentType.CHU,
            'level': EstablishmentLevel.NATIONAL,
            'region': regions[reg_code],
            'is_active': True,
            'operational_status': EstablishmentOperationalStatus.OPERATIONAL,
        }
    )
    national_ests[code] = est

print(f'  {len(national_ests)} établissements nationaux créés/existants')

# ─── CHD PAR DÉPARTEMENT ─────────────────────────────────────────────────────
CHD_DATA = [
    ('CHD-AL', 'Centre Hospitalier Départemental de l\'Alibori (CHD-Alibori)', 'AL', 'Kandi'),
    ('CHD-AT', 'Centre Hospitalier Départemental de l\'Atacora (CHD-Atacora)', 'AT', 'Natitingou'),
    ('CHD-ATL', 'Centre Hospitalier Départemental de l\'Atlantique (CHD-Atlantique)', 'ATL', 'Allada'),
    ('CHD-BO', 'Centre Hospitalier Départemental du Borgou (CHD-Borgou)', 'BO', 'Parakou'),
    ('CHD-CO', 'Centre Hospitalier Départemental des Collines (CHD-Collines)', 'CO', 'Savalou'),
    ('CHD-CF', 'Centre Hospitalier Départemental du Couffo (CHD-Couffo)', 'CF', 'Aplahoué'),
    ('CHD-DO', 'Centre Hospitalier Départemental de la Donga (CHD-Donga)', 'DO', 'Djougou'),
    ('CHD-LI', 'Centre Hospitalier Départemental du Littoral (CHDL)', 'LI', 'Cotonou'),
    ('CHD-MO', 'Centre Hospitalier Départemental du Mono (CHD-Mono)', 'MO', 'Lokossa'),
    ('CHD-OU', 'Centre Hospitalier Départemental de l\'Ouémé (CHD-Ouémé)', 'OU', 'Porto-Novo'),
    ('CHD-PL', 'Centre Hospitalier Départemental du Plateau (CHD-Plateau)', 'PL', 'Pobè'),
    ('CHD-ZO', 'Centre Hospitalier Départemental du Zou (CHD-Zou)', 'ZO', 'Abomey'),
]

chd_ests = {}
for code, name, reg_code, address in CHD_DATA:
    est, _ = Establishment.objects.get_or_create(
        name=name,
        defaults={
            'type': EstablishmentType.CHD,
            'level': EstablishmentLevel.CHD,
            'region': regions[reg_code],
            'address': address,
            'is_active': True,
            'operational_status': EstablishmentOperationalStatus.OPERATIONAL,
        }
    )
    chd_ests[code] = est

print(f'  {len(chd_ests)} CHD créés/existants')

# ─── HÔPITAUX DE ZONE (sélection principale) ─────────────────────────────────
HZ_DATA = [
    ('HZ-BAN', 'Hôpital de Zone de Banikoara', 'AL', 'ZS-BAN'),
    ('HZ-GOG', 'Hôpital de Zone de Gogounou', 'AL', 'ZS-GOG'),
    ('HZ-KAN', 'Hôpital de Zone de Kandi', 'AL', 'ZS-KAN'),
    ('HZ-MAL', 'Hôpital de Zone de Malanville', 'AL', 'ZS-MAL'),
    ('HZ-NAT', 'Hôpital de Zone de Natitingou', 'AT', 'ZS-NAT'),
    ('HZ-TAN', 'Hôpital de Zone de Tanguiéta', 'AT', 'ZS-TAN'),
    ('HZ-ACA', 'Hôpital de Zone d\'Abomey-Calavi', 'ATL', 'ZS-ACA'),
    ('HZ-ALL', 'Hôpital de Zone d\'Allada', 'ATL', 'ZS-ALL'),
    ('HZ-OUI', 'Hôpital de Zone d\'Ouidah', 'ATL', 'ZS-OUI'),
    ('HZ-BEM', 'Hôpital de Zone de Bembéréké', 'BO', 'ZS-BEM'),
    ('HZ-NIK', 'Hôpital de Zone de Nikki', 'BO', 'ZS-NIK'),
    ('HZ-TCH', 'Hôpital de Zone de Tchaourou', 'BO', 'ZS-TCH'),
    ('HZ-DAS', 'Hôpital de Zone de Dassa-Zoumé', 'CO', 'ZS-DAS'),
    ('HZ-SAV', 'Hôpital de Zone de Savalou', 'CO', 'ZS-SAV'),
    ('HZ-APL', 'Hôpital de Zone d\'Aplahoué', 'CF', 'ZS-APL'),
    ('HZ-DOG', 'Hôpital de Zone de Dogbo', 'CF', 'ZS-DOG'),
    ('HZ-DJO', 'Hôpital de Zone de Djougou', 'DO', 'ZS-DJO'),
    ('HZ-SUL', 'Hôpital de Zone de Suru-Léré', 'LI', 'ZS-COT1'),
    ('HZ-LOK', 'Hôpital de Zone de Lokossa', 'MO', 'ZS-LOK'),
    ('HZ-PNO', 'Hôpital de Zone de Porto-Novo', 'OU', 'ZS-PNO'),
    ('HZ-SEM', 'Hôpital de Zone de Sèmè-Kpodji', 'OU', 'ZS-SEM'),
    ('HZ-ABO', 'Hôpital de Zone d\'Abomey', 'ZO', 'ZS-ABO'),
    ('HZ-BOH', 'Hôpital de Zone de Bohicon', 'ZO', 'ZS-BOH'),
]

hz_ests = {}
for code, name, reg_code, zone_code in HZ_DATA:
    est, _ = Establishment.objects.get_or_create(
        name=name,
        defaults={
            'type': EstablishmentType.HZ,
            'level': EstablishmentLevel.PERIPHERAL,
            'region': regions[reg_code],
            'zone_sanitaire': zones.get(zone_code),
            'is_active': True,
            'operational_status': EstablishmentOperationalStatus.OPERATIONAL,
        }
    )
    hz_ests[code] = est

print(f'  {len(hz_ests)} hôpitaux de zone créés/existants')

# ─── UTILISATEURS NATIONAUX ──────────────────────────────────────────────────
print('\n--- Création des utilisateurs ---')

get_or_create_user('admin@pgpuss.bj', 'Admin', 'PGP-USS', UserRole.ADMIN_PLATEFORME)
get_or_create_user('cabinet@sante.bj', 'Cabinet', 'Ministère Santé', UserRole.CABINET)
get_or_create_user('dqss@sante.bj', 'Directeur', 'DQSS', UserRole.DQSS)
get_or_create_user('pnuss.national@sante.bj', 'Coordinateur', 'PNUSS National', UserRole.PNUSS)
get_or_create_user('callcenter136@pgpuss.bj', 'Agent', 'Call Center 136', UserRole.AGENT_CALL_CENTER)

# ─── DDS PAR DÉPARTEMENT ─────────────────────────────────────────────────────
DDS_USERS = [
    ('dds.alibori@sante.bj', 'Directeur', 'DDS Alibori', 'Alibori'),
    ('dds.atacora@sante.bj', 'Directeur', 'DDS Atacora', 'Atacora'),
    ('dds.atlantique@sante.bj', 'Directeur', 'DDS Atlantique', 'Atlantique'),
    ('dds.borgou@sante.bj', 'Directeur', 'DDS Borgou', 'Borgou'),
    ('dds.collines@sante.bj', 'Directeur', 'DDS Collines', 'Collines'),
    ('dds.couffo@sante.bj', 'Directeur', 'DDS Couffo', 'Couffo'),
    ('dds.donga@sante.bj', 'Directeur', 'DDS Donga', 'Donga'),
    ('dds.littoral@sante.bj', 'Directeur', 'DDS Littoral', 'Littoral'),
    ('dds.mono@sante.bj', 'Directeur', 'DDS Mono', 'Mono'),
    ('dds.oueme@sante.bj', 'Directeur', 'DDS Ouémé', 'Ouémé'),
    ('dds.plateau@sante.bj', 'Directeur', 'DDS Plateau', 'Plateau'),
    ('dds.zou@sante.bj', 'Directeur', 'DDS Zou', 'Zou'),
]

for email, first, last, dept in DDS_USERS:
    get_or_create_user(email, first, last, UserRole.DDS, departement=dept)
    slug = email.split('@')[0].split('.')[1]
    pnuss_email = f'pnuss.{slug}@sante.bj'
    get_or_create_user(pnuss_email, 'PNUSS', f'DDS {dept}', UserRole.PNUSS, departement=dept)

# ─── PFZS PAR ZONE SANITAIRE ─────────────────────────────────────────────────
for code, zone in zones.items():
    slug = code.lower().replace('-', '').replace("'", '')
    email = f'pfzs.{slug}@sante.bj'
    get_or_create_user(email, 'PF', f'ZS-{zone.name[:20]}', UserRole.PFZS, zone=zone)
    pnuss_email = f'pnuss.{slug}@sante.bj'
    get_or_create_user(pnuss_email, 'PNUSS', f'ZS-{zone.name[:20]}', UserRole.PNUSS, zone=zone)

# ─── PFE POUR ÉTABLISSEMENTS NATIONAUX ──────────────────────────────────────
for code, est in national_ests.items():
    slug = code.lower().replace('-', '')
    email = f'pfe.{slug}@sante.bj'
    get_or_create_user(email, 'PFE', est.name[:30], UserRole.PFE, establishment=est)
    pnuss_email = f'pnuss.{slug}@sante.bj'
    get_or_create_user(pnuss_email, 'PNUSS', est.name[:30], UserRole.PNUSS, establishment=est)

# ─── PFE POUR CHD ─────────────────────────────────────────────────────────────
for code, est in chd_ests.items():
    slug = code.lower().replace('-', '')
    email = f'pfe.{slug}@sante.bj'
    get_or_create_user(email, 'PFE', f'{code}', UserRole.PFE, establishment=est)
    pnuss_email = f'pnuss.{slug}@sante.bj'
    get_or_create_user(pnuss_email, 'PNUSS', f'{code}', UserRole.PNUSS, establishment=est)

# ─── PFE POUR HÔPITAUX DE ZONE ───────────────────────────────────────────────
for code, est in hz_ests.items():
    slug = code.lower().replace('-', '')
    email = f'pfe.{slug}@sante.bj'
    get_or_create_user(email, 'PFE', f'{code}', UserRole.PFE, establishment=est)
    pnuss_email = f'pnuss.{slug}@sante.bj'
    get_or_create_user(pnuss_email, 'PNUSS', f'{code}', UserRole.PNUSS, establishment=est)

print('\n--- Création des Catégories ---')
CATEGORIES = [
    'Qualité des soins',
    'Accueil et orientation',
    'Corruption et racket',
    'Hygiène et assainissement',
    'Disponibilité des médicaments',
    'Vétusté des infrastructures',
]
categories_objs = []
for idx, cat_name in enumerate(CATEGORIES, start=1):
    cat, _ = Category.objects.get_or_create(
        name=cat_name,
        defaults={'description': f'Description pour {cat_name}', 'order': idx}
    )
    categories_objs.append(cat)
    print(f'  [+] Catégorie : {cat.name}')

print('\n--- Création de plaintes fictives pour les tableaux de bord ---')
usager = get_or_create_user('usager.test@sante.bj', 'Usager', 'Test', UserRole.USAGER)
import random
from django.utils import timezone
from datetime import timedelta

complaint_count = 0
for code, zone in zones.items():
    # Prendre le premier HZ de la zone, ou le premier CS
    est = Establishment.objects.filter(zone_sanitaire=zone).first()
    cat = random.choice(categories_objs)
    priority = random.choice(['P1', 'P2', 'P3', 'P4', 'P5'])
    status = random.choice([ComplaintStatus.SOUMISE, ComplaintStatus.EN_TRAITEMENT, ComplaintStatus.RESOLUE])
    created = timezone.now() - timedelta(days=random.randint(1, 30))
    
    c = Complaint.objects.create(
        title=f"Plainte de test - {zone.name}",
        description="Ceci est une plainte générée automatiquement pour les tests.",
        category=cat,
        priority=priority,
        status=status,
        channel='WEB',
        establishment=est,
        complainant=usager,
        is_anonymous=False,
    )
    # Bypass l'auto_now_add
    Complaint.objects.filter(pk=c.pk).update(created_at=created)
    if status == ComplaintStatus.RESOLUE:
        Complaint.objects.filter(pk=c.pk).update(resolved_at=created + timedelta(days=2))
    complaint_count += 1

print(f'  {complaint_count} plaintes de test générées.')

print(f'\n=== Peuplement terminé ===')
print(f'  Régions   : {Region.objects.count()}')
print(f'  Zones     : {ZoneSanitaire.objects.count()}')
print(f'  Étab.     : {Establishment.objects.count()}')
print(f'  Utilisat. : {User.objects.count()}')
print(f'\nMot de passe par défaut : {PASSWORD}')
print('Tous les utilisateurs devront changer leur mot de passe à la première connexion.')
