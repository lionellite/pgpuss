# Guide d'Intégration Réseaux Sociaux & Mobile - PGP-USS

Ce document détaille comment connecter les canaux externes (WhatsApp, Facebook, App Mobile) à la plateforme PGP-USS.

## 1. WhatsApp (via OpenWA — recommandé)

[OpenWA](https://github.com/rmyndharis/OpenWA) est une passerelle WhatsApp open source incluse dans ce dépôt (`OpenWA/`). Elle remplace l'API Meta Cloud directe : vous scannez un QR code avec votre téléphone, sans compte Meta Business.

### Architecture

```
WhatsApp (téléphone) ↔ OpenWA (NestJS) ──webhook──► PGP-USS backend
                              ▲                         │
                              │                         ├── bot_engine (chatbot)
                              └── API REST              └── openwa_client (réponses)
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

**Tester** : envoyez « Bonjour » au numéro WhatsApp connecté pour démarrer le chatbot.

### Endpoint PGP-USS

`POST /api/complaints/webhooks/whatsapp/`

OpenWA envoie les événements `message.received` au format :

```json
{
  "event": "message.received",
  "sessionId": "sess_abc123",
  "data": {
    "id": "true_22997123456@c.us_3EB0ABC123",
    "from": "22997123456@c.us",
    "chatId": "22997123456@c.us",
    "body": "Bonjour",
    "type": "chat",
    "isGroup": false,
    "hasMedia": false
  }
}
```

**Message vocal ou pièce jointe** (OpenWA inclut le média en base64) :

```json
{
  "event": "message.received",
  "sessionId": "sess_abc123",
  "data": {
    "from": "22997123456@c.us",
    "chatId": "22997123456@c.us",
    "body": "",
    "type": "ptt",
    "hasMedia": true,
    "isGroup": false,
    "media": {
      "mimetype": "audio/ogg; codecs=opus",
      "filename": "voice.ogg",
      "data": "<base64>"
    }
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
| `CLOUDINARY_URL` | Stockage des médias WhatsApp en production (obligatoire sur Vercel) |

### Logique métier — Chatbot conversationnel

Tout message entrant (hors groupes) déclenche le chatbot (`bot_engine.py`). Une session WhatsApp (`WhatsAppSession`) conserve l'état pendant **24 h**.

#### Menu d'accueil

```
Bienvenue sur la plateforme PGP-USS Santé Bénin 🏥

Que souhaitez-vous faire ?
1. Déposer une plainte
2. Suivre une plainte (avec votre numéro de ticket)

Répondez par 1 ou 2.
Vous pouvez aussi envoyer directement votre numéro de ticket (ex: PGP-2026-AB1234).
```

#### Suivi de plainte

- Envoi direct du ticket `PGP-YYYY-XXXXXX`
- Option **2** au menu, puis saisie du ticket
- Mots-clés : « suivi », « statut », « ticket »…

La réponse inclut : statut, priorité, date de dépôt, dernières étapes du workflow, demandes de complément éventuelles.

#### Dépôt de plainte (étapes)

| État | Contenu |
|------|---------|
| **Département** | Liste des départements (régions) du référentiel |
| **Établissement** | Hôpitaux/centres filtrés par département (+ pagination) |
| **Service** | Service concerné si disponible (optionnel) |
| **Saisie manuelle** | Si établissement absent du référentiel (option `0`) |
| Catégorie | 1–7 (soins, médicaments, facturation…) |
| Titre | Titre court |
| Description | **Texte ou message vocal** 🎤 |
| Pièces jointes | Photos, PDF, documents (max 5) |
| Identité | Anonyme (1) ou nom complet (2) |
| Confirmation | Récapitulatif puis validation |

#### Routage automatique

| Cas | Destination |
|-----|-------------|
| Établissement **référencé** (FK) | **PFE** de l'établissement (notification immédiate) |
| Établissement **saisi manuellement** | **Call Center 136** (`pending_call_center_completion=True`) |

Le call center peut :
- **Finaliser** la plainte en rattachent un établissement du référentiel → routage PFE
- **Orienter vers une zone sanitaire** → notification du **PFZS** concerné

Ce routage s'applique à **tous les canaux** (web, mobile, WhatsApp).

À la confirmation :
- Création d'une plainte (canal `CHATBOT`, statut `SOUMISE`)
- Upload des médias sur la plateforme (Cloudinary / stockage local)
- Envoi du numéro de ticket via OpenWA
- Entrée dans le journal d'audit immuable

Commandes globales : `stop`, `annuler`, `quitter`, `menu` → annulation de la session.

### Fichiers backend concernés

| Fichier | Rôle |
|---------|------|
| `complaints/api_social.py` | Webhook WhatsApp / Facebook |
| `complaints/bot_engine.py` | Machine à états du chatbot |
| `complaints/whatsapp_parser.py` | Parsing messages, médias, tickets |
| `complaints/whatsapp_media.py` | Upload vocal / PJ vers la plateforme |
| `complaints/openwa_client.py` | Envoi des réponses WhatsApp |

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
- **POST Meta** : payload `entry[].changes[].value.messages[]`
- **POST simplifié** : `{ "from": "...", "text": "..." }`

> **Note Meta** : le parsing des types audio/image/document est préparé, mais le téléchargement des fichiers nécessite un appel API Meta supplémentaire (non implémenté).

## 2. Facebook Messenger

L'endpoint est situé à : `/api/complaints/webhooks/facebook/`

### Validation du Webhook

Facebook requiert une étape de vérification (GET) avant d'activer le webhook :
- **Verify Token** : variable d'env **`FB_VERIFY_TOKEN`**
- Le serveur répond avec le `hub.challenge` envoyé par Facebook.

### Réception des messages

Les messages sont reçus via POST (format `entry[].messaging[]`). Si le texte contient « PLAINTE », une plainte est créée (canal `CHATBOT`) avec `pending_call_center_completion=True` pour complétion par le call center.

## 3. Application Mobile (Flutter / React Native)

Les applications mobiles utilisent les mêmes APIs REST que le portail web.

### Authentification

Utilisez le protocole **JWT** :
1. POST `/api/auth/login/phone/` pour obtenir les tokens.
2. Ajoutez `Authorization: Bearer <token>` dans vos headers.

### Plaintes

- **Liste** : `GET /api/complaints/` (filtrée par rôle, tri par défaut `-created_at`)
- **Paramètre de tri** : `?ordering=-created_at` (plus récentes) ou `?ordering=created_at` (plus anciennes)
- **Création** : `POST /api/complaints/create/`
- **Médias différés** : `POST /api/complaints/{id}/deposit-media/`
- **Suivi public** : `GET /api/complaints/track/{ticket_number}/`

## 4. Journal d'audit immuable

Toutes les actions sensibles (plaintes, connexions, modifications utilisateurs, exports) sont enregistrées dans un journal **append-only** avec chaîne de hachage.

- **API** : `GET /api/audit/` (lecture seule)
- **Accès** : `ADMIN_PLATEFORME`, `CABINET` (ministère)
- **Vérification d'intégrité** : `GET /api/audit/verify-chain/`
- **Interface** : `/dashboard/journal-audit`

## 5. Notifications Push

Pour les notifications push réelles, nous recommandons l'utilisation de **Firebase Cloud Messaging (FCM)**. La structure est prête dans le modèle `Notification` (type='PUSH').
