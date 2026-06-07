import React from 'react'

export default function ChartTooltipAccessible({ active, payload, label }) {
  if (!active || !payload?.length) return null

  return (
    <div
      className="chart-tooltip"
      role="tooltip"
      aria-live="polite"
    >
      {label && <p className="chart-tooltip__label">{label}</p>}
      <ul className="chart-tooltip__list">
        {payload.map((entry, i) => (
          <li key={i} className="chart-tooltip__item">
            <span
              className="chart-tooltip__swatch"
              style={{ background: entry.color || entry.fill }}
              aria-hidden="true"
            />
            <span>{entry.name} : <strong>{entry.value}</strong></span>
          </li>
        ))}
      </ul>
    </div>
  )
}
