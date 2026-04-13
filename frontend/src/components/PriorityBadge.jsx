import React from 'react'

const PRIORITY_MAP = {
  P1: { label: 'P1 — Critique', class: 'badge-p1' },
  P2: { label: 'P2 — Urgent', class: 'badge-p2' },
  P3: { label: 'P3 — Élevé', class: 'badge-p3' },
  P4: { label: 'P4 — Normal', class: 'badge-p4' },
  P5: { label: 'P5 — Faible', class: 'badge-p5' },
}

export default function PriorityBadge({ priority, label }) {
  const info = PRIORITY_MAP[priority] || { label: label || priority, class: 'badge-p4' }
  return <span className={`badge ${info.class}`}>{info.label}</span>
}
