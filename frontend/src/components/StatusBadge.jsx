import React from 'react'

const STATUS_MAP = {
  DEPOSEE: { label: 'Déposée', color: '#6c757d', bg: '#f8f9fa' }, // Grey
  ENREGISTREE: { label: 'Enregistrée', color: '#005cba', bg: '#d7e3ff' }, // Primary
  CLASSIFIEE: { label: 'Classifiée', color: '#005cba', bg: '#d7e3ff' },
  AFFECTEE: { label: 'Affectée', color: '#005cba', bg: '#d7e3ff' },
  EN_INSTRUCTION: { label: 'En instruction', color: '#005cba', bg: '#d7e3ff' },
  RESOLUE: { label: 'Résolue', color: '#006e25', bg: '#83fc8e' }, // Secondary/Green
  NOTIFIEE: { label: 'Notifiée', color: '#006e25', bg: '#83fc8e' },
  CLOTURE_PROVISOIRE: { label: 'Clôture prov.', color: '#006e25', bg: '#83fc8e' },
  CLOTURE_DEFINITIVE: { label: 'Clôturée', color: '#006e25', bg: '#83fc8e' },
  CONTESTEE: { label: 'Contestée', color: '#ba1a1a', bg: '#ffdad6' }, // Error/Red
  ESCALADEE: { label: 'Escaladée', color: '#ba1a1a', bg: '#ffdad6' },
  REJETEE: { label: 'Rejetée', color: '#ba1a1a', bg: '#ffdad6' },
  FEEDBACK: { label: 'Feedback', color: '#005966', bg: '#a4eeff' }, // Tertiary/Cyan
}

export default function StatusBadge({ status, label }) {
  const info = STATUS_MAP[status] || { label: label || status, color: '#6c757d', bg: '#f8f9fa' }

  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider whitespace-nowrap"
      style={{ backgroundColor: info.bg, color: info.color }}
    >
      <span className="w-1.5 h-1.5 rounded-full mr-1.5" style={{ backgroundColor: 'currentColor' }}></span>
      {info.label}
    </span>
  )
}
