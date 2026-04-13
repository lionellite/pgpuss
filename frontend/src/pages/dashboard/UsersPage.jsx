import React, { useState, useEffect } from 'react'
import { authAPI } from '../../api'
import { useAuth } from '../../contexts/AuthContext'
import toast from 'react-hot-toast'
import { FiSearch, FiUser, FiEdit2, FiCheck, FiX } from 'react-icons/fi'

const ROLE_LABELS = {
  USAGER: 'Usager',
  AGENT_RECEPTION: 'Agent de réception',
  GESTIONNAIRE_SERVICE: 'Gestionnaire',
  MEDIATEUR: 'Médiateur',
  DIRECTEUR: 'Directeur',
  RESPONSABLE_QUALITE: 'Resp. qualité',
  ADMIN_NATIONAL: 'Admin national',
  AUDITEUR: 'Auditeur',
}

const ROLE_OPTIONS = Object.entries(ROLE_LABELS)

export default function UsersPage() {
  const { user: currentUser } = useAuth()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [editing, setEditing] = useState(null)
  const [editRole, setEditRole] = useState('')

  const load = () => {
    setLoading(true)
    authAPI.users({ search: search || undefined, role: roleFilter || undefined })
      .then(({ data }) => setUsers(data.results || data))
      .catch(() => setUsers([]))
      .finally(() => setLoading(false))
  }

  useEffect(load, [search, roleFilter])

  const saveRole = async (userId) => {
    try {
      await authAPI.updateUser(userId, { role: editRole })
      toast.success('Rôle mis à jour')
      setEditing(null)
      load()
    } catch { toast.error('Erreur lors de la mise à jour') }
  }

  const toggleActive = async (user) => {
    try {
      await authAPI.updateUser(user.id, { is_active: !user.is_active })
      toast.success(user.is_active ? 'Compte désactivé' : 'Compte activé')
      load()
    } catch { toast.error('Erreur') }
  }

  if (currentUser?.role !== 'ADMIN_NATIONAL') {
    return <div className="loading-center" style={{ color: '#8FA3BF' }}>Accès réservé à l'administrateur national.</div>
  }

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 className="page-title">Gestion des utilisateurs</h1>
        <p className="page-subtitle">{users.length} utilisateur(s)</p>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <FiSearch style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: '#8FA3BF' }} />
          <input className="form-input" style={{ paddingLeft: '2.5rem' }}
            placeholder="Nom, email..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="form-select" style={{ width: 'auto', minWidth: 180 }}
          value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
          <option value="">Tous les rôles</option>
          {ROLE_OPTIONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="loading-center"><div className="spinner" /></div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>UTILISATEUR</th>
                <th>EMAIL</th>
                <th>RÔLE</th>
                <th>ÉTABLISSEMENT</th>
                <th>STATUT</th>
                <th>INSCRIT LE</th>
                <th>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: '3rem', color: '#4A6080' }}>
                  Aucun utilisateur trouvé
                </td></tr>
              ) : users.map(u => (
                <tr key={u.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{
                        width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
                        background: 'linear-gradient(135deg, #0077B6, #06D6A0)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '0.8rem', fontWeight: 700, color: 'white',
                      }}>{u.first_name?.[0]}{u.last_name?.[0]}</div>
                      <div>
                        <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#F0F4FF' }}>{u.full_name}</div>
                        <div style={{ fontSize: '0.7rem', color: '#4A6080' }}>#{u.id?.slice(0, 8)}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ fontSize: '0.8rem', color: '#8FA3BF' }}>{u.email}</td>
                  <td>
                    {editing === u.id ? (
                      <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                        <select className="form-select" style={{ padding: '0.3rem 0.5rem', fontSize: '0.8rem' }}
                          value={editRole} onChange={e => setEditRole(e.target.value)}>
                          {ROLE_OPTIONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                        </select>
                        <button className="btn btn-secondary btn-sm" style={{ padding: '0.3rem' }} onClick={() => saveRole(u.id)}><FiCheck /></button>
                        <button className="btn btn-ghost btn-sm" style={{ padding: '0.3rem' }} onClick={() => setEditing(null)}><FiX /></button>
                      </div>
                    ) : (
                      <span className="badge badge-enregistree">{ROLE_LABELS[u.role] || u.role}</span>
                    )}
                  </td>
                  <td style={{ fontSize: '0.8rem', color: '#8FA3BF' }}>{u.establishment_name || '—'}</td>
                  <td>
                    <span className={`badge ${u.is_active ? 'badge-resolue' : 'badge-rejetee'}`}>
                      {u.is_active ? 'Actif' : 'Inactif'}
                    </span>
                  </td>
                  <td style={{ fontSize: '0.75rem', color: '#4A6080' }}>
                    {new Date(u.created_at).toLocaleDateString('fr-FR')}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      {u.id !== currentUser?.id && (
                        <>
                          <button className="btn btn-ghost btn-sm" title="Modifier le rôle"
                            onClick={() => { setEditing(u.id); setEditRole(u.role) }}>
                            <FiEdit2 />
                          </button>
                          <button className={`btn btn-sm ${u.is_active ? 'btn-danger' : 'btn-secondary'}`}
                            style={{ fontSize: '0.75rem' }} onClick={() => toggleActive(u)}>
                            {u.is_active ? <FiX /> : <FiCheck />}
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
