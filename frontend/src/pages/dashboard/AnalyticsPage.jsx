import React, { useState, useEffect } from 'react'
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import { analyticsAPI } from '../../api'
import { useAuth } from '../../contexts/AuthContext'
import PageHeader from '../../components/a11y/PageHeader'
import LoadingState from '../../components/a11y/LoadingState'
import AccessibleChartCard from '../../components/charts/AccessibleChartCard'
import ChartTooltipAccessible from '../../components/charts/ChartTooltipAccessible'
import KpiCard from '../../components/dashboard/KpiCard'
import {
  CHART_COLORS, PRIORITY_COLORS, STATUS_LABELS, chartAxisStyle, chartGridStyle,
} from '../../components/charts/chartConfig'

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

export default function AnalyticsPage() {
  const { user } = useAuth()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [period, setPeriod] = useState('monthly')
  const [year, setYear] = useState(new Date().getFullYear())
  const [value, setValue] = useState(new Date().getMonth() + 1)

  useEffect(() => {
    analyticsAPI.dashboard()
      .then(({ data }) => setStats(data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <LoadingState label="Chargement des données analytiques…" />
  if (!stats) return <p className="text-muted" role="alert">Données indisponibles.</p>

  const monthlyData = (stats.complaints_by_month || []).map((m) => ({
    mois: new Date(m.month + '-01').toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' }),
    plaintes: m.count,
  }))

  const statusData = Object.entries(stats.complaints_by_status || {}).map(([k, v]) => ({
    name: STATUS_LABELS[k] || k.replace(/_/g, ' '),
    value: v,
  }))

  const priorityData = ['P1', 'P2', 'P3', 'P4', 'P5'].map((p) => ({
    name: p,
    count: stats.complaints_by_priority?.[p] || 0,
  }))

  const categoryData = (stats.complaints_by_category || []).map((c) => ({
    name: c.category__name?.substring(0, 24) || 'Autre',
    count: c.count,
  }))

  const channelData = Object.entries(stats.complaints_by_channel || {}).map(([k, v]) => ({
    name: k,
    value: v,
  }))

  const establishmentData = (stats.complaints_by_establishment || []).slice(0, 6).map((e) => ({
    name: (e.establishment__name || 'Autre').substring(0, 25),
    count: e.count,
  }))

  const kpis = [
    { label: 'Total', value: stats.total_complaints, icon: null, color: 'var(--color-primary)' },
    { label: 'En cours', value: stats.open_complaints, icon: null, color: 'var(--priority-p2)' },
    { label: 'Résolues', value: stats.resolved_complaints, icon: null, color: 'var(--color-primary)' },
    { label: 'En retard', value: stats.overdue_complaints, icon: null, color: 'var(--priority-p1)' },
    { label: 'Délai moy.', value: stats.avg_resolution_time ? `${stats.avg_resolution_time}h` : '—', icon: null, color: 'var(--priority-p4)' },
    { label: 'Satisfaction', value: stats.satisfaction_avg ? `${stats.satisfaction_avg}/5` : '—', icon: null, color: 'var(--priority-p3)' },
  ]

  const handleExport = async (format) => {
    setExporting(true)
    try {
      const params = { format, period, year, ...(period !== 'annual' ? { value } : {}) }
      const res = await analyticsAPI.exportStats(params)
      const blob = new Blob([res.data], { type: res.headers['content-type'] || 'application/octet-stream' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `pgpuss_stats_${period}_${year}${period !== 'annual' ? '_' + value : ''}.${format === 'pdf' ? 'pdf' : 'xlsx'}`
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="dashboard-page">
      <PageHeader
        title="Analytique"
        description="Indicateurs et tendances de la plateforme de gestion des plaintes."
      />

      {(user?.role === 'CABINET' || user?.role === 'ADMIN_PLATEFORME') && (
        <div className="card card--padding-sm export-panel">
          <div className="export-panel__filters">
            <div className="form-group">
              <label className="form-label" htmlFor="export-period">Période</label>
              <select id="export-period" className="form-select" value={period} onChange={(e) => setPeriod(e.target.value)}>
                <option value="monthly">Mensuel</option>
                <option value="quarterly">Trimestriel</option>
                <option value="semiannual">Semestriel</option>
                <option value="annual">Annuel</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="export-year">Année</label>
              <input id="export-year" className="form-input" type="number" value={year} onChange={(e) => setYear(Number(e.target.value || 0))} />
            </div>
            {period !== 'annual' && (
              <div className="form-group">
                <label className="form-label" htmlFor="export-value">
                  {period === 'monthly' ? 'Mois' : period === 'quarterly' ? 'Trimestre' : 'Semestre'}
                </label>
                <input id="export-value" className="form-input" type="number" value={value} onChange={(e) => setValue(Number(e.target.value || 0))} />
              </div>
            )}
          </div>
          <div className="export-panel__actions">
            <button type="button" className="btn btn-secondary" disabled={exporting} onClick={() => handleExport('xlsx')}>
              {exporting ? 'Export…' : 'Exporter Excel'}
            </button>
            <button type="button" className="btn btn-primary" disabled={exporting} onClick={() => handleExport('pdf')}>
              {exporting ? 'Export…' : 'Exporter PDF'}
            </button>
          </div>
        </div>
      )}

      <div className="kpi-grid" role="region" aria-label="Résumé des indicateurs">
        {kpis.map((k, i) => (
          <KpiCard key={k.label} label={k.label} value={k.value} icon={k.icon} color={k.color} index={i} />
        ))}
      </div>

      {monthlyData.length > 0 && (
        <AccessibleChartCard
          title="Évolution mensuelle des dossiers"
          description="Nombre de plaintes enregistrées par mois."
          dataTable={
            <DataTable
              headers={['Mois', 'Plaintes']}
              rows={monthlyData.map((d) => [d.mois, d.plaintes])}
            />
          }
        >
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={monthlyData}>
              <CartesianGrid {...chartGridStyle} vertical={false} />
              <XAxis dataKey="mois" {...chartAxisStyle} />
              <YAxis {...chartAxisStyle} />
              <Tooltip content={<ChartTooltipAccessible />} />
              <Line
                type="monotone"
                dataKey="plaintes"
                name="Plaintes"
                stroke="var(--color-primary)"
                strokeWidth={3}
                dot={{ fill: 'var(--color-primary)', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </AccessibleChartCard>
      )}

      <div className="chart-grid chart-grid--2">
        <AccessibleChartCard
          title="Répartition par priorité"
          description="Volume de plaintes par niveau de priorité P1 à P5."
          dataTable={
            <DataTable headers={['Priorité', 'Nombre']} rows={priorityData.map((d) => [d.name, d.count])} />
          }
        >
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={priorityData}>
              <CartesianGrid {...chartGridStyle} vertical={false} />
              <XAxis dataKey="name" {...chartAxisStyle} axisLine={false} />
              <YAxis {...chartAxisStyle} axisLine={false} />
              <Tooltip content={<ChartTooltipAccessible />} />
              <Bar dataKey="count" name="Plaintes" radius={[2, 2, 0, 0]}>
                {priorityData.map((_, i) => <Cell key={i} fill={PRIORITY_COLORS[i]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </AccessibleChartCard>

        {statusData.length > 0 && (
          <AccessibleChartCard
            title="Répartition par statut"
            description="Distribution des plaintes selon leur statut dans le workflow."
            dataTable={
              <DataTable headers={['Statut', 'Nombre']} rows={statusData.map((d) => [d.name, d.value])} />
            }
          >
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={statusData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} dataKey="value" nameKey="name">
                  {statusData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Pie>
                <Tooltip content={<ChartTooltipAccessible />} />
                <Legend formatter={(v) => <span className="chart-legend__label">{v}</span>} />
              </PieChart>
            </ResponsiveContainer>
          </AccessibleChartCard>
        )}
      </div>

      <div className="chart-grid chart-grid--2">
        {categoryData.length > 0 && (
          <AccessibleChartCard
            title="Top catégories"
            description="Catégories de plaintes les plus fréquentes."
            dataTable={
              <DataTable headers={['Catégorie', 'Nombre']} rows={categoryData.map((d) => [d.name, d.count])} />
            }
          >
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={categoryData} layout="vertical">
                <CartesianGrid {...chartGridStyle} horizontal={false} />
                <XAxis type="number" tick={{ fill: '#3f4948', fontSize: 11 }} axisLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fill: '#3f4948', fontSize: 11 }} width={130} axisLine={false} />
                <Tooltip content={<ChartTooltipAccessible />} />
                <Bar dataKey="count" name="Plaintes" fill="var(--color-primary)" radius={[0, 2, 2, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </AccessibleChartCard>
        )}

        {channelData.length > 0 && (
          <AccessibleChartCard
            title="Répartition par canal"
            description="Origine des plaintes (web, téléphone, etc.)."
            dataTable={
              <DataTable headers={['Canal', 'Nombre']} rows={channelData.map((d) => [d.name, d.value])} />
            }
          >
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={channelData} cx="50%" cy="50%" outerRadius={80} dataKey="value" nameKey="name">
                  {channelData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Pie>
                <Tooltip content={<ChartTooltipAccessible />} />
                <Legend formatter={(v) => <span className="chart-legend__label">{v}</span>} />
              </PieChart>
            </ResponsiveContainer>
          </AccessibleChartCard>
        )}
      </div>

      {establishmentData.length > 0 && (
        <AccessibleChartCard
          title="Établissements les plus concernés"
          description="Établissements de santé avec le plus de plaintes enregistrées."
          dataTable={
            <DataTable headers={['Établissement', 'Plaintes']} rows={establishmentData.map((d) => [d.name, d.count])} />
          }
        >
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={establishmentData}>
              <CartesianGrid {...chartGridStyle} vertical={false} />
              <XAxis dataKey="name" tick={{ fill: '#3f4948', fontSize: 10 }} angle={-15} textAnchor="end" height={60} />
              <YAxis {...chartAxisStyle} axisLine={false} />
              <Tooltip content={<ChartTooltipAccessible />} />
              <Bar dataKey="count" name="Plaintes" fill="#004c4c" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </AccessibleChartCard>
      )}
    </div>
  )
}
