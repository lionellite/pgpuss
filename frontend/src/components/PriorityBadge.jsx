import React from 'react'

const PRIORITY_MAP = {
  P1: { label: 'Critique', color: '#ffffff', bg: '#ba1a1a' }, // Error
  P2: { label: 'Urgent', color: '#690005', bg: '#ffdad6' },
  P3: { label: 'Élevé', color: '#001b3e', bg: '#d7e3ff' }, // Primary
  P4: { label: 'Normal', color: '#414753', bg: '#e0e3e8' }, // Surface variant
  P5: { label: 'Faible', color: '#414753', bg: '#f1f4f9' },
}

export default function PriorityBadge({ priority, label }) {
  const info = PRIORITY_MAP[priority] || { label: label || priority, color: '#414753', bg: '#e0e3e8' }

  return (
    <span
      className="inline-block px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest whitespace-nowrap"
      style={{ backgroundColor: info.bg, color: info.color }}
    >
      {info.label}
    </span>
  )
}
