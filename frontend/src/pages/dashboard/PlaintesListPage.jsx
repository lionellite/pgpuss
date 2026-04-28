import React, { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { complaintsAPI } from '../../api'
import StatusBadge from '../../components/StatusBadge'
import PriorityBadge from '../../components/PriorityBadge'

export default function PlaintesListPage() {
  const [complaints, setComplaints] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [count, setCount] = useState(0)
  const [filters, setFilters] = useState({ search: '', status: '', priority: '', channel: '' })
  const PAGE_SIZE = 20

  const load = useCallback(() => {
    setLoading(true)
    complaintsAPI.list({
      search: filters.search || undefined,
      status: filters.status || undefined,
      priority: filters.priority || undefined,
      channel: filters.channel || undefined,
      page,
      page_size: PAGE_SIZE,
    }).then(({ data }) => {
      setComplaints(data.results || data)
      setCount(data.count || (data.results || data).length)
    }).catch(() => setComplaints([]))
    .finally(() => setLoading(false))
  }, [filters, page])

  useEffect(() => { load() }, [load])

  const setFilter = (key, val) => { setFilters(f => ({ ...f, [key]: val })); setPage(1) }

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-on-surface tracking-tight">File d'attente globale</h1>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
            {count} dossier(s) à traiter
          </p>
        </div>
        <button
          className="flex items-center space-x-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold text-on-surface hover:bg-slate-50 transition-colors"
          onClick={load}
        >
          <span className="material-symbols-outlined text-lg">refresh</span>
          <span>Actualiser</span>
        </button>
      </header>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="relative flex-1 min-w-[240px]">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">search</span>
            <input
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border-none rounded-lg text-sm focus:ring-2 focus:ring-primary transition-all"
              placeholder="Rechercher par ticket, titre..."
              value={filters.search}
              onChange={e => setFilter('search', e.target.value)}
            />
          </div>

          <select
            className="form-select text-sm py-2 bg-white border-slate-200 rounded-lg focus:ring-primary min-w-[160px]"
            value={filters.status}
            onChange={e => setFilter('status', e.target.value)}
          >
            <option value="">Tous les statuts</option>
            {['SOUMISE','ACCUSEE','INSTRUITE','AFFECTEE','EN_TRAITEMENT','RESOLUE','ARBITREE','CLOTUREE','ESCALADEE'].map(s => (
              <option key={s} value={s}>{s.replace(/_/g,' ')}</option>
            ))}
          </select>

          <select
            className="form-select text-sm py-2 bg-white border-slate-200 rounded-lg focus:ring-primary min-w-[140px]"
            value={filters.priority}
            onChange={e => setFilter('priority', e.target.value)}
          >
            <option value="">Priorités</option>
            {['P1','P2','P3','P4','P5'].map(p => <option key={p} value={p}>{p}</option>)}
          </select>

          <select
            className="form-select text-sm py-2 bg-white border-slate-200 rounded-lg focus:ring-primary min-w-[140px]"
            value={filters.channel}
            onChange={e => setFilter('channel', e.target.value)}
          >
            <option value="">Canaux</option>
            {['WEB','MOBILE','SMS','CHATBOT','GUICHET'].map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <span className="material-symbols-outlined animate-spin text-primary text-4xl">progress_activity</span>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Chargement des dossiers...</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">Dossier</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">Objet / Catégorie</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">Établissement</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">Statut</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">Urgence</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">Canal</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {complaints.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-20 text-center">
                      <span className="material-symbols-outlined text-4xl text-slate-200 mb-2">inventory_2</span>
                      <p className="text-sm font-medium text-slate-400">Aucun dossier trouvé pour ces critères.</p>
                    </td>
                  </tr>
                ) : complaints.map(c => (
                  <tr key={c.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="font-mono text-xs font-bold text-primary mr-2">#{c.ticket_number}</span>
                        {c.is_overdue && (
                          <span className="w-2 h-2 rounded-full bg-error animate-pulse" title="En retard"></span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1 tabular-nums">
                        {new Date(c.created_at).toLocaleDateString('fr-FR')}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="max-w-[200px]">
                        <p className="text-sm font-bold text-on-surface truncate leading-tight">{c.title}</p>
                        <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-tight">{c.category_name}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-xs font-medium text-on-surface-variant max-w-[150px] truncate">
                        {c.establishment_name || '—'}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={c.status} />
                    </td>
                    <td className="px-6 py-4">
                      <PriorityBadge priority={c.priority} />
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 text-slate-500 rounded uppercase">
                        {c.channel_display}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        to={`/dashboard/plaintes/${c.id}`}
                        className="inline-flex items-center px-3 py-1 bg-primary/5 text-primary hover:bg-primary hover:text-white rounded-lg transition-all text-xs font-bold"
                      >
                        <span className="material-symbols-outlined text-sm mr-1.5">visibility</span>
                        Détails
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {count > PAGE_SIZE && (
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                Affichage {(page-1)*PAGE_SIZE+1}-{Math.min(page*PAGE_SIZE, count)} sur {count}
              </p>
              <div className="flex space-x-2">
                <button
                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white transition-colors border border-transparent hover:border-slate-200 disabled:opacity-30"
                  onClick={() => setPage(p => p - 1)}
                  disabled={page === 1}
                >
                  <span className="material-symbols-outlined text-sm">chevron_left</span>
                </button>
                <div className="px-3 flex items-center justify-center bg-white border border-slate-200 rounded-lg text-xs font-bold text-primary">
                  {page}
                </div>
                <button
                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white transition-colors border border-transparent hover:border-slate-200 disabled:opacity-30"
                  onClick={() => setPage(p => p + 1)}
                  disabled={page >= Math.ceil(count / PAGE_SIZE)}
                >
                  <span className="material-symbols-outlined text-sm">chevron_right</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
