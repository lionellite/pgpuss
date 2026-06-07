import React, { useId } from 'react'
import ScrollReveal from '../a11y/ScrollReveal'

/**
 * Conteneur de graphique accessible WCAG 2.1 AA :
 * - titre h3, description pour lecteurs d'écran
 * - table de données alternative (sr-only ou visible)
 */
export default function AccessibleChartCard({
  title,
  description,
  children,
  dataTable,
  className = '',
}) {
  const titleId = useId()
  const descId = useId()

  return (
    <ScrollReveal as="article" className={`chart-card ${className}`.trim()}>
      <header className="chart-card__header">
        <h3 id={titleId} className="chart-card__title">{title}</h3>
        {description && (
          <p id={descId} className="chart-card__desc">{description}</p>
        )}
      </header>

      <div
        className="chart-card__viz"
        role="img"
        aria-labelledby={titleId}
        aria-describedby={description ? descId : undefined}
      >
        {children}
      </div>

      {dataTable && (
        <details className="chart-card__data-toggle">
          <summary>Voir les données du graphique</summary>
          <div className="chart-card__table-wrap">{dataTable}</div>
        </details>
      )}
    </ScrollReveal>
  )
}
