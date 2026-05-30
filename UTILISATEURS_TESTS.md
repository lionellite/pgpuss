# PGP-USS — Utilisateurs Tests & Types d'Utilisateurs

## Pyramide Sanitaire du Bénin

```
┌─────────────────────────────────────────────────────────────┐
│          Niveau 4 — NATIONAL (Ministère / DQSS)             │
│          PF-DQSS (dqss@pgpuss.bj)                           │
│          Cabinet (cabinet@pgpuss.bj)                        │
│          PNUSS National (pnuss.national@pgpuss.bj)          │
├─────────────────────────────────────────────────────────────┤
│     Niveau 3 — DÉPARTEMENTAL (DDS × 12 départements)       │
│     PF-DDS Littoral (dds.littoral@pgpuss.bj)                │
│     PF-DDS Atlantique (dds.atlantique@pgpuss.bj)            │
│     PF-DDS Borgou (dds.borgou@pgpuss.bj)                    │
│     PNUSS Littoral (pnuss.littoral@pgpuss.bj)               │
│     PNUSS Borgou (pnuss.borgou@pgpuss.bj)                   │
├─────────────────────────────────────────────────────────────┤
│   Niveau 2 — ZONE SANITAIRE (34 zones)                     │
│   PFZS Cotonou 1-2-3 (pfzs.cotonou@pgpuss.bj)              │
│   PFZS Abomey-Calavi (pfzs.abomey@pgpuss.bj)               │
│   PFZS Parakou (pfzs.parakou@pgpuss.bj)                    │
│   PNUSS Cotonou (pnuss.cotonou@pgpuss.bj)                  │
│   PNUSS Parakou (pnuss.parakou@pgpuss.bj)                  │
├─────────────────────────────────────────────────────────────┤
│ Niveau 1 — PÉRIPHÉRIQUE (Formations sanitaires)             │
│ PFE CNHU (pfe.cnhu@pgpuss.bj)                               │
│ PFE Parakou (pfe.parakou@pgpuss.bj)                         │
│ PFE Abomey (pfe.abomey@pgpuss.bj)                           │
│ PFE Lokossa (pfe.lokossa@pgpuss.bj)                         │
│ Direction CNHU (dir.cnhu@pgpuss.bj)                          │
│ Direction Parakou (dir.parakou@pgpuss.bj)                    │
│ Agent interne CNHU (agent.cnhu@pgpuss.bj)                    │
│ Agent interne Parakou (agent.parakou@pgpuss.bj)              │
└─────────────────────────────────────────────────────────────┘

              TRANSVERSAL
    Call Center 136 : callcenter@pgpuss.bj, cc136.agent1@pgpuss.bj
    Admin plateforme : admin@pgpuss.bj
    Usagers : usager@pgpuss.bj, usager2@pgpuss.bj
```

## Types d'Utilisateurs — Conformité CDC v3

### 1. Usager / Plaignant (`USAGER`)
- Dépose des plaintes via tous les canaux (web, mobile, SMS, chatbot, guichet, 136)
- Suit ses propres plaintes via numéro de ticket
- Donne son feedback post-clôture (NPS)
- Peut contester la clôture (recours de 2nd niveau)

### 2. Point Focal Établissement — PFE (`PFE`)
- **Niveau** : Périphérique (rattaché à un `establishment`)
- Premier récepteur de toutes les plaintes de son établissement
- Accuse réception (48h max), qualifie (catégorisation, priorité)
- Affecte aux **agents internes** ou au **PNUSS** de l'établissement, ou traite directement
- Escalade vers le PFZS (Zone Sanitaire) si dépassement
- Clôture les plaintes résolues

### 3. Agent interne / Agent traitant (`AGENT_INTERNE`)
- **Niveau** : Périphérique (rattaché à un `establishment`)
- Accepte ou refuse une affectation
- Documente l'investigation (journal d'instruction)
- Soumet le rapport de résolution
- Peut demander une extension de délai

### 4. Direction de l'Établissement (`DIRECTEUR_EST`)
- **Niveau** : Périphérique (rattaché à un `establishment`)
- Valide ou rejette les résolutions
- Déclenche des mesures disciplinaires si nécessaire
- Peut escalader à la DDS
- Dispose du tableau de bord de son établissement

### 5. Point Focal Zone Sanitaire — PFZS (`PFZS`)
- **Niveau** : Zone Sanitaire (rattaché à une `zone_sanitaire`)
- Coordonne les plaintes de toutes les formations sanitaires de la zone
- Supervise les PFE de sa zone (tableau de bord consolidé)
- Instruit les plaintes escaladées par les établissements
- Escalade vers la DDS les plaintes P1/P2 non résolues
- Rend compte à la hiérarchie (rapports périodiques)

### 6. Point Focal DDS — PF-DDS (`DDS`)
- **Niveau** : Départemental (rattaché via `departement`)
- Coordonne les plaintes du département
- Gère directement les plaintes P1/P2 escaladées par les zones
- Affecte des inspecteurs DDS pour enquêtes
- Arbitre les conflits
- Escalade au Ministère les cas non résolus
- Dispose du tableau de bord départemental

### 7. PF-DQSS / Agence Qualité (`DQSS`)
- **Niveau** : National
- Visibilité complète sur toutes les plaintes
- Produit les rapports nationaux
- Déclenche les audits systémiques
- Émet les injonctions officielles
- Supervise l'ensemble de la pyramide

### 8. Cabinet du Ministère (`CABINET`)
- **Niveau** : National
- Visibilité complète sur toutes les plaintes
- Arbitrage final au niveau ministériel

### 9. Agent Call Center 136 (`AGENT_CALL_CENTER`)
- **Niveau** : Transversal (canal d'entrée, pas un niveau hiérarchique)
- Reçoit les appels de la ligne verte 136
- Saisit la plainte dans PGPUSS au nom de l'usager (canal = `CALL_CENTER`)
- Communique le numéro de ticket à l'usager
- Assure le suivi téléphonique (rappels, compléments)

### 10. Représentant PNUSS (`PNUSS`)
- **Niveau** : Transversal — présent à **chaque** niveau de la pyramide
- Rattachement détermine le scope :
  - `establishment` → plaintes de l'établissement (médiation locale)
  - `zone_sanitaire` → plaintes de la zone
  - `departement` → plaintes du département
  - Aucun → visibilité nationale
- Le **PFE** peut affecter un PNUSS établissement pour médiation (comme un agent interne)
- Actions :
  - **Suivi** : Tableau de bord dédié PNUSS
  - **Enquête** : Participe aux investigations (maltraitance, violations de droits)
  - **Médiation** : Intervient en médiation usager/établissement
  - **Statistiques** : Génère rapports de sa zone
  - **Plaidoyer** : Alerte la hiérarchie, plaidoyer national

### 11. Auditeur / Superviseur (`AUDITEUR`)
- **Niveau** : Selon rattachement (établissement, zone, département ou national)
- **Lecture seule** : consultation des plaintes, tableaux de bord et analytique
- Aucune action de workflow (accusé, affectation, escalade, clôture)

### 12. Administrateur Plateforme (`ADMIN_PLATEFORME`)
- **Niveau** : Transversal
- Configuration globale du système
- Gestion des référentiels (catégories, zones, établissements)
- Gestion des comptes utilisateurs et des rôles
- Supervision technique et audit

## Tableau Récapitulatif des Comptes Tests

| Email | Rôle | Nom | Rattachement |
|-------|------|-----|-------------|
| `admin@pgpuss.bj` | ADMIN_PLATEFORME | Admin PGP-USS | — |
| `usager@pgpuss.bj` | USAGER | Fidèle Adjahouinou | — |
| `usager2@pgpuss.bj` | USAGER | Aline Tchégoun | — |
| `pfe@pgpuss.bj` | PFE | Point Focal CNHU | CHU de Cotonou |
| `pfe.cnhu@pgpuss.bj` | PFE | Rachidatou Aké | CHU de Cotonou |
| `pfe.parakou@pgpuss.bj` | PFE | Ibrahim Moussa | CHU de Parakou |
| `pfe.abomey@pgpuss.bj` | PFE | Estelle Houéto | HZ Abomey-Calavi |
| `pfe.lokossa@pgpuss.bj` | PFE | Léonce Dossou | HZ Lokossa |
| `directeur@pgpuss.bj` | DIRECTEUR_EST | Direction CNHU | CHU de Cotonou |
| `dir.cnhu@pgpuss.bj` | DIRECTEUR_EST | Prof. Aristide Houngan | CHU de Cotonou |
| `dir.parakou@pgpuss.bj` | DIRECTEUR_EST | Dr. Ruffin Kpamégnan | CHU de Parakou |
| `agent.interne@pgpuss.bj` | AGENT_INTERNE | Agent Interne CNHU | CHU de Cotonou |
| `agent.cnhu@pgpuss.bj` | AGENT_INTERNE | Pascal Sèdji | CHU de Cotonou |
| `agent.parakou@pgpuss.bj` | AGENT_INTERNE | Fatimata Alfa | CHU de Parakou |
| `pfzs@pgpuss.bj` | PFZS | Aurélie Boco | ZS Cotonou 1-2-3 |
| `pfzs.cotonou@pgpuss.bj` | PFZS | Aurélie Boco | ZS Cotonou 1-2-3 |
| `pfzs.abomey@pgpuss.bj` | PFZS | Gérard Adankpo | ZS Abomey-Calavi/So-Ava |
| `pfzs.parakou@pgpuss.bj` | PFZS | Souaïbou Yessoufou | ZS Parakou/N'Dali |
| `dds@pgpuss.bj` | DDS | DDS Littoral | Dept. Littoral |
| `dds.littoral@pgpuss.bj` | DDS | Charles Agossou | Dept. Littoral |
| `dds.atlantique@pgpuss.bj` | DDS | Aminou Kpanou | Dept. Atlantique |
| `dds.borgou@pgpuss.bj` | DDS | Hamidou Bio Nigan | Dept. Borgou |
| `dqss@pgpuss.bj` | DQSS | Dr. Alice Gbaguidi | National |
| `cabinet@pgpuss.bj` | CABINET | Honoré Zannou | National |
| `callcenter@pgpuss.bj` | AGENT_CALL_CENTER | Élodie Hounsou | Call Center 136 |
| `cc136.agent1@pgpuss.bj` | AGENT_CALL_CENTER | Élodie Hounsou | Call Center 136 |
| `cc136.agent2@pgpuss.bj` | AGENT_CALL_CENTER | Kolawolé Lawal | Call Center 136 |
| `pnuss.national@pgpuss.bj` | PNUSS | Fabien Gnacadja | National |
| `pnuss.littoral@pgpuss.bj` | PNUSS | Serge Alowanou | Dept. Littoral |
| `pnuss.borgou@pgpuss.bj` | PNUSS | Raïssa Saka | Dept. Borgou |
| `pnuss.cotonou@pgpuss.bj` | PNUSS | Joël Ahossi | ZS Cotonou 1-2-3 |
| `pnuss.parakou@pgpuss.bj` | PNUSS | Latifou Orou Guidou | ZS Parakou/N'Dali |
| `pnuss.cnhu@pgpuss.bj` | PNUSS | Marie-Claire Zinsou | CHU de Cotonou |
| `auditeur.national@pgpuss.bj` | AUDITEUR | Inspecteur National | National |
| `auditeur.littoral@pgpuss.bj` | AUDITEUR | Contrôleur Littoral | Dept. Littoral |

## Flux d'affectation (établissement)

```
Plainte → PFE (réception / qualification)
          ↓
   Affectation : Agent interne OU Représentant PNUSS (médiation)
          ↓
   Escalade : PFZS → PF-DDS → PF-DQSS
```

> **Total : 37+ utilisateurs** | **Mot de passe commun** : `Pgpuss2026!` (réinitialisé à chaque exécution de `create_test_users.py`)
