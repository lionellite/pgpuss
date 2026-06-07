import React from 'react'
import { Outlet, Link } from 'react-router-dom'
import GovFlagBar from '../components/GovFlagBar'

export default function AuthLayout() {
  return (
    <div className="auth-stitch">
      <GovFlagBar />
      <main className="auth-stitch__main">
        <Link to="/" className="auth-stitch__back">
          ← Retour à l&apos;accueil
        </Link>
        <div className="auth-stitch__card">
          <aside className="auth-stitch__brand" aria-hidden="true">
            <img
              src="/img/auth-healthcare.jpg"
              alt=""
              className="auth-stitch__brand-img"
            />
            <div className="auth-stitch__brand-overlay">
              <h2 className="auth-stitch__brand-title">
                Plateforme de Gestion des Plaintes
              </h2>
              <p className="auth-stitch__brand-text">
                Un système sécurisé et transparent pour le suivi de la qualité des soins au Bénin.
              </p>
            </div>
          </aside>
          <div className="auth-stitch__form-panel">
            <Outlet />
          </div>
        </div>
      </main>
      <footer className="auth-stitch__footer">
        <div className="auth-stitch__footer-brand">Ministère de la Santé du Bénin</div>
        <p className="auth-stitch__footer-copy">
          © {new Date().getFullYear()} Ministère de la Santé du Bénin. Tous droits réservés.
        </p>
        <nav className="auth-stitch__footer-nav" aria-label="Liens institutionnels">
          <a href="https://sante.gouv.bj" target="_blank" rel="noopener noreferrer">Mentions Légales</a>
          <a href="https://sante.gouv.bj" target="_blank" rel="noopener noreferrer">Politique de Confidentialité</a>
          <a href="tel:136">Ligne Verte 136</a>
          <a href="https://gouv.bj" target="_blank" rel="noopener noreferrer">Portail Gouvernemental</a>
        </nav>
      </footer>
    </div>
  )
}
