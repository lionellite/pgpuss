import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { complaintsAPI } from '../../api'
import StatusBadge from '../../components/StatusBadge'
import PriorityBadge from '../../components/PriorityBadge'

export default function MesPlaintesPage() {
  const [complaints, setComplaints] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  useEffect(() => {
    setLoading(true)
    complaintsAPI.list({ search, status: statusFilter || undefined })
      .then(({ data }) => setComplaints(data.results || data))
      .catch(() => setComplaints([]))
      .finally(() => setLoading(false))
  }, [search, statusFilter])

  return (
    <div className="py-8 space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-on-surface tracking-tight">Mes plaintes</h1>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Historique de vos signalements</p>
        </div>
        <Link to="/espace/deposer" className="btn btn-primary px-6">
          <span className="material-symbols-outlined mr-2">add_circle</span>
          Nouvelle plainte
        </Link>
      </header>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-center bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
        <div className="relative flex-1 min-w-[240px]">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">search</span>
          <input
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border-none rounded-lg text-sm focus:ring-2 focus:ring-primary transition-all"
            placeholder="Rechercher par ticket ou titre..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select
          className="form-select text-sm py-2 bg-white border-slate-200 rounded-lg focus:ring-primary min-w-[180px]"
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
        >
          <option value="">Tous les statuts</option>
          <option value="DEPOSEE">Déposée</option>
          <option value="AFFECTEE">Affectée</option>
          <option value="EN_INSTRUCTION">En instruction</option>
          <option value="RESOLUE">Résolue</option>
          <option value="CLOTURE_PROVISOIRE">Clôture provisoire</option>
          <option value="CONTESTEE">Contestée</option>
        </select>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <span className="material-symbols-outlined animate-spin text-primary text-4xl">progress_activity</span>
        </div>
      ) : complaints.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-20 text-center">
          <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-4xl">inventory_2</span>
          </div>
          <h3 className="text-lg font-bold text-on-surface mb-1">Aucune plainte trouvée</h3>
          <p className="text-sm text-slate-400 mb-8 max-w-xs mx-auto">
            Vous n'avez pas encore de dossier correspondant à vos critères de recherche.
          </p>
          <Link to="/espace/deposer" className="btn btn-primary px-8">Déposer ma première plainte</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {complaints.map(c => (
            <Link key={c.id} to={`/espace/plaintes/${c.id}`} className="group">
              <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-primary/20 transition-all flex flex-col md:flex-row md:items-center gap-4">
                <div className="bg-primary/5 text-primary p-3 rounded-xl group-hover:bg-primary group-hover:text-white transition-colors">
                  <span className="material-symbols-outlined">description</span>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="font-mono text-xs font-bold text-primary">#{c.ticket_number}</span>
                    <span className="text-[10px] text-slate-300">•</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                      {new Date(c.created_at).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-on-surface truncate group-hover:text-primary transition-colors">{c.title}</h4>
                  <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-tight truncate">
                    {c.establishment_name || 'Établissement non spécifié'}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3 md:border-l md:pl-6 border-slate-50">
                  <StatusBadge status={c.status} />
                  <PriorityBadge priority={c.priority} />
                  <span className="material-symbols-outlined text-slate-200 group-hover:text-primary transition-colors group-hover:translate-x-1 duration-300">
                    chevron_right
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
