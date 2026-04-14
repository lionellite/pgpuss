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
    { label: 'Total plaintes', value: stats?.total_complaints ?? 0, icon: <FiFileText />, color: 'var(--color-primary)' },
    { label: 'En cours', value: stats?.open_complaints ?? 0, icon: <FiClock />, color: '#d97706' },
    { label: 'Résolues', value: stats?.resolved_complaints ?? 0, icon: <FiCheckCircle />, color: 'var(--color-primary)' },
    { label: 'En retard', value: stats?.overdue_complaints ?? 0, icon: <FiAlertCircle />, color: '#dc2626' },
    { label: 'Temps moy. résolution', value: stats?.avg_resolution_time ? `${stats.avg_resolution_time}h` : '—', icon: <FiTrendingUp />, color: '#4f46e5' },
    { label: 'Satisfaction moyenne', value: stats?.satisfaction_avg ? `${stats.satisfaction_avg}/5` : '—', icon: '⭐', color: '#d97706' },
  ]

  const STATUS_COLORS = {
    DEPOSEE: '#717171', ENREGISTREE: '#0077b6', CLASSIFIEE: '#6b5b95',
    AFFECTEE: '#d97706', EN_INSTRUCTION: '#2563eb', RESOLUE: '#059669',
    CLOTURE_PROVISOIRE: '#059669', CLOTURE_DEFINITIVE: '#059669',
    CONTESTEE: '#dc2626', ESCALADEE: '#dc2626', REJETEE: '#dc2626',
  }

  const STATUS_LABELS = {
    DEPOSEE: 'Déposée', ENREGISTREE: 'Enregistrée', CLASSIFIEE: 'Classifiée',
    AFFECTEE: 'Affectée', EN_INSTRUCTION: 'En instruction', RESOLUE: 'Résolue',
    CLOTURE_PROVISOIRE: 'Clôture prov.', CLOTURE_DEFINITIVE: 'Clôturée',
    CONTESTEE: 'Contestée', ESCALADEE: 'Escaladée'
  }

  return (
    <div style={{ padding: '1rem 0' }}>
      <div style={{ marginBottom: '2.5rem' }}>
        <h1 className="page-title">Tableau de bord</h1>
        <p style={{ color: '#666', fontSize: '0.9rem', marginTop: '0.5rem' }}>
          Bienvenue, {user?.first_name} — {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2.5rem' }}>
        {kpis.map((kpi, i) => (
          <div key={i} className="stat-card" style={{ borderLeftColor: kpi.color }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div style={{ fontSize: '1.25rem', color: kpi.color }}>{kpi.icon}</div>
              <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#999', textTransform: 'uppercase' }}>{kpi.label}</div>
            </div>
            <div className="stat-value" style={{ fontSize: '2rem', color: '#111' }}>{kpi.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
        {/* By Status */}
        <div className="glass-card" style={{ padding: '2rem', border: '1px solid #ddd', boxShadow: 'none' }}>
          <h3 style={{ fontSize: '0.9rem', marginBottom: '1.5rem', color: '#111', textTransform: 'uppercase', fontWeight: 800 }}>
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
        <div className="glass-card" style={{ padding: '2rem', border: '1px solid #ddd', boxShadow: 'none' }}>
          <h3 style={{ fontSize: '0.9rem', marginBottom: '1.5rem', color: '#111', textTransform: 'uppercase', fontWeight: 800 }}>
            Répartition par priorité
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            {[
              { key: 'P1', label: 'P1 Critique', color: '#dc2626' },
              { key: 'P2', label: 'P2 Urgent', color: '#ea580c' },
              { key: 'P3', label: 'P3 Élevé', color: '#d97706' },
              { key: 'P4', label: 'P4 Normal', color: '#2563eb' },
              { key: 'P5', label: 'P5 Faible', color: '#717171' },
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
        <div className="glass-card" style={{ padding: '2rem', marginBottom: '1.5rem', border: '1px solid #ddd', boxShadow: 'none' }}>
          <h3 style={{ fontSize: '0.9rem', marginBottom: '1.5rem', color: '#111', textTransform: 'uppercase', fontWeight: 800 }}>
            Catégories récurrentes
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1rem' }}>
            {stats.complaints_by_category.map((item, i) => (
              <div key={i} style={{
                padding: '1rem', borderRadius: '4px',
                background: '#f8f9fa', border: '1px solid #eee',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <span style={{ fontSize: '0.85rem', color: '#333', fontWeight: 600 }}>{item.category__name}</span>
                <span className="badge badge-enregistree">{item.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent complaints */}
      {stats?.recent_complaints?.length > 0 && (
        <div className="glass-card" style={{ padding: '2rem', border: '1px solid #ddd', boxShadow: 'none' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '0.9rem', color: '#111', textTransform: 'uppercase', fontWeight: 800 }}>
              Dossiers récents
            </h3>
            <Link to="/dashboard/plaintes" className="btn btn-ghost btn-sm">
              TOUT AFFICHER <FiArrowRight />
            </Link>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {stats.recent_complaints.map((c, i) => (
              <Link key={i} to={`/dashboard/plaintes/${c.id}`} style={{ textDecoration: 'none' }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '1.5rem', padding: '1rem',
                  borderRadius: '4px', background: '#fff',
                  border: '1px solid #eee',
                }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#111', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {c.title}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#666', marginTop: '0.25rem' }}>
                      {c.ticket_number} — {c.establishment_name}
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
