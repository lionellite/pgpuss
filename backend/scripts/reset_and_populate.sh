#!/bin/bash
# reset_and_populate.sh — Réinitialisation complète + peuplement de la DB PGP-USS
# Usage (sur le VPS) : bash backend/scripts/reset_and_populate.sh
# ⚠️  ATTENTION : Efface TOUTES les données existantes.

set -e
echo "=== RÉINITIALISATION DE LA BASE PGP-USS ==="
echo "⚠️  Toutes les données seront supprimées dans 5 secondes. Ctrl+C pour annuler."
sleep 5

# Purge de la DB (conserve les tables)
docker exec pgpuss-backend python manage.py flush --no-input

# Application des migrations (au cas où)
docker exec pgpuss-backend python manage.py migrate --no-input

# Chargement des catégories par défaut (si fixture existe)
if docker exec pgpuss-backend test -f fixtures/categories.json 2>/dev/null; then
  docker exec pgpuss-backend python manage.py loaddata fixtures/categories.json
fi

# Exécution du script de peuplement
docker exec pgpuss-backend python manage.py shell < backend/scripts/populate_benin_db.py

echo ""
echo "=== Terminé ! ==="
echo "Accès admin : admin@pgpuss.bj / Pgpuss2026!"
echo "Call Center : callcenter136@pgpuss.bj / Pgpuss2026!"
