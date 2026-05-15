import React from 'react'

const STATUS_MAP = {
  SOUMISE: { label: 'Soumise', class: 'badge-soumise' },
  ACCUSEE: { label: 'Accusée', class: 'badge-accusee' },
  INSTRUITE: { label: 'Instruite', class: 'badge-instruite' },
  AFFECTEE: { label: 'Affectée', class: 'badge-affectee' },
  EN_TRAITEMENT: { label: 'En traitement', class: 'badge-en-traitement' },
  RESOLUE: { label: 'Résolue', class: 'badge-resolue' },
  ESCALADEE: { label: 'Escaladée', class: 'badge-escaladee' },
  ARBITREE: { label: 'Arbitrée', class: 'badge-arbitree' },
  CLOTUREE: { label: 'Clôturée', class: 'badge-cloturee' },
  REJETEE: { label: 'Rejetée', class: 'badge-rejetee' },
}

export default function StatusBadge({ status, label }) {
  const info = STATUS_MAP[status] || { label: label || status, class: 'badge-soumise' }
  return <span className={`badge ${info.class}`}>{info.label}</span>
}
