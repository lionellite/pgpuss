import React from 'react'
import { Outlet, Link } from 'react-router-dom'

export default function AuthLayout() {
  return (
    <div className="auth-shell">
      <aside className="auth-shell-brand hide-below-md" aria-hidden="false">
        <div className="auth-shell-brand-inner">
          <div className="auth-logo-mark" aria-hidden="true">
            P
          </div>
          <h1 className="auth-shell-title">PGP-USS</h1>
          <p className="auth-shell-tagline">
            Plateforme de Gestion des Plaintes des Usagers des Services de Santé — République du Bénin
          </p>
          <ul className="auth-feature-list">
            {[
              'Parcours guidé et accessible (texte, vocal, pièces jointes)',
              'Suivi transparent du dossier et des délais',
              'Traitement conforme au circuit institutionnel',
            ].map((text) => (
              <li key={text}>{text}</li>
            ))}
          </ul>
        </div>
      </aside>

      <div className="auth-shell-main">
        <Link to="/" className="auth-back-link">
          ← Retour à l&apos;accueil
        </Link>
        <div className="auth-shell-card-wrap">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
