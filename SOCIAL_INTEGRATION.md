# Guide d'Intégration Réseaux Sociaux & Mobile - PGP-USS

Ce document détaille comment connecter les canaux externes (WhatsApp, Facebook, App Mobile) à la plateforme PGP-USS.

## 1. WhatsApp (via Twilio ou Meta API)

L'endpoint est situé à : `/api/complaints/webhooks/whatsapp/`

### Configuration
1. **Webhook URL** : Dans votre console Twilio (ou Meta Business), configurez l'URL de votre serveur PGP-USS pointant vers l'endpoint ci-dessus.
2. **Format de données** : Le système attend un JSON contenant `from` (numéro) et `text` (message).
3. **Logique** : Si le mot "PLAINTE" est détecté, un ticket est automatiquement généré.

## 2. Facebook Messenger

L'endpoint est situé à : `/api/complaints/webhooks/facebook/`

### Validation du Webhook
Facebook requiert une étape de vérification (GET) avant d'activer le webhook :
- **Verify Token** : `pgpuss_secret_token` (configurable dans `api_social.py`)
- Le serveur répond avec le `hub.challenge` envoyé par Facebook.

### Réception des messages
Les messages sont reçus via POST. Vous devez implémenter le parsing du format "Entry/Messaging" spécifique à Facebook dans `FacebookWebhookView.post()`.

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
