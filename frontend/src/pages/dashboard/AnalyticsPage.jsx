import React, { useState, useEffect } from 'react'
import { analyticsAPI } from '../../api'
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'

const COLORS = ['#004e9f', '#006e25', '#005966', '#d97706', '#ba1a1a', '#6b5b95', '#008751', '#fcd116']

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white p-3 rounded-lg shadow-xl border border-slate-100">
      {label && <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{label}</p>}
      {payload.map((p, i) => (
        <div key={i} className="flex items-center space-x-2">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }}></div>
          <p className="text-xs font-bold text-on-surface">
            {p.name}: <span className="text-primary tabular-nums">{p.value}</span>
          </p>
        </div>
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

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-20">
      <span className="material-symbols-outlined animate-spin text-primary text-4xl">progress_activity</span>
    </div>
  )
  if (!stats) return <div className="text-center py-20 text-slate-400 font-bold uppercase tracking-widest">Données indisponibles</div>

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
    <div className="space-y-8 animate-in fade-in duration-500">
      <header>
        <h1 className="text-2xl font-black text-on-surface tracking-tight">Analyse & Performance</h1>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Données consolidées de la plateforme</p>
      </header>

      {/* Summary KPIs */}
      <section className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { label: 'Total', value: stats.total_complaints, icon: 'analytics', color: 'primary' },
          { label: 'En cours', value: stats.open_complaints, icon: 'pending_actions', color: 'secondary' },
          { label: 'Résolues', value: stats.resolved_complaints, icon: 'check_circle', color: 'secondary' },
          { label: 'En retard', value: stats.overdue_complaints, icon: 'priority_high', color: 'error' },
          { label: 'Délai moy.', value: stats.avg_resolution_time ? `${stats.avg_resolution_time}h` : '—', icon: 'schedule', color: 'tertiary' },
          { label: 'Satisfaction', value: stats.satisfaction_avg ? `${stats.satisfaction_avg}/5` : '—', icon: 'star', color: 'tertiary' },
        ].map((k, i) => (
          <div key={i} className="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
            <div className="flex justify-between items-start mb-3">
              <span className={`material-symbols-outlined text-lg p-2 rounded-lg bg-${k.color}/10 text-${k.color}`}>{k.icon}</span>
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{k.label}</p>
            <h3 className="text-2xl font-black text-on-surface tabular-nums">{k.value}</h3>
          </div>
        ))}
      </section>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly trend */}
        <section className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-8">Évolution des dépôts</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="mois" tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }} axisLine={false} tickLine={false} dy={10} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }} axisLine={false} tickLine={false} dx={-10} />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey="plaintes"
                  stroke="#004e9f"
                  strokeWidth={4}
                  dot={{ fill: '#004e9f', strokeWidth: 2, r: 4, stroke: '#fff' }}
                  activeDot={{ r: 6, strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Status distribution */}
        <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-8">Statuts des dossiers</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {statusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  verticalAlign="bottom"
                  align="center"
                  iconType="circle"
                  formatter={(v) => <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter ml-1">{v}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Priority distribution */}
        <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-8">Niveaux d'urgence</h3>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={priorityData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {priorityData.map((_, i) => (
                    <Cell key={i} fill={['#ba1a1a','#ea580c','#d97706','#004e9f','#94a3b8'][i]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Top categories */}
        <section className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-8">Catégories dominantes</h3>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="name" tick={{ fill: '#475569', fontSize: 10, fontWeight: 700 }} width={120} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" fill="#004e9f" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* By establishment */}
        <section className="lg:col-span-3 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-8">Établissements avec le plus de signalements</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={establishmentData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fill: '#475569', fontSize: 9, fontWeight: 700 }} axisLine={false} tickLine={false} interval={0} height={60} textAnchor="end" angle={-25} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" fill="#005966" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>
    </div>
  )
}
