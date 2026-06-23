#!/bin/bash
set -e

echo "=========================================="
echo "   Déploiement PGP-USS sur Contabo VPS"
echo "=========================================="

echo "1. Mise à jour du code (optionnel)..."
git pull origin master

echo "2. Construction des images Docker..."
docker compose build

echo "3. Arrêt des conteneurs existants..."
docker compose down

echo "4. Démarrage des conteneurs en arrière-plan..."
docker compose up -d

echo "4b. Nettoyage des verrous Chromium (SingletonLock) d'OpenWA..."
# Parfois, un arrêt brutal laisse un fichier de verrouillage qui empêche Chromium de démarrer
docker compose exec -T openwa find /app/data -name "SingletonLock" -delete 2>/dev/null || true

echo "5. Exécution des migrations de base de données..."
docker compose exec -T backend python manage.py migrate

echo "6. Collecte des fichiers statiques..."
docker compose exec -T backend python manage.py collectstatic --noinput

echo "=========================================="
echo "   Déploiement terminé avec succès !"
echo "=========================================="
echo "Services en cours d'exécution :"
docker compose ps
