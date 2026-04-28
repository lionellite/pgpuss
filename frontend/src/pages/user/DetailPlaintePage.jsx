import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { complaintsAPI, analyticsAPI } from '../../api'
import StatusBadge from '../../components/StatusBadge'
import PriorityBadge from '../../components/PriorityBadge'
import toast from 'react-hot-toast'

export default function DetailPlaintePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [complaint, setComplaint] = useState(null)
  const [loading, setLoading] = useState(true)
  const [contestReason, setContestReason] = useState('')
  const [showContest, setShowContest] = useState(false)
  const [showSatisfaction, setShowSatisfaction] = useState(false)
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')

  useEffect(() => {
    complaintsAPI.detail(id)
      .then(({ data }) => setComplaint(data))
      .catch(() => navigate('/espace/plaintes'))
      .finally(() => setLoading(false))
  }, [id, navigate])

  const handleContest = async () => {
    try {
      await complaintsAPI.contest(id, { reason: contestReason })
      toast.success('Votre contestation a été transmise')
      setShowContest(false)
      const { data } = await complaintsAPI.detail(id)
      setComplaint(data)
    } catch { toast.error('Erreur lors de la contestation') }
  }

  const handleSatisfaction = async () => {
    try {
      await analyticsAPI.submitSatisfaction({ complaint: id, rating, comment })
      toast.success('Merci pour votre évaluation !')
      setShowSatisfaction(false)
    } catch { toast.error('Erreur lors de la soumission') }
  }

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-20">
      <span className="material-symbols-outlined animate-spin text-primary text-4xl">progress_activity</span>
    </div>
  )
  if (!complaint) return null

  const canContest = complaint.status === 'CLOTURE_PROVISOIRE'
  const canRate = ['CLOTURE_PROVISOIRE', 'CLOTURE_DEFINITIVE', 'RESOLUE'].includes(complaint.status)

  return (
    <div className="py-8 space-y-6 animate-in fade-in duration-500 max-w-5xl mx-auto">
      <header className="flex items-center">
        <button
          onClick={() => navigate('/espace/plaintes')}
          className="flex items-center text-xs font-bold text-slate-400 hover:text-primary transition-colors uppercase tracking-widest"
        >
          <span className="material-symbols-outlined text-lg mr-2">arrow_back</span>
          Retour à mes plaintes
        </button>
      </header>

      {/* Hero Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-8 md:p-10">
          <div className="flex flex-wrap items-center justify-between gap-6 mb-8">
            <div className="flex items-center space-x-4">
              <div className="bg-primary/5 text-primary p-4 rounded-2xl">
                <span className="material-symbols-outlined text-4xl">receipt_long</span>
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Ticket de suivi</p>
                <h1 className="text-3xl font-black text-on-surface tracking-tighter">{complaint.ticket_number}</h1>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <StatusBadge status={complaint.status} />
              <PriorityBadge priority={complaint.priority} />
            </div>
          </div>

          <h2 className="text-xl font-bold text-on-surface mb-8 leading-tight">{complaint.title}</h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-8 border-t border-slate-50">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Structure</p>
              <p className="text-sm font-bold text-on-surface">{complaint.establishment_name}</p>
              <p className="text-[10px] text-slate-400 uppercase mt-0.5">{complaint.service_name || 'Service non spécifié'}</p>
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Thématique</p>
              <p className="text-sm font-bold text-on-surface">{complaint.category_name}</p>
              <p className="text-[10px] text-slate-400 uppercase mt-0.5">Canal: {complaint.channel_display}</p>
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Dépôt</p>
              <p className="text-sm font-bold text-on-surface">{new Date(complaint.created_at).toLocaleDateString('fr-FR')}</p>
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Traitement</p>
              <p className="text-sm font-bold text-primary">{complaint.assigned_to_name || 'En attente d\'affectation'}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          <section className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center">
              <span className="material-symbols-outlined text-primary mr-3">notes</span>
              Détails de votre signalement
            </h3>
            <p className="text-sm text-on-surface-variant leading-relaxed whitespace-pre-wrap">
              {complaint.description}
            </p>
          </section>

          {complaint.resolution_notes && (
            <section className="bg-secondary/5 p-8 rounded-2xl border border-secondary/10 animate-in zoom-in duration-500">
              <h3 className="text-xs font-black text-secondary uppercase tracking-[0.2em] mb-6 flex items-center">
                <span className="material-symbols-outlined mr-3 text-secondary">check_circle</span>
                Réponse de l'administration
              </h3>
              <div className="space-y-4">
                <p className="text-sm font-medium text-on-surface leading-relaxed italic bg-white/50 p-4 rounded-xl">
                  "{complaint.resolution_notes}"
                </p>
                {complaint.corrective_actions && (
                  <div className="pt-4 border-t border-secondary/10">
                    <p className="text-[10px] font-black text-secondary uppercase tracking-widest mb-2">Mesures prises</p>
                    <p className="text-xs text-slate-500 leading-relaxed">{complaint.corrective_actions}</p>
                  </div>
                )}
              </div>
            </section>
          )}

          <div className="flex flex-wrap gap-4">
            {canContest && (
              <button
                className="btn border-error text-error hover:bg-error hover:text-white px-6 py-3 text-xs font-black uppercase tracking-widest flex items-center shadow-lg shadow-error/10 transition-all"
                onClick={() => setShowContest(true)}
              >
                <span className="material-symbols-outlined mr-2">feedback</span>
                Contester la clôture
              </button>
            )}
            {canRate && (
              <button
                className="btn btn-primary px-6 py-3 text-xs font-black uppercase tracking-widest flex items-center shadow-lg shadow-primary/20 transition-all"
                onClick={() => setShowSatisfaction(true)}
              >
                <span className="material-symbols-outlined mr-2">grade</span>
                Évaluer le service
              </button>
            )}
          </div>
        </div>

        {/* Right Column: History */}
        <aside className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-8 flex items-center">
            <span className="material-symbols-outlined text-primary mr-3">history</span>
            Suivi des étapes
          </h3>
          <div className="relative space-y-8 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100">
            {complaint.history?.length > 0 ? (
              [...complaint.history].reverse().map((h, i) => (
                <div key={i} className="relative pl-10">
                  <div className={`absolute left-0 top-1 w-6 h-6 rounded-full border-4 border-white flex items-center justify-center z-10 shadow-sm ${
                    i === 0 ? 'bg-primary text-white animate-pulse' : 'bg-slate-100 text-slate-400'
                  }`}>
                    <span className="material-symbols-outlined text-[8px]">
                      {i === 0 ? 'radio_button_checked' : 'check'}
                    </span>
                  </div>
                  <p className="text-[10px] font-black text-slate-300 uppercase tracking-tighter tabular-nums mb-1">
                    {new Date(h.timestamp).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </p>
                  <p className={`text-xs font-bold ${i === 0 ? 'text-on-surface' : 'text-slate-500'}`}>{h.action}</p>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 italic">Aucune étape enregistrée.</p>
            )}
          </div>
        </aside>
      </div>

      {/* Contest Modal */}
      {showContest && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <header className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-error/5">
              <h3 className="font-bold text-error">Contester la clôture</h3>
              <button onClick={() => setShowContest(false)} className="text-slate-400 hover:text-error">
                <span className="material-symbols-outlined">close</span>
              </button>
            </header>
            <div className="p-6">
              <p className="text-xs font-medium text-slate-500 leading-relaxed mb-4">
                Si vous estimez que votre problème n'a pas été résolu de manière satisfaisante, expliquez-en les raisons ci-dessous.
              </p>
              <textarea
                className="form-textarea w-full text-sm min-h-[120px]"
                value={contestReason}
                onChange={e => setContestReason(e.target.value)}
                placeholder="Précisez votre motif de contestation..."
              />
            </div>
            <footer className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end space-x-3">
              <button onClick={() => setShowContest(false)} className="px-4 py-2 text-xs font-bold text-slate-400 uppercase tracking-widest">Annuler</button>
              <button onClick={handleContest} className="btn bg-error text-white px-6 py-2 text-xs font-black uppercase tracking-widest shadow-lg shadow-error/20">Transmettre</button>
            </footer>
          </div>
        </div>
      )}

      {/* Satisfaction Modal */}
      {showSatisfaction && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <header className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-secondary/5">
              <h3 className="font-bold text-secondary">Évaluer le traitement</h3>
              <button onClick={() => setShowSatisfaction(false)} className="text-slate-400 hover:text-secondary">
                <span className="material-symbols-outlined">close</span>
              </button>
            </header>
            <div className="p-8 text-center">
              <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-6">Note de satisfaction</p>
              <div className="flex justify-center space-x-2 mb-8">
                {[1, 2, 3, 4, 5].map(n => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setRating(n)}
                    className={`material-symbols-outlined text-4xl transition-all ${
                      n <= rating ? 'text-secondary font-fill scale-125' : 'text-slate-200'
                    }`}
                    style={{ fontVariationSettings: n <= rating ? "'FILL' 1" : "'FILL' 0" }}
                  >
                    grade
                  </button>
                ))}
              </div>
              <p className="text-xs font-bold text-secondary uppercase tracking-widest mb-6">
                {['', 'Très insatisfait', 'Insatisfait', 'Neutre', 'Satisfait', 'Très satisfait'][rating]}
              </p>
              <textarea
                className="form-textarea w-full text-sm"
                value={comment}
                onChange={e => setComment(e.target.value)}
                placeholder="Un commentaire pour nous aider à nous améliorer ? (Optionnel)"
              />
            </div>
            <footer className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end space-x-3">
              <button onClick={() => setShowSatisfaction(false)} className="px-4 py-2 text-xs font-bold text-slate-400 uppercase tracking-widest">Plus tard</button>
              <button onClick={handleSatisfaction} className="btn btn-secondary px-8 py-2 text-xs font-black uppercase tracking-widest shadow-lg shadow-secondary/20">Envoyer</button>
            </footer>
          </div>
        </div>
      )}
    </div>
  )
}
