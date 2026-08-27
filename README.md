# PGP-USS

**Plateforme de Gestion des Plaintes des Usagers des Services de Santé au Bénin**

PGP-USS est une plateforme multicanale qui centralise le dépôt, le suivi, l’instruction, l’escalade et la clôture des plaintes relatives aux services de santé. Elle fournit un portail web, une application mobile et des points d’entrée sociaux, dont un chatbot WhatsApp. Le projet est structuré autour de la pyramide sanitaire béninoise et d’un contrôle d’accès par rôles.

> Ce README décrit le dépôt tel qu’il est versionné sur la branche `master`. Les informations détaillées sont réparties entre le [guide de déploiement](docs/DEPLOIEMENT.md), le [référentiel des variables d’environnement](docs/ENVIRONNEMENT.md), le [guide d’intégration sociale et mobile](SOCIAL_INTEGRATION.md) et la [liste de référence des utilisateurs de test](UTILISATEURS_TESTS.md).

## Fonctionnalités

| Domaine | Fonctionnement |
|---|---|
| Dépôt | Dépôt identifié ou anonyme depuis le web, le mobile, le chatbot WhatsApp, Facebook ou le call center 136. |
| Suivi | Numéro de ticket, suivi public, historique des étapes et consultation des demandes de complément. |
| Workflow | Accusé de réception, qualification, affectation, instruction, résolution, escalade, arbitrage et clôture. |
| Gouvernance | Visibilité filtrée par rôle et rattachement : établissement, zone sanitaire, département ou niveau national. |
| Notifications | Notifications applicatives, e-mail et SMS selon la configuration du fournisseur. |
| Médias | Pièces jointes et messages vocaux stockés localement dans `MEDIA_ROOT`; en Docker, ils sont persistés par `backend_media`. |
| Pilotage | Tableaux de bord, statistiques, satisfaction usager et exports PDF/Excel. |
| Traçabilité | Journal d’audit append-only avec chaîne de hachage et endpoint de vérification. |
| Accessibilité et langues | Interface française par défaut, traductions Fon/Yoruba présentes dans le frontend, et aide vocale sur le formulaire de dépôt. |

## Architecture

Le projet est un monorepo composé des éléments suivants :

| Composant | Technologie et rôle |
|---|---|
| `backend/` | Django et Django REST Framework, authentification JWT, règles métier, API et fichiers médias locaux. L’image Docker utilise Python 3.11. |
| `frontend/` | React 18 et Vite en développement ; Nginx sert la SPA en production et relaie `/api/`, `/admin/` et `/static/` vers Django. |
| `mobile/` | Application Flutter consommant les mêmes API REST que le portail web. |
| `OpenWA/` | Passerelle WhatsApp NestJS basée sur `whatsapp-web.js`, avec session persistante, QR code, API REST et webhooks. |
| Redis | Cache Django et broker/backend de résultats pour Celery. Le service Docker s’appelle `redis`. |
| Celery | Worker asynchrone pour le traitement des webhooks WhatsApp et l’envoi de messages WhatsApp. |
| PostgreSQL ou SQLite | PostgreSQL est recommandé en production via `DATABASE_URL` ; SQLite est la valeur de repli pour le développement local. |

Le compose principal démarre `backend`, `frontend`, `openwa`, `openwa-dashboard`, `celery-worker` et `redis`. Les volumes `openwa_data`, `redis_data`, `backend_media` et `shared_media` assurent respectivement la persistance des sessions OpenWA, des données Redis et des fichiers médias. Le détail du routage interne est décrit dans [SOCIAL_INTEGRATION.md](SOCIAL_INTEGRATION.md).

## Prérequis

Pour un développement sans Docker, prévoir Python 3.11 ou une version compatible avec les dépendances du backend, Node.js 18 ou supérieur, npm, Redis et Flutter 3.x si l’application mobile doit être lancée. Pour un déploiement conteneurisé, prévoir Docker Engine et le plugin Docker Compose. OpenWA nécessite également une mémoire partagée suffisante pour Chromium ; son compose principal utilise `shm_size: 1gb` et les options Chromium adaptées au conteneur.

## Démarrage local sans Docker

Le mode manuel sépare le backend, Redis, le worker Celery, le frontend et OpenWA. Les commandes doivent être exécutées dans des terminaux distincts.

### 1. Backend Django

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate                 # Windows : .venv\\Scripts\\activate
pip install -r requirements.txt
cp .env.example .env                      # puis compléter les valeurs nécessaires
python manage.py migrate
python manage.py shell < scripts/populate_benin_db.py
python manage.py runserver 0.0.0.0:8000
```

Le script de peuplement est idempotent pour les référentiels et crée les données de démonstration prévues pour les tests. La commande `seed_benin_workflow` mentionnée dans d’anciens documents n’est pas la procédure de référence actuelle.

### 2. Redis et Celery

Démarrer Redis localement, puis lancer le worker depuis `backend/` dans un autre terminal :

```bash
redis-server
cd backend
source .venv/bin/activate
celery -A config worker --loglevel=info --concurrency=2
```

Redis est utilisé par Django pour le cache et par Celery comme broker et backend de résultats. Le webhook WhatsApp tente de mettre la tâche en file ; si Redis ou Celery est indisponible, le backend applique un traitement synchrone de secours. Ce fallback ne remplace pas un worker en production, car le traitement asynchrone reste nécessaire pour la robustesse et les retries.

### Variables obligatoires et facultatives

Le fonctionnement minimal local peut utiliser SQLite, le stockage local des médias et le mode SMS `mock`. En production, `DJANGO_SECRET_KEY`, `DJANGO_DEBUG=False`, `DATABASE_URL` et `REDIS_URL` sont obligatoires pour une installation durable. `OPENWA_API_KEY` et `OPENWA_WEBHOOK_SECRET` sont obligatoires uniquement si WhatsApp/OpenWA est activé. Les variables e-mail (`EMAIL_*`), SMS (`SMS_*`), Firebase (`FIREBASE_SERVICE_ACCOUNT_JSON` ou `GOOGLE_APPLICATION_CREDENTIALS`), Facebook (`FB_VERIFY_TOKEN`) et le parcours serverless (`FAST_COMPLAINT_CREATE`, `VERCEL_MAX_UPLOAD_BYTES`) sont facultatives et ne doivent être renseignées que pour la fonctionnalité correspondante. `PGPUSS_WEBHOOK_URL` et `OPENWA_SESSION_NAME` sont utilisées uniquement par le script de configuration OpenWA. `VITE_API_URL` est facultative avec le proxy Vite local, mais requise lorsque le frontend est servi séparément.

Les fichiers uploadés sont enregistrés localement dans `MEDIA_ROOT`. Le compose racine monte ce répertoire sur `backend_media`, qui doit être sauvegardé sur le VPS. Le stockage local n’est pas persistant sur Vercel ; le déploiement complet avec uploads doit utiliser le VPS Docker recommandé. Le détail de chaque variable se trouve dans [docs/ENVIRONNEMENT.md](docs/ENVIRONNEMENT.md).

### 3. Frontend React

```bash
cd frontend
npm install
npm run dev
```

Le frontend est disponible sur `http://localhost:5173`. En développement, `frontend/vite.config.js` relaie `/api` vers `http://localhost:8000`; `frontend/.env.development` laisse donc `VITE_API_URL` vide. Pour une autre adresse, définir `VITE_API_URL` avant de lancer Vite.

### 4. OpenWA en développement

Pour activer WhatsApp, suivre [SOCIAL_INTEGRATION.md](SOCIAL_INTEGRATION.md). OpenWA peut être lancé directement avec Node.js ou avec `docker-compose.openwa.yml` lorsque seul le gateway WhatsApp est conteneurisé. Une fois la session créée, ouvrir le dashboard QR à `http://localhost:2886`, scanner le code puis enregistrer le webhook vers `/api/complaints/webhooks/whatsapp/`.

## Déploiement Docker local ou VPS

Le compose racine est le mode recommandé pour un serveur ou une démonstration complète :

```bash
cp .env.example .env
# renseigner au minimum DJANGO_SECRET_KEY, OPENWA_API_KEY et OPENWA_WEBHOOK_SECRET
# puis adapter DATABASE_URL et les paramètres SMTP si nécessaire
docker compose build
docker compose up -d
docker compose ps
```

Le frontend est publié sur le port `80`, l’API Django sur `8000`, OpenWA sur `2785` et son dashboard sur `2886`. En production, exposer de préférence uniquement le frontend derrière un reverse proxy TLS et ne pas publier Redis directement sur Internet. Le guide complet, incluant sauvegardes, renouvellement des secrets, logs et procédure de mise à jour, se trouve dans [docs/DEPLOIEMENT.md](docs/DEPLOIEMENT.md).

### Déploiement VPS avec `deploy.sh`

Sur un VPS où le dépôt est déjà cloné et où Docker Compose est installé :

```bash
cd /chemin/vers/PGPUSS
cp .env.example .env
chmod +x deploy.sh
# éditer .env avant le premier démarrage
./deploy.sh
```

`deploy.sh` suppose que la branche distante à mettre à jour est `master`. Il exécute `git pull origin master`, construit les images, arrête puis redémarre le compose, supprime les verrous Chromium résiduels dans le volume `pgpuss_openwa_data`, puis lance `migrate` et `collectstatic` dans le conteneur backend. La suppression du verrou ne doit pas être remplacée par une suppression du volume, car le volume contient les sessions WhatsApp persistantes.

Pour une opération plus contrôlée, exécuter manuellement les étapes du script et vérifier `docker compose logs -f backend celery-worker openwa` après le redémarrage. Le script ne réalise pas de sauvegarde de la base ou des volumes : ces sauvegardes doivent être organisées avant une mise à jour majeure.

## Déploiement sur Vercel

Le dépôt ne contient pas de `vercel.json` ni d’adaptateur `api/index.py`. Le déploiement Vercel repose donc sur la configuration des projets Vercel existants et sur les réglages de répertoire racine. La procédure à utiliser est la suivante :

1. Créer ou sélectionner un projet Vercel pour le backend, avec `backend/` comme répertoire racine, puis un projet séparé pour le frontend, avec `frontend/` comme répertoire racine.
2. Définir dans le projet backend les variables `DJANGO_SECRET_KEY`, `DJANGO_DEBUG=False`, `DATABASE_URL`, `REDIS_URL` et les variables d’intégration nécessaires. Le backend doit disposer d’une base PostgreSQL accessible depuis Vercel. Le stockage local des fichiers n’est pas persistant sur Vercel ; les uploads doivent donc être traités sur le VPS Docker recommandé.
3. Définir dans le projet frontend `VITE_API_URL` sur l’URL publique du backend Vercel, puis lancer un nouveau déploiement du frontend.
4. Activer ou conserver `VERCEL=1` dans l’environnement Vercel. Le backend passe alors en création rapide de plainte et les médias sont envoyés séparément vers `POST /api/complaints/<id>/deposit-media/`.
5. Tester une connexion, un dépôt JSON, le suivi public et un dépôt avec petite pièce jointe. Les fichiers sont enregistrés dans `MEDIA_ROOT`; sur Vercel, ce stockage est éphémère et ne doit pas être utilisé pour une conservation durable.

Vercel convient surtout à l’API et au frontend HTTP sans conservation locale durable de fichiers. Le stockage local Django, le worker Celery et OpenWA nécessitent des processus ou volumes persistants ; le déploiement complet recommandé est donc le VPS Docker. Si le backend Vercel traite des webhooks WhatsApp, il faut maintenir un worker Celery séparé qui utilise le même `REDIS_URL`, et accepter que les fichiers locaux ne soient pas durables. Les détails et les limites de cette architecture sont centralisés dans [docs/DEPLOIEMENT.md](docs/DEPLOIEMENT.md).

## WhatsApp et OpenWA

OpenWA est l’option open source retenue dans ce projet **à la place d’une intégration directe avec l’API Meta Cloud** pour mettre en place le chatbot WhatsApp. Il fonctionne comme une passerelle auto-hébergée : le téléphone scanne un QR code, OpenWA reçoit les messages et appelle le webhook PGP-USS ; le backend traite la conversation et envoie les réponses via l’API OpenWA. Cette option évite de dépendre d’un compte Meta Business pour le parcours de démonstration, mais elle implique de maintenir une session WhatsApp Web, Chromium, un volume persistant et un processus OpenWA actif.

Le point d’entrée PGP-USS est `POST /api/complaints/webhooks/whatsapp/`. Les variables principales sont `OPENWA_API_URL`, `OPENWA_API_KEY`, `OPENWA_SESSION_ID` et `OPENWA_WEBHOOK_SECRET`. La configuration automatique de la session et du webhook s’effectue avec `scripts/setup_openwa_whatsapp.sh`. Consulter [SOCIAL_INTEGRATION.md](SOCIAL_INTEGRATION.md) pour les payloads, le routage, le chatbot et l’alternative Meta/Twilio. OpenWA reste également documenté dans son propre [README](OpenWA/README.md).

## API et interfaces utiles

| Usage | Adresse ou fichier |
|---|---|
| API locale | `http://localhost:8000/api/` |
| Documentation OpenAPI | `http://localhost:8000/api/docs/` |
| ReDoc | `http://localhost:8000/api/redoc/` |
| Frontend local | `http://localhost:5173` |
| Frontend Docker | `http://localhost/` |
| OpenWA API | `http://localhost:2785/api` |
| OpenWA dashboard QR | `http://localhost:2886` |
| Suivi public | `GET /api/complaints/track/<ticket_number>/` |
| Webhook WhatsApp | `POST /api/complaints/webhooks/whatsapp/` |
| Journal d’audit | `GET /api/audit/` et `GET /api/audit/verify-chain/` |

## Comptes de test

Les identifiants historiques qui ne figurent plus dans le référentiel à jour ne doivent plus être utilisés. La référence actuelle est [UTILISATEURS_TESTS.md](UTILISATEURS_TESTS.md). Les comptes prioritaires ci-dessous utilisent le mot de passe commun `Pgpuss2026!` après exécution du script de peuplement ; ils imposent un changement de mot de passe à la première connexion.

| Email | Rôle | Rattachement |
|---|---|---|
| `admin@pgpuss.bj` | `ADMIN_PLATEFORME` | Transversal |
| `cabinet@sante.bj` | `CABINET` | Ministère de la Santé |
| `dqss@sante.bj` | `DQSS` | National |
| `pnuss.national@sante.bj` | `PNUSS` | National |
| `callcenter136@pgpuss.bj` | `AGENT_CALL_CENTER` | Ligne verte 136 |
| `dds.littoral@sante.bj` | `DDS` | Département du Littoral |
| `pfzs.zscot1@sante.bj` | `PFZS` | Zone Cotonou 1 (Akpakpa) |
| `pfe.cnhuhkm@sante.bj` | `PFE` | CNHU-HKM |
| `pfe.hzsul@sante.bj` | `PFE` | HZ Suru-Léré |
| `pfe.chdli@sante.bj` | `PFE` | CHD Littoral |
| `pnuss.littoral@sante.bj` | `PNUSS` | Département du Littoral |
| `pnuss.zscot1@sante.bj` | `PNUSS` | Zone Cotonou 1 (Akpakpa) |
| `pnuss.cnhuhkm@sante.bj` | `PNUSS` | CNHU-HKM |

Pour réinitialiser entièrement une base Docker de démonstration, utiliser `bash backend/scripts/reset_and_populate.sh`. **Cette commande efface toutes les données existantes** ; elle ne doit jamais être exécutée sur une base de production sans sauvegarde et validation explicite.

## Tests et qualité

Les tests applicatifs Django sont répartis dans les applications backend. Depuis `backend/`, exécuter `python manage.py test accounts complaints establishments notifications analytics support audit` après installation des dépendances. Les fichiers `backend/test_*.py` à la racine sont des scripts historiques qui accèdent parfois à la base au moment de leur import et ne doivent pas être confondus avec la suite applicative automatique. Pour une vérification manuelle, tester au minimum l’authentification JWT, le dépôt identifié/anonyme, le suivi par ticket, le routage par établissement, l’escalade, le dépôt de médias, le webhook WhatsApp et la visibilité par rôle.

## Documentation du dépôt

| Document | Objet |
|---|---|
| [docs/DEPLOIEMENT.md](docs/DEPLOIEMENT.md) | Installation locale, Docker, VPS, `deploy.sh`, Vercel, sauvegardes et dépannage. |
| [docs/ENVIRONNEMENT.md](docs/ENVIRONNEMENT.md) | Variables backend, frontend, Docker, Redis, Celery, OpenWA et options facultatives. |
| [SOCIAL_INTEGRATION.md](SOCIAL_INTEGRATION.md) | WhatsApp/OpenWA, Facebook, mobile, webhooks et chatbot. |
| [UTILISATEURS_TESTS.md](UTILISATEURS_TESTS.md) | Comptes de test, rôles, rattachements et permissions. |
| [docs/fosa_benin.md](docs/fosa_benin.md) | Référentiel documentaire des formations sanitaires. |
| [DOCUMENTATION.md](DOCUMENTATION.md) | Vue technique synthétique et workflow métier. |
| [Cahier_de_charge_v3.docx](Cahier_de_charge_v3.docx) | Cahier des charges du projet académique. |

## Avertissements de sécurité

Ne jamais commiter `.env`, une clé OpenWA, un secret HMAC ou un mot de passe SMTP. Le fichier `.env.example` est un modèle non secret ; le fichier `.env` est chargé par Docker et doit rester local au serveur. En production, remplacer les mots de passe de démonstration, limiter les ports exposés, utiliser HTTPS et sauvegarder les volumes persistants avant toute opération destructive.

## Références

[1]: https://docs.docker.com/compose/ Docker Compose — documentation officielle
[2]: https://vercel.com/docs Vercel — documentation officielle
[3]: https://github.com/rmyndharis/OpenWA OpenWA — passerelle WhatsApp open source
