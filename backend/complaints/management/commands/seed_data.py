"""
Commande de seed “démo”.

Historique: ce projet a eu un ancien workflow (statuts/rôles) qui a évolué.
Pour éviter les incohérences, `seed_data` délègue désormais au seed officiel
`seed_benin_workflow`.
Usage: python manage.py seed_data
"""

from django.core.management.base import BaseCommand
from .seed_benin_workflow import Command as BeninSeedCommand


class Command(BaseCommand):
    help = "Alias → seed_benin_workflow (workflow Bénin)"

    def handle(self, *args, **options):
        BeninSeedCommand().handle(*args, **options)
