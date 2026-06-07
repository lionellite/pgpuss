import React from 'react'

/**
 * En-tête de page accessible — titre h1 unique + description optionnelle.
 */
export default function PageHeader({ title, description, children, id = 'page-title' }) {
  return (
    <header className="page-header">
      <h1 id={id} className="page-title">{title}</h1>
      {description && (
        <p className="page-header__desc">{description}</p>
      )}
      {children}
    </header>
  )
}
