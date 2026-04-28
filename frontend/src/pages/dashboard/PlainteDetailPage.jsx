import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { complaintsAPI, authAPI } from '../../api'
import { useAuth } from '../../contexts/AuthContext'
import StatusBadge from '../../components/StatusBadge'
import PriorityBadge from '../../components/PriorityBadge'
import toast from 'react-hot-toast'
import { FiArrowLeft, FiUser, FiCheckCircle, FiLock, FiArrowUp, FiFileText, FiShield } from 'react-icons/fi'

export default function PlainteDetailPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [complaint, setComplaint] = useState(null)
  const [loading, setLoading] = useState(true)
  const [agents, setAgents] = useState([])
  const [modal, setModal] = useState(null) // 'acknowledge' | 'qualify' | 'assign' | 'resolve' | 'escalate' | 'arbitrate' | 'close'
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
      if (action === 'acknowledge') await complaintsAPI.acknowledge(id)
      else if (action === 'qualify') await complaintsAPI.qualify(id, payload)
      else if (action === 'assign') await complaintsAPI.assign(id, payload)
      else if (action === 'start') await complaintsAPI.startInvestigation(id)
      else if (action === 'resolve') await complaintsAPI.resolve(id, payload)
      else if (action === 'escalate') await complaintsAPI.escalate(id, payload)
      else if (action === 'arbitrate') await complaintsAPI.arbitrate(id, payload)
      else if (action === 'close') await complaintsAPI.close(id)

      toast.success('Action effectuée avec succès')
      setModal(null)
      reload()
    } catch { toast.error("Erreur lors de l'action") }
  }

  if (!complaint && loading) return <div className="loading-center"><div className="spinner" /></div>
  if (!complaint) return null

  // Permissions Bénin Workflow
  const isPFE = user?.role === 'PFE'
  const isAgent = user?.role === 'AGENT_INTERNE'
  const isRegulateur = ['DDS', 'DQSS', 'CABINET'].includes(user?.role)
  const isDirecteur = user?.role === 'DIRECTEUR_EST'

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
            { label: 'Affecté à', value: complaint.assigned_to_name || 'Non affecté' },
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
            <button className="btn btn-primary btn-sm" onClick={() => doAction('acknowledge')}>
              Accuser réception
            </button>
          )}
          {isPFE && complaint.status === 'ACCUSEE' && (
            <button className="btn btn-primary btn-sm" onClick={() => setModal('qualify')}>
              <FiFileText /> Qualifier
            </button>
          )}
          {isPFE && complaint.status === 'INSTRUITE' && (
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button className="btn btn-primary btn-sm" onClick={() => setModal('assign')}>
                <FiUser /> Affecter
              </button>
              <button className="btn btn-secondary btn-sm" onClick={() => setModal('resolve')}>
                Traiter directement
              </button>
              <button className="btn btn-danger btn-sm" onClick={() => setModal('escalate')}>
                <FiArrowUp /> Escalader à la Direction
              </button>
            </div>
          )}
          {isPFE && complaint.status === 'RESOLUE' && (
            <button className="btn btn-ghost btn-sm" onClick={() => doAction('close')}>
              <FiLock /> Clôturer
            </button>
          )}

          {/* Agent Actions */}
          {isAgent && complaint.status === 'AFFECTEE' && (
            <button className="btn btn-primary btn-sm" onClick={() => doAction('start')}>
              🚀 Accepter l'affectation
            </button>
          )}
          {isAgent && complaint.status === 'EN_TRAITEMENT' && (
            <button className="btn btn-secondary btn-sm" onClick={() => setModal('resolve')}>
              <FiCheckCircle /> Soumettre rapport
            </button>
          )}

          {/* Direction / Régulation Actions */}
          {isRegulateur && complaint.status === 'ESCALADEE' && (
            <button className="btn btn-primary btn-sm" onClick={() => setModal('arbitrate')}>
              <FiShield /> Arbitrer
            </button>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '1.5rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="glass-card" style={{ padding: '1.75rem' }}>
            <h3 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '1rem' }}>Description</h3>
            <p style={{ color: '#444', lineHeight: 1.8, fontSize: '0.9rem', whiteSpace: 'pre-wrap' }}>{complaint.description}</p>
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

      {/* Action Modals */}
      {modal && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Action : {modal}</h3>
              <button className="modal-close" onClick={() => setModal(null)}>✕</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
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
                  <select className="form-select" onChange={e => setFormData({...formData, assigned_to: e.target.value})}>
                    <option value="">Sélectionner un agent</option>
                    {agents.filter(a => a.role === 'AGENT_INTERNE').map(a => (
                      <option key={a.id} value={a.id}>{a.full_name}</option>
                    ))}
                  </select>
                </div>
              )}

              {['resolve', 'arbitrate', 'qualify', 'escalate'].includes(modal) && (
                <textarea className="form-textarea" placeholder="Notes ou commentaires..."
                  onChange={e => setFormData({...formData, notes: e.target.value, resolution_notes: e.target.value, reason: e.target.value})} />
              )}

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <button className="btn btn-ghost" onClick={() => setModal(null)}>Annuler</button>
                <button className="btn btn-primary" onClick={() => doAction(modal, formData)}>Confirmer</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
