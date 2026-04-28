import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { complaintsAPI, authAPI } from '../../api'
import { useAuth } from '../../contexts/AuthContext'
import StatusBadge from '../../components/StatusBadge'
import PriorityBadge from '../../components/PriorityBadge'
import toast from 'react-hot-toast'

export default function PlainteDetailPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [complaint, setComplaint] = useState(null)
  const [loading, setLoading] = useState(true)
  const [agents, setAgents] = useState([])
  const [modal, setModal] = useState(null) // 'assign' | 'resolve' | 'close' | 'escalate'
  const [formData, setFormData] = useState({})

  const reload = () => {
    complaintsAPI.detail(id).then(({ data }) => setComplaint(data)).catch(() => navigate('/dashboard/plaintes'))
  }
  useEffect(() => {
    reload()
    setLoading(false)
  }, [id])

  useEffect(() => {
    authAPI.users().then(({ data }) => setAgents(data.results || data)).catch(() => {})
  }, [])

  const doAction = async (action, payload) => {
    try {
      if (action === 'assign') await complaintsAPI.assign(id, payload)
      else if (action === 'start') await complaintsAPI.start(id)
      else if (action === 'resolve') await complaintsAPI.resolve(id, payload)
      else if (action === 'close') await complaintsAPI.close(id, payload)
      else if (action === 'escalate') await complaintsAPI.escalate(id, payload)
      toast.success('Action effectuée avec succès')
      setModal(null)
      setFormData({})
      reload()
    } catch { toast.error("Erreur lors de l'action") }
  }

  if (!complaint && loading) return (
    <div className="flex flex-col items-center justify-center py-20">
      <span className="material-symbols-outlined animate-spin text-primary text-4xl">progress_activity</span>
    </div>
  )
  if (!complaint) return null

  const canAssign = ['AGENT_RECEPTION','GESTIONNAIRE_SERVICE','ADMIN_NATIONAL','DIRECTEUR'].includes(user?.role)
  const canResolve = ['AGENT_RECEPTION','GESTIONNAIRE_SERVICE','ADMIN_NATIONAL','DIRECTEUR','MEDIATEUR'].includes(user?.role)
  const canClose = canResolve
  const canEscalate = ['AGENT_RECEPTION','GESTIONNAIRE_SERVICE','ADMIN_NATIONAL'].includes(user?.role)

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <header className="flex items-center justify-between">
        <button
          onClick={() => navigate('/dashboard/plaintes')}
          className="flex items-center text-xs font-bold text-slate-400 hover:text-primary transition-colors uppercase tracking-widest"
        >
          <span className="material-symbols-outlined text-lg mr-2">arrow_back</span>
          Retour à la liste
        </button>
        <div className="flex space-x-2">
          <button className="p-2 text-slate-400 hover:text-primary transition-colors">
            <span className="material-symbols-outlined">print</span>
          </button>
          <button className="p-2 text-slate-400 hover:text-primary transition-colors">
            <span className="material-symbols-outlined">share</span>
          </button>
        </div>
      </header>

      {/* Main Info Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 md:p-8 border-b border-slate-50">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div className="flex items-center space-x-4">
              <div className="bg-primary/10 text-primary p-3 rounded-xl">
                <span className="material-symbols-outlined text-3xl">assignment</span>
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Dossier Ticket</p>
                <h1 className="text-2xl font-black text-on-surface tracking-tighter">#{complaint.ticket_number}</h1>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <StatusBadge status={complaint.status} />
              <PriorityBadge priority={complaint.priority} />
              {complaint.is_overdue && (
                <span className="bg-error text-white text-[10px] font-black px-2 py-0.5 rounded-full uppercase">En retard</span>
              )}
            </div>
          </div>

          <h2 className="text-xl font-bold text-on-surface mb-6 leading-tight">{complaint.title}</h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Établissement</p>
              <p className="text-sm font-bold text-on-surface">{complaint.establishment_name}</p>
              <p className="text-[10px] text-slate-400 uppercase">{complaint.service_name || 'Service non spécifié'}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Catégorie</p>
              <p className="text-sm font-bold text-on-surface">{complaint.category_name}</p>
              <p className="text-[10px] text-slate-400 uppercase">Canal: {complaint.channel_display}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Plaignant</p>
              <p className="text-sm font-bold text-on-surface">{complaint.complainant_display}</p>
              <p className="text-[10px] text-slate-400 uppercase">Depuis le {new Date(complaint.created_at).toLocaleDateString('fr-FR')}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Agent Assigné</p>
              <p className="text-sm font-bold text-primary">{complaint.assigned_to_name || 'Non assigné'}</p>
            </div>
          </div>
        </div>

        {/* Action Bar */}
        <div className="px-8 py-4 bg-slate-50 flex flex-wrap gap-3">
          {canAssign && (
            <button className="btn btn-primary px-4 py-2 text-xs" onClick={() => setModal('assign')}>
              <span className="material-symbols-outlined text-sm mr-2">person_add</span>
              Affecter
            </button>
          )}
          {canResolve && (complaint.status === 'AFFECTEE' || complaint.status === 'CLASSIFIEE') && (
            <button className="btn btn-primary px-4 py-2 text-xs" onClick={() => doAction('start')}>
              <span className="material-symbols-outlined text-sm mr-2">play_arrow</span>
              Démarrer l'instruction
            </button>
          )}
          {canResolve && complaint.status === 'EN_INSTRUCTION' && (
            <button className="btn btn-outline border-secondary text-secondary hover:bg-secondary hover:text-white px-4 py-2 text-xs" onClick={() => setModal('resolve')}>
              <span className="material-symbols-outlined text-sm mr-2">check_circle</span>
              Résoudre
            </button>
          )}
          {canClose && complaint.status === 'RESOLUE' && (
            <button className="btn btn-outline border-slate-400 text-slate-600 hover:bg-slate-600 hover:text-white px-4 py-2 text-xs" onClick={() => setModal('close')}>
              <span className="material-symbols-outlined text-sm mr-2">lock</span>
              Clôturer
            </button>
          )}
          {canEscalate && ['EN_INSTRUCTION','AFFECTEE'].includes(complaint.status) && (
            <button className="btn btn-outline border-error text-error hover:bg-error hover:text-white px-4 py-2 text-xs" onClick={() => setModal('escalate')}>
              <span className="material-symbols-outlined text-sm mr-2">priority_high</span>
              Escalader
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Description & Resolution */}
        <div className="lg:col-span-2 space-y-6">
          <section className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center">
              <span className="material-symbols-outlined text-primary mr-3">subject</span>
              Description du dossier
            </h3>
            <div className="prose prose-slate max-w-none">
              <p className="text-on-surface-variant leading-relaxed whitespace-pre-wrap text-sm">
                {complaint.description}
              </p>
            </div>

            {complaint.attachments?.length > 0 && (
              <div className="mt-8 pt-8 border-t border-slate-50">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Pièces jointes</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {complaint.attachments.map((a, i) => (
                    <a key={i} href={a.file} target="_blank" rel="noreferrer" className="flex items-center p-3 bg-slate-50 rounded-xl border border-slate-100 hover:border-primary transition-colors group">
                      <span className="material-symbols-outlined text-primary mr-3">attach_file</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-on-surface truncate">{a.file_name}</p>
                        <p className="text-[10px] text-slate-400">{(a.file_size / 1024).toFixed(0)} Ko</p>
                      </div>
                      <span className="material-symbols-outlined text-slate-300 group-hover:text-primary transition-colors">download</span>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </section>

          {complaint.resolution_notes && (
            <section className="bg-secondary/5 p-8 rounded-2xl border border-secondary/10">
              <h3 className="text-xs font-black text-secondary uppercase tracking-[0.2em] mb-6 flex items-center">
                <span className="material-symbols-outlined mr-3 text-secondary">task_alt</span>
                Solution Apportée
              </h3>
              <div className="space-y-4">
                <p className="text-sm text-on-surface leading-relaxed font-medium">
                  {complaint.resolution_notes}
                </p>
                {complaint.corrective_actions && (
                  <div className="mt-4 p-4 bg-white/50 rounded-xl">
                    <p className="text-[10px] font-black text-secondary uppercase tracking-widest mb-1">Mesures correctives</p>
                    <p className="text-xs text-on-surface-variant italic">{complaint.corrective_actions}</p>
                  </div>
                )}
              </div>
            </section>
          )}
        </div>

        {/* Right Column: History & Timeline */}
        <aside className="space-y-6">
          <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center">
              <span className="material-symbols-outlined text-primary mr-3">history</span>
              Journal d'activités
            </h3>
            <div className="relative space-y-6 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100">
              {complaint.history?.length > 0 ? (
                [...complaint.history].reverse().map((h, i) => (
                  <div key={i} className="relative pl-8">
                    <div className={`absolute left-0 top-1 w-6 h-6 rounded-full border-4 border-white flex items-center justify-center z-10 ${
                      i === 0 ? 'bg-primary text-white' : 'bg-slate-200 text-slate-500'
                    }`}>
                      <span className="material-symbols-outlined text-[10px]">
                        {i === 0 ? 'adjust' : 'circle'}
                      </span>
                    </div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter tabular-nums">
                      {new Date(h.timestamp).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </p>
                    <p className="text-xs font-bold text-on-surface mt-0.5">{h.action}</p>
                    {h.actor_name && (
                      <p className="text-[10px] font-bold text-primary mt-1">Agent: {h.actor_name}</p>
                    )}
                    {h.notes && (
                      <p className="mt-2 text-[11px] text-slate-500 bg-slate-50 p-2 rounded leading-relaxed border-l-2 border-slate-200">
                        {h.notes}
                      </p>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 italic text-center py-4">Aucun historique disponible</p>
              )}
            </div>
          </section>
        </aside>
      </div>

      {/* Modals */}
      {modal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <header className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-on-surface">
                {modal === 'assign' && 'Affecter le dossier'}
                {modal === 'resolve' && 'Résoudre la plainte'}
                {modal === 'close' && 'Clôturer provisoirement'}
                {modal === 'escalate' && 'Escalader le dossier'}
              </h3>
              <button onClick={() => setModal(null)} className="text-slate-400 hover:text-error transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </header>

            <div className="p-6 space-y-4">
              {modal === 'assign' && (
                <>
                  <div className="form-group">
                    <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">Assigner à</label>
                    <select className="form-select w-full" value={formData.assigned_to || ''}
                      onChange={e => setFormData(d => ({ ...d, assigned_to: e.target.value }))}>
                      <option value="">Sélectionnez un agent</option>
                      {agents.filter(a => a.role !== 'USAGER').map(a => (
                        <option key={a.id} value={a.id}>{a.full_name} ({a.role})</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">Instructions (optionnel)</label>
                    <textarea className="form-textarea w-full text-sm" placeholder="Consignes particulières..."
                      value={formData.notes || ''} onChange={e => setFormData(d => ({ ...d, notes: e.target.value }))} />
                  </div>
                </>
              )}

              {modal === 'resolve' && (
                <>
                  <div className="form-group">
                    <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">Notes de résolution *</label>
                    <textarea className="form-textarea w-full text-sm min-h-[100px]" placeholder="Détaillez la solution..."
                      value={formData.resolution_notes || ''} onChange={e => setFormData(d => ({ ...d, resolution_notes: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">Actions correctives (optionnel)</label>
                    <textarea className="form-textarea w-full text-sm" placeholder="Mesures pour l'avenir..."
                      value={formData.corrective_actions || ''} onChange={e => setFormData(d => ({ ...d, corrective_actions: e.target.value }))} />
                  </div>
                </>
              )}

              {modal === 'close' && (
                <>
                  <div className="bg-blue-50 p-4 rounded-xl mb-4">
                    <p className="text-xs text-blue-800 font-medium">
                      La clôture provisoire notifie l'usager. Il dispose de 15 jours pour contester avant la clôture définitive.
                    </p>
                  </div>
                  <div className="form-group">
                    <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">Commentaire final</label>
                    <textarea className="form-textarea w-full text-sm" placeholder="Dernière note avant clôture..."
                      value={formData.notes || ''} onChange={e => setFormData(d => ({ ...d, notes: e.target.value }))} />
                  </div>
                </>
              )}

              {modal === 'escalate' && (
                <>
                  <div className="form-group">
                    <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">Escalader vers</label>
                    <select className="form-select w-full" value={formData.to_user || ''}
                      onChange={e => setFormData(d => ({ ...d, to_user: e.target.value }))}>
                      <option value="">Sélectionnez un responsable</option>
                      {agents.filter(a => ['DIRECTEUR','RESPONSABLE_QUALITE','ADMIN_NATIONAL'].includes(a.role)).map(a => (
                        <option key={a.id} value={a.id}>{a.full_name} ({a.role})</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">Motif de l'escalade</label>
                    <textarea className="form-textarea w-full text-sm" placeholder="Pourquoi ce dossier nécessite-t-il un niveau supérieur ?"
                      value={formData.reason || ''} onChange={e => setFormData(d => ({ ...d, reason: e.target.value }))} />
                  </div>
                </>
              )}
            </div>

            <footer className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end space-x-3">
              <button onClick={() => setModal(null)} className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-on-surface transition-colors uppercase tracking-widest">
                Annuler
              </button>
              <button
                className={`btn px-6 py-2 text-xs ${modal === 'escalate' ? 'btn-danger' : 'btn-primary'}`}
                onClick={() => {
                  if (modal === 'assign') doAction('assign', formData)
                  if (modal === 'resolve') doAction('resolve', formData)
                  if (modal === 'close') doAction('close', formData)
                  if (modal === 'escalate') doAction('escalate', formData)
                }}
              >
                Confirmer l'action
              </button>
            </footer>
          </div>
        </div>
      )}
    </div>
  )
}
