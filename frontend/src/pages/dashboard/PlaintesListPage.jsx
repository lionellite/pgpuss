import React, { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { complaintsAPI } from '../../api'
import StatusBadge from '../../components/StatusBadge'
import PriorityBadge from '../../components/PriorityBadge'
import { FiSearch, FiFilter, FiEye, FiRefreshCw } from 'react-icons/fi'

export default function PlaintesListPage() {
  const [complaints, setComplaints] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [count, setCount] = useState(0)
  const [filters, setFilters] = useState({ search: '', status: '', priority: '', channel: '' })
  const PAGE_SIZE = 20

  const load = useCallback(() => {
    setLoading(true)
    complaintsAPI.list({
      search: filters.search || undefined,
      status: filters.status || undefined,
      priority: filters.priority || undefined,
      channel: filters.channel || undefined,
      page,
      page_size: PAGE_SIZE,
    }).then(({ data }) => {
      setComplaints(data.results || data)
      setCount(data.count || (data.results || data).length)
    }).catch(() => setComplaints([]))
    .finally(() => setLoading(false))
  }, [filters, page])

  useEffect(() => { load() }, [load])

  const setFilter = (key, val) => { setFilters(f => ({ ...f, [key]: val })); setPage(1) }

  return (
    <div style={{ padding: '1rem 0' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
        <div>
          <h1 className="page-title">Gestion des plaintes</h1>
          <p style={{ color: '#666', fontSize: '0.9rem', marginTop: '0.5rem' }}>{count} dossier(s) répertorié(s)</p>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={load}>
          <FiRefreshCw /> ACTUALISER
        </button>
      </div>

      {/* Filters */}
      <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '1.5rem', border: '1px solid #ddd', boxShadow: 'none' }}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
            <FiSearch style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: '#666' }} />
            <input className="form-input" style={{ paddingLeft: '2.5rem' }}
              placeholder="N° de ticket, titre..." value={filters.search}
              onChange={e => setFilter('search', e.target.value)} />
          </div>
          <select className="form-select" style={{ width: 'auto', minWidth: 160 }}
            value={filters.status} onChange={e => setFilter('status', e.target.value)}>
            <option value="">Tous les statuts</option>
            {['DEPOSEE','ENREGISTREE','CLASSIFIEE','AFFECTEE','EN_INSTRUCTION','RESOLUE','CLOTURE_PROVISOIRE','CLOTURE_DEFINITIVE','CONTESTEE','ESCALADEE'].map(s => (
              <option key={s} value={s}>{s.replace(/_/g,' ')}</option>
            ))}
          </select>
          <select className="form-select" style={{ width: 'auto', minWidth: 140 }}
            value={filters.priority} onChange={e => setFilter('priority', e.target.value)}>
            <option value="">Toutes priorités</option>
            {['P1','P2','P3','P4','P5'].map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          <select className="form-select" style={{ width: 'auto', minWidth: 140 }}
            value={filters.channel} onChange={e => setFilter('channel', e.target.value)}>
            <option value="">Tous canaux</option>
            {['WEB','MOBILE','SMS','CHATBOT','GUICHET'].map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="loading-center"><div className="spinner" /></div>
      ) : (
        <>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>TICKET</th>
                  <th>TITRE</th>
                  <th>ÉTABLISSEMENT</th>
                  <th>STATUT</th>
                  <th>PRIORITÉ</th>
                  <th>CANAL</th>
                  <th>DATE</th>
                  <th>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {complaints.length === 0 ? (
                  <tr><td colSpan={8} style={{ textAlign: 'center', padding: '3rem', color: '#666' }}>
                    Aucun dossier trouvé.
                  </td></tr>
                ) : complaints.map(c => (
                  <tr key={c.id}>
                    <td style={{ verticalAlign: 'middle' }}>
                      <span style={{ fontWeight: 800, fontSize: '0.85rem', color: '#111' }}>
                        {c.ticket_number}
                      </span>
                      {c.is_overdue && <span className="badge badge-escaladee" style={{ marginLeft: '0.5rem' }}>RETARD</span>}
                    </td>
                    <td style={{ maxWidth: 250 }}>
                      <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.9rem', fontWeight: 600, color: '#111' }}>{c.title}</div>
                      <div style={{ fontSize: '0.75rem', color: '#666' }}>{c.category_name}</div>
                    </td>
                    <td style={{ fontSize: '0.8rem', color: '#444', maxWidth: 150 }}>
                      <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {c.establishment_name || '—'}
                      </div>
                    </td>
                    <td><StatusBadge status={c.status} /></td>
                    <td><PriorityBadge priority={c.priority} /></td>
                    <td>
                      <span style={{ fontSize: '0.75rem', color: '#8FA3BF', background: 'rgba(0,119,182,0.07)', padding: '0.2rem 0.5rem', borderRadius: '6px' }}>
                        {c.channel_display}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.75rem', color: '#4A6080' }}>
                      {new Date(c.created_at).toLocaleDateString('fr-FR')}
                    </td>
                    <td>
                      <Link to={`/dashboard/plaintes/${c.id}`} className="btn btn-ghost btn-sm">
                        <FiEye /> Voir
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {count > PAGE_SIZE && (
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', marginTop: '1.5rem', alignItems: 'center' }}>
              <button className="btn btn-ghost btn-sm" onClick={() => setPage(p => p - 1)} disabled={page === 1}>←</button>
              <span style={{ fontSize: '0.875rem', color: '#8FA3BF' }}>
                Page {page} / {Math.ceil(count / PAGE_SIZE)}
              </span>
              <button className="btn btn-ghost btn-sm" onClick={() => setPage(p => p + 1)} disabled={page >= Math.ceil(count / PAGE_SIZE)}>→</button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
