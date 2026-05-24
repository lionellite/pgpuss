# Configurer Cloudinary pour PGP-USS

Cloudinary stocke les **pièces jointes** et les **messages vocaux** des plaintes. Sans lui, Vercel ne peut pas conserver les fichiers (disque éphémère).

---

## 1. Créer un compte Cloudinary

1. Ouvrez [https://cloudinary.com/users/register/free](https://cloudinary.com/users/register/free)
2. Créez un compte (gratuit : environ **25 crédits / mois**, largement suffisant pour des tests et un volume modéré de plaintes)
3. Confirmez votre e-mail si demandé

---

## 2. Récupérer l’URL de connexion

1. Connectez-vous au [tableau de bord Cloudinary](https://console.cloudinary.com/)
2. En haut à droite : **Product environment** (ou l’icône engrenage → **API Keys**)
3. Repérez le bloc **API environment variable** — il ressemble à :

   ```
   CLOUDINARY_URL=cloudinary://123456789012345:xxxxxxxxxxxxxxxxxxxxxxxx@dxxxxxxxx
   ```

4. Cliquez sur **Copy** à côté de cette ligne (ou copiez uniquement la partie après `=`)

**Format attendu :**

```
cloudinary://API_KEY:API_SECRET@CLOUD_NAME
```

Ne partagez jamais cette URL publiquement (elle contient le secret).

---

## 3. Ajouter la variable sur Vercel (backend)

1. Allez sur [vercel.com](https://vercel.com) → votre projet **backend** Django (ex. `pgpuss`)
2. **Settings** → **Environment Variables**
3. Ajoutez :

   | Name | Value |
   |------|--------|
   | `CLOUDINARY_URL` | `cloudinary://...` (collez l’URL complète, **sans** le préfixe `CLOUDINARY_URL=` si Vercel ne le demande pas — en général mettez **uniquement** la valeur `cloudinary://...`) |

4. Cochez **Production**, **Preview** et **Development** si vous testez aussi les previews
5. **Save**
6. **Redéployez** le backend (Deployments → … → Redeploy) — obligatoire pour que la variable soit prise en compte

Les autres variables (`DATABASE_URL`, `DJANGO_SECRET_KEY`, etc.) restent inchangées.

---

## 4. Tester en local (optionnel)

Dans `backend/.env` (fichier à créer, non versionné) :

```env
CLOUDINARY_URL=cloudinary://VOTRE_CLE:VOTRE_SECRET@VOTRE_CLOUD_NAME
```

Puis :

```bash
cd backend
pip install -r requirements.txt
python manage.py runserver
```

Déposez une plainte avec une petite image (< 4 Mo) depuis le frontend ou l’app mobile.

---

## 5. Vérifier que ça fonctionne

### A. Dans Cloudinary

Après un dépôt de plainte avec pièce jointe ou vocal :

1. Console Cloudinary → **Media Library**
2. Vous devriez voir des dossiers du type `attachments/` ou `complaints/voice/`

### B. Via l’API

1. Créez une plainte (web ou mobile)
2. Si vous avez joint un fichier, la réponse ne doit pas contenir d’erreur 503 sur `deposit-media`
3. Suivez la plainte ou ouvrez le détail côté agent : l’URL du fichier doit commencer par `https://res.cloudinary.com/...`

### C. Erreurs fréquentes

| Symptôme | Cause probable | Action |
|----------|----------------|--------|
| `503` + message Cloudinary | `CLOUDINARY_URL` absente ou incorrecte | Vérifier la variable Vercel + redéployer |
| Plainte OK mais pas de fichier | Upload média échoué après création | Fichier > 4 Mo ; réduire la taille |
| `Invalid Signature` | Mauvaise URL ou secret tronqué | Recopier l’URL depuis le dashboard |
| Fichiers en local mais pas en prod | Cloudinary non configuré sur Vercel | Ajouter `CLOUDINARY_URL` |

---

## 6. Limites utiles (plan gratuit)

- Taille max par fichier côté **PGP-USS** : **4 Mo** (limite Vercel + réglage app)
- Cloudinary gratuit : stockage et bande passante limités — surveillez l’usage dans **Dashboard → Usage**
- Formats acceptés : images, PDF, audio (vocal), vidéo, Word

---

## 7. Sécurité

- Ne commitez **jamais** `CLOUDINARY_URL` dans Git
- En cas de fuite : Cloudinary → **Settings → Security** → régénérer l’**API Secret**, puis mettre à jour Vercel
- Les usagers n’ont pas accès direct à Cloudinary : seul le backend Django envoie les fichiers après validation du jeton `upload_token`

---

## Résumé

```
Compte Cloudinary → copier CLOUDINARY_URL
       ↓
Vercel (projet backend) → Environment Variables → CLOUDINARY_URL
       ↓
Redéployer le backend
       ↓
Tester un dépôt avec photo ou vocal
```

Pour toute question sur le dépôt en deux étapes (JSON puis médias), voir aussi le README section « Déploiement en Production ».
