# Référentiel des variables d’environnement

Ce document décrit uniquement les variables utilisées par PGP-USS et ses scripts d’intégration. Les fichiers `.env.example`, `.env.exemple` et `backend/.env.example` sont des modèles ; ils ne contiennent pas de secrets réels. Le stockage des fichiers uploadés est **local** via Django `FileSystemStorage` et `MEDIA_ROOT`. En Docker, il est rendu persistant par le volume `backend_media`.

## Fichier à utiliser selon le mode

| Mode | Fichier | Fonction |
|---|---|---|
| Docker Compose racine | `.env` à la racine | Injecté au backend et au worker Celery par `env_file`; utilisé par Compose pour `OPENWA_API_KEY`. |
| Backend manuel | `backend/.env` | Lu par Django lors du lancement depuis `backend/`. |
| Frontend Vite | `frontend/.env.development` ou `.env.production` | Seules les variables `VITE_*` sont intégrées au navigateur. |
| OpenWA autonome | `OpenWA/.env` | Configuration propre au sous-projet OpenWA et à ses profils Docker. |

Créer le fichier adapté avant de démarrer :

```bash
cp .env.example .env                 # Docker
cp backend/.env.example backend/.env # backend manuel
chmod 600 .env backend/.env 2>/dev/null || true
```

## Variables PGP-USS

| Variable | Statut | Usage réel |
|---|---|---|
| `DJANGO_SECRET_KEY` | Obligatoire en production | Clé Django. Le code possède une valeur de développement de repli, qui ne doit jamais être conservée en production. |
| `DJANGO_DEBUG` | Obligatoire en production | `False` en production. La valeur par défaut du code est `True` pour le développement. |
| `DATABASE_URL` | Facultative en local, requise en production durable | URL PostgreSQL consommée par `dj-database-url`. En l’absence de valeur, Django utilise `backend/db.sqlite3`. |
| `REDIS_URL` | Facultative pour un démarrage minimal, requise pour l’architecture complète | Cache Django et broker/backend Celery. En Docker : `redis://redis:6379/0`; en manuel : `redis://localhost:6379/0`. |
| `FAST_COMPLAINT_CREATE` | Facultative | Active le dépôt JSON puis les médias différés. `VERCEL=1` l’active automatiquement sur Vercel. |
| `VERCEL_MAX_UPLOAD_BYTES` | Facultative | Limite de taille d’une requête média ; valeur par défaut du code : 50 MiB. |
| `EMAIL_ALERTS_ENABLED` | Facultative | Active ou désactive les alertes e-mail ; le modèle de développement la désactive. |
| `EMAIL_BACKEND` | Facultative | Backend Django e-mail. Sans valeur et sans compte SMTP, le backend console est utilisé. |
| `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USE_TLS` | Facultatives | Paramètres SMTP utilisés seulement si les alertes e-mail sont activées. |
| `EMAIL_HOST_USER`, `EMAIL_HOST_PASSWORD` | Facultatives | Identifiants SMTP ; le mot de passe ne doit jamais être versionné. |
| `DEFAULT_FROM_EMAIL` | Facultative | Adresse d’expédition des alertes e-mail. |
| `SITE_NAME` | Facultative | Nom affiché dans les notifications, avec une valeur de repli. |
| `SMS_PROVIDER_MODE` | Facultative | `mock` journalise sans envoyer ; toute autre valeur utilise `SMS_WEBHOOK_URL`. |
| `SMS_WEBHOOK_URL` | Facultative | Endpoint du fournisseur SMS lorsque le mode n’est pas `mock`. |
| `SMS_SENDER` | Facultative | Expéditeur transmis au webhook SMS. |
| `FIREBASE_SERVICE_ACCOUNT_JSON` | Facultative | Credential JSON utilisée par l’endpoint Firebase OTP si ce parcours est activé. |
| `GOOGLE_APPLICATION_CREDENTIALS` | Facultative | Chemin vers la credential Firebase, alternative au JSON inline. |
| `FB_VERIFY_TOKEN` | Facultative | Token utilisé uniquement pour la vérification du webhook Facebook. |
| `OPENWA_API_URL` | Facultative hors WhatsApp | URL du gateway OpenWA : `http://openwa:2785/api` en Docker ou `http://localhost:2785/api` en manuel. |
| `OPENWA_API_KEY` | Requise si OpenWA est utilisé | Clé envoyée dans `X-API-Key` et injectée à OpenWA comme `API_MASTER_KEY` par les Compose PGP-USS. |
| `OPENWA_SESSION_ID` | Facultative hors WhatsApp | Identifiant de la session WhatsApp active ; valeur de repli `pgpuss-whatsapp`. |
| `OPENWA_WEBHOOK_SECRET` | Requise si le webhook OpenWA est sécurisé | Secret HMAC vérifié par le webhook WhatsApp. |
| `WA_VERIFY_TOKEN` | Facultative | Token de compatibilité pour la vérification GET au format Meta. |
| `PGPUSS_WEBHOOK_URL` | Facultative, script uniquement | URL enregistrée par `scripts/setup_openwa_whatsapp.sh`; elle n’est pas lue par les réglages Django. |
| `OPENWA_SESSION_NAME` | Facultative, script uniquement | Nom utilisé par le script de création de session ; il devient `OPENWA_SESSION_ID`. |
| `VITE_API_URL` | Facultative en développement, requise pour un frontend distant | URL publique de l’API dans le build Vite. Vide en développement pour utiliser le proxy Vite `/api`. |

La variable `VERCEL` est fournie par la plateforme lorsqu’elle est disponible ; elle ne doit pas être ajoutée comme secret dans un fichier `.env`. Toute variable absente de la matrice ci-dessus ne doit pas être ajoutée aux modèles sans être d’abord implémentée et consommée par le runtime.

## Redis et Celery

Redis est utilisé par Django pour le cache et par Celery comme broker et backend de résultats. Le service du compose racine s’appelle `redis`; `localhost` ne doit donc pas être utilisé depuis le conteneur backend.

```env
# Docker
REDIS_URL=redis://redis:6379/0

# Lancement manuel
REDIS_URL=redis://localhost:6379/0
```

Le worker se lance avec :

```bash
cd backend
celery -A config worker --loglevel=info --concurrency=2
```

Le webhook WhatsApp dispose d’un fallback synchrone lorsque Redis/Celery est indisponible, mais ce fallback ne remplace pas le worker en production.

## OpenWA

OpenWA est une passerelle WhatsApp auto-hébergée choisie comme alternative à l’API Meta Cloud pour le chatbot. Les variables propres à OpenWA comme `DATABASE_TYPE`, `SESSION_DATA_PATH`, `STORAGE_TYPE`, `PUPPETEER_ARGS`, `REDIS_ENABLED` ou `S3_ENDPOINT` appartiennent au sous-projet OpenWA et à `OpenWA/.env`; elles ne sont pas des variables PGP-USS à recopier dans les modèles racine.

Dans le compose racine, la configuration OpenWA de base est définie directement dans `docker-compose.yml`. La clé PGP-USS est transmise uniquement par `OPENWA_API_KEY` :

```env
OPENWA_API_URL=http://openwa:2785/api
OPENWA_API_KEY=remplacer-par-la-cle-openwa
OPENWA_SESSION_ID=pgpuss-whatsapp
OPENWA_WEBHOOK_SECRET=remplacer-par-un-secret-hmac
PGPUSS_WEBHOOK_URL=http://backend:8000/api/complaints/webhooks/whatsapp/
OPENWA_SESSION_NAME=pgpuss-whatsapp
```

Pour un lancement manuel, remplacer `openwa` et `backend` par `localhost` dans les URLs. Les sessions et médias OpenWA restent persistants dans `openwa_data` et `shared_media` lorsque le compose racine est utilisé.

## Stockage local des médias

Les champs `voice_file` et `Attachment.file` sont des `FileField` Django. Ils écrivent dans `MEDIA_ROOT`, avec les sous-répertoires `complaints/voice/` et `attachments/`. En Docker, le volume nommé `backend_media` est monté dans le backend et dans Nginx ; le volume `shared_media` sert au transfert des médias OpenWA.

Le code limite les requêtes média ordinaires avec `VERCEL_MAX_UPLOAD_BYTES` et les pièces jointes WhatsApp à 50 MiB par défaut. Le frontend Nginx accepte 50 MiB et une plainte peut contenir au maximum cinq pièces jointes. Ces limites ne rendent pas le stockage serverless persistant.

## Frontend

```env
# frontend/.env.development
VITE_API_URL=

# frontend/.env.production
VITE_API_URL=https://api.exemple.bj
```

Une URL interne Docker telle que `http://backend:8000` ne doit jamais être intégrée dans un build destiné au navigateur.

## Contrôle avant déploiement

Avant de démarrer une instance, vérifier que `.env` n’est pas suivi par Git, que `DJANGO_SECRET_KEY` est remplacée, que `DATABASE_URL` et `REDIS_URL` correspondent au contexte réseau, que les secrets OpenWA sont cohérents, que `MEDIA_ROOT` est monté sur un volume persistant sur VPS, et que `VITE_API_URL` pointe vers une API publique pour un frontend distant.

## Références

[1]: https://docs.djangoproject.com/en/stable/topics/files/ Django — gestion des fichiers uploadés
[2]: https://docs.celeryq.dev/en/stable/ Celery — documentation officielle
