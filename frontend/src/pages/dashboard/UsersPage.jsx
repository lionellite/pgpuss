import React, { useState, useEffect } from 'react'
import { authAPI, establishmentsAPI } from '../../api'
import { useAuth } from '../../contexts/AuthContext'
import toast from 'react-hot-toast'
import { FiSearch, FiUser, FiEdit2, FiCheck, FiX } from 'react-icons/fi'

import {
  ROLE_LABELS,
  ROLES_NEED_ZONE,
  ROLES_NEED_DEPT,
  ROLES_NEED_ESTABLISHMENT,
} from '../../constants/roles'

const ROLE_OPTIONS = Object.entries(ROLE_LABELS)

export default function UsersPage() {
  const { user: currentUser } = useAuth()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [editing, setEditing] = useState(null)
  const [editRole, setEditRole] = useState('')
  const [editZone, setEditZone] = useState('')
  const [editDept, setEditDept] = useState('')
  const [editEst, setEditEst] = useState('')
  const [zones, setZones] = useState([])
  const [regions, setRegions] = useState([])
  const [establishments, setEstablishments] = useState([])

  useEffect(() => {
    establishmentsAPI.zones().then(({ data }) => setZones(data.results || data)).catch(() => {})
    establishmentsAPI.regions().then(({ data }) => setRegions(data.results || data)).catch(() => {})
    establishmentsAPI.list().then(({ data }) => setEstablishments(data.results || data)).catch(() => {})
  }, [])

  const load = () => {
    setLoading(true)
    authAPI.users({ search: search || undefined, role: roleFilter || undefined })
      .then(({ data }) => setUsers(data.results || data))
      .catch(() => setUsers([]))
      .finally(() => setLoading(false))
  }

  useEffect(load, [search, roleFilter])

  const startEdit = (u) => {
    setEditing(u.id)
    setEditRole(u.role)
    setEditZone(u.zone_sanitaire || '')
    setEditDept(u.departement || '')
    setEditEst(u.establishment || '')
  }

  const saveUser = async (userId) => {
    try {
      const patch = { role: editRole }
      if (ROLES_NEED_ZONE.includes(editRole)) {
        patch.zone_sanitaire = editZone || null
      }
      if (ROLES_NEED_DEPT.includes(editRole)) {
        patch.departement = editDept || ''
      }
      if (ROLES_NEED_ESTABLISHMENT.includes(editRole)) {
        patch.establishment = editEst || null
      }
      if (editRole === 'PNUSS') {
        patch.establishment = editEst || null
        if (editEst) {
          patch.zone_sanitaire = null
          patch.departement = ''
        } else if (editZone) {
          patch.zone_sanitaire = editZone
          patch.departement = ''
        } else if (editDept) {
          patch.departement = editDept
          patch.zone_sanitaire = null
        } else {
          patch.zone_sanitaire = null
          patch.departement = ''
        }
      }
      if (editRole === 'AUDITEUR') {
        patch.establishment = editEst || null
        patch.zone_sanitaire = editZone || null
        patch.departement = editDept || ''
      }
      await authAPI.updateUser(userId, patch)
      toast.success('Utilisateur mis à jour')
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

  if (currentUser?.role !== 'ADMIN_PLATEFORME') {
    return <div className="loading-center text-muted">Accès réservé à l&apos;administrateur de la plateforme.</div>
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
          <FiSearch aria-hidden style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
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
                <th>RATTACHEMENT</th>
                <th>STATUT</th>
                <th>INSCRIT LE</th>
                <th>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                  Aucun utilisateur trouvé
                </td></tr>
              ) : users.map(u => (
                <tr key={u.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{
                        width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
                        background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-container))',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '0.8rem', fontWeight: 700, color: 'white',
                      }}>{u.first_name?.[0]}{u.last_name?.[0]}</div>
                      <div>
                        <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>{u.full_name}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>#{u.id?.slice(0, 8)}</div>
                      </div>
                    </div>
                  </td>
                  <td className="text-muted" style={{ fontSize: '0.8rem' }}>{u.email}</td>
                  <td>
                    {editing === u.id ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                        <select className="form-select" style={{ padding: '0.3rem 0.5rem', fontSize: '0.8rem' }}
                          value={editRole} onChange={e => setEditRole(e.target.value)}>
                          {ROLE_OPTIONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                        </select>
                        {ROLES_NEED_ZONE.includes(editRole) && (
                          <select className="form-select" style={{ padding: '0.3rem 0.5rem', fontSize: '0.75rem' }}
                            value={editZone} onChange={e => setEditZone(e.target.value)}>
                            <option value="">Zone sanitaire…</option>
                            {zones.map(z => <option key={z.id} value={z.id}>{z.name}</option>)}
                          </select>
                        )}
                        {ROLES_NEED_DEPT.includes(editRole) && (
                          <select className="form-select" style={{ padding: '0.3rem 0.5rem', fontSize: '0.75rem' }}
                            value={editDept} onChange={e => setEditDept(e.target.value)}>
                            <option value="">Département…</option>
                            {regions.map(r => <option key={r.id} value={r.name}>{r.name}</option>)}
                          </select>
                        )}
                        {(ROLES_NEED_ESTABLISHMENT.includes(editRole) || editRole === 'PNUSS' || editRole === 'AUDITEUR') && (
                          <select className="form-select" style={{ padding: '0.3rem 0.5rem', fontSize: '0.75rem' }}
                            value={editEst} onChange={e => setEditEst(e.target.value)}>
                            <option value="">Établissement (optionnel)…</option>
                            {establishments.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                          </select>
                        )}
                        <div style={{ display: 'flex', gap: '0.3rem' }}>
                          <button className="btn btn-secondary btn-sm" style={{ padding: '0.3rem' }} onClick={() => saveUser(u.id)}><FiCheck /></button>
                          <button className="btn btn-ghost btn-sm" style={{ padding: '0.3rem' }} onClick={() => setEditing(null)}><FiX /></button>
                        </div>
                      </div>
                    ) : (
                      <span className="badge badge-info">{ROLE_LABELS[u.role] || u.role}</span>
                    )}
                  </td>
                  <td className="text-muted" style={{ fontSize: '0.75rem' }}>
                    {u.establishment_name && <div>{u.establishment_name}</div>}
                    {u.zone_sanitaire_name && <div>🗺️ {u.zone_sanitaire_name}</div>}
                    {u.departement && <div>🏛️ {u.departement}</div>}
                    {!u.establishment_name && !u.zone_sanitaire_name && !u.departement && '—'}
                  </td>
                  <td>
                    <span className={`badge ${u.is_active ? 'badge-resolue' : 'badge-rejetee'}`}>
                      {u.is_active ? 'Actif' : 'Inactif'}
                    </span>
                  </td>
                  <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {new Date(u.created_at).toLocaleDateString('fr-FR')}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      {u.id !== currentUser?.id && (
                        <>
                          <button className="btn btn-ghost btn-sm" title="Modifier"
                            onClick={() => startEdit(u)}>
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
