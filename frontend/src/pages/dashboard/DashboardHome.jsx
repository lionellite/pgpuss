import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { analyticsAPI } from '../../api'
import { useAuth } from '../../contexts/AuthContext'
import StatusBadge from '../../components/StatusBadge'
import PriorityBadge from '../../components/PriorityBadge'
import { FiFileText, FiAlertCircle, FiCheckCircle, FiClock, FiTrendingUp, FiArrowRight } from 'react-icons/fi'

export default function DashboardHome() {
  const { user } = useAuth()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    analyticsAPI.dashboard()
      .then(({ data }) => setStats(data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="loading-center"><div className="spinner" /></div>

  const kpis = [
    { label: 'Total plaintes', value: stats?.total_complaints ?? 0, icon: <FiFileText />, color: '#0077B6' },
    { label: 'En cours', value: stats?.open_complaints ?? 0, icon: <FiClock />, color: '#F59E0B' },
    { label: 'Résolues', value: stats?.resolved_complaints ?? 0, icon: <FiCheckCircle />, color: '#06D6A0' },
    { label: 'En retard', value: stats?.overdue_complaints ?? 0, icon: <FiAlertCircle />, color: '#EF476F' },
    { label: 'Temps moy. résolution', value: stats?.avg_resolution_time ? `${stats.avg_resolution_time}h` : '—', icon: <FiTrendingUp />, color: '#A78BFA' },
    { label: 'Satisfaction moyenne', value: stats?.satisfaction_avg ? `${stats.satisfaction_avg}/5` : '—', icon: '⭐', color: '#F59E0B' },
  ]

  const STATUS_COLORS = {
    DEPOSEE: '#8FA3BF', ENREGISTREE: '#60A5FA', CLASSIFIEE: '#A78BFA',
    AFFECTEE: '#F59E0B', EN_INSTRUCTION: '#3B82F6', RESOLUE: '#10B981',
    CLOTURE_PROVISOIRE: '#06D6A0', CLOTURE_DEFINITIVE: '#06D6A0',
    CONTESTEE: '#FF6B35', ESCALADEE: '#EF476F', REJETEE: '#EF476F',
  }

  const STATUS_LABELS = {
    DEPOSEE: 'Déposée', ENREGISTREE: 'Enregistrée', CLASSIFIEE: 'Classifiée',
    AFFECTEE: 'Affectée', EN_INSTRUCTION: 'En instruction', RESOLUE: 'Résolue',
    CLOTURE_PROVISOIRE: 'Clôture prov.', CLOTURE_DEFINITIVE: 'Clôturée',
    CONTESTEE: 'Contestée', ESCALADEE: 'Escaladée'
  }

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 className="page-title">Tableau de bord</h1>
        <p className="page-subtitle">
          Bienvenue, {user?.first_name} — {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        {kpis.map((kpi, i) => (
          <div key={i} className="stat-card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <div style={{ fontSize: '1.5rem', color: kpi.color, opacity: 0.8 }}>{kpi.icon}</div>
            </div>
            <div className="stat-value" style={{ fontSize: '2rem' }}>{kpi.value}</div>
            <div className="stat-label">{kpi.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
        {/* By Status */}
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '1.25rem', color: '#8FA3BF', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Répartition par statut
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
            {Object.entries(stats?.complaints_by_status || {}).map(([status, count]) => {
              const total = stats?.total_complaints || 1
              const pct = Math.round((count / total) * 100)
              return (
                <div key={status}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                    <span style={{ fontSize: '0.8rem', color: '#8FA3BF' }}>{STATUS_LABELS[status] || status}</span>
                    <span style={{ fontSize: '0.8rem', fontWeight: 600, color: STATUS_COLORS[status] || '#8FA3BF' }}>{count}</span>
                  </div>
                  <div style={{ height: 6, borderRadius: '3px', background: 'rgba(0,119,182,0.1)' }}>
                    <div style={{ height: '100%', borderRadius: '3px', width: `${pct}%`, background: STATUS_COLORS[status] || '#8FA3BF', transition: 'width 0.8s ease' }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* By Priority */}
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '1.25rem', color: '#8FA3BF', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Répartition par priorité
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            {[
              { key: 'P1', label: 'P1 Critique', color: '#EF476F' },
              { key: 'P2', label: 'P2 Urgent', color: '#FF6B35' },
              { key: 'P3', label: 'P3 Élevé', color: '#F59E0B' },
              { key: 'P4', label: 'P4 Normal', color: '#3B82F6' },
              { key: 'P5', label: 'P5 Faible', color: '#8FA3BF' },
            ].map(({ key, label, color }) => {
              const count = stats?.complaints_by_priority?.[key] || 0
              const total = stats?.total_complaints || 1
              const pct = Math.round((count / total) * 100)
              return (
                <div key={key}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                    <span style={{ fontSize: '0.8rem', color: '#8FA3BF' }}>{label}</span>
                    <span style={{ fontSize: '0.8rem', fontWeight: 600, color }}>{count} ({pct}%)</span>
                  </div>
                  <div style={{ height: 6, borderRadius: '3px', background: 'rgba(0,119,182,0.1)' }}>
                    <div style={{ height: '100%', borderRadius: '3px', width: `${pct}%`, background: color, transition: 'width 0.8s ease' }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* By Category */}
      {stats?.complaints_by_category?.length > 0 && (
        <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
          <h3 style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '1.25rem', color: '#8FA3BF', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Top catégories
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.75rem' }}>
            {stats.complaints_by_category.map((item, i) => (
              <div key={i} style={{
                padding: '0.875rem 1rem', borderRadius: '10px',
                background: 'rgba(0,119,182,0.05)', border: '1px solid rgba(0,119,182,0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <span style={{ fontSize: '0.85rem', color: '#F0F4FF' }}>{item.category__name}</span>
                <span className="badge badge-enregistree">{item.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent complaints */}
      {stats?.recent_complaints?.length > 0 && (
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <h3 style={{ fontWeight: 700, fontSize: '0.95rem', color: '#8FA3BF', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Plaintes récentes
            </h3>
            <Link to="/dashboard/plaintes" className="btn btn-ghost btn-sm">
              Voir tout <FiArrowRight />
            </Link>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {stats.recent_complaints.map((c, i) => (
              <Link key={i} to={`/dashboard/plaintes/${c.id}`} style={{ textDecoration: 'none' }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.875rem',
                  borderRadius: '10px', background: 'rgba(0,119,182,0.03)',
                  border: '1px solid rgba(0,119,182,0.07)', transition: 'all 0.2s',
                }}
                  onMouseOver={e => e.currentTarget.style.background = 'rgba(0,119,182,0.08)'}
                  onMouseOut={e => e.currentTarget.style.background = 'rgba(0,119,182,0.03)'}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#F0F4FF', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {c.title}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#4A6080', marginTop: '0.1rem' }}>
                      {c.ticket_number} • {c.establishment_name}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.4rem', flexShrink: 0 }}>
                    <StatusBadge status={c.status} />
                    <PriorityBadge priority={c.priority} />
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#4A6080', flexShrink: 0 }}>
                    {new Date(c.created_at).toLocaleDateString('fr-FR')}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
