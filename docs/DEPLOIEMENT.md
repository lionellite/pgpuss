# Guide de déploiement PGP-USS

Ce guide couvre le développement local, le déploiement complet avec Docker sur un VPS et le déploiement séparé du frontend/backend sur Vercel. Le stockage des fichiers uploadés est local : Django utilise `FileSystemStorage` et écrit dans `MEDIA_ROOT`. Pour une conservation durable, il faut donc utiliser un VPS ou une autre machine persistante avec sauvegarde du volume média.

> **Recommandation.** Le VPS Docker est le mode complet recommandé, car il conserve les fichiers, les sessions OpenWA, Redis et le worker Celery. Vercel peut servir l’API et le frontend HTTP, mais son système de fichiers local est éphémère et ne doit pas être utilisé pour conserver les pièces jointes ou les messages vocaux.

## Préparer l’environnement

Pour Docker, créer le fichier racine `.env` à partir de `.env.example`. Pour un lancement manuel, créer `backend/.env` à partir de `backend/.env.example`. Les deux fichiers sont distincts : le compose injecte le fichier racine au backend et au worker, tandis que Django lit `backend/.env` lorsqu’il est lancé depuis `backend/`.

```bash
cp .env.example .env
# ou, pour un lancement manuel uniquement :
cp backend/.env.example backend/.env
chmod 600 .env backend/.env 2>/dev/null || true
```

Définir en production `DJANGO_SECRET_KEY`, `DJANGO_DEBUG=False`, `DATABASE_URL`, `REDIS_URL` et les secrets OpenWA lorsque WhatsApp est activé. Les variables facultatives sont décrites dans [ENVIRONNEMENT.md](ENVIRONNEMENT.md).

## Développement local sans Docker

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
python manage.py migrate
python manage.py shell < scripts/populate_benin_db.py
python manage.py runserver 0.0.0.0:8000
```

Django utilise `backend/db.sqlite3` si `DATABASE_URL` est absente. Cette base et le répertoire `backend/media/` conviennent au développement local. En production, utiliser PostgreSQL et un volume de fichiers sauvegardé.

Démarrer Redis localement puis le worker Celery dans un autre terminal :

```bash
redis-server
cd backend
source .venv/bin/activate
celery -A config worker --loglevel=info --concurrency=2
```

Le frontend se lance depuis `frontend/` avec `npm install` puis `npm run dev`. Vite écoute sur `http://localhost:5173` et relaie `/api` vers `http://localhost:8000`.

## Déploiement complet avec Docker

Le compose racine démarre `backend`, `frontend`, `openwa`, `openwa-dashboard`, `celery-worker` et `redis` :

```bash
cp .env.example .env
# renseigner au minimum DJANGO_SECRET_KEY, OPENWA_API_KEY et OPENWA_WEBHOOK_SECRET
docker compose config
docker compose build
docker compose up -d
docker compose ps
docker compose logs -f backend celery-worker openwa
```

Le fichier `.env` est injecté au backend et au worker avec `env_file`. Compose utilise aussi `OPENWA_API_KEY` pour renseigner `API_MASTER_KEY` dans OpenWA. Les fichiers médias sont persistés dans `backend_media` ; les médias transitoires d’OpenWA utilisent `shared_media` ; la session et les données OpenWA utilisent `openwa_data` ; Redis utilise `redis_data`.

| Service | Port hôte | Fonction |
|---|---:|---|
| Frontend Nginx | `80` | Interface web, proxy `/api`, `/admin`, `/static` et accès `/media`. |
| Backend Django | `8000` | API, administration et écriture des fichiers dans `MEDIA_ROOT`. |
| OpenWA | `2785` | API de la passerelle WhatsApp. |
| Dashboard OpenWA | `2886` | Connexion de la session WhatsApp par QR code. |
| Redis | `6379` | Cache Django et broker Celery ; ne pas l’exposer publiquement. |

Le backend exécute les migrations au démarrage via `backend/entrypoint.sh`. La réinitialisation de démonstration est destructive :

```bash
bash backend/scripts/reset_and_populate.sh
```

Elle effectue un `flush` complet avant de recréer les référentiels et comptes. Ne pas l’utiliser en production.

Le compose autonome `docker-compose.openwa.yml` lance uniquement OpenWA et son volume de session. Il accepte `OPENWA_API_KEY` depuis le `.env` racine. Pour le chatbot complet, utiliser le compose racine afin que le webhook puisse atteindre le service `backend` et que `shared_media` soit partagé.

## Déploiement VPS avec `deploy.sh`

Sur un VPS déjà équipé de Docker Compose et contenant le dépôt :

```bash
cd /chemin/vers/PGPUSS
git checkout master
cp .env.example .env
nano .env
chmod +x deploy.sh
./deploy.sh
```

Le script exécute `git pull origin master`, construit les images, arrête les conteneurs, démarre les services, supprime les éventuels `SingletonLock` Chromium dans le volume `pgpuss_openwa_data`, exécute `migrate`, exécute `collectstatic` et affiche `docker compose ps`.

Le script suppose la branche `master` et le nom de volume OpenWA `pgpuss_openwa_data`. Vérifier le nom réel avec `docker volume ls` si le projet a été lancé avec un autre nom Compose. Le script ne sauvegarde ni la base ni les volumes et ne doit pas être lancé avant une sauvegarde des données.

En production, placer un reverse proxy TLS devant le frontend, restreindre le firewall, ne pas exposer Redis, et sauvegarder la base ainsi que `backend_media`, `shared_media` et `openwa_data`. Ne pas supprimer `openwa_data` lors d’une simple mise à jour : il contient la session WhatsApp.

## Déploiement Vercel

Le dépôt ne contient pas de `vercel.json` ni d’adaptateur `api/index.py`. La procédure Vercel repose donc sur deux projets configurés dans le tableau de bord : un projet backend avec `backend/` comme répertoire racine et un projet frontend avec `frontend/` comme répertoire racine. Vérifier le runtime Python et le point d’entrée WSGI pris en charge par le projet avant de considérer le déploiement comme automatisé par Git.

Pour le backend, définir `DJANGO_SECRET_KEY`, `DJANGO_DEBUG=False`, `DATABASE_URL`, `REDIS_URL` et les variables OpenWA si des webhooks sont utilisés. PostgreSQL et Redis doivent être accessibles depuis Vercel. `VERCEL=1` active le parcours de création rapide : la plainte est créée en JSON, puis les médias sont envoyés séparément sur `POST /api/complaints/<id>/deposit-media/`.

Le stockage local de Django n’est pas persistant sur Vercel. Une plainte avec pièce jointe ou message vocal doit être traitée sur le VPS Docker recommandé, ou sur une infrastructure de stockage externe explicitement ajoutée au projet. Aucun stockage externe de ce type n’est fourni par le dépôt actuel.

Pour le frontend, définir `VITE_API_URL` sur l’URL HTTPS publique du backend avant `npm run build`. Ne jamais utiliser `http://backend:8000` dans un build destiné au navigateur.

OpenWA, Chromium et le worker Celery ne doivent pas être exécutés comme des fonctions serverless éphémères. Ils doivent rester sur un VPS ou un service persistant. Si le backend Vercel reçoit des webhooks WhatsApp, le worker séparé doit utiliser le même `REDIS_URL`.

## Validation et dépannage

```bash
docker compose config
docker compose ps
docker compose exec -T redis redis-cli ping
curl -f http://localhost:8000/api/docs/ >/dev/null
docker compose logs --tail=100 backend celery-worker openwa redis
```

| Symptôme | Vérification |
|---|---|
| Les fichiers disparaissent après redémarrage | Vérifier que `backend_media` est bien monté et ne pas utiliser le stockage local Vercel. |
| Les tâches WhatsApp restent en attente | Vérifier Redis, `REDIS_URL=redis://redis:6379/0` et le conteneur `celery-worker`. |
| Le QR OpenWA ne répond pas | Vérifier `openwa`, le volume `openwa_data`, la mémoire partagée et les logs Chromium. |
| Le frontend affiche une erreur réseau | Vérifier le proxy Nginx et `VITE_API_URL` selon le mode d’exécution. |
| `deploy.sh` ne trouve pas le volume | Comparer le nom attendu `pgpuss_openwa_data` avec `docker volume ls`. |

## Références

[1]: https://docs.docker.com/compose/ Docker Compose — documentation officielle
[2]: https://vercel.com/docs Vercel — documentation officielle
[3]: https://docs.djangoproject.com/en/stable/topics/files/ Django — gestion des fichiers uploadés
