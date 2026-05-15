#!/bin/bash
# Script de lancement PGP-USS Mobile
# Usage: ./run.sh [IP:PORT]
# Exemples:
#   ./run.sh                        → utilise 10.40.1.230:8000
#   ./run.sh 192.168.1.50:8000      → IP personnalisée
#   ./run.sh pgpuss.gouv.bj         → production (HTTPS auto)

API="${1:-https://pgpuss-git-master-lionels-projects-c5af5fda.vercel.app}"

# Ajouter http:// si pas de protocole
if [[ "$API" != http* ]]; then
  API="http://$API"
fi

echo "🏥 PGP-USS Mobile — Backend: $API"
flutter run --debug --dart-define=API_BASE_URL="$API"
