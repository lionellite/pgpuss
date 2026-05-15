import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { complaintsAPI, analyticsAPI } from '../../api'
import { useAuth } from '../../contexts/AuthContext'
import StatusBadge from '../../components/StatusBadge'
import PriorityBadge from '../../components/PriorityBadge'
import ComplaintDocumentsEditor from '../../components/ComplaintDocumentsEditor'
import toast from 'react-hot-toast'
import { FiArrowLeft, FiAlertTriangle, FiStar, FiCheckCircle, FiXCircle, FiEdit3, FiFileText } from 'react-icons/fi'

export default function DetailPlaintePage() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [complaint, setComplaint] = useState(null)
  const [loading, setLoading] = useState(true)
  const [contestReason, setContestReason] = useState('')
  const [showContest, setShowContest] = useState(false)
  const [showSatisfaction, setShowSatisfaction] = useState(false)
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [showAckResolution, setShowAckResolution] = useState(false)
  const [ackAccepted, setAckAccepted] = useState(true)
  const [ackNotes, setAckNotes] = useState('')
  const [showProvideInfo, setShowProvideInfo] = useState(false)
  const [provideInfo, setProvideInfo] = useState('')
  const [showDocs, setShowDocs] = useState(false)

  useEffect(() => {
    complaintsAPI.detail(id)
      .then(({ data }) => setComplaint(data))
      .catch(() => navigate('/espace/plaintes'))
      .finally(() => setLoading(false))
  }, [id])

  const handleContest = async () => {
    try {
      await complaintsAPI.escalate(id, { reason: contestReason })
      toast.success('Demande de réexamen enregistrée')
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

  if (loading) return <div className="loading-center" style={{ minHeight: '60vh' }}><div className="spinner" /></div>
  if (!complaint) return null

  const canAckResolution = complaint.status === 'RESOLUE' && complaint.resolution_notes
  const canContest = complaint.status === 'RESOLUE'
  const canRate = ['RESOLUE', 'CLOTUREE'].includes(complaint.status)
  const hasRequestInfo = (complaint.history || []).some(h => (h.action || '').toLowerCase().includes('demande de complément'))
  const canProvideInfo = complaint.status === 'SOUMISE' && hasRequestInfo

  const loadDocs = () => setShowDocs(true)

  const submitAckResolution = async () => {
    try {
      await complaintsAPI.acknowledgeResolution(id, { accepted: ackAccepted, notes: ackNotes })
      toast.success('Votre réponse a été enregistrée')
      setShowAckResolution(false)
      const { data } = await complaintsAPI.detail(id)
      setComplaint(data)
    } catch { toast.error("Erreur lors de l'envoi") }
  }

  const submitProvideInfo = async () => {
    try {
      await complaintsAPI.provideInfo(id, { info: provideInfo })
      toast.success('Complément envoyé')
      setShowProvideInfo(false)
      setProvideInfo('')
      const { data } = await complaintsAPI.detail(id)
      setComplaint(data)
    } catch { toast.error("Erreur lors de l'envoi") }
  }

  return (
    <div style={{ padding: '2rem 0' }}>
      <div className="page-container">
        <button onClick={() => navigate('/espace/plaintes')} className="btn btn-ghost btn-sm" style={{ marginBottom: '1.5rem' }}>
          <FiArrowLeft /> Retour à mes plaintes
        </button>

        {/* Header */}
        <div className="glass-card" style={{ padding: '2rem', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'space-between', flexWrap: 'wrap', marginBottom: '1rem' }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>N° de ticket</div>
              <div style={{ fontWeight: 800, fontSize: '1.25rem', color: 'var(--color-primary)', letterSpacing: '0.05em' }}>
                {complaint.ticket_number}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignSelf: 'flex-start' }}>
              <StatusBadge status={complaint.status} />
              <PriorityBadge priority={complaint.priority} />
            </div>
          </div>
          <h1 style={{ fontWeight: 700, fontSize: '1.35rem', marginBottom: '1rem', color: 'var(--text-primary)' }}>
            {complaint.title}
          </h1>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.75rem' }}>
            {[
              { label: 'Établissement', value: complaint.establishment_name },
              { label: 'Service', value: complaint.service_name || '—' },
              { label: 'Catégorie', value: complaint.category_name },
              { label: 'Canal', value: complaint.channel_display },
              { label: 'Déposée le', value: new Date(complaint.created_at).toLocaleDateString('fr-FR') },
              { label: 'Assignée à', value: complaint.assigned_to_name || 'Non assignée' },
            ].map((item, i) => (
              <div key={i} style={{ padding: '0.75rem', background: '#f8faf9', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>{item.label}</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 500 }}>{item.value || '—'}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="detail-two-col">
          {/* Left */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Description */}
            <div className="glass-card" style={{ padding: '1.75rem' }}>
              <h3 style={{ fontWeight: 700, marginBottom: '1rem', fontSize: '1rem' }}>Description</h3>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8, fontSize: '0.9rem', whiteSpace: 'pre-wrap' }}>
                {complaint.description}
              </p>
              {complaint.voice_file_url && (
                <div style={{ marginTop: '1rem' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.35rem', color: 'var(--text-muted)' }}>Message vocal</div>
                  <audio controls src={complaint.voice_file_url} style={{ width: '100%', maxWidth: 420 }}>
                    <track kind="captions" />
                  </audio>
                </div>
              )}
            </div>

            {/* Resolution */}
            {complaint.resolution_notes && (
              <div className="glass-card" style={{ padding: '1.75rem', borderLeft: '4px solid var(--color-primary)' }}>
                <h3 style={{ fontWeight: 700, marginBottom: '1rem', fontSize: '1rem', color: 'var(--color-primary)' }}>
                  Résolution
                </h3>
                <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8, fontSize: '0.9rem' }}>{complaint.resolution_notes}</p>
                {complaint.corrective_actions && (
                  <>
                    <h4 style={{ fontWeight: 600, marginTop: '1rem', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                      Actions correctives
                    </h4>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{complaint.corrective_actions}</p>
                  </>
                )}
              </div>
            )}

            {/* Actions */}
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              {canProvideInfo && (
                <button className="btn btn-secondary" onClick={() => setShowProvideInfo(true)}>
                  <FiEdit3 /> Compléter (suite demande PFE)
                </button>
              )}
              {canAckResolution && (
                <button className="btn btn-primary" onClick={() => setShowAckResolution(true)}>
                  <FiCheckCircle /> Répondre à la résolution
                </button>
              )}
              {canContest && (
                <button className="btn btn-danger" onClick={() => setShowContest(true)}>
                  <FiAlertTriangle /> Contester la résolution / Escalader
                </button>
              )}
              {canRate && (
                <button className="btn btn-secondary" onClick={() => setShowSatisfaction(true)}>
                  <FiStar /> Évaluer le traitement
                </button>
              )}
              <button className="btn btn-ghost" onClick={loadDocs}>
                <FiFileText /> Documents
              </button>
            </div>
          </div>

          {/* Timeline */}
          <div className="glass-card" style={{ padding: '1.75rem', alignSelf: 'flex-start' }}>
            <h3 style={{ fontWeight: 700, marginBottom: '1.25rem', fontSize: '1rem' }}>Historique</h3>
            {complaint.history?.length > 0 ? (
              <div className="timeline">
                {[...complaint.history].reverse().map((h, i) => (
                  <div key={i} className="timeline-item">
                    <div className="timeline-date">
                      {new Date(h.timestamp).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <div className="timeline-title">{h.action}</div>
                    {h.notes && <div className="timeline-note">{h.notes}</div>}
                  </div>
                ))}
              </div>
            ) : <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Aucun historique</p>}
          </div>
        </div>

        {/* Contest Modal */}
        {showContest && (
          <div className="modal-overlay" onClick={() => setShowContest(false)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h3 className="modal-title">Contester la clôture</h3>
                <button className="modal-close" onClick={() => setShowContest(false)}>✕</button>
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1.25rem' }}>
                Expliquez pourquoi vous contestez la décision de clôture. Un médiateur examinera votre demande.
              </p>
              <textarea className="form-textarea" value={contestReason}
                onChange={e => setContestReason(e.target.value)}
                placeholder="Motif de la contestation..." style={{ marginBottom: '1rem' }} />
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button className="btn btn-ghost" onClick={() => setShowContest(false)}>Annuler</button>
                <button className="btn btn-danger" onClick={handleContest}>Soumettre la contestation</button>
              </div>
            </div>
          </div>
        )}

        {/* Provide Info Modal */}
        {showProvideInfo && (
          <div className="modal-overlay" onClick={() => setShowProvideInfo(false)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h3 className="modal-title">Compléter les informations</h3>
                <button className="modal-close" onClick={() => setShowProvideInfo(false)}>✕</button>
              </div>
              <textarea className="form-textarea" value={provideInfo}
                onChange={e => setProvideInfo(e.target.value)}
                placeholder="Ajoutez les informations manquantes..." style={{ marginBottom: '1rem' }} />
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button className="btn btn-ghost" onClick={() => setShowProvideInfo(false)}>Annuler</button>
                <button className="btn btn-primary" onClick={submitProvideInfo}>Envoyer</button>
              </div>
            </div>
          </div>
        )}

        {/* Ack Resolution Modal */}
        {showAckResolution && (
          <div className="modal-overlay" onClick={() => setShowAckResolution(false)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h3 className="modal-title">Répondre à la résolution</h3>
                <button className="modal-close" onClick={() => setShowAckResolution(false)}>✕</button>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                <button type="button" className={`btn ${ackAccepted ? 'btn-primary' : 'btn-ghost'}`}
                  onClick={() => setAckAccepted(true)}>
                  <FiCheckCircle /> Accepter
                </button>
                <button type="button" className={`btn ${!ackAccepted ? 'btn-danger' : 'btn-ghost'}`}
                  onClick={() => setAckAccepted(false)}>
                  <FiXCircle /> Contester / Escalader
                </button>
              </div>
              <textarea className="form-textarea" value={ackNotes}
                onChange={e => setAckNotes(e.target.value)}
                placeholder="Commentaire (optionnel)..." style={{ marginBottom: '1rem' }} />
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button className="btn btn-ghost" onClick={() => setShowAckResolution(false)}>Annuler</button>
                <button className="btn btn-primary" onClick={submitAckResolution}>Envoyer</button>
              </div>
            </div>
          </div>
        )}

        {/* Documents Modal */}
        {showDocs && (
          <div className="modal-overlay" onClick={() => setShowDocs(false)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h3 className="modal-title">Documents générés</h3>
                <button className="modal-close" onClick={() => setShowDocs(false)}>✕</button>
              </div>
              <ComplaintDocumentsEditor complaintId={id} userRole={user?.role} />
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <button className="btn btn-ghost" onClick={() => setShowDocs(false)}>Fermer</button>
              </div>
            </div>
          </div>
        )}

        {/* Satisfaction Modal */}
        {showSatisfaction && (
          <div className="modal-overlay" onClick={() => setShowSatisfaction(false)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h3 className="modal-title">Évaluer le traitement</h3>
                <button className="modal-close" onClick={() => setShowSatisfaction(false)}>✕</button>
              </div>
              <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>Note de satisfaction</div>
                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                  {[1,2,3,4,5].map(n => (
                    <button key={n} type="button" onClick={() => setRating(n)}
                      style={{
                        fontSize: '2rem', background: 'none', border: 'none', cursor: 'pointer',
                        filter: n <= rating ? 'none' : 'grayscale(1) opacity(0.4)',
                        transition: 'all 0.2s', transform: n <= rating ? 'scale(1.1)' : 'scale(1)',
                      }}>⭐</button>
                  ))}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                  {rating}/5 — {['', 'Très insatisfait', 'Insatisfait', 'Neutre', 'Satisfait', 'Très satisfait'][rating]}
                </div>
              </div>
              <textarea className="form-textarea" value={comment}
                onChange={e => setComment(e.target.value)}
                placeholder="Commentaire optionnel..." style={{ marginBottom: '1rem' }} />
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button className="btn btn-ghost" onClick={() => setShowSatisfaction(false)}>Annuler</button>
                <button className="btn btn-secondary" onClick={handleSatisfaction}><FiStar /> Envoyer</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
