import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { analyticsAPI } from '../../api'
import { FiSearch, FiPlusCircle, FiShield, FiClock, FiBarChart2, FiCheckCircle, FiArrowRight, FiMap } from 'react-icons/fi'

export default function LandingPage() {
  const [stats, setStats] = useState(null)
  const [ticketInput, setTicketInput] = useState('')

  useEffect(() => {
    analyticsAPI.publicStats().then(({ data }) => setStats(data)).catch(() => {})
  }, [])

  const handleTrack = (e) => {
    e.preventDefault()
    if (ticketInput.trim()) window.location.href = `/suivi?ticket=${ticketInput.trim()}`
  }

  return (
    <div>
      {/* Hero Section */}
      <section style={{
        minHeight: '92vh', display: 'flex', alignItems: 'center',
        position: 'relative', overflow: 'hidden', padding: '4rem 0',
      }}>
        {/* Background */}
        <div style={{
          position: 'absolute', inset: 0, zIndex: 0,
          background: `
            radial-gradient(ellipse at 20% 50%, rgba(0,119,182,0.15) 0%, transparent 55%),
            radial-gradient(ellipse at 80% 20%, rgba(6,214,160,0.1) 0%, transparent 55%),
            radial-gradient(ellipse at 50% 80%, rgba(0,119,182,0.08) 0%, transparent 55%)
          `,
        }} />
        {/* Grid pattern */}
        <div style={{
          position: 'absolute', inset: 0, zIndex: 0, opacity: 0.03,
          backgroundImage: 'linear-gradient(rgba(0,180,216,1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,180,216,1) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }} />

        <div className="page-container" style={{ position: 'relative', zIndex: 1, width: '100%' }}>
          <div style={{ maxWidth: 720, margin: '0 auto', textAlign: 'center' }}>
            {/* Badge */}
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.35rem 1rem', borderRadius: '99px',
              background: 'rgba(6,214,160,0.1)', border: '1px solid rgba(6,214,160,0.25)',
              color: '#06D6A0', fontSize: '0.8rem', fontWeight: 600, marginBottom: '1.5rem',
            }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#06D6A0', display: 'inline-block', animation: 'pulse 2s infinite' }} />
              Plateforme officielle — Ministère de la Santé du Bénin
            </div>

            <h1 style={{
              fontFamily: 'Outfit', fontWeight: 900,
              fontSize: 'clamp(2rem, 5vw, 3.5rem)',
              lineHeight: 1.1, color: '#F0F4FF', marginBottom: '1.5rem',
            }}>
              Votre voix pour améliorer{' '}
              <span style={{
                background: 'linear-gradient(135deg, #0077B6, #06D6A0)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
              }}>les services de santé</span>
            </h1>

            <p style={{ fontSize: '1.1rem', color: '#8FA3BF', maxWidth: 560, margin: '0 auto 2.5rem', lineHeight: 1.7 }}>
              Déposez vos plaintes sur les services de santé au Bénin, suivez leur traitement en temps réel et recevez un retour d'information garanti.
            </p>

            {/* CTA Buttons */}
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '3rem' }}>
              <Link to="/deposer" className="btn btn-primary btn-lg">
                <FiPlusCircle /> Déposer une plainte
              </Link>
              <Link to="/suivi" className="btn btn-ghost btn-lg">
                <FiSearch /> Suivre une plainte
              </Link>
            </div>

            {/* Quick Track */}
            <form onSubmit={handleTrack} style={{
              display: 'flex', gap: '0.5rem', maxWidth: 480, margin: '0 auto',
              background: 'rgba(15,30,53,0.7)', border: '1px solid rgba(0,119,182,0.2)',
              borderRadius: '14px', padding: '0.5rem',
              backdropFilter: 'blur(16px)',
            }}>
              <input
                value={ticketInput}
                onChange={e => setTicketInput(e.target.value)}
                placeholder="Entrez votre numéro de ticket (ex: PGP-2025-AB1234)"
                style={{
                  flex: 1, background: 'none', border: 'none', outline: 'none',
                  color: '#F0F4FF', fontSize: '0.875rem', padding: '0.5rem',
                }}
              />
              <button type="submit" className="btn btn-primary btn-sm">
                <FiSearch /> Suivre
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* Stats band */}
      <section style={{
        background: 'rgba(15,30,53,0.6)', borderTop: '1px solid rgba(0,119,182,0.1)',
        borderBottom: '1px solid rgba(0,119,182,0.1)', padding: '2.5rem 0',
      }}>
        <div className="page-container">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
            {[
              { label: 'Plaintes reçues', value: stats?.total_complaints ?? '—', icon: '📋' },
              { label: 'Plaintes résolues', value: stats?.resolved_complaints ?? '—', icon: '✅' },
              { label: 'Taux de résolution', value: stats?.resolution_rate ? `${stats.resolution_rate}%` : '—', icon: '📈' },
              { label: 'Satisfaction moyenne', value: stats?.satisfaction_avg ? `${stats.satisfaction_avg}/5` : '—', icon: '⭐' },
            ].map((s, i) => (
              <div key={i} className="stat-card" style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>{s.icon}</div>
                <div className="stat-value">{s.value}</div>
                <div className="stat-label">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section style={{ padding: '5rem 0' }}>
        <div className="page-container">
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <h2 className="page-title" style={{ fontSize: '2rem' }}>Comment ça fonctionne ?</h2>
            <p style={{ color: '#8FA3BF', marginTop: '0.5rem' }}>Un processus simple en 4 étapes</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem' }}>
            {[
              { step: 1, icon: '📝', title: 'Déposez votre plainte', desc: 'Via le portail web, en mode anonyme ou identifié, avec pièces jointes optionnelles.' },
              { step: 2, icon: '🎫', title: 'Recevez votre ticket', desc: 'Un numéro unique vous est attribué immédiatement pour suivre votre dossier.' },
              { step: 3, icon: '⚙️', title: 'Traitement rapide', desc: 'Votre plainte est classifiée et affectée selon un niveau de priorité (P1 à P5).' },
              { step: 4, icon: '🔔', title: 'Retour garanti', desc: 'Vous êtes notifié à chaque étape et pouvez contester la décision sous 15 jours.' },
            ].map((s, i) => (
              <div key={i} className="glass-card" style={{ padding: '1.75rem', textAlign: 'center', position: 'relative' }}>
                <div style={{
                  width: 44, height: 44, borderRadius: '50%',
                  background: 'linear-gradient(135deg, rgba(0,119,182,0.2), rgba(0,180,216,0.2))',
                  border: '2px solid rgba(0,119,182,0.3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 800, color: '#00B4D8', margin: '0 auto 1rem',
                  fontFamily: 'Outfit',
                }}>{s.step}</div>
                <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>{s.icon}</div>
                <h3 style={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: '1rem', marginBottom: '0.5rem' }}>{s.title}</h3>
                <p style={{ color: '#8FA3BF', fontSize: '0.875rem', lineHeight: 1.6 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section style={{ padding: '4rem 0', background: 'rgba(8,18,32,0.5)' }}>
        <div className="page-container">
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <h2 className="page-title" style={{ fontSize: '2rem' }}>Types de plaintes</h2>
            <p style={{ color: '#8FA3BF', marginTop: '0.5rem' }}>Tous les domaines des services de santé sont couverts</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            {[
              { icon: '🏥', label: 'Qualité des soins' },
              { icon: '👤', label: 'Comportement du personnel' },
              { icon: '⏰', label: 'Attente et délais' },
              { icon: '💰', label: 'Facturation et coûts' },
              { icon: '🏢', label: "Conditions d'accueil" },
              { icon: '💊', label: 'Disponibilité des médicaments' },
              { icon: '🔒', label: 'Confidentialité' },
              { icon: '🚑', label: 'Accès aux soins' },
            ].map((c, i) => (
              <Link key={i} to="/deposer" style={{ textDecoration: 'none' }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '0.875rem',
                  padding: '1rem 1.25rem', borderRadius: '12px',
                  background: 'rgba(15,30,53,0.6)', border: '1px solid rgba(0,119,182,0.1)',
                  transition: 'all 0.2s', cursor: 'pointer',
                }}
                  onMouseOver={e => {
                    e.currentTarget.style.background = 'rgba(0,119,182,0.1)'
                    e.currentTarget.style.borderColor = 'rgba(0,119,182,0.3)'
                  }}
                  onMouseOut={e => {
                    e.currentTarget.style.background = 'rgba(15,30,53,0.6)'
                    e.currentTarget.style.borderColor = 'rgba(0,119,182,0.1)'
                  }}
                >
                  <span style={{ fontSize: '1.5rem' }}>{c.icon}</span>
                  <span style={{ fontSize: '0.875rem', fontWeight: 500, color: '#F0F4FF' }}>{c.label}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Priority levels */}
      <section style={{ padding: '4rem 0' }}>
        <div className="page-container">
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <h2 className="page-title" style={{ fontSize: '2rem' }}>Niveaux de priorité</h2>
            <p style={{ color: '#8FA3BF', marginTop: '0.5rem' }}>Traitement selon l'urgence</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxWidth: 700, margin: '0 auto' }}>
            {[
              { p: 'P1', label: 'Critique', delay: '4 heures', color: '#EF476F', desc: 'Risque vital, urgence médicale' },
              { p: 'P2', label: 'Urgent', delay: '24 heures', color: '#FF6B35', desc: 'Impact grave sur la santé' },
              { p: 'P3', label: 'Élevé', delay: '72 heures', color: '#F59E0B', desc: 'Problème récurrent, impact significatif' },
              { p: 'P4', label: 'Normal', delay: '7 jours', color: '#3B82F6', desc: 'Insatisfaction standard' },
              { p: 'P5', label: 'Faible', delay: '15 jours', color: '#8FA3BF', desc: 'Suggestion, remarque mineure' },
            ].map((item, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: '1rem',
                padding: '1rem 1.25rem', borderRadius: '12px',
                background: 'rgba(15,30,53,0.6)', border: `1px solid ${item.color}30`,
              }}>
                <span style={{
                  width: 44, height: 44, borderRadius: '10px', flexShrink: 0,
                  background: `${item.color}15`, border: `2px solid ${item.color}40`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 800, fontSize: '0.875rem', color: item.color, fontFamily: 'Outfit',
                }}>{item.p}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, color: '#F0F4FF', fontSize: '0.9rem' }}>{item.label}</div>
                  <div style={{ fontSize: '0.8rem', color: '#8FA3BF' }}>{item.desc}</div>
                </div>
                <div style={{
                  background: `${item.color}15`, border: `1px solid ${item.color}30`,
                  borderRadius: '8px', padding: '0.35rem 0.75rem',
                  fontSize: '0.8rem', color: item.color, fontWeight: 600, flexShrink: 0,
                }}>
                  ≤ {item.delay}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section style={{ padding: '4rem 0' }}>
        <div className="page-container">
          <div style={{
            borderRadius: '24px', padding: '3rem',
            background: 'linear-gradient(135deg, rgba(0,119,182,0.15), rgba(6,214,160,0.1))',
            border: '1px solid rgba(0,119,182,0.2)', textAlign: 'center',
          }}>
            <h2 style={{ fontFamily: 'Outfit', fontWeight: 800, fontSize: '2rem', marginBottom: '1rem', color: '#F0F4FF' }}>
              Prêt à soumettre votre plainte ?
            </h2>
            <p style={{ color: '#8FA3BF', marginBottom: '2rem', maxWidth: 500, margin: '0 auto 2rem' }}>
              Votre témoignage contribue à l'amélioration des services de santé pour tous au Bénin.
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link to="/deposer" className="btn btn-primary btn-lg">
                <FiPlusCircle /> Déposer une plainte maintenant
              </Link>
              <Link to="/inscription" className="btn btn-secondary btn-lg">
                Créer un compte <FiArrowRight />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  )
}
