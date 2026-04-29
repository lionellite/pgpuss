import React from 'react'
import { Outlet, Link } from 'react-router-dom'

export default function AuthLayout() {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-dark)',
      display: 'flex',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Animated background */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse at 30% 50%, rgba(0,119,182,0.12) 0%, transparent 60%), radial-gradient(ellipse at 70% 20%, rgba(6,214,160,0.08) 0%, transparent 60%)',
      }} />

      {/* Left branding panel */}
      <div className="hide-mobile" style={{
        flex: 1, maxWidth: 520,
        background: 'linear-gradient(135deg, rgba(0,119,182,0.1), rgba(6,214,160,0.05))',
        borderRight: '1px solid rgba(0,119,182,0.1)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '3rem', position: 'relative',
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <div style={{
            width: 72, height: 72, borderRadius: '20px',
            background: 'linear-gradient(135deg, #0077B6, #00B4D8)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '2rem', fontWeight: 900, color: 'white',
            fontFamily: 'Outfit', margin: '0 auto 1rem',
            boxShadow: '0 8px 32px rgba(0,119,182,0.4)',
          }}>P</div>
          <h1 style={{ fontFamily: 'Outfit', fontWeight: 800, fontSize: '1.75rem', color: '#F0F4FF' }}>PGP-USS</h1>
          <p style={{ color: '#8FA3BF', fontSize: '0.875rem', marginTop: '0.3rem' }}>
            Plateforme de Gestion des Plaintes<br/>des Usagers des Services de Santé
          </p>
        </div>

        {/* Feature list */}
        {[
          { icon: '🛡️', text: 'Vos données sont sécurisées et confidentielles' },
          { icon: '📋', text: 'Suivi en temps réel de vos plaintes' },
          { icon: '⚡', text: 'Traitement rapide selon la priorité' },
          { icon: '🔔', text: 'Notifications à chaque étape du traitement' },
        ].map((f, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: '1rem',
            padding: '0.875rem 1.25rem', borderRadius: '12px',
            background: 'rgba(0,119,182,0.05)', border: '1px solid rgba(0,119,182,0.1)',
            marginBottom: '0.75rem', width: '100%',
          }}>
            <span style={{ fontSize: '1.25rem' }}>{f.icon}</span>
            <span style={{ fontSize: '0.875rem', color: '#8FA3BF' }}>{f.text}</span>
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
          position: 'absolute', top: '1.5rem', left: '1.5rem',
          display: 'flex', alignItems: 'center', gap: '0.4rem',
          fontSize: '0.8rem', color: '#8FA3BF', textDecoration: 'none',
        }}>← Retour à l'accueil</Link>

        <div style={{ width: '100%', maxWidth: 420 }}>
          <Outlet />
        </div>
      </div>
    </div>
  )
}
