import React, { useState, useEffect } from 'react'
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

export default function LandingPage() {
  const [stats, setStats] = useState(null)

  useEffect(() => {
    analyticsAPI.publicStats().then(({ data }) => setStats(data)).catch(() => {})
  }, [])

  const treated = stats?.resolved_complaints ?? stats?.total_complaints
  const satisfaction = stats?.satisfaction_avg != null
    ? `${Math.round((stats.satisfaction_avg / 5) * 100)}%`
    : '94%'

  return (
    <div className="stitch-landing">
      <section className="stitch-hero" aria-labelledby="hero-title">
        <div className="stitch-hero__pattern" aria-hidden="true" />
        <div className="page-container stitch-hero__grid">
          <div>
            <p className="stitch-hero__badge">
              <span className="material-symbols-outlined material-symbols-outlined--filled" aria-hidden>verified_user</span>
              Plateforme Officielle du Ministère de la Santé
            </p>
            <h1 id="hero-title" className="stitch-hero__title">
              Votre voix compte pour une meilleure santé au Bénin
            </h1>
            <p className="stitch-hero__subtitle">
              Déposez une plainte, suivez son traitement en toute transparence et contribuez activement à l&apos;amélioration de nos services de santé nationaux.
            </p>
            <div className="stitch-hero__actions">
              <Link to="/deposer" className="stitch-hero__btn stitch-hero__btn--primary">
                <span className="material-symbols-outlined" aria-hidden>add_circle</span>
                Déposer une plainte
              </Link>
              <Link to="/suivi" className="stitch-hero__btn stitch-hero__btn--secondary">
                <span className="material-symbols-outlined" aria-hidden>search</span>
                Suivre ma plainte
              </Link>
            </div>
          </div>
          <div className="stitch-hero__visual" aria-hidden="true">
            <div className="stitch-hero__blur stitch-hero__blur--1" />
            <div className="stitch-hero__blur stitch-hero__blur--2" />
            <div className="stitch-hero__image-wrap">
              <img
                src="/img/hero-stitch-web.jpg"
                alt=""
                className="stitch-hero__image"
                loading="eager"
              />
            </div>
          </div>
        </div>
      </section>

      <section id="statistiques" className="stitch-kpi" aria-labelledby="stats-title">
        <div className="page-container">
          <h2 id="stats-title" className="sr-only">Indicateurs publics</h2>
          <div className="stitch-kpi__grid">
            <article className="stitch-kpi__card stitch-kpi__card--primary">
              <div className="stitch-kpi__icon-wrap">
                <span className="material-symbols-outlined stitch-kpi__icon" aria-hidden>task_alt</span>
              </div>
              <p className="stitch-kpi__value">{formatStat(treated, '12 450+')}</p>
              <p className="stitch-kpi__label">Plaintes traitées</p>
            </article>
            <article className="stitch-kpi__card stitch-kpi__card--p4">
              <div className="stitch-kpi__icon-wrap">
                <span className="material-symbols-outlined stitch-kpi__icon" aria-hidden>timer</span>
              </div>
              <p className="stitch-kpi__value">48 Heures</p>
              <p className="stitch-kpi__label">Délai moyen de résolution</p>
            </article>
            <article className="stitch-kpi__card stitch-kpi__card--secondary">
              <div className="stitch-kpi__icon-wrap">
                <span className="material-symbols-outlined stitch-kpi__icon" aria-hidden>mood</span>
              </div>
              <p className="stitch-kpi__value">{satisfaction}</p>
              <p className="stitch-kpi__label">Taux de satisfaction</p>
            </article>
          </div>
        </div>
      </section>

      <section id="comment" className="stitch-steps" aria-labelledby="how-title">
        <div className="page-container">
          <div className="stitch-steps__header">
            <h2 id="how-title" className="stitch-steps__title">Comment ça marche ?</h2>
            <p className="stitch-steps__lead">
              Un processus structuré en 3 étapes pour garantir que chaque voix est entendue et chaque problème résolu.
            </p>
          </div>
          <div className="stitch-steps__grid">
            <div className="stitch-steps__connector" aria-hidden="true" />
            {STEPS.map((s) => (
              <article key={s.step} className="stitch-step">
                <div className="stitch-step__num" aria-hidden="true">{s.step}</div>
                <div className="stitch-step__card">
                  <span className="material-symbols-outlined stitch-step__icon" aria-hidden>{s.icon}</span>
                  <h3 className="stitch-step__title">{s.title}</h3>
                  <p className="stitch-step__desc">{s.desc}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="stitch-hotline" aria-labelledby="hotline-title">
        <div className="stitch-hotline__bg-icon" aria-hidden="true">
          <span className="material-symbols-outlined">phone_in_talk</span>
        </div>
        <div className="page-container stitch-hotline__inner">
          <div>
            <h2 id="hotline-title" className="stitch-hotline__title">
              Besoin d&apos;une assistance immédiate ?
            </h2>
            <p className="stitch-hotline__text">
              Nos agents sont à votre écoute 24h/24 et 7j/7 pour vous accompagner dans vos démarches de santé ou recueillir vos alertes sanitaires.
            </p>
          </div>
          <div className="stitch-hotline__card">
            <span className="stitch-hotline__label">Ligne Verte Gratuite</span>
            <a href="tel:136" className="stitch-hotline__number">
              <span className="material-symbols-outlined" aria-hidden>call</span>
              136
            </a>
            <p className="stitch-hotline__hint">Appel gratuit depuis tous les opérateurs au Bénin</p>
          </div>
        </div>
      </section>
    </div>
  )
}
