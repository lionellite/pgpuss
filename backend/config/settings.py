"""
Django settings for PGP-USS project.
"""

from pathlib import Path
from datetime import timedelta
import os
import dj_database_url
from dotenv import load_dotenv
from corsheaders.defaults import default_headers

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = os.environ.get('DJANGO_SECRET_KEY', 'django-insecure-pgpuss-dev-key-change-in-production-2025')

DEBUG = os.environ.get('DJANGO_DEBUG', 'True').lower() == 'true'

ALLOWED_HOSTS = ['*'] #os.environ.get('ALLOWED_HOSTS', 'localhost,127.0.0.1').split(',')

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    # Third-party
    'rest_framework',
    'rest_framework_simplejwt',
    'corsheaders',
    'django_filters',
    'drf_spectacular',
    # Local apps
    'accounts',
    'complaints',
    'establishments',
    'notifications',
    'analytics',
    'support',
    'audit',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'config.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'config.wsgi.application'

# Backend d'authentification : email OU téléphone
AUTHENTICATION_BACKENDS = [
    'accounts.backends.PhoneOrEmailBackend',
    'django.contrib.auth.backends.ModelBackend',
]

import dj_database_url

# Database - PostgreSQL (prod) / SQLite (dev)
DATABASES = {
    'default': dj_database_url.config(
        default=f"sqlite:///{BASE_DIR / 'db.sqlite3'}",
        conn_max_age=600,
        conn_health_checks=True,
    )
}

# Redis & Cache Settings
REDIS_URL = os.environ.get('REDIS_URL', 'redis://localhost:6379/1')

CACHES = {
    "default": {
        "BACKEND": "django_redis.cache.RedisCache",
        "LOCATION": REDIS_URL,
        "OPTIONS": {
            "CLIENT_CLASS": "django_redis.client.DefaultClient",
            "SOCKET_CONNECT_TIMEOUT": 2,  # Timeout connexion : 2s max
            "SOCKET_TIMEOUT": 2,
            "IGNORE_EXCEPTIONS": True,  # Cache miss silencieux si Redis tombe
        }
    }
}

AUTH_USER_MODEL = 'accounts.User'

AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

LANGUAGE_CODE = 'fr-fr'
TIME_ZONE = 'Africa/Porto-Novo'
USE_I18N = True
USE_TZ = True

STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'

MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

# Django 4.2+ / 6.x : STORAGES remplace DEFAULT_FILE_STORAGE et STATICFILES_STORAGE
STORAGES = {
    'default': {
        'BACKEND': 'django.core.files.storage.FileSystemStorage',
        'OPTIONS': {
            'location': MEDIA_ROOT,
            'base_url': MEDIA_URL,
        },
    },
    'staticfiles': {
        'BACKEND': 'django.contrib.staticfiles.storage.StaticFilesStorage',
    },
}
# Compatibilité django-cloudinary-storage (collectstatic lit encore STATICFILES_STORAGE)
STATICFILES_STORAGE = 'django.contrib.staticfiles.storage.StaticFilesStorage'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# REST Framework
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    ),
    'DEFAULT_FILTER_BACKENDS': (
        'django_filters.rest_framework.DjangoFilterBackend',
        'rest_framework.filters.SearchFilter',
        'rest_framework.filters.OrderingFilter',
    ),
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
    'DEFAULT_SCHEMA_CLASS': 'drf_spectacular.openapi.AutoSchema',
    'DEFAULT_RENDERER_CLASSES': (
        'rest_framework.renderers.JSONRenderer',
        'rest_framework.renderers.BrowsableAPIRenderer',
    ),
}

# JWT Settings
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(hours=12),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'AUTH_HEADER_TYPES': ('Bearer',),
}

# Spectacular (Swagger/OpenAPI) Settings
SPECTACULAR_SETTINGS = {
    'TITLE': 'PGP-USS API',
    'DESCRIPTION': 'Plateforme de Gestion des Plaintes des Usagers des Services de Santé - Bénin',
    'VERSION': '1.0.0',
    'SERVE_INCLUDE_SCHEMA': False,
    'COMPONENT_SPLIT_REQUEST': True,
}

# Celery Configuration
CELERY_BROKER_URL = os.environ.get('REDIS_URL', 'redis://localhost:6379/0')
CELERY_RESULT_BACKEND = os.environ.get('REDIS_URL', 'redis://localhost:6379/0')
CELERY_ACCEPT_CONTENT = ['json']
CELERY_TASK_SERIALIZER = 'json'
CELERY_RESULT_SERIALIZER = 'json'
CELERY_TIMEZONE = 'Africa/Porto-Novo'
# Délai max d'une tâche = 10 min (ex: upload Cloudinary de grosses vidéos)
CELERY_TASK_SOFT_TIME_LIMIT = 540
CELERY_TASK_TIME_LIMIT = 600
# Réessayer 3 fois en cas d'échec, avec 60s de délai
CELERY_TASK_MAX_RETRIES = 3
# Timeout broker : si Redis est injoignable, lever l'exception rapidement (fallback synchrone)
CELERY_BROKER_TRANSPORT_OPTIONS = {
    'socket_timeout': 2,
    'socket_connect_timeout': 2,
    'max_retries': 1,
}

# CORS : accepter toutes les origines pour l'API REST (mobile + frontend)
CORS_ALLOWED_ORIGINS = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:3000',
]
CORS_ALLOW_ALL_ORIGINS = True
CORS_ALLOW_CREDENTIALS = True
# En-têtes personnalisés (ex. jeton d'upload médias après dépôt de plainte)
CORS_ALLOW_HEADERS = list(default_headers) + [
    'x-upload-token',
]

# File upload limits (Vercel serverless : corps de requête ~4,5 Mo max, VPS: 50 Mo max)
FILE_UPLOAD_MAX_MEMORY_SIZE = 50 * 1024 * 1024
DATA_UPLOAD_MAX_MEMORY_SIZE = 50 * 1024 * 1024
VERCEL_MAX_UPLOAD_BYTES = int(os.environ.get('VERCEL_MAX_UPLOAD_BYTES', str(50 * 1024 * 1024)))
# Création plainte sans génération de document ni gros multipart (recommandé sur Vercel)
FAST_COMPLAINT_CREATE = os.environ.get('FAST_COMPLAINT_CREATE', '').lower() in (
    '1', 'true', 'yes',
) or os.environ.get('VERCEL', '').lower() in ('1', 'true')

# Notifications email (SMTP Gmail en production)
EMAIL_ALERTS_ENABLED = os.environ.get("EMAIL_ALERTS_ENABLED", "True").lower() == "true"
_email_backend = os.environ.get("EMAIL_BACKEND", "").strip()
if not _email_backend and os.environ.get("EMAIL_HOST_USER"):
    _email_backend = "django.core.mail.backends.smtp.EmailBackend"
EMAIL_BACKEND = _email_backend or "django.core.mail.backends.console.EmailBackend"
EMAIL_HOST = os.environ.get("EMAIL_HOST", "smtp.gmail.com")
EMAIL_PORT = int(os.environ.get("EMAIL_PORT", "587"))
EMAIL_HOST_USER = os.environ.get("EMAIL_HOST_USER", "")
EMAIL_HOST_PASSWORD = os.environ.get("EMAIL_HOST_PASSWORD", "")
EMAIL_USE_TLS = os.environ.get("EMAIL_USE_TLS", "True").lower() == "true"
DEFAULT_FROM_EMAIL = os.environ.get("DEFAULT_FROM_EMAIL", "PGP-USS <noreply@pgpuss.local>")
SITE_NAME = os.environ.get("SITE_NAME", "PGP-USS Santé Bénin")

# SMS : mock (dev) | webhook (API externe) | firebase (OTP côté client Firebase Auth)
SMS_PROVIDER_MODE = os.environ.get("SMS_PROVIDER_MODE", "mock")
SMS_WEBHOOK_URL = os.environ.get("SMS_WEBHOOK_URL", "")
SMS_SENDER = os.environ.get("SMS_SENDER", "PGPUSS")

# Firebase Authentication (OTP SMS — vérification côté serveur du id_token)
FIREBASE_PROJECT_ID = os.environ.get("FIREBASE_PROJECT_ID", "")

# WhatsApp via OpenWA (gateway open source — alternative à l'API Meta)
OPENWA_API_URL = os.environ.get("OPENWA_API_URL", "http://localhost:2785/api")
OPENWA_API_KEY = os.environ.get("OPENWA_API_KEY", "")
OPENWA_SESSION_ID = os.environ.get("OPENWA_SESSION_ID", "pgpuss-whatsapp")
OPENWA_WEBHOOK_SECRET = os.environ.get("OPENWA_WEBHOOK_SECRET", "")
WA_VERIFY_TOKEN = os.environ.get("WA_VERIFY_TOKEN", "pgpuss_wa_verify_token_change_me")

# Stockage des fichiers médias (local uniquement)
