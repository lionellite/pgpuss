import React from 'react'

const STATUS_MAP = {
  SOUMISE: { label: 'Soumise', class: 'badge-deposee' },
  ACCUSEE: { label: 'Accusée', class: 'badge-enregistree' },
  INSTRUITE: { label: 'Instruite', class: 'badge-classifiee' },
  AFFECTEE: { label: 'Affectée', class: 'badge-affectee' },
  EN_TRAITEMENT: { label: 'Investigation', class: 'badge-en_instruction' },
  RESOLUE: { label: 'Résolue', class: 'badge-resolue' },
  ESCALADEE: { label: 'Escaladée', class: 'badge-escaladee' },
  ARBITREE: { label: 'Arbitrée', class: 'badge-feedback' },
  CLOTUREE: { label: 'Clôturée', class: 'badge-cloture_definitive' },
  REJETEE: { label: 'Rejetée', class: 'badge-rejetee' },
}

export default function StatusBadge({ status, label }) {
  const info = STATUS_MAP[status] || { label: label || status, class: 'badge-deposee' }
  return <span className={`badge ${info.class}`}>{info.label}</span>
}
