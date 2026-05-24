import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { complaintsAPI } from '../../api'
import { useAuth } from '../../contexts/AuthContext'
import StatusBadge from '../../components/StatusBadge'
import PriorityBadge from '../../components/PriorityBadge'
import { FiPlusCircle, FiSearch, FiFilter, FiFileText } from 'react-icons/fi'

export default function MesPlaintesPage() {
  const { user } = useAuth()
  const [complaints, setComplaints] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  useEffect(() => {
    setLoading(true)
    complaintsAPI.list({ search, status: statusFilter || undefined })
      .then(({ data }) => setComplaints(data.results || data))
      .catch(() => setComplaints([]))
      .finally(() => setLoading(false))
  }, [search, statusFilter])

  return (
    <div style={{ padding: '2rem 0' }}>
      <div className="page-container">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 className="page-title">Mes plaintes</h1>
            <p className="page-subtitle">Suivez l'avancement de toutes vos plaintes</p>
          </div>
          <Link to="/espace/deposer" className="btn btn-primary">
            <FiPlusCircle /> Nouvelle plainte
          </Link>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
            <FiSearch aria-hidden style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input className="form-input" style={{ paddingLeft: '2.5rem' }}
              placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="form-select" style={{ width: 'auto', minWidth: 180 }}
            value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="">Tous les statuts</option>
            <option value="SOUMISE">Soumise</option>
            <option value="ACCUSEE">Accusée</option>
            <option value="AFFECTEE">Affectée</option>
            <option value="EN_TRAITEMENT">Investigation</option>
            <option value="RESOLUE">Résolue</option>
            <option value="CLOTUREE">Clôturée</option>
          </select>
        </div>

        {loading ? (
          <div className="loading-center"><div className="spinner" /></div>
        ) : complaints.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 0' }}>
            <FiFileText aria-hidden style={{ fontSize: '2.5rem', color: 'var(--text-muted)', marginBottom: '1rem' }} />
            <h3 className="text-muted" style={{ marginBottom: '0.5rem' }}>Aucune plainte trouvée</h3>
            <p className="text-muted" style={{ fontSize: '0.875rem', marginBottom: '1.5rem' }}>
              Vous n'avez pas encore déposé de plainte.
            </p>
            <Link to="/deposer" className="btn btn-primary"><FiPlusCircle /> Déposer une plainte</Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {complaints.map(c => (
              <Link key={c.id} to={`/espace/plaintes/${c.id}`} style={{ textDecoration: 'none' }}>
                <div className="card card--padding-sm" style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                  <div className="list-row-icon"><FiFileText aria-hidden /></div>
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <div style={{ fontWeight: 600, marginBottom: '0.2rem', fontSize: '0.9rem' }}>
                      {c.title}
                    </div>
                    <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                      {c.ticket_number} • {c.establishment_name || 'Établissement non spécifié'} • {c.category_name || '—'}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0, flexWrap: 'wrap', alignItems: 'center' }}>
                    <StatusBadge status={c.status} />
                    <PriorityBadge priority={c.priority} />
                    {c.is_overdue && <span className="badge badge-escaladee">En retard</span>}
                  </div>
                  <div className="text-muted" style={{ fontSize: '0.75rem', flexShrink: 0 }}>
                    {new Date(c.created_at).toLocaleDateString('fr-FR')}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
