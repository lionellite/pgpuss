import React, { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { complaintsAPI } from '../../api'
import { FiSearch, FiAlertCircle, FiCopy, FiCheck } from 'react-icons/fi'
import toast from 'react-hot-toast'
import StatusBadge from '../../components/StatusBadge'

export default function TrackPage() {
  const [searchParams] = useSearchParams()
  const ticketParam = searchParams.get('ticket')
  const inputRef = useRef(null)
  const [ticket, setTicket] = useState(ticketParam || '')
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  const runSearch = async (query) => {
    const q = (query ?? ticket).trim()
    if (!q) {
      setError('Saisissez un numéro de ticket pour lancer la recherche.')
      inputRef.current?.focus()
      return
    }
    setLoading(true)
    setError('')
    setResult(null)
    try {
      const { data } = await complaintsAPI.track(q.toUpperCase())
      setResult(data)
    } catch {
      setError('Aucune plainte trouvée avec ce numéro. Vérifiez le ticket et réessayez.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!ticketParam?.trim()) return
    setTicket(ticketParam)
    runSearch(ticketParam)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticketParam])

  const handleSearch = (e) => {
    e.preventDefault()
    runSearch()
  }

  const handleCopy = async (text) => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text)
      } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea')
        textArea.value = text
        textArea.style.position = 'fixed'
        textArea.style.top = '0'
        textArea.style.left = '0'
        document.body.appendChild(textArea)
        textArea.focus()
        textArea.select()
        document.execCommand('copy')
        document.body.removeChild(textArea)
      }
      setCopied(true)
      toast.success('Numéro copié dans le presse-papiers')
      setTimeout(() => setCopied(false), 2000)
    } catch (e) {
      console.error('Copy failed:', e)
      toast.error("Erreur lors de la copie du ticket")
    }
  }

  return (
    <section className="section" style={{ minHeight: '70vh' }} aria-labelledby="track-title">
      <div className="page-container" style={{ maxWidth: 680 }}>
        <h1 id="track-title" className="page-title">Suivre ma plainte</h1>
        <p className="page-intro">
          Saisissez le numéro de ticket reçu lors du dépôt de votre plainte. Aucune connexion n&apos;est requise.
        </p>

        <div className="card card--padding" style={{ marginBottom: '1.5rem' }}>
          <form onSubmit={handleSearch} role="search" aria-label="Recherche par numéro de ticket">
            <label className="form-label" htmlFor="track-ticket">Numéro de ticket</label>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 200, position: 'relative' }}>
                <FiSearch
                  aria-hidden
                  style={{
                    position: 'absolute',
                    left: '0.75rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-muted)',
                  }}
                />
                <input
                  ref={inputRef}
                  id="track-ticket"
                  className="form-input"
                  style={{ paddingLeft: '2.5rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}
                  value={ticket}
                  onChange={(e) => setTicket(e.target.value)}
                  placeholder="PGP-2026-AB1234"
                  autoComplete="off"
                  aria-invalid={error && !ticket.trim() ? 'true' : undefined}
                  aria-describedby={error ? 'track-error' : undefined}
                />
              </div>
              <button type="submit" className="btn btn-primary" disabled={loading} aria-busy={loading}>
                {loading ? 'Recherche…' : 'Rechercher'}
              </button>
            </div>
          </form>
        </div>

        {error && (
          <div id="track-error" className="alert alert-danger" style={{ marginBottom: '1.5rem' }} role="alert">
            <FiAlertCircle aria-hidden />
            {error}
          </div>
        )}

        {result && (
          <article className="card card--padding">
            <header style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <div>
                <p className="text-muted" style={{ fontSize: '0.7rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                  Numéro de ticket
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontWeight: 700, fontSize: '1.35rem', letterSpacing: '0.04em' }}>
                    {result.ticket_number}
                  </span>
                  <button
                    type="button"
                    className="btn-icon"
                    onClick={() => handleCopy(result.ticket_number)}
                    aria-label="Copier le numéro de ticket"
                  >
                    {copied ? <FiCheck aria-hidden /> : <FiCopy aria-hidden />}
                  </button>
                </div>
              </div>
              <StatusBadge status={result.status} />
            </header>

            <h2 style={{ fontSize: '1.1rem', marginBottom: '0.75rem' }}>{result.title}</h2>
            {result.category_name && (
              <p className="text-muted" style={{ fontSize: '0.85rem', marginBottom: '0.75rem' }}>
                Catégorie : {result.category_name}
              </p>
            )}
            {result.description && (
              <p className="text-muted" style={{ fontSize: '0.9rem', marginBottom: '1.5rem', lineHeight: 1.6 }}>
                {result.description}
              </p>
            )}
            
            {result.closure_report && (
              <div style={{ 
                background: 'var(--surface-container-low)', 
                padding: '1.25rem', 
                borderRadius: '8px', 
                marginBottom: '1.5rem',
                border: '1px solid var(--border)'
              }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.75rem' }}>
                  Rapport de clôture
                </h3>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                  {result.closure_report}
                </p>
              </div>
            )}

            <dl style={{ display: 'grid', gap: '0.75rem', fontSize: '0.875rem' }}>
              <div>
                <dt className="text-muted" style={{ fontWeight: 600 }}>Établissement</dt>
                <dd>{result.establishment_name || '—'}</dd>
              </div>
              {result.establishment_address && (
                <div>
                  <dt className="text-muted" style={{ fontWeight: 600 }}>Adresse</dt>
                  <dd>{result.establishment_address}</dd>
                </div>
              )}
              <div>
                <dt className="text-muted" style={{ fontWeight: 600 }}>Dépôt</dt>
                <dd>
                  {result.created_at
                    ? new Date(result.created_at).toLocaleString('fr-FR')
                    : '—'}
                </dd>
              </div>
              <div>
                <dt className="text-muted" style={{ fontWeight: 600 }}>Dernière mise à jour</dt>
                <dd>
                  {result.updated_at
                    ? new Date(result.updated_at).toLocaleString('fr-FR')
                    : '—'}
                </dd>
              </div>
            </dl>

            {result.timeline?.length > 0 && (
              <section style={{ marginTop: '2rem' }} aria-labelledby="track-timeline">
                <h3 id="track-timeline" style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                  Historique du traitement
                </h3>
                <ol style={{ listStyle: 'none', padding: 0, margin: 0, borderLeft: '2px solid var(--border)' }}>
                  {result.timeline.map((entry, idx) => (
                    <li
                      key={`${entry.timestamp}-${idx}`}
                      style={{ paddingLeft: '1.25rem', paddingBottom: '1.25rem', position: 'relative' }}
                    >
                      <span
                        aria-hidden
                        style={{
                          position: 'absolute',
                          left: -6,
                          top: 4,
                          width: 10,
                          height: 10,
                          borderRadius: '50%',
                          background: 'var(--color-primary)',
                        }}
                      />
                      <p style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.25rem' }}>{entry.action}</p>
                      {entry.status && (
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                          Statut : {entry.status}
                        </p>
                      )}
                      {entry.notes && (
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                          {entry.notes}
                        </p>
                      )}
                      <time style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {entry.timestamp ? new Date(entry.timestamp).toLocaleString('fr-FR') : ''}
                      </time>
                    </li>
                  ))}
                </ol>
              </section>
            )}
          </article>
        )}
      </div>
    </section>
  )
}
