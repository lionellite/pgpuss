/** Libellés et regroupements des rôles (pyramide sanitaire PGP-USS). */

export const ROLE_LABELS = {
  USAGER: 'Plaignant',
  PFE: 'Point Focal Établissement (PFE)',
  AGENT_INTERNE: 'Agent interne / Agent traitant',
  PFZS: 'Point Focal Zone Sanitaire (PFZS)',
  DDS: 'Point Focal Départemental (PF-DDS)',
  DQSS: 'Point Focal National (PF-DQSS)',
  CABINET: 'Ministère de la Santé (Cabinet)',
  DIRECTEUR_EST: "Direction de l'établissement",
  PNUSS: 'Représentant PNUSS',
  AGENT_CALL_CENTER: 'Agent Call Center (136)',
  ADMIN_PLATEFORME: 'Administrateur national',
  AUDITEUR: 'Auditeur / Superviseur (lecture seule)',
}

export const DASHBOARD_ROLES = [
  'PFE', 'PFZS', 'AGENT_INTERNE', 'DIRECTEUR_EST',
  'DDS', 'DQSS', 'CABINET', 'AGENT_CALL_CENTER', 'PNUSS',
  'ADMIN_PLATEFORME', 'AUDITEUR',
]

export const READ_ONLY_ROLES = ['AUDITEUR']

export const ROLES_NEED_ESTABLISHMENT = ['PFE', 'AGENT_INTERNE', 'DIRECTEUR_EST']
export const ROLES_NEED_ZONE = ['PFZS', 'PNUSS']
export const ROLES_NEED_DEPT = ['DDS', 'PNUSS']

export function pnussScopeLabel(user) {
  if (!user || user.role !== 'PNUSS') return ''
  if (user.establishment_name) return `Établissement — ${user.establishment_name}`
  if (user.zone_sanitaire_name) return `Zone — ${user.zone_sanitaire_name}`
  if (user.departement) return `Département — ${user.departement}`
  return 'National'
}

export function contextBadgeForUser(user) {
  if (!user) return ''
  const r = user.role
  if (r === 'PFE') return `Périphérique — ${user.establishment_name || 'Établissement'}`
  if (r === 'DIRECTEUR_EST') return `Direction — ${user.establishment_name || 'Établissement'}`
  if (r === 'AGENT_INTERNE') return `Agent traitant — ${user.establishment_name || 'Établissement'}`
  if (r === 'PFZS') return `Zone sanitaire — ${user.zone_sanitaire_name || 'Zone'}`
  if (r === 'DDS') return `PF-DDS — ${user.departement || 'Département'}`
  if (r === 'DQSS') return 'PF-DQSS — Niveau national'
  if (r === 'CABINET') return 'Cabinet — Niveau national'
  if (r === 'PNUSS') return `PNUSS — ${pnussScopeLabel(user)}`
  if (r === 'AUDITEUR') {
    if (user.establishment_name) return `Auditeur — ${user.establishment_name}`
    if (user.zone_sanitaire_name) return `Auditeur — ${user.zone_sanitaire_name}`
    if (user.departement) return `Auditeur — ${user.departement}`
    return 'Auditeur — Lecture nationale'
  }
  if (r === 'AGENT_CALL_CENTER') return 'Call center — Ligne verte 136'
  if (r === 'ADMIN_PLATEFORME') return 'Administration plateforme'
  return ROLE_LABELS[r] || r
}
