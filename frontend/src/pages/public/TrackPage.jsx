import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { complaintsAPI } from '../../api'
import toast from 'react-hot-toast'
import StatusBadge from '../../components/StatusBadge'
import PriorityBadge from '../../components/PriorityBadge'

export default function TrackPage() {
  const [searchParams] = useSearchParams()
  const [ticket, setTicket] = useState(searchParams.get('ticket') || '')
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (searchParams.get('ticket')) {
      handleSearch()
    }
  }, [])

  const handleSearch = async (e) => {
    if (e) e.preventDefault()
    if (!ticket.trim()) return
    setLoading(true); setError(''); setResult(null)
    try {
      const { data } = await complaintsAPI.track(ticket.trim().toUpperCase())
      setResult(data)
    } catch {
      setError('Aucune plainte trouvée avec ce numéro de ticket. Vérifiez et réessayez.')
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    toast.success('Numéro de ticket copié !')
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="py-20 min-h-[80vh] bg-surface">
      <div className="max-w-3xl mx-auto px-6">
        <header className="text-center mb-12">
          <h1 className="text-3xl font-black text-on-surface mb-3 tracking-tight">Suivre l'avancement</h1>
          <p className="text-on-surface-variant max-w-lg mx-auto">
            Consultez en temps réel le statut de traitement de votre dossier grâce à votre numéro de ticket.
          </p>
        </header>

        {/* Search form */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 mb-10">
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">search</span>
              <input
                className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-xl text-lg font-mono font-bold tracking-widest focus:ring-2 focus:ring-primary transition-all placeholder:text-slate-300 placeholder:font-sans placeholder:tracking-normal placeholder:font-normal"
                value={ticket}
                onChange={e => setTicket(e.target.value)}
                placeholder="EX: PGP-2024-XXXX"
              />
            </div>
            <button
              type="submit"
              className="btn btn-primary px-8 py-4 text-sm font-black uppercase tracking-widest shadow-lg shadow-primary/20 disabled:opacity-50"
              disabled={loading}
            >
              {loading ? (
                <span className="material-symbols-outlined animate-spin">progress_activity</span>
              ) : (
                'Rechercher'
              )}
            </button>
          </form>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-error/5 p-4 rounded-xl border border-error/10 flex items-center space-x-3 mb-8 animate-in fade-in slide-in-from-top-2">
            <span className="material-symbols-outlined text-error">error</span>
            <p className="text-xs font-bold text-error uppercase tracking-widest">{error}</p>
          </div>
        )}

        {/* Result */}
        {result && (
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="p-8 md:p-12">
              <div className="flex flex-wrap items-center justify-between gap-6 mb-10">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Dossier identifié</p>
                  <div className="flex items-center space-x-3">
                    <h2 className="text-3xl font-black text-primary tracking-tighter">{result.ticket_number}</h2>
                    <button
                      onClick={() => handleCopy(result.ticket_number)}
                      className="p-2 text-slate-400 hover:text-primary transition-colors hover:bg-slate-50 rounded-lg"
                      title="Copier"
                    >
                      <span className="material-symbols-outlined text-lg">{copied ? 'check' : 'content_copy'}</span>
                    </button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <StatusBadge status={result.status} label={result.status_display} />
                  <PriorityBadge priority={result.priority} label={result.priority_display} />
                </div>
              </div>

              <div className="mb-10">
                <h3 className="text-xl font-bold text-on-surface mb-2">{result.title}</h3>
                <div className="flex flex-wrap gap-x-8 gap-y-2">
                  <p className="text-xs font-medium text-slate-500 flex items-center">
                    <span className="material-symbols-outlined text-sm mr-2">hospital</span>
                    {result.establishment_name || 'Non spécifié'}
                  </p>
                  <p className="text-xs font-medium text-slate-500 flex items-center">
                    <span className="material-symbols-outlined text-sm mr-2">calendar_month</span>
                    Déposé le {new Date(result.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                </div>
              </div>

              {/* Resolution Notes if available */}
              {result.resolution_notes && (
                <div className="bg-secondary/5 p-6 rounded-2xl border border-secondary/10 mb-10">
                  <div className="flex items-center space-x-2 mb-3">
                    <span className="material-symbols-outlined text-secondary text-sm">task_alt</span>
                    <h4 className="text-[10px] font-black text-secondary uppercase tracking-widest">Résolution apportée</h4>
                  </div>
                  <p className="text-sm font-medium text-on-surface leading-relaxed italic">
                    "{result.resolution_notes}"
                  </p>
                </div>
              )}

              {/* Timeline */}
              {result.timeline?.length > 0 && (
                <div className="space-y-6">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-8 flex items-center">
                    <span className="material-symbols-outlined text-sm mr-3">history</span>
                    Journal de traitement
                  </h4>
                  <div className="relative space-y-8 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100">
                    {result.timeline.map((item, i) => (
                      <div key={i} className="relative pl-10">
                        <div className={`absolute left-0 top-1 w-6 h-6 rounded-full border-4 border-white flex items-center justify-center z-10 shadow-sm ${
                          i === 0 ? 'bg-primary text-white animate-pulse' : 'bg-slate-100 text-slate-400'
                        }`}>
                          <span className="material-symbols-outlined text-[8px]">
                            {i === 0 ? 'radio_button_checked' : 'check'}
                          </span>
                        </div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter tabular-nums mb-1">
                          {new Date(item.timestamp).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </p>
                        <p className={`text-xs font-bold ${i === 0 ? 'text-on-surface' : 'text-slate-500'}`}>{item.action}</p>
                        {item.notes && (
                          <p className="mt-2 text-[11px] text-slate-400 leading-relaxed max-w-lg">
                            {item.notes}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <footer className="px-8 py-4 bg-slate-50 border-t border-slate-100 flex justify-center">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Plateforme officielle de suivi — Ministère de la Santé
              </p>
            </footer>
          </div>
        )}

        {/* Info box */}
        {!result && !error && (
          <div className="mt-8 flex flex-col md:flex-row items-center justify-center space-y-4 md:space-y-0 md:space-x-8 text-center md:text-left">
            <div className="flex items-center space-x-3">
              <span className="material-symbols-outlined text-primary">info</span>
              <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Besoin d'aide ?</p>
            </div>
            <p className="text-xs text-slate-400">
              Si vous avez un compte, <a href="/connexion" className="text-primary font-bold underline decoration-primary/30 underline-offset-4">connectez-vous</a> pour gérer toutes vos plaintes.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
