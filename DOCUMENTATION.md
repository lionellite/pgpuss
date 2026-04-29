# Documentation Complète PGP-USS 🏥
**Plateforme de Gestion des Plaintes des Usagers des Services de Santé au Bénin**

## 📖 Présentation
PGP-USS est un projet de Licence en Informatique visant à centraliser et automatiser le traitement des plaintes de santé au Bénin.

## 🏗️ Architecture Technique
- **Backend** : Django 5.1 / Django REST Framework
- **Frontend** : React 18 / Vite / Tailwind (Flat design)
- **Base de données** : PostgreSQL (Docker)
- **Workflow** : Circuit institutionnel (Usager -> PFE -> Agent -> Direction -> DDS -> DQSS)

## 🔄 Workflow Institutionnel
1. **SOUMISE** : Plainte déposée par l'usager (Web, WhatsApp, FB).
2. **ACCUSEE** : Le Point Focal Établissement (PFE) accuse réception.
3. **INSTRUITE** : Le PFE qualifie la plainte (priorité, catégorie).
4. **AFFECTEE** : Affectation à un agent interne.
5. **EN TRAITEMENT** : L'agent mène l'enquête interne.
6. **RESOLUE** : Une solution est proposée.
7. **CLOTUREE** : Dossier fermé après satisfaction ou arbitrage.

## 🚀 Installation & Déploiement

### Docker (Recommandé)
```bash
docker compose up --build
```
L'application sera accessible sur :
- Frontend : `http://localhost:5173`
- Backend : `http://localhost:8000`

### Manuelle
1. **Backend** :
   ```bash
   pip install -r backend/requirements.txt
   python manage.py migrate
   python manage.py seed_benin_workflow
   python manage.py runserver
   ```
2. **Frontend** :
   ```bash
   npm install
   npm run dev
   ```

## 🌐 Internationalisation (i18n)
Support natif pour :
- **Français** (Priorité)
- **Fon**
- **Yoruba**

## ♿ Accessibilité
- Aide vocale intégrée sur le formulaire de dépôt (Web Speech API).
- Pictogrammes universels pour les catégories.

## 👤 Comptes de Test
- PFE : `pfe@pgpuss.bj` / `pfe123`
- DDS : `dds@pgpuss.bj` / `dds123`
- Usager : `usager@pgpuss.bj` / `usager123`
