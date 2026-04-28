import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { analyticsAPI, complaintsAPI } from '../../api'
import { useAuth } from '../../contexts/AuthContext'
import StatusBadge from '../../components/StatusBadge'
import PriorityBadge from '../../components/PriorityBadge'

export default function DashboardHome() {
  const { user } = useAuth()
  const [stats, setStats] = useState(null)
  const [myComplaints, setMyComplaints] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      analyticsAPI.dashboard(),
      complaintsAPI.list({ assigned_to: user?.id, page_size: 3 })
    ]).then(([statsRes, complaintsRes]) => {
      setStats(statsRes.data)
      setMyComplaints(complaintsRes.data.results || [])
    })
    .catch(() => {})
    .finally(() => setLoading(false))
  }, [user])

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-20">
      <span className="material-symbols-outlined animate-spin text-primary text-4xl">progress_activity</span>
    </div>
  )

  const kpis = [
    { label: 'Taux de Résolution', value: stats?.resolution_rate ? `${stats.resolution_rate}%` : '94.8%', icon: 'task_alt', trend: '+4.2%', color: 'secondary' },
    { label: 'Temps Moyen', value: stats?.avg_resolution_time ? `${stats.avg_resolution_time}h` : '2h 45m', icon: 'schedule', trend: '-12m', color: 'primary' },
    { label: 'Dossiers Clôturés', value: stats?.resolved_complaints ?? '1,204', icon: 'assignment_turned_in', color: 'secondary' },
    { label: 'Urgences en attente', value: stats?.overdue_complaints ?? '08', icon: 'emergency_home', color: 'error' },
  ]

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-on-surface tracking-tight">Tableau de Bord</h1>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
            Bienvenue, {user?.first_name} {user?.last_name} — Agent {user?.role_display}
          </p>
        </div>
        <div className="flex space-x-2">
           <button className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors">Exporter</button>
           <button className="px-4 py-2 bg-primary text-white rounded-lg text-xs font-bold shadow-lg shadow-primary/20 hover:bg-primary/90 transition-colors">Nouvelle Entrée</button>
        </div>
      </header>

      {/* KPI Grid */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <span className={`material-symbols-outlined p-2 rounded-xl bg-${kpi.color}/10 text-${kpi.color}`}>{kpi.icon}</span>
              {kpi.trend && (
                <span className={`text-[10px] font-black flex items-center ${kpi.trend.startsWith('+') ? 'text-secondary' : 'text-error'}`}>
                  <span className="material-symbols-outlined text-xs mr-1">{kpi.trend.startsWith('+') ? 'trending_up' : 'trending_down'}</span>
                  {kpi.trend}
                </span>
              )}
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{kpi.label}</p>
            <h3 className="text-3xl font-black text-on-surface tabular-nums">{kpi.value}</h3>
          </div>
        ))}
      </section>

      {/* Main Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">

        {/* Assigned Tickets Column */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-on-surface flex items-center">
              <span className="material-symbols-outlined mr-3 text-primary">person_search</span>
              Mes dossiers assignés
            </h3>
            <span className="px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-black rounded-full uppercase">
              {myComplaints.length} Actifs
            </span>
          </div>

          <div className="space-y-4">
            {myComplaints.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Aucun dossier assigné</p>
              </div>
            ) : myComplaints.map(c => (
              <Link key={c.id} to={`/dashboard/plaintes/${c.id}`} className="block group">
                <div className={`bg-white p-5 rounded-2xl shadow-sm border-l-4 hover:shadow-md transition-all ${
                  c.priority === 'P1' || c.priority === 'P2' ? 'border-error' : 'border-primary'
                }`}>
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-[10px] font-black text-slate-300 tracking-widest uppercase">ID #{c.ticket_number.slice(-6)}</span>
                    <PriorityBadge priority={c.priority} />
                  </div>
                  <h4 className="font-bold text-on-surface text-sm mb-2 leading-tight group-hover:text-primary transition-colors">{c.title}</h4>
                  <p className="text-[11px] text-slate-500 line-clamp-2 mb-4 leading-relaxed">
                    {c.description}
                  </p>
                  <div className="flex items-center justify-between pt-3 border-t border-slate-50">
                    <div className="flex items-center">
                      <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-black">
                        {user?.first_name?.[0]}{user?.last_name?.[0]}
                      </div>
                      <span className="ml-2 text-[10px] font-bold text-slate-400">Assigné à moi</span>
                    </div>
                    <span className="text-[10px] font-bold text-slate-300 tabular-nums">
                      {new Date(c.created_at).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Global Queue Column */}
        <section className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-on-surface flex items-center">
              <span className="material-symbols-outlined mr-3 text-primary">list_alt</span>
              File d'attente globale
            </h3>
            <Link to="/dashboard/plaintes" className="text-xs font-black text-primary uppercase tracking-widest hover:underline decoration-2 underline-offset-4">
              Voir tout le registre
            </Link>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Dossier</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Utilisateur</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Statut</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {(stats?.recent_complaints || []).slice(0, 6).map((c, i) => (
                    <tr key={i} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-4">
                        <span className="font-mono text-xs font-bold text-primary">#{c.ticket_number.slice(-6)}</span>
                        <p className="text-[10px] text-slate-400 mt-0.5 truncate max-w-[150px]">{c.title}</p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center text-[10px] font-black mr-3">
                            {c.complainant_name?.[0] || '?'}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-on-surface leading-none">{c.complainant_name || 'Anonyme'}</p>
                            <p className="text-[10px] text-slate-400 mt-1">{c.establishment_name}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={c.status} />
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link to={`/dashboard/plaintes/${c.id}`} className="inline-flex items-center p-2 text-slate-400 hover:text-primary transition-colors">
                          <span className="material-symbols-outlined text-lg">visibility</span>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>

      {/* Geospatial Section */}
      <section className="relative h-[400px] rounded-3xl overflow-hidden shadow-sm border border-slate-100 group">
        <div
          className="absolute inset-0 bg-slate-100 bg-cover bg-center mix-blend-multiply opacity-50 grayscale group-hover:grayscale-0 transition-all duration-1000"
          style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/cubes.png")' }}
        ></div>
        <div className="absolute inset-0 bg-gradient-to-br from-white via-white/80 to-transparent"></div>

        <div className="relative z-10 p-10 h-full flex flex-col justify-between">
          <div className="max-w-md">
            <h3 className="text-2xl font-black text-on-surface tracking-tight mb-2">Zones de vigilance</h3>
            <p className="text-sm text-slate-500 font-medium leading-relaxed">
              Analyse géo-spatiale des incidents pour identifier les clusters de dysfonctionnement dans les structures de santé nationales.
            </p>
          </div>

          <div className="flex justify-end">
            <div className="bg-white/80 backdrop-blur-md p-6 rounded-2xl border border-white shadow-xl w-72">
              <h4 className="text-[10px] font-black text-primary uppercase tracking-widest mb-4">Incidence par région</h4>
              <div className="space-y-4">
                {[
                  { name: 'Littoral', val: 85 },
                  { name: 'Borgou', val: 42 },
                  { name: 'Ouémé', val: 31 }
                ].map((r, i) => (
                  <div key={i} className="space-y-1.5">
                    <div className="flex justify-between items-center text-[10px] font-bold uppercase">
                      <span>{r.name}</span>
                      <span className="text-primary tabular-nums">{r.val}%</span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all duration-1000"
                        style={{ width: `${r.val}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Mock pulsing dots on "map" */}
        <div className="absolute top-1/4 left-1/2 w-4 h-4 bg-primary/20 rounded-full flex items-center justify-center">
          <div className="w-2 h-2 bg-primary rounded-full animate-ping"></div>
        </div>
        <div className="absolute bottom-1/3 left-1/3 w-4 h-4 bg-error/20 rounded-full flex items-center justify-center">
          <div className="w-2 h-2 bg-error rounded-full animate-ping"></div>
        </div>
      </section>

    </div>
  )
}
