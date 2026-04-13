# PGP-USS 🏥
**Plateforme de Gestion des Plaintes des Usagers des Services de Santé au Bénin**

PGP-USS est une solution numérique moderne conçue pour centraliser, traiter et suivre les plaintes relatives aux services de santé au Bénin. Elle permet d'assurer une traçabilité totale, une transparence accrue et une amélioration continue de la qualité des soins.

---

## 🚀 Fonctionnalités Clés

- **Dépôt de Plaintes Mulimodes** : Interface web intuitive pour soumettre des plaintes (mode identifié ou anonyme).
- **Suivi en Temps Réel** : Système de ticket unique pour suivre l'état d'avancement du traitement.
- **Gestion Administrative (RBAC)** : Tableaux de bord dédiés pour les agents, gestionnaires, médiateurs et administrateurs.
- **Analytique & KPIs** : Statistiques en temps réel sur les performances de résolution et la satisfaction des usagers.
- **Système de Notification** : Alertes automatiques lors de chaque changement d'état d'une plainte.
- **Cycle de Vie Complet** : De l'enregistrement à la clôture, incluant l'escalade et la contestation.

---

## 🛠️ Stack Technique

- **Backend** : Django 6.0+, Django REST Framework, SQLite (Développement).
- **Frontend** : React 18, Vite, Framer Motion (Animations), Recharts (Graphiques).
- **Design** : Système de design personnalisé avec Glassmorphism et mode sombre.
- **Authentification** : JWT (JSON Web Tokens).

---

## ⚙️ Installation & Lancement

### 1. Prérequis
- Python 3.10+
- Node.js 18+
- npm ou yarn

### 2. Lancement du Backend (Django)
```bash
cd backend
# Créer un environnement virtuel (optionnel)
python -m venv venv
source venv/bin/activate  # Sur Windows: venv\Scripts\activate

# Installer les dépendances
pip install django djangorestframework django-cors-headers djangorestframework-simplejwt

# Appliquer les migrations
python manage.py migrate

# Peupler la base de données avec des données de test
python manage.py seed_data

# Lancer le serveur
python manage.py runserver
```
*Le backend sera disponible sur : `http://localhost:8000`*

### 3. Lancement du Frontend (React/Vite)
```bash
cd frontend
# Installer les dépendances
npm install

# Lancer le serveur de développement
npm run dev
```
*Le frontend sera disponible sur : `http://localhost:5173`*

---

## 👤 Comptes de Test (Démo)

| Rôle | Email | Mot de passe |
| :--- | :--- | :--- |
| **Admin National** | admin@pgpuss.bj | `admin123` |
| **Agent Réception** | agent@pgpuss.bj | `agent123` |
| **Gestionnaire** | gestionnaire@pgpuss.bj | `gest123` |
| **Directeur** | directeur@pgpuss.bj | `dir123` |
| **Usager** | usager@pgpuss.bj | `usager123` |

---

## 📋 Cahier des Charges
Ce projet a été développé dans le cadre de la Licence en Informatique, Année Académique 2025–2026.
