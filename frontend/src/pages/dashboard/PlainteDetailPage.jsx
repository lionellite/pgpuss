import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useParams, useNavigate } from 'react-router-dom'
import { complaintsAPI, authAPI } from '../../api'
import { useAuth } from '../../contexts/AuthContext'
import StatusBadge from '../../components/StatusBadge'
import PriorityBadge from '../../components/PriorityBadge'
import ComplaintDocumentsEditor from '../../components/ComplaintDocumentsEditor'
import toast from 'react-hot-toast'
import { FiArrowLeft, FiUser, FiCheckCircle, FiLock, FiArrowUp, FiFileText, FiShield, FiXCircle, FiClock, FiBookOpen } from 'react-icons/fi'

export default function PlainteDetailPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [complaint, setComplaint] = useState(null)
  const [loading, setLoading] = useState(true)
  const [agents, setAgents] = useState([])
  const [modal, setModal] = useState(null) // actions + docs
  const [formData, setFormData] = useState({})
  const [confirm, setConfirm] = useState(null) // { action, payload, title, message }
  const [showNewAgent, setShowNewAgent] = useState(false)
  const [newAgent, setNewAgent] = useState({ first_name: '', last_name: '', email: '', phone: '', password: '' })

  const reload = () => {
    complaintsAPI.detail(id).then(({ data }) => setComplaint(data)).catch(() => navigate('/dashboard/plaintes'))
  }
  useEffect(() => { reload(); setLoading(false) }, [id])
  useEffect(() => {
    authAPI.users().then(({ data }) => setAgents(data.results || data)).catch(() => {})
  }, [])

  const reloadAgents = () => {
    authAPI.users().then(({ data }) => setAgents(data.results || data)).catch(() => {})
  }

  const createAgent = async () => {
    try {
      const { data } = await authAPI.createUser(newAgent)
      toast.success('Agent créé')
      setShowNewAgent(false)
      setNewAgent({ first_name: '', last_name: '', email: '', phone: '', password: '' })
      reloadAgents()
      if (data?.user?.id) {
        setFormData((prev) => ({ ...prev, assigned_to: data.user.id }))
      }
    } catch (e) {
      const err = e.response?.data
      toast.error(err?.non_field_errors?.[0] || err?.error || err?.email?.[0] || 'Erreur création agent')
    }
  }

  const doAction = async (action, payload) => {
    try {
      if (action === 'acknowledge') await complaintsAPI.acknowledge(id)
      else if (action === 'requestInfo') await complaintsAPI.requestInfo(id, payload)
      else if (action === 'qualify') await complaintsAPI.qualify(id, payload)
      else if (action === 'assign') await complaintsAPI.assign(id, payload)
      else if (action === 'acceptAssignment') await complaintsAPI.acceptAssignment(id, payload)
      else if (action === 'refuseAssignment') await complaintsAPI.refuseAssignment(id, payload)
      else if (action === 'start') await complaintsAPI.startInvestigation(id)
      else if (action === 'investigationLog') await complaintsAPI.investigationLog(id, payload)
      else if (action === 'requestExtension') await complaintsAPI.requestExtension(id, payload)
      else if (action === 'resolve') await complaintsAPI.resolve(id, payload)
      else if (action === 'escalate') await complaintsAPI.escalate(id, payload)
      else if (action === 'validateResolution') await complaintsAPI.validateResolution(id, payload)
      else if (action === 'rejectResolution') await complaintsAPI.rejectResolution(id, payload)
      else if (action === 'ddsAssignInspector') await complaintsAPI.ddsAssignInspector(id, payload)
      else if (action === 'ddsInvestigation') await complaintsAPI.ddsInvestigation(id, payload)
      else if (action === 'notifyParties') await complaintsAPI.notifyParties(id, payload)
      else if (action === 'arbitrate') await complaintsAPI.arbitrate(id, payload)
      else if (action === 'close') await complaintsAPI.close(id)

      toast.success('Action effectuée avec succès')
      setModal(null)
      setFormData({})
      reload()
    } catch (e) {
      const err = e.response?.data
      toast.error(err?.error || err?.detail || err?.non_field_errors?.[0] || "Erreur lors de l'action")
    }
  }

  const askConfirm = (action, payload, title, message) => {
    setModal(null)
    setConfirm({ action, payload: payload || {}, title: title || 'Confirmer', message: message || '' })
  }

  const openActionModal = (name) => {
    setConfirm(null)
    setFormData({})
    if (!name) {
      setModal(null)
      setShowNewAgent(false)
      return
    }
    setModal(name)
  }

  const runConfirmed = async () => {
    if (!confirm) return
    const { action, payload } = confirm
    setConfirm(null)
    await doAction(action, payload)
  }

  const openDocs = () => openActionModal('documents')

  if (!complaint && loading) return <div className="loading-center"><div className="spinner" /></div>
  if (!complaint) return null

  // Permissions Bénin Workflow
  const isPFE = user?.role === 'PFE'
  const isAgent = user?.role === 'AGENT_INTERNE'
  const isRegulateur = ['DDS', 'DQSS', 'CABINET'].includes(user?.role)
  const isDDS = user?.role === 'DDS'
  const isDQSS = ['DQSS', 'CABINET'].includes(user?.role)
  const isDirecteur = user?.role === 'DIRECTEUR_EST'
  const isPFZS = user?.role === 'PFZS'
  const isPNUSS = user?.role === 'PNUSS'
  const isCallCenter = user?.role === 'AGENT_CALL_CENTER'

  return (
    <div style={{ padding: '1rem 0' }}>
      <button onClick={() => navigate('/dashboard/plaintes')} className="btn btn-secondary btn-sm" style={{ marginBottom: '2rem' }}>
        <FiArrowLeft /> RETOUR À LA LISTE
      </button>

      <div className="glass-card" style={{ padding: '2.5rem', marginBottom: '1.5rem', border: '1px solid #ddd', boxShadow: 'none' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
          <div>
            <div style={{ fontSize: '0.7rem', color: '#666', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.25rem' }}>Dossier N°</div>
            <div style={{ fontWeight: 800, fontSize: '1.5rem', color: '#111', letterSpacing: '0.05em' }}>{complaint.ticket_number}</div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <StatusBadge status={complaint.status} />
            <PriorityBadge priority={complaint.priority} />
          </div>
        </div>
        <h1 style={{ fontSize: '1.4rem', marginBottom: '1.5rem', color: '#111' }}>{complaint.title}</h1>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
          {[
            { label: 'Établissement', value: complaint.establishment_name },
            { label: 'Service', value: complaint.service_name || '—' },
            { label: 'Catégorie', value: complaint.category_name },
            { label: 'Canal', value: complaint.channel_display },
            { label: 'Plaignant', value: complaint.complainant_display },
            ...(complaint.call_center_agent_name ? [{ label: 'Agent 136', value: complaint.call_center_agent_name }] : []),
            { label: 'Affecté à', value: complaint.assigned_to_name || 'Non affecté' },
            ...(complaint.zone_sanitaire_name ? [{ label: 'Zone Sanitaire', value: complaint.zone_sanitaire_name }] : []),
            { label: 'Déposée le', value: new Date(complaint.created_at).toLocaleDateString('fr-FR') },
          ].map((item, i) => (
            <div key={i} style={{ padding: '1rem', background: '#f8f9fa', border: '1px solid #eee' }}>
              <div style={{ fontSize: '0.7rem', color: '#666', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.25rem' }}>{item.label}</div>
              <div style={{ fontSize: '0.9rem', color: '#333', fontWeight: 500 }}>{item.value || '—'}</div>
            </div>
          ))}
        </div>

        {/* Workflow Actions */}
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', borderTop: '1px solid #eee', paddingTop: '2rem' }}>

          {/* PFE Actions */}
          {isPFE && complaint.status === 'SOUMISE' && (
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button className="btn btn-primary btn-sm" onClick={() => askConfirm('acknowledge', {}, 'Accuser réception', 'Confirmez-vous l’accusé de réception de cette plainte ?')}>
                Accuser réception
              </button>
              <button className="btn btn-secondary btn-sm" onClick={() => openActionModal('requestInfo')}>
                Demander complément
              </button>
            </div>
          )}
          {isPFE && complaint.status === 'ACCUSEE' && (
            <button className="btn btn-primary btn-sm" onClick={() => openActionModal('qualify')}>
              <FiFileText /> Qualifier
            </button>
          )}
          {isPFE && complaint.status === 'INSTRUITE' && (
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button className="btn btn-primary btn-sm" onClick={() => openActionModal('assign')}>
                <FiUser /> Affecter
              </button>
              <button className="btn btn-secondary btn-sm" onClick={() => askConfirm('start', {}, 'Démarrer le traitement', 'Confirmez-vous le démarrage du traitement (investigation) ?')}>
                Traiter directement
              </button>
              <button className="btn btn-danger btn-sm" onClick={() => openActionModal('escalate')}>
                <FiArrowUp /> Escalader (Zone Sanitaire)
              </button>
            </div>
          )}
          {isPFE && complaint.status === 'RESOLUE' && (
            <button className="btn btn-ghost btn-sm" onClick={() => askConfirm('close', {}, 'Clôturer', 'Confirmez-vous la clôture de ce dossier ?')}>
              <FiLock /> Clôturer
            </button>
          )}

          {/* Agent Actions */}
          {isAgent && complaint.status === 'AFFECTEE' && (
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button className="btn btn-primary btn-sm" onClick={() => askConfirm('acceptAssignment', formData, "Accepter l'affectation", 'Confirmez-vous l’acceptation de cette affectation ?')}>
                <FiCheckCircle /> Accepter l'affectation
              </button>
              <button className="btn btn-danger btn-sm" onClick={() => openActionModal('refuseAssignment')}>
                <FiXCircle /> Refuser / Réorienter
              </button>
              <button className="btn btn-secondary btn-sm" onClick={() => askConfirm('start', {}, 'Démarrer le traitement', 'Confirmez-vous le démarrage du traitement (investigation) ?')}>
                🚀 Démarrer le traitement
              </button>
            </div>
          )}
          {isAgent && complaint.status === 'EN_TRAITEMENT' && (
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button className="btn btn-ghost btn-sm" onClick={() => openActionModal('investigationLog')}>
                <FiBookOpen /> Journal
              </button>
              <button className="btn btn-ghost btn-sm" onClick={() => openActionModal('requestExtension')}>
                <FiClock /> Extension délai
              </button>
              <button className="btn btn-secondary btn-sm" onClick={() => openActionModal('resolve')}>
                <FiCheckCircle /> Soumettre rapport
              </button>
            </div>
          )}

          {/* Direction Actions */}
          {isDirecteur && complaint.status === 'RESOLUE' && (
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button className="btn btn-primary btn-sm" onClick={() => openActionModal('validateResolution')}>
                Valider la résolution
              </button>
              <button className="btn btn-danger btn-sm" onClick={() => openActionModal('rejectResolution')}>
                Rejeter / Renvoyer
              </button>
            </div>
          )}
          {isDirecteur && complaint.status === 'INSTRUITE' && (
            <button className="btn btn-danger btn-sm" onClick={() => openActionModal('escalate')}>
              <FiArrowUp /> Escalader à la DDS
            </button>
          )}

          {/* PFZS — Zone Sanitaire Actions (diag: UC25-UC29) */}
          {isPFZS && ['SOUMISE', 'ACCUSEE', 'INSTRUITE', 'AFFECTEE', 'EN_TRAITEMENT'].includes(complaint.status) && (
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button className="btn btn-ghost btn-sm" onClick={() => openActionModal('investigationLog')}>
                <FiBookOpen /> Superviser / Journal
              </button>
            </div>
          )}
          {isPFZS && complaint.status === 'ESCALADEE' && (
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button className="btn btn-primary btn-sm" onClick={() => doAction('acknowledge')}>
                Accuser réception (PFZS)
              </button>
              <button className="btn btn-secondary btn-sm" onClick={() => openActionModal('investigationLog')}>
                <FiBookOpen /> Instruire enquête
              </button>
              <button className="btn btn-secondary btn-sm" onClick={() => openActionModal('resolve')}>
                <FiCheckCircle /> Proposer résolution
              </button>
              <button className="btn btn-danger btn-sm" onClick={() => openActionModal('escalate')}>
                <FiArrowUp /> Escalader à la DDS
              </button>
            </div>
          )}
          {isPFZS && complaint.status === 'RESOLUE' && (
            <button className="btn btn-ghost btn-sm" onClick={() => askConfirm('close', {}, 'Clôturer', 'Confirmez-vous la clôture de ce dossier ?')}>
              <FiLock /> Clôturer
            </button>
          )}

          {/* DDS Actions */}
          {isDDS && complaint.status === 'ESCALADEE' && (
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button className="btn btn-primary btn-sm" onClick={() => openActionModal('ddsAssignInspector')}>
                Affecter inspecteur
              </button>
              <button className="btn btn-secondary btn-sm" onClick={() => openActionModal('ddsInvestigation')}>
                Enquête DDS
              </button>
              <button className="btn btn-primary btn-sm" onClick={() => openActionModal('arbitrate')}>
                <FiShield /> Arbitrer
              </button>
              <button className="btn btn-danger btn-sm" onClick={() => openActionModal('escalate')}>
                <FiArrowUp /> Escalader au Ministère
              </button>
              <button className="btn btn-ghost btn-sm" onClick={() => askConfirm('close', {}, 'Clôturer dossier', 'Confirmez-vous la clôture de ce dossier ?')}>
                <FiLock /> Clôturer dossier
              </button>
            </div>
          )}

          {/* DQSS / National Actions (UC37-UC41) */}
          {isDQSS && complaint.status === 'ESCALADEE' && (
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button className="btn btn-primary btn-sm" onClick={() => openActionModal('arbitrate')}>
                <FiShield /> Arbitrer / Injonction
              </button>
              <button className="btn btn-ghost btn-sm" onClick={() => askConfirm('close', {}, 'Clôturer définitivement', 'Confirmez-vous la clôture définitive de ce dossier ?')}>
                <FiLock /> Clôturer définitivement
              </button>
            </div>
          )}

          {/* PNUSS Actions (UC46-UC51) */}
          {isPNUSS && ['EN_TRAITEMENT', 'ESCALADEE'].includes(complaint.status) && (
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button className="btn btn-secondary btn-sm" onClick={() => openActionModal('investigationLog')}>
                <FiBookOpen /> Participer à l'enquête
              </button>
              <button className="btn btn-secondary btn-sm" onClick={() => openActionModal('notifyParties')}>
                Médiation / Intervention
              </button>
              <button className="btn btn-danger btn-sm" onClick={() => openActionModal('escalate')}>
                <FiArrowUp /> Alerter hiérarchie
              </button>
            </div>
          )}

          {/* Notify parties — accessible à tous les acteurs hiérarchiques */}
          {(isRegulateur || isDirecteur || isPFE || isPFZS || isPNUSS) && (
            <button className="btn btn-ghost btn-sm" onClick={() => openActionModal('notifyParties')}>
              Notifier parties
            </button>
          )}

          <button className="btn btn-ghost btn-sm" onClick={openDocs}>
            Documents
          </button>
        </div>
      </div>

      <div className="detail-two-col">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="glass-card" style={{ padding: '1.75rem' }}>
            <h3 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '1rem' }}>Description</h3>
            <p style={{ color: '#444', lineHeight: 1.8, fontSize: '0.9rem', whiteSpace: 'pre-wrap' }}>{complaint.description}</p>
            {complaint.voice_file_url && (
              <div style={{ marginTop: '1rem' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.35rem', color: 'var(--text-muted)' }}>Message vocal déposé</div>
                <audio controls src={complaint.voice_file_url} style={{ width: '100%', maxWidth: 420 }}>
                  <track kind="captions" />
                </audio>
              </div>
            )}
            {complaint.attachments?.length > 0 && (
              <div style={{ marginTop: '1rem' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Pièces jointes</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {complaint.attachments.map((att) => {
                    const url = att.file_url || att.file
                    const isAudio = (att.file_type || '').startsWith('audio/') || /\.(webm|mp3|m4a|wav|ogg)$/i.test(att.file_name || '')
                    const isImage = (att.file_type || '').startsWith('image/')
                    return (
                      <div key={att.id} style={{ padding: '0.75rem', background: '#f8f9fa', borderRadius: 4, border: '1px solid #eee' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                          <a href={url} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                            {att.file_name}
                          </a>
                          <a className="btn btn-ghost btn-sm" href={url} download>
                            Télécharger
                          </a>
                        </div>
                        {isAudio && url && (
                          <audio controls src={url} style={{ width: '100%', marginTop: '0.5rem' }}>
                            <track kind="captions" />
                          </audio>
                        )}
                        {isImage && url && (
                          <img src={url} alt={att.file_name} style={{ maxWidth: '100%', marginTop: '0.5rem', borderRadius: 4 }} />
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
          {complaint.resolution_notes && (
            <div className="glass-card" style={{ padding: '1.75rem', borderLeft: '4px solid var(--color-primary)' }}>
              <h3 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '1rem', color: 'var(--color-primary)' }}>Résolution / Rapport</h3>
              <p style={{ color: '#444', lineHeight: 1.8, fontSize: '0.9rem' }}>{complaint.resolution_notes}</p>
            </div>
          )}
        </div>

        <div className="glass-card" style={{ padding: '1.75rem', alignSelf: 'flex-start' }}>
          <h3 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '1.25rem' }}>Historique</h3>
          <div className="timeline">
            {[...complaint.history].reverse().map((h, i) => (
              <div key={i} className="timeline-item">
                <div className="timeline-date">{new Date(h.timestamp).toLocaleDateString('fr-FR')}</div>
                <div className="timeline-title">{h.action}</div>
                {h.actor_name && <div style={{ fontSize: '0.75rem', color: 'var(--color-primary)' }}>par {h.actor_name}</div>}
                {h.notes && <div className="timeline-note">{h.notes}</div>}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Action Modals (portal) */}
      {modal && typeof document !== 'undefined' && createPortal(
        <div className="modal-overlay" onClick={() => openActionModal(null)} role="presentation">
          <div className="modal" onClick={e => e.stopPropagation()} role="dialog" aria-modal="true">
            <div className="modal-header">
              <h3 className="modal-title">Action : {modal}</h3>
              <button className="modal-close" onClick={() => openActionModal(null)}>✕</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {modal === 'documents' && (
                <ComplaintDocumentsEditor complaintId={id} userRole={user?.role} />
              )}

              {modal === 'requestInfo' && (
                <textarea className="form-textarea" placeholder="Précisions demandées à l'usager..."
                  onChange={e => setFormData({ ...formData, notes: e.target.value })} />
              )}

              {modal === 'qualify' && (
                <div className="form-group">
                  <label className="form-label">Niveau de priorité</label>
                  <select className="form-select" onChange={e => setFormData({...formData, priority: e.target.value})}>
                    <option value="P4">P4 - Normal</option>
                    <option value="P3">P3 - Élevé</option>
                    <option value="P2">P2 - Urgent</option>
                    <option value="P1">P1 - Critique</option>
                  </select>
                </div>
              )}

              {modal === 'assign' && (
                <div className="form-group">
                  <label className="form-label">Agent interne</label>
                  <select className="form-select" value={formData.assigned_to || ''} onChange={e => setFormData({...formData, assigned_to: e.target.value})}>
                    <option value="">Sélectionner un agent</option>
                    {agents.filter(a => a.role === 'AGENT_INTERNE').map(a => (
                      <option key={a.id} value={a.id}>{a.full_name}</option>
                    ))}
                  </select>
                  {isPFE && (
                    <div style={{ marginTop: '1rem' }}>
                      <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowNewAgent(!showNewAgent)}>
                        {showNewAgent ? 'Annuler' : '+ Ajouter un agent manuellement'}
                      </button>
                      {showNewAgent && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.75rem' }}>
                          <input className="form-input" placeholder="Prénom *" value={newAgent.first_name} onChange={e => setNewAgent({ ...newAgent, first_name: e.target.value })} />
                          <input className="form-input" placeholder="Nom" value={newAgent.last_name} onChange={e => setNewAgent({ ...newAgent, last_name: e.target.value })} />
                          <input className="form-input" placeholder="Email" value={newAgent.email} onChange={e => setNewAgent({ ...newAgent, email: e.target.value })} />
                          <input className="form-input" placeholder="Téléphone" value={newAgent.phone} onChange={e => setNewAgent({ ...newAgent, phone: e.target.value })} />
                          <input className="form-input" placeholder="Mot de passe (optionnel)" type="password" value={newAgent.password} onChange={e => setNewAgent({ ...newAgent, password: e.target.value })} />
                          <button type="button" className="btn btn-secondary btn-sm" onClick={createAgent}>Créer l&apos;agent</button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {modal === 'refuseAssignment' && (
                <textarea className="form-textarea" placeholder="Justification du refus / réorientation..."
                  onChange={e => setFormData({ ...formData, reason: e.target.value })} />
              )}

              {modal === 'investigationLog' && (
                <textarea className="form-textarea" placeholder="Entrée du journal d'instruction..."
                  onChange={e => setFormData({ ...formData, entry: e.target.value })} />
              )}

              {modal === 'requestExtension' && (
                <>
                  <div className="form-group">
                    <label className="form-label">Jusqu'au (ISO)</label>
                    <input className="form-input" placeholder="2026-04-29T18:00:00+01:00"
                      onChange={e => setFormData({ ...formData, until: e.target.value })} />
                  </div>
                  <textarea className="form-textarea" placeholder="Motif de l'extension..."
                    onChange={e => setFormData({ ...formData, reason: e.target.value })} />
                </>
              )}

              {modal === 'validateResolution' && (
                <textarea className="form-textarea" placeholder="Notes de validation (optionnel)..."
                  onChange={e => setFormData({ ...formData, notes: e.target.value })} />
              )}

              {modal === 'rejectResolution' && (
                <textarea className="form-textarea" placeholder="Motif du rejet / corrections demandées..."
                  onChange={e => setFormData({ ...formData, reason: e.target.value })} />
              )}

              {modal === 'ddsAssignInspector' && (
                <div className="form-group">
                  <label className="form-label">Inspecteur (utilisateur)</label>
                  <select className="form-select" onChange={e => setFormData({ ...formData, inspector_id: e.target.value })}>
                    <option value="">Sélectionner</option>
                    {agents.map(a => <option key={a.id} value={a.id}>{a.full_name} — {a.role}</option>)}
                  </select>
                </div>
              )}

              {modal === 'ddsInvestigation' && (
                <textarea className="form-textarea" placeholder="Notes d'enquête DDS..."
                  onChange={e => setFormData({ ...formData, notes: e.target.value })} />
              )}

              {modal === 'notifyParties' && (
                <textarea className="form-textarea" placeholder="Message à notifier (usager + intervenants)..."
                  onChange={e => setFormData({ ...formData, message: e.target.value })} />
              )}

              {modal === 'escalate' && (
                <div className="form-group">
                  <label className="form-label">Escalader vers</label>
                  <select
                    className="form-select"
                    value={formData.to_user || ''}
                    onChange={(e) => setFormData({ ...formData, to_user: e.target.value || null })}
                  >
                    <option value="">Automatique / Non spécifié</option>
                    {agents
                      .filter(a => ['PFZS', 'DDS', 'DQSS', 'CABINET', 'PNUSS', 'ADMIN_PLATEFORME'].includes(a.role))
                      .map(a => (
                        <option key={a.id} value={a.id}>
                          {a.full_name} — {a.role}
                        </option>
                      ))}
                  </select>
                  <div className="text-muted" style={{ fontSize: '0.8rem', marginTop: '0.35rem' }}>
                    Choisissez le destinataire si vous souhaitez orienter l’escalade vers une personne précise.
                  </div>
                </div>
              )}

              {['resolve', 'arbitrate', 'qualify', 'escalate'].includes(modal) && (
                <textarea
                  className="form-textarea"
                  placeholder={modal === 'escalate' ? 'Raison de l\'escalade (min. 10 caractères)…' : 'Notes ou commentaires…'}
                  value={formData.reason || formData.notes || ''}
                  onChange={e => setFormData({...formData, notes: e.target.value, resolution_notes: e.target.value, reason: e.target.value})}
                />
              )}

              {modal === 'resolve' && (
                <textarea className="form-textarea" placeholder="Actions correctives (optionnel)..."
                  onChange={e => setFormData({ ...formData, corrective_actions: e.target.value })} />
              )}

              {modal !== 'documents' && (
                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                  <button className="btn btn-ghost" onClick={() => openActionModal(null)}>Annuler</button>
                  <button
                    className="btn btn-primary"
                    onClick={() => {
                      const map = {
                        requestInfo: 'requestInfo',
                        qualify: 'qualify',
                        assign: 'assign',
                        refuseAssignment: 'refuseAssignment',
                        investigationLog: 'investigationLog',
                        requestExtension: 'requestExtension',
                        resolve: 'resolve',
                        escalate: 'escalate',
                        arbitrate: 'arbitrate',
                        validateResolution: 'validateResolution',
                        rejectResolution: 'rejectResolution',
                        ddsAssignInspector: 'ddsAssignInspector',
                        ddsInvestigation: 'ddsInvestigation',
                        notifyParties: 'notifyParties',
                      }
                      askConfirm(map[modal] || modal, formData, 'Confirmer l’action', 'Confirmez-vous cette action ?')
                    }}
                  >
                    Confirmer
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body,
      )}

      {/* Confirm Modal */}
      {confirm && typeof document !== 'undefined' && createPortal(
        <div className="modal-overlay" onClick={() => setConfirm(null)} role="presentation">
          <div className="modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
            <div className="modal-header">
              <h3 className="modal-title">{confirm.title}</h3>
              <button className="modal-close" onClick={() => setConfirm(null)}>✕</button>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6 }}>
              {confirm.message || 'Confirmez-vous cette action ?'}
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
              <button className="btn btn-ghost" onClick={() => setConfirm(null)}>Annuler</button>
              <button className="btn btn-primary" onClick={runConfirmed}>Oui, confirmer</button>
            </div>
          </div>
        </div>,
        document.body,
      )}
    </div>
  )
}
