import React from 'react'

const STATUS_MAP = {
  DEPOSEE: { label: 'Déposée', class: 'badge-deposee' },
  ENREGISTREE: { label: 'Enregistrée', class: 'badge-enregistree' },
  CLASSIFIEE: { label: 'Classifiée', class: 'badge-classifiee' },
  AFFECTEE: { label: 'Affectée', class: 'badge-affectee' },
  EN_INSTRUCTION: { label: 'En instruction', class: 'badge-en_instruction' },
  RESOLUE: { label: 'Résolue', class: 'badge-resolue' },
  NOTIFIEE: { label: 'Notifiée', class: 'badge-resolue' },
  CLOTURE_PROVISOIRE: { label: 'Clôture prov.', class: 'badge-cloture_provisoire' },
  CLOTURE_DEFINITIVE: { label: 'Clôturée', class: 'badge-cloture_definitive' },
  CONTESTEE: { label: 'Contestée', class: 'badge-contestee' },
  ESCALADEE: { label: 'Escaladée', class: 'badge-escaladee' },
  REJETEE: { label: 'Rejetée', class: 'badge-rejetee' },
  FEEDBACK: { label: 'Feedback', class: 'badge-feedback' },
}

export default function StatusBadge({ status, label }) {
  const info = STATUS_MAP[status] || { label: label || status, class: 'badge-deposee' }
  return <span className={`badge ${info.class}`}>{info.label}</span>
}
