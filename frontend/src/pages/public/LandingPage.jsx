import React, { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { analyticsAPI } from '../../api'

const STEPS = [
  {
    step: 1,
    icon: 'move_to_inbox',
    title: 'Dépôt multicanal',
    desc: 'Via web, application mobile, ou appel gratuit au 136. Prise en charge des notes vocales et photos.',
  },
  {
    step: 2,
    icon: 'settings_suggest',
    title: 'Traitement structuré',
    desc: "Attribution automatique à l'unité compétente avec suivi en temps réel et respect des délais légaux.",
  },
  {
    step: 3,
    icon: 'verified',
    title: 'Feedback & Résolution',
    desc: 'Notification de la solution apportée et recueil de votre niveau de satisfaction final.',
  },
]

function formatStat(value, fallback = '—') {
  if (value == null || value === '') return fallback
  const n = Number(value)
  if (!Number.isNaN(n) && n >= 1000) {
    return `${n.toLocaleString('fr-FR')}+`
  }
  return String(value)
}

function useInView(options = {}) {
  const ref = useRef(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setInView(true)
        obs.disconnect()
      }
    }, { threshold: 0.1, ...options })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])
  return [ref, inView]
}

export default function LandingPage() {
  const [stats, setStats] = useState(null)
  const [kpiRef, kpiInView] = useInView()

  useEffect(() => {
    analyticsAPI.publicStats().then(({ data }) => setStats(data)).catch(() => { })
  }, [])

  const treated = stats?.resolved_complaints ?? stats?.total_complaints
  const satisfaction = stats?.satisfaction_avg != null
    ? `${Math.round((stats.satisfaction_avg / 5) * 100)}%`
    : '94%'

  return (
    <div className="lp-root">

      {/* ── HERO ──────────────────────────────────────── */}
      <section className="lp-hero" aria-labelledby="hero-display-title">
        <div className="lp-hero__pattern" aria-hidden="true" />
        <div className="lp-hero__container">
          {/* Grand titre centré (au-dessus de la grille) */}
          <div className="lp-hero__display-wrap">
            <h1 id="hero-display-title" className="lp-hero__display-title">
              Bienvenue sur la plateforme de gestion des plaintes des usagers des services de santé
            </h1>
          </div>

          {/* Grille 2 colonnes : copy gauche + image droite */}
          <div className="lp-hero__grid">
            {/* Copy */}
            <div className="lp-hero__copy">
              <p className="lp-hero__badge">
                <span className="material-symbols-outlined material-symbols-outlined--filled lp-hero__badge-icon" aria-hidden>verified_user</span>
                Plateforme Officielle du Ministère de la Santé
              </p>
              <h2 id="hero-title" className="lp-hero__title">
                Votre voix compte pour une meilleure santé au Bénin
              </h2>
              <p className="lp-hero__subtitle">
                Déposez une plainte, suivez son traitement en toute transparence et contribuez activement à l&apos;amélioration de nos services de santé nationaux.
              </p>
              <div className="lp-hero__actions">
                <Link to="/deposer" className="lp-btn lp-btn--primary lp-btn--lg">
                  <span className="material-symbols-outlined" aria-hidden>add_circle</span>
                  Déposer une plainte
                </Link>
                <Link to="/suivi" className="lp-btn lp-btn--outline lp-btn--lg">
                  <span className="material-symbols-outlined" aria-hidden>search</span>
                  Suivre ma plainte
                </Link>
              </div>
            </div>
            {/* Visual */}
            <div className="lp-hero__visual" aria-hidden="true">
              <div className="lp-hero__img-frame">
                <img
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuCBGTrQNYQyO0U1bbj8O8X4R-Sh2RyEfwjEQscyc4kFDSpZEGFUVOpaJGDDaCr4DFvCOmXdocbg5RNeIlLpOUCQHOjuH_CHsZxSwviBlJSlYjN8g7n6VBA7PkSY08CU19Tkwgsf1llajim-EUaP-AUaqlc1vLS0CXVZD8weGa8J9RMO3Gs9OjilabYz-Wy5r7sIGoTbExogITJxQZFfAkH-MzaMskJ0qXCIvRE4VQOugiWWE9Evy929MWoQXnu-FwN0QvSiHzajPF4"
                  alt="Médecin béninois en consultation avec un patient dans un établissement de santé moderne"
                  className="lp-hero__img"
                  loading="eager"
                />
              </div>
              <div className="lp-hero__glow lp-hero__glow--1" />
              <div className="lp-hero__glow lp-hero__glow--2" />
            </div>
          </div>
        </div>
      </section>

      {/* ── KPI ───────────────────────────────────────── */}
      <section id="statistiques" className="lp-kpi" aria-labelledby="stats-title">
        <div className="page-container">
          <h2 id="stats-title" className="sr-only">Indicateurs publics</h2>
          <div className="lp-kpi__grid" ref={kpiRef}>
            {/* Card 1 */}
            <article className={`lp-kpi__card lp-kpi__card--primary${kpiInView ? ' lp-kpi__card--visible' : ''}`} style={{ transitionDelay: '0ms' }}>
              <div className="lp-kpi__icon-wrap lp-kpi__icon-wrap--primary">
                <span className="material-symbols-outlined lp-kpi__icon" aria-hidden>task_alt</span>
              </div>
              <p className="lp-kpi__value">{formatStat(treated, '12 450+')}</p>
              <p className="lp-kpi__label">Plaintes traitées</p>
            </article>
            {/* Card 2 */}
            <article className={`lp-kpi__card lp-kpi__card--p4${kpiInView ? ' lp-kpi__card--visible' : ''}`} style={{ transitionDelay: '100ms' }}>
              <div className="lp-kpi__icon-wrap lp-kpi__icon-wrap--p4">
                <span className="material-symbols-outlined lp-kpi__icon lp-kpi__icon--p4" aria-hidden>timer</span>
              </div>
              <p className="lp-kpi__value">48 Heures</p>
              <p className="lp-kpi__label">Délai moyen de résolution</p>
            </article>
            {/* Card 3 */}
            <article className={`lp-kpi__card lp-kpi__card--secondary${kpiInView ? ' lp-kpi__card--visible' : ''}`} style={{ transitionDelay: '200ms' }}>
              <div className="lp-kpi__icon-wrap lp-kpi__icon-wrap--secondary">
                <span className="material-symbols-outlined lp-kpi__icon lp-kpi__icon--secondary" aria-hidden>mood</span>
              </div>
              <p className="lp-kpi__value">{satisfaction}</p>
              <p className="lp-kpi__label">Taux de satisfaction</p>
            </article>
          </div>
        </div>
      </section>

      {/* ── COMMENT ÇA MARCHE ─────────────────────────── */}
      <section id="comment" className="lp-steps" aria-labelledby="how-title">
        <div className="page-container">
          <div className="lp-steps__header">
            <h2 id="how-title" className="lp-steps__title">Comment ça marche ?</h2>
            <p className="lp-steps__lead">
              Un processus structuré en 3 étapes pour garantir que chaque voix est entendue et chaque problème résolu.
            </p>
          </div>
          <div className="lp-steps__grid">
            <div className="lp-steps__connector" aria-hidden="true" />
            {STEPS.map((s) => (
              <article key={s.step} className="lp-step">
                <div className="lp-step__num" aria-hidden="true">{s.step}</div>
                <div className="lp-step__card">
                  <span className="material-symbols-outlined lp-step__icon" aria-hidden>{s.icon}</span>
                  <h3 className="lp-step__title">{s.title}</h3>
                  <p className="lp-step__desc">{s.desc}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOTLINE ───────────────────────────────────── */}
      <section className="lp-hotline" aria-labelledby="hotline-title">
        <div className="lp-hotline__bg-icon" aria-hidden="true">
          <span className="material-symbols-outlined">phone_in_talk</span>
        </div>
        <div className="page-container lp-hotline__inner">
          <div className="lp-hotline__copy">
            <h2 id="hotline-title" className="lp-hotline__title">
              Besoin d&apos;une assistance immédiate ?
            </h2>
            <p className="lp-hotline__text">
              Nos agents sont à votre écoute 24h/24 et 7j/7 pour vous accompagner dans vos démarches de santé ou recueillir vos alertes sanitaires.
            </p>
          </div>
          <div className="lp-hotline__card">
            <span className="lp-hotline__label">Ligne Verte Gratuite</span>
            <a href="tel:136" className="lp-hotline__number">
              <span className="material-symbols-outlined" aria-hidden>call</span>
              136
            </a>
            <p className="lp-hotline__hint">Appel gratuit depuis tous les opérateurs au Bénin</p>
          </div>
        </div>
      </section>

    </div>
  )
}
