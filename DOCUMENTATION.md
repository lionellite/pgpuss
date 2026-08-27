# Documentation technique PGP-USS

PGP-USS est une plateforme multicanale de gestion des plaintes des usagers des services de santé au Bénin. Elle permet de recevoir une plainte, de la qualifier, de la router vers le bon niveau de la pyramide sanitaire, d’en suivre l’instruction, d’enregistrer les décisions et de mesurer la satisfaction de l’usager.

Le [README principal](README.md) est le point d’entrée du projet. Ce document présente l’architecture et le workflow ; les procédures opérationnelles sont détaillées dans [docs/DEPLOIEMENT.md](docs/DEPLOIEMENT.md), les variables dans [docs/ENVIRONNEMENT.md](docs/ENVIRONNEMENT.md), les canaux sociaux dans [SOCIAL_INTEGRATION.md](SOCIAL_INTEGRATION.md) et les comptes dans [UTILISATEURS_TESTS.md](UTILISATEURS_TESTS.md).

## Architecture technique

| Couche | Technologie ou composant |
|---|---|
| Backend | Django, Django REST Framework, JWT, OpenAPI via drf-spectacular. |
| Frontend web | React 18, Vite, React Router, Recharts, i18next et Framer Motion. |
| Mobile | Flutter, consommant les API REST communes. |
| Données | SQLite par défaut en développement ; PostgreSQL via `DATABASE_URL` en production. |
| Cache et tâches | Redis via `REDIS_URL`, Django cache et broker/backend Celery. |
| WhatsApp | OpenWA, passerelle auto-hébergée basée sur `whatsapp-web.js`, utilisée comme alternative à l’API Meta Cloud. |
| Fichiers | Stockage local via Django `FileSystemStorage` dans `MEDIA_ROOT`, persisté par le volume Docker `backend_media` sur VPS. |
| Production Docker | Gunicorn pour Django, Nginx pour le frontend, worker Celery et volumes nommés. |

Le compose principal orchestre `backend`, `frontend`, `openwa`, `openwa-dashboard`, `celery-worker` et `redis`. Le backend et le worker reçoivent les variables du `.env` racine ; le frontend Nginx relaie les routes applicatives vers `backend` ; OpenWA et le backend partagent le volume `shared_media` pour les médias WhatsApp.

## Workflow institutionnel

Une plainte peut être déposée par un usager ou transcrite par le call center 136. Elle passe par les états `SOUMISE`, `ACCUSEE`, `INSTRUITE`, `AFFECTEE`, `EN_TRAITEMENT`, `RESOLUE` et `CLOTUREE`, avec les états d’escalade, d’arbitrage ou de rejet prévus par le modèle.

Le routage initial dépend du niveau de l’établissement : un établissement référencé est dirigé vers son PFE ; une structure saisie manuellement peut être orientée vers le call center pour complétion. L’escalade suit ensuite la pyramide sanitaire :

| Origine | Cible habituelle |
|---|---|
| PFE d’un établissement périphérique | PFZS de la zone sanitaire |
| PFE d’un CHD | DDS du département, avec bypass du PFZS |
| PFE d’un établissement national | DQSS, avec bypass des niveaux intermédiaires |
| PFZS | DDS du département |
| DDS | DQSS national |
| DQSS | Cabinet du Ministère |

Les messages WhatsApp sont reçus par OpenWA, validés par secret HMAC, placés dans Redis pour traitement Celery et traités par la machine conversationnelle. En cas d’indisponibilité de Redis ou du worker, le webhook dispose d’un traitement synchrone de secours, mais ce mode ne remplace pas le worker en production.

## Installation et lancement

Le lancement manuel se fait en créant `backend/.env`, en installant `backend/requirements.txt`, en appliquant les migrations puis en exécutant `python manage.py shell < scripts/populate_benin_db.py`. Redis et le worker Celery doivent être démarrés pour les traitements asynchrones. Le frontend se lance avec `npm install` puis `npm run dev` depuis `frontend/`.

Le lancement Docker se fait depuis la racine après création de `.env` à partir de `.env.example` :

```bash
docker compose build
docker compose up -d
docker compose ps
```

Le déploiement VPS automatisé est assuré par `./deploy.sh`. Il suit la branche `master`, reconstruit les images, redémarre les services, nettoie les verrous Chromium d’OpenWA, exécute les migrations et collecte les statiques. Il ne réalise aucune sauvegarde et ne doit pas être lancé sans vérifier le fichier `.env`.

Vercel peut servir le frontend et l’API en projets séparés, mais son système de fichiers local n’est pas une solution de conservation durable des uploads. PostgreSQL, les médias locaux, OpenWA, Chromium et Celery doivent rester sur un environnement persistant ; le VPS Docker est le mode complet recommandé. Voir [docs/DEPLOIEMENT.md](docs/DEPLOIEMENT.md) pour les prérequis et limites exacts.

## Internationalisation et accessibilité

Le frontend utilise `react-i18next` et propose le français comme langue principale, avec des ressources Fon et Yoruba. Le formulaire de dépôt inclut une aide vocale s’appuyant sur la Web Speech API. Les pictogrammes, libellés de statut et messages de validation doivent rester cohérents avec les parcours web et mobile.

## Comptes de test

Les identifiants historiques qui ne figurent plus dans le référentiel actuel sont retirés de la documentation. Après le peuplement, utiliser les comptes et le mot de passe commun indiqués dans [UTILISATEURS_TESTS.md](UTILISATEURS_TESTS.md), notamment `admin@pgpuss.bj`, `pfe.cnhuhkm@sante.bj`, `dds.littoral@sante.bj`, `pfzs.zscot1@sante.bj`, `dqss@sante.bj`, `cabinet@sante.bj`, `pnuss.national@sante.bj` et `callcenter136@pgpuss.bj`.

La réinitialisation Docker est destructive :

```bash
bash backend/scripts/reset_and_populate.sh
```

Elle exécute un `flush` de la base avant de recréer les données de démonstration. Ne pas l’utiliser sur une base de production.

## API principales

La documentation interactive est disponible sur `/api/docs/` et `/api/redoc/`. Les ressources principales sont l’authentification JWT sous `/api/auth/`, les plaintes sous `/api/complaints/`, les référentiels sous `/api/establishments/`, les statistiques sous `/api/analytics/`, les notifications sous `/api/notifications/` et le journal sous `/api/audit/`.

Les points d’entrée sociaux sont `POST /api/complaints/webhooks/whatsapp/` et `/api/complaints/webhooks/facebook/`. Le suivi public utilise `GET /api/complaints/track/<ticket_number>/`; les médias différés utilisent `POST /api/complaints/<id>/deposit-media/`.

## Références

[1]: https://www.django-rest-framework.org/ Django REST Framework — documentation officielle
[2]: https://docs.celeryq.dev/en/stable/ Celery — documentation officielle
[3]: https://github.com/rmyndharis/OpenWA OpenWA — passerelle WhatsApp open source
