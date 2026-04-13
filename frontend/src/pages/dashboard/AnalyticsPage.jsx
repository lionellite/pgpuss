import React, { useState, useEffect } from 'react'
import { analyticsAPI } from '../../api'
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'

const COLORS = ['#0077B6', '#06D6A0', '#FF6B35', '#EF476F', '#F59E0B', '#A78BFA', '#3B82F6', '#10B981']

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: '#0F1E35', border: '1px solid rgba(0,119,182,0.3)', borderRadius: '10px', padding: '0.75rem 1rem' }}>
      {label && <p style={{ color: '#8FA3BF', fontSize: '0.75rem', marginBottom: '0.3rem' }}>{label}</p>}
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color || '#F0F4FF', fontSize: '0.875rem', fontWeight: 600 }}>
          {p.name}: {p.value}
        </p>
      ))}
    </div>
  )
}

export default function AnalyticsPage() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    analyticsAPI.dashboard()
      .then(({ data }) => setStats(data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="loading-center"><div className="spinner" /></div>
  if (!stats) return <div className="loading-center" style={{ color: '#8FA3BF' }}>Données indisponibles</div>

  // Prepare data
  const monthlyData = (stats.complaints_by_month || []).map(m => ({
    mois: new Date(m.month + '-01').toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' }),
    plaintes: m.count,
  }))

  const statusData = Object.entries(stats.complaints_by_status || {}).map(([k, v]) => ({
    name: k.replace(/_/g, ' '),
    value: v,
  }))

  const priorityData = ['P1', 'P2', 'P3', 'P4', 'P5'].map(p => ({
    name: p,
    count: stats.complaints_by_priority?.[p] || 0,
  }))

  const categoryData = (stats.complaints_by_category || []).map(c => ({
    name: c.category__name?.substring(0, 20) || 'Autre',
    count: c.count,
  }))

  const channelData = Object.entries(stats.complaints_by_channel || {}).map(([k, v]) => ({
    name: k,
    value: v,
  }))

  const establishmentData = (stats.complaints_by_establishment || []).slice(0, 6).map(e => ({
    name: (e.establishment__name || 'Autre').substring(0, 25),
    count: e.count,
  }))

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 className="page-title">Analytique</h1>
        <p className="page-subtitle">Tendances et statistiques des plaintes</p>
      </div>

      {/* Summary KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        {[
          { label: 'Total', value: stats.total_complaints, color: '#0077B6' },
          { label: 'En cours', value: stats.open_complaints, color: '#F59E0B' },
          { label: 'Résolues', value: stats.resolved_complaints, color: '#06D6A0' },
          { label: 'En retard', value: stats.overdue_complaints, color: '#EF476F' },
          { label: 'Délai moy.', value: stats.avg_resolution_time ? `${stats.avg_resolution_time}h` : '—', color: '#A78BFA' },
          { label: 'Satisfaction', value: stats.satisfaction_avg ? `${stats.satisfaction_avg}/5 ⭐` : '—', color: '#F59E0B' },
        ].map((k, i) => (
          <div key={i} className="stat-card">
            <div className="stat-value" style={{ fontSize: '1.75rem', color: k.color }}>{k.value}</div>
            <div className="stat-label">{k.label}</div>
          </div>
        ))}
      </div>

      {/* Monthly trend */}
      {monthlyData.length > 0 && (
        <div className="glass-card" style={{ padding: '1.75rem', marginBottom: '1.5rem' }}>
          <h3 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '1.5rem', color: '#8FA3BF', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Évolution mensuelle des plaintes
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,119,182,0.1)" />
              <XAxis dataKey="mois" tick={{ fill: '#8FA3BF', fontSize: 11 }} axisLine={{ stroke: 'rgba(0,119,182,0.2)' }} />
              <YAxis tick={{ fill: '#8FA3BF', fontSize: 11 }} axisLine={{ stroke: 'rgba(0,119,182,0.2)' }} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="plaintes" name="Plaintes" stroke="#0077B6" strokeWidth={2.5}
                dot={{ fill: '#00B4D8', r: 4 }} activeDot={{ r: 6, fill: '#06D6A0' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
        {/* Priority distribution */}
        <div className="glass-card" style={{ padding: '1.75rem' }}>
          <h3 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '1.5rem', color: '#8FA3BF', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Répartition par priorité
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={priorityData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,119,182,0.1)" />
              <XAxis dataKey="name" tick={{ fill: '#8FA3BF', fontSize: 11 }} axisLine={false} />
              <YAxis tick={{ fill: '#8FA3BF', fontSize: 11 }} axisLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" name="Plaintes" radius={[4, 4, 0, 0]}>
                {priorityData.map((_, i) => (
                  <Cell key={i} fill={['#EF476F','#FF6B35','#F59E0B','#3B82F6','#8FA3BF'][i]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Status pie */}
        {statusData.length > 0 && (
          <div className="glass-card" style={{ padding: '1.75rem' }}>
            <h3 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '1.5rem', color: '#8FA3BF', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Répartition par statut
            </h3>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={statusData} cx="50%" cy="50%" innerRadius={50} outerRadius={80}
                  dataKey="value" nameKey="name" paddingAngle={2}>
                  {statusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend formatter={(v) => <span style={{ color: '#8FA3BF', fontSize: '0.75rem' }}>{v}</span>} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        {/* Top categories */}
        {categoryData.length > 0 && (
          <div className="glass-card" style={{ padding: '1.75rem' }}>
            <h3 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '1.5rem', color: '#8FA3BF', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Top catégories
            </h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={categoryData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,119,182,0.1)" />
                <XAxis type="number" tick={{ fill: '#8FA3BF', fontSize: 10 }} axisLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fill: '#8FA3BF', fontSize: 10 }} width={130} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" name="Plaintes" fill="#0077B6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* By channel */}
        {channelData.length > 0 && (
          <div className="glass-card" style={{ padding: '1.75rem' }}>
            <h3 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '1.5rem', color: '#8FA3BF', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Répartition par canal
            </h3>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={channelData} cx="50%" cy="50%" outerRadius={80} dataKey="value" nameKey="name">
                  {channelData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend formatter={(v) => <span style={{ color: '#8FA3BF', fontSize: '0.75rem' }}>{v}</span>} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* By establishment */}
      {establishmentData.length > 0 && (
        <div className="glass-card" style={{ padding: '1.75rem', marginTop: '1.5rem' }}>
          <h3 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '1.5rem', color: '#8FA3BF', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Top établissements
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={establishmentData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,119,182,0.1)" />
              <XAxis dataKey="name" tick={{ fill: '#8FA3BF', fontSize: 10 }} angle={-20} textAnchor="end" height={50} />
              <YAxis tick={{ fill: '#8FA3BF', fontSize: 11 }} axisLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" name="Plaintes" fill="#06D6A0" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
