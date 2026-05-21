# PGP-USS — Contexte Projet Persistant

## 1. Présentation

**PGP-USS** (Plateforme de Gestion des Plaintes des Usagers des Services de Santé) est une plateforme numérique multicanale pour le système de santé du Bénin. Elle permet aux citoyens de déposer, suivre et obtenir résolution de plaintes relatives aux services de santé.

## 2. Stack Technique

| Couche | Technologie |
|--------|------------|
| **Backend** | Django 5 + DRF (REST API) |
| **Frontend Web** | React 18 + Vite |
| **Mobile** | Flutter |
| **Base de données** | SQLite (dev) / PostgreSQL (prod) |
| **Authentification** | JWT (djangorestframework-simplejwt) |
| **Charts** | Recharts |
| **i18n** | react-i18next |

## 3. Architecture de Fichiers

```
pgpuss-main/
├── backend/
│   ├── accounts/          # Modèle User, rôles, JWT
│   ├── complaints/        # Plaintes, workflow, documents
│   ├── establishments/    # Établissements, Régions, Zones Sanitaires, Services
│   ├── analytics/         # Dashboard, statistiques
│   ├── notifications/     # Notifications in-app, email, SMS
│   ├── config/            # Settings Django, URLs racine
│   └── manage.py
├── frontend/
│   ├── src/
│   │   ├── api/index.js           # Axios + intercepteurs JWT
│   │   ├── contexts/AuthContext.jsx
│   │   ├── layouts/
│   │   │   ├── MainLayout.jsx     # Layout public (navbar + footer)
│   │   │   ├── DashboardLayout.jsx # Sidebar dashboard agents
│   │   │   └── AuthLayout.jsx
│   │   ├── pages/
│   │   │   ├── public/            # LandingPage, DepotPage, TrackPage, LoginPage, RegisterPage
│   │   │   ├── user/              # MesPlaintesPage, DetailPlaintePage, NotificationsPage, ProfilPage
│   │   │   └── dashboard/         # DashboardHome, PlaintesListPage, PlainteDetailPage, AnalyticsPage, UsersPage, EstablishmentsAdminPage, ReferentialsAdminPage
│   │   ├── components/            # StatusBadge, PriorityBadge, ComplaintDocumentsEditor
│   │   └── App.jsx                # Routes + PrivateRoute / AgentRoute / AdminPlateformeOnly
│   └── vite.config.js
├── mobile/                # App Flutter
└── diagrammes/            # 6 fichiers PlantUML (use case, classes, séquence ×4)
```

## 4. Pyramide Sanitaire du Bénin (Hiérarchie)

```
Niveau 4 — National (Ministère / DQSS / Cabinet)         ← PF-DQSS + PNUSS National
    └── Niveau 3 — Départemental (DDS × 12 départements) ← PF-DDS + PNUSS Départemental
        └── Niveau 2 — Zone Sanitaire (34 zones)         ← PFZS + PNUSS Zone
            └── Niveau 1 — Périphérique (Formations sanitaires : CHU, CHR, HZ, CS, Privé)
                                                          ← PFE + Agents internes + Direction + PNUSS Établissement
```

**Principes clés (CDC v3) :**
- Chaque niveau de la pyramide dispose d'un **Point Focal** désigné
- La **PNUSS** a une représentation à **chaque** niveau de la pyramide (transversal)
- Chaque structure dispose d'**agents internes** affectés aux enquêtes
- Le **Call Center 136** est un canal d'entrée national (pas un niveau hiérarchique)

### Acteurs par niveau

| Niveau | Point Focal | PNUSS | Autres acteurs |
|--------|-------------|-------|----------------|
| **Périphérique** (Établissement) | PFE | PNUSS Établissement | Agents internes, Directeur |
| **Zone Sanitaire** | PFZS | PNUSS Zone | — |
| **Départemental** | PF-DDS (`DDS`) | PNUSS Département | Inspecteurs DDS |
| **National** | PF-DQSS (`DQSS`) | PNUSS National | Cabinet Ministère |
| **Transversal** | — | — | Agent Call Center 136, Admin plateforme |

## 5. Rôles Backend (`UserRole`)

| Code | Libellé | Niveau pyramide | Rattachement | Scope des données |
|------|---------|-----------------|--------------|-------------------|
| `USAGER` | Plaignant | — | — | Ses propres plaintes |
| `PFE` | Point Focal Établissement | Périphérique | `establishment` | Plaintes de son établissement |
| `AGENT_INTERNE` | Agent affecté | Périphérique | `establishment` | Plaintes qui lui sont affectées |
| `DIRECTEUR_EST` | Directeur d'établissement | Périphérique | `establishment` | Plaintes de son établissement |
| `PFZS` | Point Focal Zone Sanitaire | Zone Sanitaire | `zone_sanitaire` | Plaintes de sa zone sanitaire |
| `DDS` | Point Focal DDS (PF-DDS) | Départemental | `departement` | Plaintes de son département |
| `DQSS` | PF-DQSS / Agence Qualité | National | — | Toutes (par défaut : escaladées) |
| `CABINET` | Ministère de la Santé | National | — | Toutes |
| `AGENT_CALL_CENTER` | Agent Call Center 136 | Transversal | — | Plaintes qu'il a transcrites |
| `PNUSS` | Représentant PNUSS | Multi-niveaux | `zone_sanitaire` OU `departement` OU aucun (= national) | Selon rattachement |
| `ADMIN_PLATEFORME` | Administrateur système | Transversal | — | Tout |

### 5b. Utilisateurs Tests

> **Mot de passe commun** : même mot de passe que `admin@pgpuss.bj` (défini lors du setup initial)

#### Niveau Périphérique — Établissements

| Email | Rôle | Rattachement |
|-------|------|-------------|
| `pfe@pgpuss.bj` | PFE | CHU de Cotonou (CNHU-HKM) |
| `pfe.cnhu@pgpuss.bj` | PFE | CHU de Cotonou (CNHU-HKM) |
| `pfe.parakou@pgpuss.bj` | PFE | CHU de Parakou |
| `pfe.abomey@pgpuss.bj` | PFE | Hôpital de Zone d'Abomey-Calavi |
| `pfe.lokossa@pgpuss.bj` | PFE | Hôpital de Zone de Lokossa |
| `directeur@pgpuss.bj` | DIRECTEUR_EST | CHU de Cotonou (CNHU-HKM) |
| `dir.cnhu@pgpuss.bj` | DIRECTEUR_EST | CHU de Cotonou (CNHU-HKM) |
| `dir.parakou@pgpuss.bj` | DIRECTEUR_EST | CHU de Parakou |
| `agent.interne@pgpuss.bj` | AGENT_INTERNE | CHU de Cotonou (CNHU-HKM) |
| `agent.cnhu@pgpuss.bj` | AGENT_INTERNE | CHU de Cotonou (CNHU-HKM) |
| `agent.parakou@pgpuss.bj` | AGENT_INTERNE | CHU de Parakou |

#### Niveau Zone Sanitaire

| Email | Rôle | Rattachement |
|-------|------|-------------|
| `pfzs@pgpuss.bj` | PFZS | Zone Sanitaire Cotonou 1-2-3 |
| `pfzs.cotonou@pgpuss.bj` | PFZS | Zone Sanitaire Cotonou 1-2-3 |
| `pfzs.abomey@pgpuss.bj` | PFZS | Zone Sanitaire Abomey-Calavi/So-Ava |
| `pfzs.parakou@pgpuss.bj` | PFZS | Zone Sanitaire Parakou/N'Dali |

#### Niveau Départemental (PF-DDS)

| Email | Rôle | Département |
|-------|------|------------|
| `dds@pgpuss.bj` | DDS | Littoral |
| `dds.littoral@pgpuss.bj` | DDS | Littoral |
| `dds.atlantique@pgpuss.bj` | DDS | Atlantique |
| `dds.borgou@pgpuss.bj` | DDS | Borgou |

#### Niveau National

| Email | Rôle | Description |
|-------|------|------------|
| `dqss@pgpuss.bj` | DQSS | Point Focal National — Agence Qualité |
| `cabinet@pgpuss.bj` | CABINET | Ministère de la Santé |

#### Call Center 136 (Ligne Verte)

| Email | Rôle |
|-------|------|
| `callcenter@pgpuss.bj` | AGENT_CALL_CENTER |
| `cc136.agent1@pgpuss.bj` | AGENT_CALL_CENTER |
| `cc136.agent2@pgpuss.bj` | AGENT_CALL_CENTER |

#### PNUSS — Représentants à chaque niveau

| Email | Rôle | Niveau | Rattachement |
|-------|------|--------|-------------|
| `pnuss.national@pgpuss.bj` | PNUSS | National | — (visibilité nationale) |
| `pnuss.littoral@pgpuss.bj` | PNUSS | Départemental | Littoral |
| `pnuss.borgou@pgpuss.bj` | PNUSS | Départemental | Borgou |
| `pnuss.cotonou@pgpuss.bj` | PNUSS | Zone Sanitaire | Zone Sanitaire Cotonou 1-2-3 |
| `pnuss.parakou@pgpuss.bj` | PNUSS | Zone Sanitaire | Zone Sanitaire Parakou/N'Dali |

#### Autres

| Email | Rôle |
|-------|------|
| `admin@pgpuss.bj` | ADMIN_PLATEFORME |
| `usager@pgpuss.bj` | USAGER |
| `usager2@pgpuss.bj` | USAGER |

## 6. Modèles Clés

### User (`accounts.User`)
- `role` : choix parmi `UserRole`
- `establishment` : FK vers `Establishment` (pour PFE, DIRECTEUR_EST, AGENT_INTERNE)
- `zone_sanitaire` : FK vers `ZoneSanitaire` (pour PFZS, PNUSS niveau zone)
- `departement` : CharField (pour DDS, PNUSS niveau département)

### Establishment (`establishments.Establishment`)
- `region` : FK vers `Region` (= département)
- `zone_sanitaire` : FK vers `ZoneSanitaire`
- `type` : CHU, CHR, HZ, CS, PRIVE, PHARMACIE, LABORATOIRE
- `operational_status` : OPERATIONAL, LIMITED, CLOSED_TEMP, CLOSED_PERM

### ZoneSanitaire (`establishments.ZoneSanitaire`)
- `region` : FK vers `Region` (département)
- `communes` : TextField (liste CSV)

### Complaint (`complaints.Complaint`)
- `channel` : WEB, MOBILE, SMS, CHATBOT, GUICHET, **CALL_CENTER**
- `call_center_agent` : FK vers User (agent ayant transcrit)
- `status` : SOUMISE → ACCUSEE → INSTRUITE → AFFECTEE → EN_TRAITEMENT → RESOLUE → CLOTUREE (+ ESCALADEE, ARBITREE, REJETEE)
- `priority` : P1 (4h), P2 (24h), P3 (72h), P4 (7j), P5 (15j)

### ComplaintDocument (workflow documentaire)
- Types : FICHE_PLAINTE, RECEPISSE_ACCUSATION, FICHE_QUALIFICATION, BON_AFFECTATION, JOURNAL_INSTRUCTION, RAPPORT_RESOLUTION, DOSSIER_ESCALADE, DECISION_ARBITRAGE, FICHE_CLOTURE

## 7. Workflow des Plaintes (Séquences)

1. **Dépôt** : Usager soumet (Web/Mobile/SMS/Chatbot/Guichet) ou Call Center 136 transcrit
2. **Classification IA** : NLP catégorise et priorise (P1-P5), routage vers PFE compétent
3. **Accusé de réception** : PFE accuse réception (48h max) → ACCUSEE
4. **Qualification** : PFE qualifie (catégorie, priorité) → INSTRUITE
5. **Affectation** : PFE affecte à agent interne ou traite directement → AFFECTEE
6. **Investigation** : Agent documente, journal d'instruction → EN_TRAITEMENT
7. **Résolution** : Agent soumet rapport → Direction valide → RESOLUE
8. **Escalade pyramide** :
   - Établissement → PFZS (zone sanitaire)
   - PFZS → DDS (département)
   - DDS → DQSS/Ministère (national)
9. **Arbitrage** : DDS/DQSS arbitre → ARBITREE
10. **Clôture** : PFE clôture + enquête NPS → CLOTUREE

## 8. Canal Call Center 136

- L'agent call center (`AGENT_CALL_CENTER`) reçoit l'appel de l'usager
- Il saisit la plainte dans PGPUSS au nom de l'usager (canal = `CALL_CENTER`)
- Le champ `call_center_agent` trace l'agent ayant transcrit
- Le ticket est communiqué verbalement à l'usager
- L'agent peut assister l'usager pour le suivi ultérieur

## 9. PNUSS (Plateforme Nationale des Usagers)

Le représentant PNUSS intervient à chaque niveau :
- **Suivi** : Consulte le tableau de bord de sa zone/département/national
- **Enquête** : Participe aux enquêtes (notamment maltraitance, violations de droits)
- **Médiation** : Intervient en médiation entre usager et établissement
- **Statistiques** : Génère des rapports et statistiques
- **Plaidoyer** : Alerte la hiérarchie, plaidoyer national

## 10. API Endpoints Clés

```
POST   /api/auth/login/phone/
POST   /api/auth/register/
GET    /api/auth/me/
GET    /api/auth/users/

GET    /api/complaints/
POST   /api/complaints/create/
GET    /api/complaints/{id}/
POST   /api/complaints/{id}/acknowledge/
POST   /api/complaints/{id}/qualify/
POST   /api/complaints/{id}/assign/
POST   /api/complaints/{id}/start-investigation/
POST   /api/complaints/{id}/resolve/
POST   /api/complaints/{id}/escalate/
POST   /api/complaints/{id}/arbitrate/
POST   /api/complaints/{id}/close/
GET    /api/complaints/{id}/documents/
GET    /api/complaints/track/{ticket}/

GET    /api/establishments/
GET    /api/establishments/regions/
GET    /api/establishments/zones/
GET    /api/establishments/{id}/services/

GET    /api/analytics/dashboard/
GET    /api/analytics/public-stats/
POST   /api/analytics/satisfaction/

GET    /api/notifications/
POST   /api/notifications/{id}/read/
```

## 11. Frontend — Routes

| Route | Composant | Accès |
|-------|-----------|-------|
| `/` | LandingPage | Public |
| `/deposer` | DepotPage | Public |
| `/suivi` | TrackPage | Public |
| `/connexion` | LoginPage | Public |
| `/espace/plaintes` | MesPlaintesPage | Authentifié |
| `/dashboard` | DashboardHome | AgentRoute |
| `/dashboard/plaintes` | PlaintesListPage | AgentRoute |
| `/dashboard/plaintes/:id` | PlainteDetailPage | AgentRoute |
| `/dashboard/analytique` | AnalyticsPage | AgentRoute |
| `/dashboard/utilisateurs` | UsersPage | ADMIN_PLATEFORME |
| `/dashboard/etablissements` | EstablishmentsAdminPage | ADMIN_PLATEFORME |
| `/dashboard/referentiels` | ReferentialsAdminPage | ADMIN_PLATEFORME |

**AgentRoute** autorise : PFE, PFZS, AGENT_INTERNE, DIRECTEUR_EST, DDS, DQSS, CABINET, AGENT_CALL_CENTER, PNUSS, ADMIN_PLATEFORME

## 12. Conventions de Code

- **Frontend** : Composants fonctionnels React avec hooks, pas de classes
- **Styles** : CSS inline avec variables CSS (`--color-primary: #008751`, couleurs Bénin)
- **i18n** : Français par défaut, clés de traduction via `useTranslation()`
- **API** : Module centralisé dans `frontend/src/api/index.js`
- **Toast** : `react-hot-toast` pour les notifications UI
- **Icons** : `react-icons/fi` (Feather Icons)
