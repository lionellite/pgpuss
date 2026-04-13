import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { complaintsAPI } from '../../api'
import { FiSearch, FiClock, FiCheckCircle, FiAlertCircle } from 'react-icons/fi'
import StatusBadge from '../../components/StatusBadge'
import PriorityBadge from '../../components/PriorityBadge'

export default function TrackPage() {
  const [searchParams] = useSearchParams()
  const [ticket, setTicket] = useState(searchParams.get('ticket') || '')
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (searchParams.get('ticket')) handleSearch()
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

  return (
    <div style={{ padding: '4rem 0', minHeight: '80vh', background: '#fff' }}>
      <div className="page-container">
        <div style={{ maxWidth: 680, margin: '0 auto' }}>
          <div style={{ textAlign: 'left', marginBottom: '3rem' }}>
            <h1 className="page-title">Suivre ma plainte</h1>
            <p style={{ color: '#666', marginTop: '0.5rem', fontSize: '0.9rem' }}>
              Entrez le numéro de ticket unique qui vous a été attribué lors de la soumission de votre plainte.
            </p>
          </div>

          {/* Search form */}
          <div className="glass-card" style={{ padding: '2rem', marginBottom: '2rem', border: '1px solid #ddd', boxShadow: 'none' }}>
            <form onSubmit={handleSearch} style={{ display: 'flex', gap: '0.75rem' }}>
              <div style={{ flex: 1, position: 'relative' }}>
                <FiSearch style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#666' }} />
                <input
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

          {/* Error */}
          {error && (
            <div className="alert alert-danger" style={{ marginBottom: '1.5rem' }}>
              <FiAlertCircle style={{ flexShrink: 0 }} />
              {error}
            </div>
          )}

          {/* Result */}
          {result && (
            <div className="glass-card" style={{ padding: '2.5rem', border: '1px solid #ddd', boxShadow: 'none' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <div style={{ fontSize: '0.7rem', color: '#666', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.25rem' }}>N° de ticket</div>
                  <div style={{ fontWeight: 800, fontSize: '1.5rem', color: '#111', letterSpacing: '0.05em' }}>
                    {result.ticket_number}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <StatusBadge status={result.status} label={result.status_display} />
                  <PriorityBadge priority={result.priority} label={result.priority_display} />
                </div>
              </div>

              <h3 style={{ fontWeight: 700, fontSize: '1.2rem', marginBottom: '1.5rem', color: '#111' }}>{result.title}</h3>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
                <div style={{ padding: '1rem', background: '#f8f9fa', border: '1px solid #eee' }}>
                  <div style={{ fontSize: '0.7rem', color: '#666', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.25rem' }}>Établissement</div>
                  <div style={{ fontSize: '0.9rem', color: '#333', fontWeight: 500 }}>{result.establishment_name || 'Non spécifié'}</div>
                </div>
                <div style={{ padding: '1rem', background: '#f8f9fa', border: '1px solid #eee' }}>
                  <div style={{ fontSize: '0.7rem', color: '#666', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.25rem' }}>Date de dépôt</div>
                  <div style={{ fontSize: '0.9rem', color: '#333', fontWeight: 500 }}>{new Date(result.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
                </div>
              </div>

              {/* Timeline */}
              {result.timeline?.length > 0 && (
                <div>
                  <h4 style={{ fontWeight: 600, fontSize: '0.875rem', color: '#8FA3BF', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Historique du traitement
                  </h4>
                  <div className="timeline">
                    {result.timeline.map((item, i) => (
                      <div key={i} className="timeline-item">
                        <div className="timeline-date">
                          {new Date(item.timestamp).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </div>
                        <div className="timeline-title">{item.action}</div>
                        {item.notes && <div className="timeline-note">{item.notes}</div>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Info box */}
          {!result && !error && (
            <div className="alert alert-info">
              <FiClock style={{ flexShrink: 0 }} />
              <div>
                <strong>Vous n'avez pas de numéro de ticket ?</strong> Si vous avez déposé une plainte avec un compte, 
                <a href="/connexion" style={{ color: '#00B4D8', marginLeft: '0.25rem' }}>connectez-vous</a> pour accéder directement à vos plaintes.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
