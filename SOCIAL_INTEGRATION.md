# Guide d'Intégration Réseaux Sociaux & Mobile - PGP-USS

Ce document détaille comment connecter les canaux externes (WhatsApp, Facebook, App Mobile) à la plateforme PGP-USS.

## 1. WhatsApp (via OpenWA — recommandé)

[OpenWA](https://github.com/rmyndharis/OpenWA) est une passerelle WhatsApp open source incluse dans ce dépôt (`OpenWA/`). Elle remplace l'API Meta Cloud directe : vous scannez un QR code avec votre téléphone, sans compte Meta Business.

### Architecture

```
WhatsApp (téléphone) ↔ OpenWA (NestJS) ──webhook──► PGP-USS backend
                              ▲
                              └── API REST (envoi de confirmations)
```

### Démarrage local (sans Docker pour tout le projet)

**Terminal 1 — Backend PGP-USS**

```bash
cd backend
cp .env.example .env   # puis renseigner OPENWA_* (voir ci-dessous)
python manage.py migrate
python manage.py runserver
```

**Terminal 2 — OpenWA** (au choix)

*Option A — Node.js (recommandé en dev)*

```bash
cd OpenWA
npm install
npm run dev
# API : http://localhost:2785/api
# Dashboard QR : http://localhost:2886
```

*Option B — Docker OpenWA seul* (backend reste en local)

```bash
docker compose -f docker-compose.openwa.yml up -d
# Webhook vers le backend local :
PGPUSS_WEBHOOK_URL=http://host.docker.internal:8000/api/complaints/webhooks/whatsapp/ \
  ./scripts/setup_openwa_whatsapp.sh
```

**Terminal 3 — Configuration session + webhook**

```bash
# Clé API (fichier généré au 1er démarrage d'OpenWA)
cat OpenWA/data/.api-key

chmod +x scripts/setup_openwa_whatsapp.sh
OPENWA_API_KEY=<votre-clé> ./scripts/setup_openwa_whatsapp.sh
```

Puis dans `backend/.env` :

```env
OPENWA_API_URL=http://localhost:2785/api
OPENWA_API_KEY=<clé>
OPENWA_SESSION_ID=<session-id affiché par le script>
OPENWA_WEBHOOK_SECRET=pgpuss_openwa_secret_change_me
```

**Scanner le QR code** : http://localhost:2886

**Tester** : envoyez « PLAINTE » au numéro WhatsApp connecté.

### Démarrage rapide (Docker — stack complète, optionnel)

Si vous utilisez déjà `docker compose up` pour db/backend/frontend, OpenWA reste **indépendant** :

```bash
docker compose -f docker-compose.openwa.yml up -d
```

### Endpoint PGP-USS

`POST /api/complaints/webhooks/whatsapp/`

OpenWA envoie les événements `message.received` au format :

```json
{
  "event": "message.received",
  "sessionId": "sess_abc123",
  "data": {
    "from": "22997123456@c.us",
    "chatId": "22997123456@c.us",
    "body": "Je veux déposer une PLAINTE",
    "isGroup": false
  }
}
```

### Variables d'environnement (backend)

| Variable | Description |
|----------|-------------|
| `OPENWA_API_URL` | URL de l'API OpenWA (ex. `http://openwa:2785/api` en Docker) |
| `OPENWA_API_KEY` | Clé API OpenWA (`X-API-Key`) |
| `OPENWA_SESSION_ID` | ID de la session WhatsApp connectée |
| `OPENWA_WEBHOOK_SECRET` | Secret HMAC pour vérifier les webhooks entrants |
| `WA_VERIFY_TOKEN` | Token Meta (conservé pour compatibilité GET webhook) |

### Logique métier

1. Un citoyen envoie un message WhatsApp contenant le mot **PLAINTE**
2. OpenWA transmet l'événement au backend PGP-USS
3. Un ticket est créé automatiquement (canal `CHATBOT`)
4. Une confirmation avec le numéro de ticket est renvoyée via OpenWA (si configuré)

### Configuration manuelle du webhook (OpenWA)

```bash
curl -X POST http://localhost:2785/api/sessions/<SESSION_ID>/webhooks \
  -H "X-API-Key: <OPENWA_API_KEY>" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "http://localhost:8000/api/complaints/webhooks/whatsapp/",
    "events": ["message.received"],
    "secret": "pgpuss_openwa_secret_change_me"
  }'
```

### Alternative : API Meta Cloud / Twilio

L'endpoint reste compatible avec l'ancien format Meta :

- **GET** : vérification webhook (`hub.mode`, `hub.verify_token`, `hub.challenge`)
- **POST Meta** : payload `entry[].changes[].value.messages[].text.body`
- **POST simplifié** : `{ "from": "...", "text": "..." }`

## 2. Facebook Messenger

L'endpoint est situé à : `/api/complaints/webhooks/facebook/`

### Validation du Webhook
Facebook requiert une étape de vérification (GET) avant d'activer le webhook :
- **Verify Token** : variable d'env **`FB_VERIFY_TOKEN`**
- Le serveur répond avec le `hub.challenge` envoyé par Facebook.

### Réception des messages
Les messages sont reçus via POST (format `entry[].messaging[]`). Si le texte contient "PLAINTE", une plainte est créée (canal `CHATBOT`) et un ticket est renvoyé dans la réponse.

## 3. Application Mobile (Flutter / React Native)

Les applications mobiles utilisent les mêmes APIs REST que le portail web.

### Authentification
Utilisez le protocole **JWT** :
1. POST `/api/auth/login/` pour obtenir les tokens.
2. Ajoutez `Authorization: Bearer <token>` dans vos headers.

### Endpoint dédié
- **Mes plaintes** : `/api/complaints/mobile/my-complaints/` (GET) renvoie la liste filtrée pour l'utilisateur mobile.

## 4. Notifications Push
Pour les notifications push réelles, nous recommandons l'utilisation de **Firebase Cloud Messaging (FCM)**. La structure est prête dans le modèle `Notification` (type='PUSH').
