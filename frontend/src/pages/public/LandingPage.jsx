import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { analyticsAPI } from '../../api'
import { useTranslation } from 'react-i18next'
import {
  FiSearch, FiPlusCircle, FiFileText, FiCheckCircle,
  FiBarChart2, FiStar, FiArrowRight,
  FiActivity, FiUsers, FiClock, FiDollarSign,
  FiHome, FiPackage, FiShield, FiTruck,
} from 'react-icons/fi'

const DOMAINS = [
  { icon: FiActivity, label: 'Qualité des soins' },
  { icon: FiUsers, label: 'Comportement du personnel' },
  { icon: FiClock, label: 'Attente et délais' },
  { icon: FiDollarSign, label: 'Facturation et coûts' },
  { icon: FiHome, label: "Conditions d'accueil" },
  { icon: FiPackage, label: 'Disponibilité des médicaments' },
  { icon: FiShield, label: 'Confidentialité' },
  { icon: FiTruck, label: 'Accès aux soins' },
]

const PRIORITIES = [
  { p: 'P1', label: 'Critique', delay: '4 heures', color: '#b91c1c', desc: 'Risque vital ou urgence médicale immédiate.' },
  { p: 'P2', label: 'Urgent', delay: '24 heures', color: '#c2410c', desc: 'Impact grave sur la santé ou maltraitance.' },
  { p: 'P3', label: 'Élevé', delay: '72 heures', color: '#a16207', desc: 'Problème récurrent ou impact significatif.' },
  { p: 'P4', label: 'Normal', delay: '7 jours', color: '#1d4ed8', desc: 'Insatisfaction standard liée aux services.' },
  { p: 'P5', label: 'Faible', delay: '15 jours', color: '#4b5563', desc: 'Suggestion ou remarque mineure.' },
]

export default function LandingPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)
  const [ticketInput, setTicketInput] = useState('')

  useEffect(() => {
    analyticsAPI.publicStats().then(({ data }) => setStats(data)).catch(() => {})
  }, [])

  const handleTrack = (e) => {
    e.preventDefault()
    const q = ticketInput.trim()
    if (q) navigate(`/suivi?ticket=${encodeURIComponent(q)}`)
  }

  return (
    <div>
      <section className="hero" aria-labelledby="hero-title">
        <div className="page-container hero__inner">
          <p className="hero__badge">Plateforme officielle — Ministère de la Santé</p>
          <h1 id="hero-title" className="hero__title">{t('welcome')}</h1>
          <p className="hero__subtitle">{t('slogan')}</p>

          <form className="hero__search" onSubmit={handleTrack} role="search" aria-label="Rechercher une plainte">
            <label className="hero__search-label" htmlFor="hero-ticket">
              Suivre une plainte par numéro de ticket
            </label>
            <div className="hero__search-row">
              <input
                id="hero-ticket"
                className="form-input"
                value={ticketInput}
                onChange={(e) => setTicketInput(e.target.value)}
                placeholder="Ex. PGP-2026-AB1234"
                autoComplete="off"
              />
              <button type="submit" className="btn btn-primary">
                <FiSearch aria-hidden /> Rechercher
              </button>
            </div>
          </form>

          <div className="grid-2">
            <Link to="/deposer" className="glass-card action-card">
              <div className="action-card__icon"><FiPlusCircle aria-hidden /></div>
              <h2 className="action-card__title">{t('submit_complaint')}</h2>
              <p className="action-card__desc">
                Signalez un dysfonctionnement ou une insatisfaction, de manière identifiée ou anonyme.
              </p>
              <span className="action-card__cta">
                Commencer <FiArrowRight aria-hidden />
              </span>
            </Link>
            <Link to="/suivi" className="glass-card action-card">
              <div className="action-card__icon"><FiSearch aria-hidden /></div>
              <h2 className="action-card__title">{t('track_complaint')}</h2>
              <p className="action-card__desc">
                Consultez l&apos;état d&apos;avancement de votre dossier avec votre numéro unique.
              </p>
              <span className="action-card__cta">
                Vérifier <FiArrowRight aria-hidden />
              </span>
            </Link>
          </div>
        </div>
      </section>

      <section className="section section--muted" aria-labelledby="stats-title">
        <div className="page-container">
          <h2 id="stats-title" className="sr-only">Indicateurs publics</h2>
          <div className="grid-4">
            {[
              { label: 'Plaintes reçues', value: stats?.total_complaints ?? '—', icon: FiFileText },
              { label: 'Plaintes résolues', value: stats?.resolved_complaints ?? '—', icon: FiCheckCircle },
              { label: 'Taux de résolution', value: stats?.resolution_rate != null ? `${stats.resolution_rate} %` : '—', icon: FiBarChart2 },
              { label: 'Satisfaction moyenne', value: stats?.satisfaction_avg != null ? `${stats.satisfaction_avg} / 5` : '—', icon: FiStar },
            ].map(({ label, value, icon: Icon }) => (
              <div key={label} className="stat-card">
                <div className="stat-card__icon"><Icon aria-hidden /></div>
                <div className="stat-value">{value}</div>
                <div className="stat-label">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section" aria-labelledby="how-title">
        <div className="page-container">
          <div className="section__header">
            <h2 id="how-title" className="page-title">Comment ça fonctionne</h2>
          </div>
          <div className="steps-grid">
            {[
              { step: 1, title: 'Soumission', desc: 'Déposez votre plainte en quelques minutes.' },
              { step: 2, title: 'Numérotation', desc: 'Recevez un numéro de ticket unique.' },
              { step: 3, title: 'Instruction', desc: 'Votre dossier est traité par les services compétents.' },
              { step: 4, title: 'Retour', desc: 'Vous êtes informé de la décision et des suites.' },
            ].map((s) => (
              <article key={s.step} className="step-item">
                <div className="step-item__num" aria-hidden>{s.step}</div>
                <h3 className="step-item__title">{s.title}</h3>
                <p className="step-item__desc">{s.desc}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section section--muted" aria-labelledby="domains-title">
        <div className="page-container">
          <div className="section__header">
            <h2 id="domains-title" className="page-title">Domaines couverts</h2>
          </div>
          <div className="grid-2">
            {DOMAINS.map(({ icon: Icon, label }) => (
              <div key={label} className="domain-item">
                <span className="domain-item__icon"><Icon aria-hidden /></span>
                <span className="domain-item__label">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section" aria-labelledby="priority-title">
        <div className="page-container">
          <div className="section__header">
            <h2 id="priority-title" className="page-title">Niveaux de priorité</h2>
            <p className="section__lead">
              Les délais de traitement sont garantis selon l&apos;urgence de la situation.
            </p>
          </div>
          <div style={{ maxWidth: 800, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {PRIORITIES.map((item) => (
              <div key={item.p} className="priority-row">
                <span className="priority-row__badge" style={{ background: item.color }}>{item.p}</span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>
                    {item.label} — {item.delay}
                  </div>
                  <div className="text-muted" style={{ fontSize: '0.85rem' }}>{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section section--muted">
        <div className="page-container">
          <div className="cta-band">
            <h2 className="cta-band__title">
              Contribuez à l&apos;amélioration des services de santé
            </h2>
            <p className="cta-band__text">
              Votre retour d&apos;expérience aide les autorités à garantir des soins de qualité pour tous les citoyens.
            </p>
            <div className="cta-band__actions">
              <Link to="/deposer" className="btn btn-primary">Déposer une plainte</Link>
              <Link to="/inscription" className="btn btn-secondary">Créer un compte</Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
