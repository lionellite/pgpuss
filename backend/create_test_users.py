#!/usr/bin/env python3
"""
Script de création des utilisateurs tests pour PGP-USS.
Conforme au cahier de charges v3 — Pyramide sanitaire complète.

Usage:
    cd backend && python manage.py shell < create_test_users.py
"""

import os
import sys
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

import django
django.setup()

from django.contrib.auth import get_user_model
from establishments.models import Region, ZoneSanitaire, Establishment

User = get_user_model()

PASSWORD = 'Pgpuss2026!'


def get_or_create_user(email, defaults):
    """Crée ou met à jour un utilisateur test."""
    user, created = User.objects.update_or_create(
        email=email,
        defaults=defaults,
    )
    if created:
        user.set_password(PASSWORD)
        user.save()
        print(f'  ✅ CRÉÉ  : {email} ({defaults["role"]})')
    else:
        # Mise à jour des champs sans écraser le password
        for k, v in defaults.items():
            setattr(user, k, v)
        user.save()
        print(f'  🔄 MàJ   : {email} ({defaults["role"]})')
    return user


# ─── Récupérer les références ─────────────────────────────────────────────
print('\n═══════════════════════════════════════════════')
print('  PGP-USS — Création des utilisateurs tests')
print('═══════════════════════════════════════════════\n')

# Régions (départements)
regions = {r.name: r for r in Region.objects.all()}
print(f'Départements disponibles : {list(regions.keys())}')

# Zones sanitaires
zones = {z.name: z for z in ZoneSanitaire.objects.all()}
print(f'Zones sanitaires : {list(zones.keys())}')

# Établissements
establishments = {e.name: e for e in Establishment.objects.all()}
print(f'Établissements : {list(establishments.keys())}')

# ─── Références utiles ────────────────────────────────────────────────────
zone_cotonou = zones.get('Zone Sanitaire Cotonou 1-2-3')
zone_cotonou2 = zones.get('Zone Sanitaire Cotonou 4-5-6')
zone_abomey = zones.get('Zone Sanitaire Abomey-Calavi/So-Ava')
zone_parakou = zones.get('Zone Sanitaire Parakou/N\'Dali')
zone_lokossa = zones.get('Zone Sanitaire Lokossa/Athiémé')

est_cnhu = establishments.get('CHU de Cotonou (CNHU-HKM)')
est_parakou = establishments.get('CHU de Parakou')
est_hz_abomey = establishments.get('Hôpital de Zone d\'Abomey-Calavi')
est_hz_lokossa = establishments.get('Hôpital de Zone de Lokossa')
est_cs_godomey = establishments.get('Centre de Santé de Godomey')
est_chr_borgou = establishments.get('CHR Borgou-Alibori')

dept_littoral = regions.get('Littoral')
dept_atlantique = regions.get('Atlantique')
dept_borgou = regions.get('Borgou')
dept_mono = regions.get('Mono')

# ─── 1. ADMINISTRATEUR PLATEFORME ─────────────────────────────────────────
print('\n── Administrateur Plateforme ──')
get_or_create_user('admin@pgpuss.bj', {
    'first_name': 'Admin', 'last_name': 'PGP-USS',
    'role': 'ADMIN_PLATEFORME', 'is_staff': True, 'is_superuser': True,
})

# ─── 2. USAGERS (plaignants) ──────────────────────────────────────────────
print('\n── Usagers ──')
get_or_create_user('usager@pgpuss.bj', {
    'first_name': 'Fidèle', 'last_name': 'Adjahouinou',
    'role': 'USAGER',
})
get_or_create_user('usager2@pgpuss.bj', {
    'first_name': 'Aline', 'last_name': 'Tchégoun',
    'role': 'USAGER', 'phone': '+22997001122',
})

# ─── 3. NIVEAU PÉRIPHÉRIQUE — PFE (Points Focaux Établissement) ──────────
print('\n── PFE (Points Focaux Établissement) ──')
get_or_create_user('pfe.cnhu@pgpuss.bj', {
    'first_name': 'Rachidatou', 'last_name': 'Aké',
    'role': 'PFE', 'establishment': est_cnhu,
})
get_or_create_user('pfe.parakou@pgpuss.bj', {
    'first_name': 'Ibrahim', 'last_name': 'Moussa',
    'role': 'PFE', 'establishment': est_parakou,
})
get_or_create_user('pfe.abomey@pgpuss.bj', {
    'first_name': 'Estelle', 'last_name': 'Houéto',
    'role': 'PFE', 'establishment': est_hz_abomey,
})
get_or_create_user('pfe.lokossa@pgpuss.bj', {
    'first_name': 'Léonce', 'last_name': 'Dossou',
    'role': 'PFE', 'establishment': est_hz_lokossa,
})
# Ancien compte PFE → rattacher au CNHU s'il n'a pas d'établissement
old_pfe = User.objects.filter(email='pfe@pgpuss.bj').first()
if old_pfe:
    old_pfe.establishment = est_cnhu
    old_pfe.save(update_fields=['establishment'])
    print(f'  🔄 MàJ ancien PFE : pfe@pgpuss.bj → {est_cnhu}')

# ─── 4. NIVEAU PÉRIPHÉRIQUE — DIRECTEURS D'ÉTABLISSEMENT ─────────────────
print('\n── Directeurs d\'établissement ──')
get_or_create_user('dir.cnhu@pgpuss.bj', {
    'first_name': 'Prof. Aristide', 'last_name': 'Houngan',
    'role': 'DIRECTEUR_EST', 'establishment': est_cnhu,
})
get_or_create_user('dir.parakou@pgpuss.bj', {
    'first_name': 'Dr. Ruffin', 'last_name': 'Kpamégnan',
    'role': 'DIRECTEUR_EST', 'establishment': est_parakou,
})
# Ancien compte directeur → rattacher
old_dir = User.objects.filter(email='directeur@pgpuss.bj').first()
if old_dir:
    old_dir.establishment = est_cnhu
    old_dir.save(update_fields=['establishment'])

# ─── 5. NIVEAU PÉRIPHÉRIQUE — AGENTS INTERNES ────────────────────────────
print('\n── Agents internes ──')
get_or_create_user('agent.cnhu@pgpuss.bj', {
    'first_name': 'Pascal', 'last_name': 'Sèdji',
    'role': 'AGENT_INTERNE', 'establishment': est_cnhu,
})
get_or_create_user('agent.parakou@pgpuss.bj', {
    'first_name': 'Fatimata', 'last_name': 'Alfa',
    'role': 'AGENT_INTERNE', 'establishment': est_parakou,
})
# Ancien compte agent → rattacher
old_agent = User.objects.filter(email='agent.interne@pgpuss.bj').first()
if old_agent:
    old_agent.establishment = est_cnhu
    old_agent.save(update_fields=['establishment'])

# ─── 6. NIVEAU ZONE SANITAIRE — PFZS ────────────────────────────────────
print('\n── PFZS (Points Focaux Zone Sanitaire) ──')
get_or_create_user('pfzs.cotonou@pgpuss.bj', {
    'first_name': 'Aurélie', 'last_name': 'Boco',
    'role': 'PFZS', 'zone_sanitaire': zone_cotonou,
})
get_or_create_user('pfzs.abomey@pgpuss.bj', {
    'first_name': 'Gérard', 'last_name': 'Adankpo',
    'role': 'PFZS', 'zone_sanitaire': zone_abomey,
})
get_or_create_user('pfzs.parakou@pgpuss.bj', {
    'first_name': 'Souaïbou', 'last_name': 'Yessoufou',
    'role': 'PFZS', 'zone_sanitaire': zone_parakou,
})
# Ancien PFZS → rattacher
old_pfzs = User.objects.filter(email='pfzs@pgpuss.bj').first()
if old_pfzs:
    old_pfzs.zone_sanitaire = zone_cotonou
    old_pfzs.save(update_fields=['zone_sanitaire'])

# ─── 7. NIVEAU DÉPARTEMENTAL — DDS (PF-DDS) ─────────────────────────────
print('\n── PF-DDS (Points Focaux Départementaux) ──')
get_or_create_user('dds.littoral@pgpuss.bj', {
    'first_name': 'Charles', 'last_name': 'Agossou',
    'role': 'DDS', 'departement': 'Littoral',
})
get_or_create_user('dds.atlantique@pgpuss.bj', {
    'first_name': 'Aminou', 'last_name': 'Kpanou',
    'role': 'DDS', 'departement': 'Atlantique',
})
get_or_create_user('dds.borgou@pgpuss.bj', {
    'first_name': 'Hamidou', 'last_name': 'Bio Nigan',
    'role': 'DDS', 'departement': 'Borgou',
})
# Ancien DDS → mise à jour
old_dds = User.objects.filter(email='dds@pgpuss.bj').first()
if old_dds:
    old_dds.departement = 'Littoral'
    old_dds.save(update_fields=['departement'])

# ─── 8. NIVEAU NATIONAL — DQSS / CABINET ────────────────────────────────
print('\n── Niveau National (DQSS / Cabinet) ──')
get_or_create_user('dqss@pgpuss.bj', {
    'first_name': 'Dr. Alice', 'last_name': 'Gbaguidi',
    'role': 'DQSS',
})
get_or_create_user('cabinet@pgpuss.bj', {
    'first_name': 'Honoré', 'last_name': 'Zannou',
    'role': 'CABINET',
})

# ─── 9. CALL CENTER 136 ─────────────────────────────────────────────────
print('\n── Agents Call Center 136 ──')
get_or_create_user('cc136.agent1@pgpuss.bj', {
    'first_name': 'Élodie', 'last_name': 'Hounsou',
    'role': 'AGENT_CALL_CENTER',
})
get_or_create_user('cc136.agent2@pgpuss.bj', {
    'first_name': 'Kolawolé', 'last_name': 'Lawal',
    'role': 'AGENT_CALL_CENTER',
})

# ─── 10. PNUSS — Représentants à chaque niveau ──────────────────────────
print('\n── PNUSS (Représentants à chaque niveau de la pyramide) ──')

# PNUSS Niveau National (sans zone_sanitaire ni departement → visibilité nationale)
get_or_create_user('pnuss.national@pgpuss.bj', {
    'first_name': 'Fabien', 'last_name': 'Gnacadja',
    'role': 'PNUSS',
    'zone_sanitaire': None,
    'departement': '',
})

# PNUSS Niveau Départemental (departement renseigné, pas de zone)
get_or_create_user('pnuss.littoral@pgpuss.bj', {
    'first_name': 'Serge', 'last_name': 'Alowanou',
    'role': 'PNUSS',
    'departement': 'Littoral',
    'zone_sanitaire': None,
})
get_or_create_user('pnuss.borgou@pgpuss.bj', {
    'first_name': 'Raïssa', 'last_name': 'Saka',
    'role': 'PNUSS',
    'departement': 'Borgou',
    'zone_sanitaire': None,
})

# PNUSS Niveau Zone Sanitaire (zone_sanitaire renseignée)
get_or_create_user('pnuss.cotonou@pgpuss.bj', {
    'first_name': 'Joël', 'last_name': 'Ahossi',
    'role': 'PNUSS',
    'zone_sanitaire': zone_cotonou,
    'departement': '',
})
get_or_create_user('pnuss.parakou@pgpuss.bj', {
    'first_name': 'Latifou', 'last_name': 'Orou Guidou',
    'role': 'PNUSS',
    'zone_sanitaire': zone_parakou,
    'departement': '',
})

# Nettoyer ancien PNUSS zone
old_pnuss_zone = User.objects.filter(email='pnuss.zone@pgpuss.bj').first()
if old_pnuss_zone:
    old_pnuss_zone.zone_sanitaire = zone_cotonou
    old_pnuss_zone.save(update_fields=['zone_sanitaire'])
    print(f'  🔄 MàJ ancien PNUSS zone : pnuss.zone@pgpuss.bj → {zone_cotonou}')

# ─── Résumé ──────────────────────────────────────────────────────────────
print('\n═══════════════════════════════════════════════')
print('  Résumé des utilisateurs tests')
print('═══════════════════════════════════════════════')
from collections import Counter
roles = Counter(User.objects.values_list('role', flat=True))
total = sum(roles.values())
for role, count in sorted(roles.items()):
    print(f'  {role:25s} : {count}')
print(f'  {"TOTAL":25s} : {total}')
print(f'\n  Mot de passe par défaut : {PASSWORD}')
print('═══════════════════════════════════════════════\n')
