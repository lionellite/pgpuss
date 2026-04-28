import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { complaintsAPI } from '../../api'
import { FiSearch, FiClock, FiAlertCircle, FiCopy, FiCheck } from 'react-icons/fi'
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

          <div className="glass-card" style={{ padding: '2rem', marginBottom: '2rem', border: '1px solid #ddd', boxShadow: 'none' }}>
            <form onSubmit={handleSearch} style={{ display: 'flex', gap: '0.75rem' }}>
              <div style={{ flex: 1, position: 'relative' }}>
                <label htmlFor="ticket-input" className="sr-only">Numéro de ticket</label>
                <FiSearch aria-hidden="true" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#666' }} />
                <input
                  id="ticket-input"
                  className="form-input"
                  style={{ paddingLeft: '2.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}
                  value={ticket}
                  onChange={e => setTicket(e.target.value)}
                  placeholder="PGP-2026-AB1234"
                />
              </div>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? '...' : 'RECHERCHER'}
              </button>
            </form>
          </div>

          {error && (
            <div className="alert alert-danger" role="alert" style={{ marginBottom: '1.5rem' }}>
              <FiAlertCircle style={{ flexShrink: 0 }} aria-hidden="true" />
              {error}
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

          {result && (
            <div className="glass-card" style={{ padding: '2.5rem', border: '1px solid #ddd', boxShadow: 'none' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Dossier identifié</p>
                  <div className="flex items-center space-x-3">
                    <h2 className="text-3xl font-black text-primary tracking-tighter">{result.ticket_number}</h2>
                    <button
                      onClick={() => handleCopy(result.ticket_number)}
                      aria-label="Copier le numéro de ticket"
                      style={{
                        background: '#f1f1f1', border: '1px solid #ccc',
                        color: '#333', borderRadius: '4px', padding: '0.35rem', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'all 0.2s',
                      }}
                    >
                      {copied ? <FiCheck size={14} aria-hidden="true" /> : <FiCopy size={14} aria-hidden="true" />}
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

              {result.timeline?.length > 0 && (
                <div>
                  <h4 style={{ fontWeight: 600, fontSize: '0.875rem', color: '#666', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Historique du traitement
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

          {!result && !error && (
            <div className="alert alert-info">
              <FiClock style={{ flexShrink: 0 }} aria-hidden="true" />
              <div>
                <strong>Vous n'avez pas de numéro de ticket ?</strong> Si vous avez déposé une plainte avec un compte,
                <a href="/connexion" style={{ color: 'var(--color-primary)', marginLeft: '0.25rem' }}>connectez-vous</a> pour accéder directement à vos plaintes.
              </div>
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
