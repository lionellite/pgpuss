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
      {/* Hero Section - Minimal/Flat */}
      <section style={{
        minHeight: '60vh', display: 'flex', alignItems: 'center',
        background: '#fff', borderBottom: '1px solid #eee', padding: '4rem 0',
      }}>
        <div className="page-container" style={{ width: '100%' }}>
          <div style={{ maxWidth: 800, margin: '0 auto', textAlign: 'center' }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.4rem 1rem', borderRadius: '4px',
              background: '#f0f9f5', border: '1px solid #cdece0',
              color: 'var(--color-primary)', fontSize: '0.75rem', fontWeight: 700,
              textTransform: 'uppercase', marginBottom: '2rem',
            }}>
              Plateforme officielle — Ministère de la Santé
            </div>

            <h1 style={{
              fontSize: 'clamp(2rem, 5vw, 3rem)',
              lineHeight: 1.2, color: '#111', marginBottom: '1.5rem',
              fontWeight: 800
            }}>
              Améliorons ensemble la qualité des services de santé au Bénin
            </h1>

            <p style={{ fontSize: '1.1rem', color: '#555', maxWidth: 640, margin: '0 auto 2.5rem', lineHeight: 1.6 }}>
              Un mécanisme transparent pour exprimer vos préoccupations, suivre leur résolution et contribuer à l'amélioration du système sanitaire national.
            </p>

            {/* Main Action Shortcuts */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginTop: '3rem' }}>
              <Link to="/deposer" className="glass-card" style={{ padding: '2rem', textAlign: 'left', textDecoration: 'none' }}>
                <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>📝</div>
                <h3 style={{ marginBottom: '0.5rem' }}>Déposer une plainte</h3>
                <p style={{ fontSize: '0.875rem', color: '#666' }}>Signalez un dysfonctionnement ou une insatisfaction de manière identifiée ou anonyme.</p>
                <div style={{ marginTop: '1.5rem', color: 'var(--color-primary)', fontWeight: 700, fontSize: '0.8rem' }}>COMMENCER →</div>
              </Link>
              <Link to="/suivi" className="glass-card" style={{ padding: '2rem', textAlign: 'left', textDecoration: 'none' }}>
                <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>🔍</div>
                <h3 style={{ marginBottom: '0.5rem' }}>Suivre mon ticket</h3>
                <p style={{ fontSize: '0.875rem', color: '#666' }}>Consultez l'état d'avancement du traitement de votre dossier à l'aide de votre numéro unique.</p>
                <div style={{ marginTop: '1.5rem', color: 'var(--color-primary)', fontWeight: 700, fontSize: '0.8rem' }}>VÉRIFIER →</div>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Public Stats - Flat Blocks */}
      <section style={{ background: '#f8f9fa', padding: '4rem 0' }}>
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

      {/* How it works - Clean Steps */}
      <section style={{ padding: '5rem 0', background: '#fff' }}>
        <div className="page-container">
          <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <h2 className="page-title">Comment ça fonctionne ?</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '2rem' }}>
            {[
              { step: 1, title: 'Soumission', desc: 'Déposez votre plainte en quelques minutes.' },
              { step: 2, title: 'Numérotation', desc: 'Recevez un ticket unique de suivi.' },
              { step: 3, title: 'Instruction', desc: 'Votre dossier est traité par les services compétents.' },
              { step: 4, title: 'Retour', desc: 'Vous recevez une notification de la décision.' },
            ].map((s, i) => (
              <div key={i} style={{ textAlign: 'center' }}>
                <div style={{
                  width: 48, height: 48, borderRadius: '50%',
                  background: 'var(--color-primary)', color: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 800, fontSize: '1.25rem', margin: '0 auto 1.5rem',
                }}>{s.step}</div>
                <h3 style={{ fontSize: '1rem', marginBottom: '0.75rem' }}>{s.title}</h3>
                <p style={{ color: '#666', fontSize: '0.85rem', lineHeight: 1.5 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories - Light Flat */}
      <section style={{ padding: '5rem 0', background: '#f8f9fa', borderTop: '1px solid #eee' }}>
        <div className="page-container">
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <h2 className="page-title">Domaines couverts</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
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
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: '1rem',
                padding: '1.25rem', borderRadius: '4px',
                background: '#fff', border: '1px solid #ddd',
              }}>
                <span style={{ fontSize: '1.5rem' }}>{c.icon}</span>
                <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#333' }}>{c.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Priority levels - Flat Table-like */}
      <section style={{ padding: '5rem 0', background: '#fff' }}>
        <div className="page-container">
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <h2 className="page-title">Niveaux de priorité</h2>
            <p style={{ color: '#666', marginTop: '0.5rem', fontSize: '0.9rem' }}>Les délais de traitement sont garantis selon l'urgence de la situation.</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxWidth: 800, margin: '0 auto' }}>
            {[
              { p: 'P1', label: 'Critique', delay: '4 heures', color: '#d32f2f', desc: 'Risque vital ou urgence médicale immédiate.' },
              { p: 'P2', label: 'Urgent', delay: '24 heures', color: '#e65100', desc: 'Impact grave sur la santé ou maltraitance.' },
              { p: 'P3', label: 'Élevé', delay: '72 heures', color: '#f57c00', desc: 'Problème récurrent ou impact significatif.' },
              { p: 'P4', label: 'Normal', delay: '7 jours', color: '#1976d2', desc: 'Insatisfaction standard liée aux services.' },
              { p: 'P5', label: 'Faible', delay: '15 jours', color: '#616161', desc: 'Suggestion ou remarque mineure.' },
            ].map((item, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: '1.5rem',
                padding: '1.25rem', borderRadius: '4px',
                background: '#fcfcfc', border: '1px solid #eee',
              }}>
                <span style={{
                  width: 44, height: 44, borderRadius: '4px', flexShrink: 0,
                  background: item.color, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 800, fontSize: '1rem', color: '#fff',
                }}>{item.p}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, color: '#111', fontSize: '0.95rem' }}>{item.label} — {item.delay}</div>
                  <div style={{ fontSize: '0.85rem', color: '#666' }}>{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner - Simple Flat */}
      <section style={{ padding: '5rem 0', background: '#f8f9fa', borderTop: '1px solid #eee' }}>
        <div className="page-container">
          <div style={{
            padding: '3rem', background: '#fff', border: '1px solid #ddd',
            textAlign: 'center', maxWidth: 900, margin: '0 auto'
          }}>
            <h2 style={{ fontWeight: 800, fontSize: '1.75rem', marginBottom: '1rem', color: '#111' }}>
              Souhaitez-vous nous aider à améliorer la santé au Bénin ?
            </h2>
            <p style={{ color: '#666', marginBottom: '2.5rem', maxWidth: 600, margin: '0 auto 2.5rem' }}>
              Votre retour d'expérience est précieux pour garantir des services de qualité pour tous les citoyens.
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link to="/deposer" className="btn btn-primary">
                DÉPOSER UNE PLAINTE
              </Link>
              <Link to="/inscription" className="btn btn-secondary">
                CRÉER UN COMPTE
              </Link>
            </div>
          </div>
        </div>
      </section>

    </div>
  )
}
