# Guide technique interne PGP-USS

Ce document résume les conventions techniques et le modèle métier actuels du dépôt. Pour les procédures opérationnelles, consulter le [README](README.md), le [guide de déploiement](docs/DEPLOIEMENT.md), le [référentiel d’environnement](docs/ENVIRONNEMENT.md), le [guide social/mobile](SOCIAL_INTEGRATION.md) et la [référence des comptes](UTILISATEURS_TESTS.md).

## Présentation et stack

PGP-USS est une plateforme multicanale de gestion des plaintes des usagers des services de santé du Bénin. Le backend est développé avec Django et Django REST Framework, le frontend web avec React 18/Vite, et le client mobile avec Flutter. L’authentification REST utilise JWT. SQLite est la valeur de repli en développement ; PostgreSQL est attendu en production via `DATABASE_URL`.

Redis est utilisé à la fois pour le cache Django et pour le broker/backend de résultats Celery. Le worker Celery traite notamment les webhooks WhatsApp et l’envoi de réponses WhatsApp. OpenWA est une passerelle WhatsApp auto-hébergée basée sur `whatsapp-web.js`, intégrée au dépôt comme alternative à l’API Meta Cloud.

## Architecture des répertoires

```text
PGPUSS/
├── backend/
│   ├── accounts/          # utilisateur, rôles et JWT
│   ├── complaints/        # plaintes, workflow, bot et médias
│   ├── establishments/    # départements, zones et établissements
│   ├── notifications/     # notifications applicatives, e-mail et SMS
│   ├── analytics/         # tableaux de bord et statistiques
│   ├── support/           # support et demandes associées
│   ├── audit/             # journal append-only et chaîne de hachage
│   ├── config/            # settings, URLs, WSGI et Celery
│   └── scripts/           # peuplement et réinitialisation de démonstration
├── frontend/              # SPA React/Vite et configuration Nginx
├── mobile/                # application Flutter
├── OpenWA/                # gateway WhatsApp et dashboard
├── scripts/               # configuration de la session et du webhook OpenWA
├── docs/                  # déploiement, environnement et référentiel FOSA
└── diagrammes/            # diagrammes PlantUML métier et techniques
```

## Pyramide sanitaire et rôles

La plateforme distingue les niveaux national, départemental, zone sanitaire et établissement. Les rôles principaux sont `ADMIN_PLATEFORME`, `CABINET`, `DQSS`, `PNUSS`, `DDS`, `PFZS`, `PFE`, `AGENT_INTERNE`, `DIRECTEUR_EST`, `AGENT_CALL_CENTER` et `USAGER`. Le périmètre d’un agent est déterminé par son rattachement à un établissement, une zone ou un département, sauf pour les rôles nationaux.

| Niveau | Rôle principal | Rattachement |
|---|---|---|
| National | `DQSS`, `CABINET`, `PNUSS` national | Visibilité nationale |
| Départemental | `DDS`, `PNUSS` départemental | `departement` |
| Zone sanitaire | `PFZS`, `PNUSS` de zone | `zone_sanitaire` |
| Établissement | `PFE`, `AGENT_INTERNE`, `DIRECTEUR_EST`, `PNUSS` d’établissement | `establishment` |
| Transversal | `ADMIN_PLATEFORME`, `AGENT_CALL_CENTER` | Aucun ou périmètre fonctionnel |

Les comptes à utiliser pour les tests sont exclusivement ceux de [UTILISATEURS_TESTS.md](UTILISATEURS_TESTS.md). Tout identifiant qui ne figure pas dans ce référentiel doit être considéré comme historique et ne doit pas être ajouté à la documentation.

## Cycle de vie d’une plainte

Une plainte est déposée par le web, le mobile, WhatsApp, Facebook, le guichet ou le call center 136. Elle suit généralement les états `SOUMISE`, `ACCUSEE`, `INSTRUITE`, `AFFECTEE`, `EN_TRAITEMENT`, `RESOLUE` puis `CLOTUREE`. Le modèle prévoit également l’escalade, l’arbitrage et le rejet.

Le routage initial dirige une plainte liée à un établissement vers son PFE. Une plainte dont l’établissement est saisi manuellement est orientée vers le call center pour complétion. L’escalade d’un PFE périphérique va vers le PFZS ; celle d’un CHD va directement vers la DDS ; celle d’un établissement national va vers la DQSS. Le circuit supérieur est `PFZS → DDS → DQSS → CABINET`.

## API de référence

```text
POST /api/auth/login/phone/
POST /api/auth/register/
GET  /api/auth/me/

GET  /api/complaints/
POST /api/complaints/create/
GET  /api/complaints/<id>/
POST /api/complaints/<id>/acknowledge/
POST /api/complaints/<id>/qualify/
POST /api/complaints/<id>/assign/
POST /api/complaints/<id>/start-investigation/
POST /api/complaints/<id>/resolve/
POST /api/complaints/<id>/escalate/
POST /api/complaints/<id>/arbitrate/
POST /api/complaints/<id>/close/
GET  /api/complaints/track/<ticket_number>/
POST /api/complaints/<id>/deposit-media/

GET  /api/establishments/
GET  /api/establishments/regions/
GET  /api/establishments/zones/
GET  /api/analytics/dashboard/
GET  /api/notifications/
GET  /api/audit/
GET  /api/audit/verify-chain/
POST /api/complaints/webhooks/whatsapp/
POST /api/complaints/webhooks/facebook/
```

La documentation interactive est exposée par `/api/docs/` et `/api/redoc/`. Les clients envoient `Authorization: Bearer <access_token>` après authentification.

## Conventions de développement

Le frontend utilise des composants fonctionnels React, des hooks, `react-i18next`, `react-hot-toast`, `react-icons` et un module API centralisé dans `frontend/src/api/index.js`. Le backend organise la logique asynchrone dans `tasks.py` et conserve les secrets uniquement dans les fichiers d’environnement non suivis. Toute modification de workflow doit être accompagnée de tests backend et d’une mise à jour de la documentation correspondante.

## Procédures de référence

Pour un environnement manuel : `python manage.py migrate`, puis `python manage.py shell < scripts/populate_benin_db.py`. Pour Docker : `docker compose build && docker compose up -d`. Pour un VPS : `./deploy.sh`, après vérification du `.env`, de la branche `master` et des sauvegardes. Pour WhatsApp : `scripts/setup_openwa_whatsapp.sh` et [SOCIAL_INTEGRATION.md](SOCIAL_INTEGRATION.md). Pour les médias : utiliser le stockage local et le volume `backend_media` documentés dans [docs/ENVIRONNEMENT.md](docs/ENVIRONNEMENT.md).

## Références

[1]: https://docs.djangoproject.com/en/stable/ Django — documentation officielle
[2]: https://docs.celeryq.dev/en/stable/ Celery — documentation officielle
[3]: https://github.com/rmyndharis/OpenWA OpenWA — passerelle WhatsApp open source
