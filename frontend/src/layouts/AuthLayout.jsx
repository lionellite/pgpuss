import React from 'react'
import { Outlet, Link } from 'react-router-dom'

export default function AuthLayout() {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--background)',
      display: 'flex',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Subtle background decoration */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(circle at 10% 20%, rgba(0,78,159,0.05) 0%, transparent 50%)',
      }} />

      {/* Left branding panel */}
      <div className="hide-mobile" style={{
        flex: 1, maxWidth: 520,
        background: 'var(--surface-container-low)',
        borderRight: '1px solid var(--outline-variant)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '3rem', position: 'relative',
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <div style={{
            width: 80, height: 80, borderRadius: 'var(--radius-md)',
            background: 'var(--primary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '2.5rem', fontWeight: 900, color: 'white',
            fontFamily: 'Public Sans', margin: '0 auto 1.5rem',
            boxShadow: 'var(--shadow-md)',
          }}>P</div>
          <h1 style={{ fontFamily: 'Public Sans', fontWeight: 900, fontSize: '2.25rem', color: 'var(--primary)', letterSpacing: '-0.04em' }}>PGP-USS</h1>
          <p style={{ color: 'var(--on-surface-variant)', fontSize: '0.9rem', marginTop: '0.5rem', fontWeight: 500, lineHeight: 1.4 }}>
            Plateforme de Gestion des Plaintes des Usagers des Services de Santé
          </p>
        </div>

        {/* Feature list */}
        {[
          { icon: 'shield', text: 'Vos données sont sécurisées et confidentielles' },
          { icon: 'assignment_turned_in', text: 'Suivi en temps réel de vos plaintes' },
          { icon: 'bolt', text: 'Traitement rapide selon la priorité' },
          { icon: 'notifications_active', text: 'Notifications à chaque étape du traitement' },
        ].map((f, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: '1rem',
            padding: '1rem 1.25rem', borderRadius: 'var(--radius-md)',
            background: 'var(--surface-container-lowest)', border: '1px solid var(--outline-variant)',
            marginBottom: '1rem', width: '100%', boxShadow: 'var(--shadow-sm)',
          }}>
            <span className="material-symbols-outlined" style={{ color: 'var(--primary)', fontSize: '1.5rem' }}>{f.icon}</span>
            <span style={{ fontSize: '0.875rem', color: 'var(--on-surface-variant)', fontWeight: 500 }}>{f.text}</span>
          </div>
        ))}
      </div>

      {/* Right form panel */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '2rem', position: 'relative', zIndex: 1,
      }}>
        <Link to="/" style={{
          position: 'absolute', top: '2rem', left: '2rem',
          display: 'flex', alignItems: 'center', gap: '0.5rem',
          fontSize: '0.875rem', color: 'var(--on-surface-variant)', textDecoration: 'none',
          fontWeight: 600,
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: '1.2rem' }}>arrow_back</span>
          Retour à l'accueil
        </Link>

        <div style={{ width: '100%', maxWidth: 440 }}>
          <Outlet />
        </div>
      </div>
    </div>
  )
}
