#!/usr/bin/env bash
# Configuration initiale OpenWA → PGP-USS (session WhatsApp + webhook)
set -euo pipefail

OPENWA_API_URL="${OPENWA_API_URL:-http://localhost:2785/api}"
OPENWA_API_KEY="${OPENWA_API_KEY:-}"
PGPUSS_WEBHOOK_URL="${PGPUSS_WEBHOOK_URL:-https://pgpuss.vercel.app//api/complaints/webhooks/whatsapp/}"
OPENWA_WEBHOOK_SECRET="${OPENWA_WEBHOOK_SECRET:-pgpuss_openwa_secret_change_me}"
SESSION_NAME="${OPENWA_SESSION_NAME:-pgpuss-whatsapp}"

if [[ -z "$OPENWA_API_KEY" ]]; then
  if [[ -f OpenWA/data/.api-key ]]; then
    OPENWA_API_KEY="$(cat OpenWA/data/.api-key)"
    echo "Clé API lue depuis OpenWA/data/.api-key"
  else
    echo "Erreur : définissez OPENWA_API_KEY ou démarrez OpenWA pour générer data/.api-key"
    exit 1
  fi
fi

auth_header=(-H "X-API-Key: ${OPENWA_API_KEY}" -H "Content-Type: application/json")

echo "==> Création de la session WhatsApp « ${SESSION_NAME} »..."
session_response="$(curl -sS -X POST "${OPENWA_API_URL}/sessions" "${auth_header[@]}" \
  -d "{\"name\":\"${SESSION_NAME}\"}")"

SESSION_ID="$(echo "$session_response" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('id', d.get('data', {}).get('id', '')))" 2>/dev/null || true)"

if [[ -z "$SESSION_ID" ]]; then
  echo "Réponse OpenWA : $session_response"
  echo "Tentative de récupération d'une session existante..."
  SESSION_ID="$(curl -sS "${OPENWA_API_URL}/sessions" "${auth_header[@]}" | python3 -c "
import sys, json
res = json.load(sys.stdin)
data = res if isinstance(res, list) else res.get('data', [])
name = '${SESSION_NAME}'
for s in data:
    if s.get('name') == name:
        print(s.get('id', ''))
        break
" 2>/dev/null || true)"
fi

if [[ -z "$SESSION_ID" ]]; then
  echo "Impossible d'obtenir un sessionId OpenWA."
  exit 1
fi

echo "Session Name : ${SESSION_NAME}"

echo "==> Enregistrement du webhook vers PGP-USS..."
webhook_response="$(curl -sS -X POST "${OPENWA_API_URL}/sessions/${SESSION_NAME}/webhooks" "${auth_header[@]}" \
  -d "{
    \"url\": \"${PGPUSS_WEBHOOK_URL}\",
    \"events\": [\"message.received\"],
    \"secret\": \"${OPENWA_WEBHOOK_SECRET}\"
  }")"
echo "$webhook_response"

echo ""
echo "==> QR Code WhatsApp (scannez avec votre téléphone) :"
echo "   Dashboard : http://localhost:2886"
echo "   API QR    : ${OPENWA_API_URL}/sessions/${SESSION_NAME}/qr"
echo ""

ENV_FILE=".env"
if [[ -f "$ENV_FILE" ]]; then
  echo "==> Mise à jour automatique de $ENV_FILE avec le SESSION_NAME (fixe)..."
  # Remplacer la ligne OPENWA_SESSION_ID si elle existe, sinon l'ajouter
  if grep -q "^OPENWA_SESSION_ID=" "$ENV_FILE"; then
    sed -i "s/^OPENWA_SESSION_ID=.*/OPENWA_SESSION_ID=${SESSION_NAME}/" "$ENV_FILE"
  else
    echo "OPENWA_SESSION_ID=${SESSION_NAME}" >> "$ENV_FILE"
  fi
  echo "✓ $ENV_FILE mis à jour."
  
  echo "==> Redémarrage du backend pour appliquer le nouvel ID..."
  docker compose restart backend || echo "Attention: échec du redémarrage du backend."
else
  echo "Ajoutez ces variables dans votre fichier .env ou docker-compose :"
  echo "  OPENWA_API_URL=${OPENWA_API_URL}"
  echo "  OPENWA_API_KEY=${OPENWA_API_KEY}"
  echo "  OPENWA_SESSION_ID=${SESSION_ID}"
  echo "  OPENWA_WEBHOOK_SECRET=${OPENWA_WEBHOOK_SECRET}"
fi

echo ""
echo "Test : envoyez un message WhatsApp contenant le mot PLAINTE au numéro connecté."
