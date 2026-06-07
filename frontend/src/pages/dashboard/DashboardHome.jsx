import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import { analyticsAPI } from '../../api'
import { useAuth } from '../../contexts/AuthContext'
import { contextBadgeForUser } from '../../constants/roles'
import StatusBadge from '../../components/StatusBadge'
import PriorityBadge from '../../components/PriorityBadge'
import PageHeader from '../../components/a11y/PageHeader'
import LoadingState from '../../components/a11y/LoadingState'
import KpiCard from '../../components/dashboard/KpiCard'
import AccessibleChartCard from '../../components/charts/AccessibleChartCard'
import ChartTooltipAccessible from '../../components/charts/ChartTooltipAccessible'
import { CHART_COLORS, PRIORITY_COLORS, STATUS_LABELS, chartAxisStyle, chartGridStyle } from '../../components/charts/chartConfig'
import ScrollReveal from '../../components/a11y/ScrollReveal'
import {
  FiFileText, FiAlertCircle, FiCheckCircle, FiClock, FiTrendingUp, FiArrowRight, FiStar,
} from 'react-icons/fi'

function DataTable({ headers, rows }) {
  return (
    <table className="data-table">
      <thead>
        <tr>{headers.map((h) => <th key={h} scope="col">{h}</th>)}</tr>
      </thead>
      <tbody>
        {rows.map(([a, b], i) => (
          <tr key={i}><td>{a}</td><td>{b}</td></tr>
        ))}
      </tbody>
    </table>
  )
}

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

  if (loading) return <LoadingState label="Chargement du tableau de bord…" />
  if (!stats) return <p className="text-muted" role="alert">Données indisponibles.</p>

  const kpis = [
    { label: 'Total plaintes', value: stats.total_complaints ?? 0, icon: <FiFileText />, color: 'var(--color-primary)' },
    { label: 'En cours', value: stats.open_complaints ?? 0, icon: <FiClock />, color: 'var(--priority-p2)' },
    { label: 'Résolues', value: stats.resolved_complaints ?? 0, icon: <FiCheckCircle />, color: 'var(--color-secondary)' },
    { label: 'En retard', value: stats.overdue_complaints ?? 0, icon: <FiAlertCircle />, color: 'var(--priority-p1)' },
    { label: 'Temps moy. résolution', value: stats.avg_resolution_time ? `${stats.avg_resolution_time}h` : '—', icon: <FiTrendingUp />, color: 'var(--priority-p4)' },
    { label: 'Satisfaction moyenne', value: stats.satisfaction_avg ? `${stats.satisfaction_avg}/5` : '—', icon: <FiStar />, color: 'var(--priority-p3)' },
  ]

  const statusData = Object.entries(stats.complaints_by_status || {}).map(([k, v]) => ({
    name: STATUS_LABELS[k] || k,
    value: v,
  }))

  const priorityData = ['P1', 'P2', 'P3', 'P4', 'P5'].map((p) => ({
    name: p,
    count: stats.complaints_by_priority?.[p] || 0,
  }))

  const dateLabel = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })

  return (
    <div className="dashboard-page">
      <PageHeader
        title="Tableau de bord"
        description={`Bienvenue, ${user?.first_name} — ${dateLabel}`}
      >
        <p className="context-badge">{contextBadgeForUser(user)}</p>
        {user?.role === 'AUDITEUR' && (
          <p className="dashboard-page__hint">
            Accès en lecture seule — consultation et statistiques uniquement.
          </p>
        )}
      </PageHeader>

      <div className="kpi-grid" role="region" aria-label="Indicateurs clés">
        {kpis.map((kpi, i) => (
          <KpiCard key={kpi.label} {...kpi} index={i} />
        ))}
      </div>

      <div className="chart-grid chart-grid--2">
        <AccessibleChartCard
          title="Répartition par statut"
          description="Nombre de plaintes par étape du workflow."
          dataTable={
            <DataTable
              headers={['Statut', 'Nombre']}
              rows={statusData.map((d) => [d.name, d.value])}
            />
          }
        >
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={85}
                dataKey="value"
                nameKey="name"
              >
                {statusData.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<ChartTooltipAccessible />} />
            </PieChart>
          </ResponsiveContainer>
        </AccessibleChartCard>

        <AccessibleChartCard
          title="Répartition par priorité"
          description="Distribution des plaintes selon les niveaux P1 à P5."
          dataTable={
            <DataTable
              headers={['Priorité', 'Nombre']}
              rows={priorityData.map((d) => [d.name, d.count])}
            />
          }
        >
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={priorityData}>
              <CartesianGrid {...chartGridStyle} vertical={false} />
              <XAxis dataKey="name" {...chartAxisStyle} axisLine={false} />
              <YAxis {...chartAxisStyle} axisLine={false} />
              <Tooltip content={<ChartTooltipAccessible />} />
              <Bar dataKey="count" name="Plaintes" radius={[2, 2, 0, 0]}>
                {priorityData.map((_, i) => (
                  <Cell key={i} fill={PRIORITY_COLORS[i]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </AccessibleChartCard>
      </div>

      {stats.complaints_by_category?.length > 0 && (
        <ScrollReveal className="card card--padding dashboard-section">
          <h2 className="dashboard-section__title">Catégories récurrentes</h2>
          <div className="category-grid">
            {stats.complaints_by_category.map((item, i) => (
              <div key={i} className="category-chip">
                <span className="category-chip__name">{item.category__name}</span>
                <span className="badge badge-info">{item.count}</span>
              </div>
            ))}
          </div>
        </ScrollReveal>
      )}

      {stats.recent_complaints?.length > 0 && (
        <ScrollReveal className="card card--padding dashboard-section">
          <div className="dashboard-section__head">
            <h2 className="dashboard-section__title">Dossiers récents</h2>
            <Link to="/dashboard/plaintes" className="btn btn-ghost btn-sm">
              Tout afficher <FiArrowRight aria-hidden />
            </Link>
          </div>
          <ul className="recent-list">
            {stats.recent_complaints.map((c) => (
              <li key={c.id}>
                <Link to={`/dashboard/plaintes/${c.id}`} className="recent-list__item">
                  <div className="recent-list__main">
                    <span className="recent-list__title">{c.title}</span>
                    <span className="recent-list__meta">
                      {c.ticket_number} — {c.establishment_name}
                    </span>
                  </div>
                  <div className="recent-list__badges">
                    <StatusBadge status={c.status} />
                    <PriorityBadge priority={c.priority} />
                  </div>
                  <time className="recent-list__date" dateTime={c.created_at}>
                    {new Date(c.created_at).toLocaleDateString('fr-FR')}
                  </time>
                </Link>
              </li>
            ))}
          </ul>
        </ScrollReveal>
      )}
    </div>
  )
}
