import React, { useState, useEffect, useCallback } from 'react'
import { auditAPI } from '../../api'
import { FiShield, FiRefreshCw, FiCheckCircle, FiAlertTriangle, FiFilter } from 'react-icons/fi'

const EVENT_TYPES = [
  { value: '', label: 'Tous les types' },
  { value: 'AUTH', label: 'Authentification' },
  { value: 'COMPLAINT', label: 'Plainte' },
  { value: 'USER', label: 'Utilisateur' },
  { value: 'EXPORT', label: 'Export' },
  { value: 'SYSTEM', label: 'Système' },
  { value: 'WEBHOOK', label: 'Webhook' },
]

function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  })
}

export default function AuditLogPage() {
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [count, setCount] = useState(0)
  const [chainStatus, setChainStatus] = useState(null)
  const [filters, setFilters] = useState({ event_type: '', action: '', resource_label: '' })
  const PAGE_SIZE = 25

  const load = useCallback(() => {
    setLoading(true)
    auditAPI.list({
      event_type: filters.event_type || undefined,
      action: filters.action || undefined,
      resource_label: filters.resource_label || undefined,
      page,
      page_size: PAGE_SIZE,
      ordering: '-sequence',
    })
      .then(({ data }) => {
        setEntries(data.results || data)
        setCount(data.count || (data.results || data).length)
      })
      .catch(() => setEntries([]))
      .finally(() => setLoading(false))
  }, [filters, page])

  const verifyChain = useCallback(() => {
    auditAPI.verifyChain()
      .then(({ data }) => setChainStatus(data))
      .catch(() => setChainStatus({ valid: false, checked: 0 }))
  }, [])

  useEffect(() => { load() }, [load])
  useEffect(() => { verifyChain() }, [verifyChain])

  const setFilter = (key, val) => { setFilters(f => ({ ...f, [key]: val })); setPage(1) }
  const totalPages = Math.max(1, Math.ceil(count / PAGE_SIZE))

  return (
    <div style={{ padding: '1rem 0' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FiShield aria-hidden /> Journal d&apos;audit
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.5rem' }}>
            Piste d&apos;audit immuable — lecture seule ({count} entrée(s))
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
          {chainStatus && (
            <span className={`badge ${chainStatus.valid ? 'badge-success' : 'badge-danger'}`}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', padding: '0.35rem 0.75rem', borderRadius: 999 }}>
              {chainStatus.valid
                ? <><FiCheckCircle aria-hidden /> Chaîne intacte ({chainStatus.checked})</>
                : <><FiAlertTriangle aria-hidden /> Intégrité compromise</>}
            </span>
          )}
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => { load(); verifyChain() }}>
            <FiRefreshCw aria-hidden /> Actualiser
          </button>
        </div>
      </div>

      <div className="glass-card" style={{ padding: '1.25rem', marginBottom: '1.5rem', border: '1px solid var(--border-color)' }}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <FiFilter aria-hidden style={{ color: 'var(--text-secondary)' }} />
          <select className="form-select" style={{ width: 'auto', minWidth: 180 }}
            value={filters.event_type} onChange={e => setFilter('event_type', e.target.value)}>
            {EVENT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
          <input className="form-input" style={{ minWidth: 160, flex: 1 }}
            placeholder="Filtrer par action…" value={filters.action}
            onChange={e => setFilter('action', e.target.value)} />
          <input className="form-input" style={{ minWidth: 160, flex: 1 }}
            placeholder="Ticket, ressource…" value={filters.resource_label}
            onChange={e => setFilter('resource_label', e.target.value)} />
        </div>
      </div>

      {loading ? (
        <div className="loading-center"><div className="spinner" /></div>
      ) : entries.length === 0 ? (
        <div className="glass-card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
          Aucune entrée dans le journal.
        </div>
      ) : (
        <div className="glass-card" style={{ overflow: 'auto', border: '1px solid var(--border-color)' }}>
          <table className="data-table" style={{ minWidth: 900 }}>
            <thead>
              <tr>
                <th scope="col">#</th>
                <th scope="col">Date</th>
                <th scope="col">Type</th>
                <th scope="col">Action</th>
                <th scope="col">Acteur</th>
                <th scope="col">Ressource</th>
                <th scope="col">IP</th>
              </tr>
            </thead>
            <tbody>
              {entries.map(entry => (
                <tr key={entry.id}>
                  <td><code style={{ fontSize: '0.75rem' }}>{entry.sequence}</code></td>
                  <td style={{ whiteSpace: 'nowrap', fontSize: '0.85rem' }}>{formatDate(entry.created_at)}</td>
                  <td><span className="badge badge-neutral">{entry.event_type_display || entry.event_type}</span></td>
                  <td>{entry.action}</td>
                  <td>
                    <div style={{ fontSize: '0.85rem' }}>{entry.actor_label || entry.actor_name || '—'}</div>
                    {entry.actor_role && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{entry.actor_role}</div>
                    )}
                  </td>
                  <td>
                    {entry.resource_label || entry.resource_id || '—'}
                    {entry.new_value?.status && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        → {entry.new_value.status}
                      </div>
                    )}
                  </td>
                  <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{entry.ip_address || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '1.5rem' }}>
          <button type="button" className="btn btn-secondary btn-sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
            Précédent
          </button>
          <span style={{ alignSelf: 'center', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Page {page} / {totalPages}
          </span>
          <button type="button" className="btn btn-secondary btn-sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
            Suivant
          </button>
        </div>
      )}
    </div>
  )
}
