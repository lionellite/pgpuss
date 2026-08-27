"""
Configuration Celery pour PGP-USS.

Redis est utilisé comme Message Broker (file d'attente des tâches).
Toutes les tâches lentes (webhooks WhatsApp, enregistrement de médias,
notifications) sont déléguées à un worker Celery en arrière-plan.
"""
import os
from celery import Celery

# On pointe vers le module de settings Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

app = Celery('pgpuss')

# Lit les paramètres Celery depuis settings.py (préfixe CELERY_)
app.config_from_object('django.conf:settings', namespace='CELERY')

# Découverte automatique des fichiers tasks.py dans chaque application Django
app.autodiscover_tasks()
