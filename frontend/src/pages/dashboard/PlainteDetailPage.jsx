import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { complaintsAPI, authAPI } from '../../api'
import { useAuth } from '../../contexts/AuthContext'
import StatusBadge from '../../components/StatusBadge'
import PriorityBadge from '../../components/PriorityBadge'
import toast from 'react-hot-toast'
import { FiArrowLeft, FiUser, FiCheckCircle, FiLock, FiArrowUp, FiAlertTriangle } from 'react-icons/fi'

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
  useEffect(() => { reload(); setLoading(false) }, [id])
  useEffect(() => {
    authAPI.users().then(({ data }) => setAgents(data.results || data)).catch(() => {})
  }, [])

  const doAction = async (action, payload) => {
    try {
      if (action === 'assign') await complaintsAPI.assign(id, payload)
      else if (action === 'resolve') await complaintsAPI.resolve(id, payload)
      else if (action === 'close') await complaintsAPI.close(id, payload)
      else if (action === 'escalate') await complaintsAPI.escalate(id, payload)
      toast.success('Action effectuée avec succès')
      setModal(null)
      reload()
    } catch { toast.error("Erreur lors de l'action") }
  }

  if (!complaint && loading) return <div className="loading-center"><div className="spinner" /></div>
  if (!complaint) return null

  const canAssign = ['AGENT_RECEPTION','GESTIONNAIRE_SERVICE','ADMIN_NATIONAL','DIRECTEUR'].includes(user?.role)
  const canResolve = ['AGENT_RECEPTION','GESTIONNAIRE_SERVICE','ADMIN_NATIONAL','DIRECTEUR','MEDIATEUR'].includes(user?.role)
  const canClose = canResolve
  const canEscalate = ['AGENT_RECEPTION','GESTIONNAIRE_SERVICE','ADMIN_NATIONAL'].includes(user?.role)

  return (
    <div>
      <button onClick={() => navigate('/dashboard/plaintes')} className="btn btn-ghost btn-sm" style={{ marginBottom: '1.5rem' }}>
        <FiArrowLeft /> Retour
      </button>

      {/* Header */}
      <div className="glass-card" style={{ padding: '2rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
          <div>
            <div style={{ fontSize: '0.7rem', color: '#8FA3BF', marginBottom: '0.25rem' }}>N° ticket</div>
            <div style={{ fontFamily: 'Outfit', fontWeight: 800, fontSize: '1.3rem', color: '#00B4D8', letterSpacing: '0.05em' }}>
              {complaint.ticket_number}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <StatusBadge status={complaint.status} />
            <PriorityBadge priority={complaint.priority} />
            {complaint.is_overdue && <span className="badge badge-escaladee"><FiAlertTriangle /> En retard</span>}
          </div>
        </div>
        <h1 style={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: '1.3rem', marginBottom: '1rem' }}>{complaint.title}</h1>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '0.75rem', marginBottom: '1.5rem' }}>
          {[
            { label: 'Établissement', value: complaint.establishment_name },
            { label: 'Service', value: complaint.service_name || '—' },
            { label: 'Catégorie', value: complaint.category_name },
            { label: 'Canal', value: complaint.channel_display },
            { label: 'Plaignant', value: complaint.complainant_display },
            { label: 'Assigné à', value: complaint.assigned_to_name || 'Non assigné' },
            { label: 'Déposée le', value: new Date(complaint.created_at).toLocaleDateString('fr-FR') },
            { label: 'Mise à jour', value: new Date(complaint.updated_at).toLocaleDateString('fr-FR') },
          ].map((item, i) => (
            <div key={i} style={{ padding: '0.75rem', background: 'rgba(0,119,182,0.04)', borderRadius: '10px', border: '1px solid rgba(0,119,182,0.08)' }}>
              <div style={{ fontSize: '0.68rem', color: '#8FA3BF', marginBottom: '0.2rem' }}>{item.label}</div>
              <div style={{ fontSize: '0.82rem', color: '#F0F4FF', fontWeight: 500 }}>{item.value || '—'}</div>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', borderTop: '1px solid rgba(0,119,182,0.1)', paddingTop: '1.25rem' }}>
          {canAssign && (
            <button className="btn btn-primary btn-sm" onClick={() => setModal('assign')}>
              <FiUser /> Affecter
            </button>
          )}
          {canResolve && complaint.status === 'EN_INSTRUCTION' && (
            <button className="btn btn-secondary btn-sm" onClick={() => setModal('resolve')}>
              <FiCheckCircle /> Résoudre
            </button>
          )}
          {canClose && complaint.status === 'RESOLUE' && (
            <button className="btn btn-ghost btn-sm" onClick={() => setModal('close')}>
              <FiLock /> Clôturer
            </button>
          )}
          {canEscalate && ['EN_INSTRUCTION','AFFECTEE'].includes(complaint.status) && (
            <button className="btn btn-danger btn-sm" onClick={() => setModal('escalate')}>
              <FiArrowUp /> Escalader
            </button>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '1.5rem' }}>
        {/* Description + Resolution */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="glass-card" style={{ padding: '1.75rem' }}>
            <h3 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '1rem' }}>Description</h3>
            <p style={{ color: '#8FA3BF', lineHeight: 1.8, fontSize: '0.9rem', whiteSpace: 'pre-wrap' }}>{complaint.description}</p>
          </div>
          {complaint.resolution_notes && (
            <div className="glass-card" style={{ padding: '1.75rem', borderColor: 'rgba(6,214,160,0.2)' }}>
              <h3 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '1rem', color: '#06D6A0' }}>✅ Résolution</h3>
              <p style={{ color: '#8FA3BF', lineHeight: 1.8, fontSize: '0.9rem' }}>{complaint.resolution_notes}</p>
              {complaint.corrective_actions && (
                <>
                  <h4 style={{ fontWeight: 600, marginTop: '0.75rem', marginBottom: '0.4rem', fontSize: '0.875rem', color: '#F0F4FF' }}>
                    Actions correctives:
                  </h4>
                  <p style={{ color: '#8FA3BF', fontSize: '0.875rem' }}>{complaint.corrective_actions}</p>
                </>
              )}
            </div>
          )}
          {/* Attachments */}
          {complaint.attachments?.length > 0 && (
            <div className="glass-card" style={{ padding: '1.75rem' }}>
              <h3 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '1rem' }}>Pièces jointes ({complaint.attachments.length})</h3>
              {complaint.attachments.map((a, i) => (
                <a key={i} href={a.file} target="_blank" rel="noreferrer" style={{
                  display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem',
                  background: 'rgba(0,119,182,0.05)', borderRadius: '8px', marginBottom: '0.5rem',
                  border: '1px solid rgba(0,119,182,0.1)', textDecoration: 'none',
                }}>
                  <span>📎</span>
                  <span style={{ fontSize: '0.875rem', color: '#00B4D8' }}>{a.file_name}</span>
                  <span style={{ fontSize: '0.75rem', color: '#4A6080', marginLeft: 'auto' }}>
                    {(a.file_size / 1024).toFixed(0)} Ko
                  </span>
                </a>
              ))}
            </div>
          )}
        </div>

        {/* History */}
        <div className="glass-card" style={{ padding: '1.75rem', alignSelf: 'flex-start' }}>
          <h3 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '1.25rem' }}>
            Historique ({complaint.history?.length || 0})
          </h3>
          {complaint.history?.length > 0 ? (
            <div className="timeline">
              {[...complaint.history].reverse().map((h, i) => (
                <div key={i} className="timeline-item">
                  <div className="timeline-date">
                    {new Date(h.timestamp).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </div>
                  <div className="timeline-title">{h.action}</div>
                  {h.actor_name && <div style={{ fontSize: '0.75rem', color: '#3B82F6', marginTop: '0.15rem' }}>par {h.actor_name}</div>}
                  {h.notes && <div className="timeline-note">{h.notes}</div>}
                </div>
              ))}
            </div>
          ) : <p style={{ color: '#4A6080', fontSize: '0.875rem' }}>Aucun historique</p>}
        </div>
      </div>

      {/* Modals */}
      {modal && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">
                {modal === 'assign' && '👤 Affecter la plainte'}
                {modal === 'resolve' && '✅ Résoudre la plainte'}
                {modal === 'close' && '🔒 Clôturer la plainte'}
                {modal === 'escalate' && '⬆️ Escalader la plainte'}
              </h3>
              <button className="modal-close" onClick={() => setModal(null)}>✕</button>
            </div>

            {modal === 'assign' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Assigner à</label>
                  <select className="form-select" value={formData.assigned_to || ''}
                    onChange={e => setFormData(d => ({ ...d, assigned_to: e.target.value }))}>
                    <option value="">Sélectionnez un agent</option>
                    {agents.filter(a => a.role !== 'USAGER').map(a => (
                      <option key={a.id} value={a.id}>{a.full_name} ({a.role})</option>
                    ))}
                  </select>
                </div>
                <textarea className="form-textarea" placeholder="Note (optionnel)"
                  value={formData.notes || ''} onChange={e => setFormData(d => ({ ...d, notes: e.target.value }))} />
                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                  <button className="btn btn-ghost" onClick={() => setModal(null)}>Annuler</button>
                  <button className="btn btn-primary" onClick={() => doAction('assign', formData)}>Affecter</button>
                </div>
              </div>
            )}

            {modal === 'resolve' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Notes de résolution *</label>
                  <textarea className="form-textarea" placeholder="Expliquez la résolution apportée..."
                    value={formData.resolution_notes || ''} onChange={e => setFormData(d => ({ ...d, resolution_notes: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Actions correctives (optionnel)</label>
                  <textarea className="form-textarea" placeholder="Mesures prises pour éviter la récurrence..."
                    value={formData.corrective_actions || ''} onChange={e => setFormData(d => ({ ...d, corrective_actions: e.target.value }))} />
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                  <button className="btn btn-ghost" onClick={() => setModal(null)}>Annuler</button>
                  <button className="btn btn-secondary" onClick={() => doAction('resolve', formData)}>
                    <FiCheckCircle /> Marquer comme résolu
                  </button>
                </div>
              </div>
            )}

            {modal === 'close' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <p style={{ color: '#8FA3BF', fontSize: '0.875rem' }}>
                  La plainte sera clôturée provisoirement. L'usager dispose de 15 jours pour contester.
                </p>
                <textarea className="form-textarea" placeholder="Note de clôture (optionnel)"
                  value={formData.notes || ''} onChange={e => setFormData(d => ({ ...d, notes: e.target.value }))} />
                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                  <button className="btn btn-ghost" onClick={() => setModal(null)}>Annuler</button>
                  <button className="btn btn-primary" onClick={() => doAction('close', formData)}>Clôturer</button>
                </div>
              </div>
            )}

            {modal === 'escalate' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Escalader vers</label>
                  <select className="form-select" value={formData.to_user || ''}
                    onChange={e => setFormData(d => ({ ...d, to_user: e.target.value }))}>
                    <option value="">Sélectionnez un responsable</option>
                    {agents.filter(a => ['DIRECTEUR','RESPONSABLE_QUALITE','ADMIN_NATIONAL'].includes(a.role)).map(a => (
                      <option key={a.id} value={a.id}>{a.full_name} ({a.role})</option>
                    ))}
                  </select>
                </div>
                <textarea className="form-textarea" placeholder="Motif de l'escalade..."
                  value={formData.reason || ''} onChange={e => setFormData(d => ({ ...d, reason: e.target.value }))} />
                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                  <button className="btn btn-ghost" onClick={() => setModal(null)}>Annuler</button>
                  <button className="btn btn-danger" onClick={() => doAction('escalate', formData)}>
                    <FiArrowUp /> Escalader
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
