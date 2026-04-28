import React, { useState, useEffect } from 'react'
import { authAPI } from '../../api'
import { useAuth } from '../../contexts/AuthContext'
import toast from 'react-hot-toast'

const ROLE_LABELS = {
  USAGER: 'Citoyen',
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
      toast.success('Rôle mis à jour avec succès')
      setEditing(null)
      load()
    } catch { toast.error('Erreur lors de la mise à jour') }
  }

  const toggleActive = async (user) => {
    try {
      await authAPI.updateUser(user.id, { is_active: !user.is_active })
      toast.success(user.is_active ? 'Compte suspendu' : 'Compte réactivé')
      load()
    } catch { toast.error('Erreur lors de l\'opération') }
  }

  if (currentUser?.role !== 'ADMIN_NATIONAL') {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <span className="material-symbols-outlined text-error text-6xl mb-4">gpp_maybe</span>
        <h2 className="text-xl font-black text-on-surface uppercase tracking-tight">Accès restreint</h2>
        <p className="text-sm text-slate-400 mt-2">Cette page est réservée à l'administration centrale.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <header>
        <h1 className="text-2xl font-black text-on-surface tracking-tight">Gestion des utilisateurs</h1>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Contrôle des accès et des habilitations</p>
      </header>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-wrap gap-4 items-center">
        <div className="relative flex-1 min-w-[240px]">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">search</span>
          <input
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border-none rounded-lg text-sm focus:ring-2 focus:ring-primary transition-all"
            placeholder="Rechercher par nom ou email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select
          className="form-select text-sm py-2 bg-white border-slate-200 rounded-lg focus:ring-primary min-w-[200px]"
          value={roleFilter}
          onChange={e => setRoleFilter(e.target.value)}
        >
          <option value="">Tous les rôles</option>
          {ROLE_OPTIONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <button className="btn btn-primary px-4 py-2 text-xs" onClick={load}>
          <span className="material-symbols-outlined text-sm mr-2">refresh</span>
          Actualiser
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <span className="material-symbols-outlined animate-spin text-primary text-4xl">progress_activity</span>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Utilisateur</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Rôle</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Habilitation</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-20 text-center">
                      <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Aucun résultat trouvé</p>
                    </td>
                  </tr>
                ) : users.map(u => (
                  <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-black text-xs border-2 border-white shadow-sm">
                          {u.first_name?.[0]}{u.last_name?.[0]}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-on-surface leading-none">{u.full_name}</p>
                          <p className="text-[10px] text-slate-400 mt-1">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {editing === u.id ? (
                        <div className="flex items-center space-x-2 animate-in zoom-in-95">
                          <select
                            className="form-select text-[10px] font-bold py-1 px-2 border-slate-200 rounded"
                            value={editRole}
                            onChange={e => setEditRole(e.target.value)}
                          >
                            {ROLE_OPTIONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                          </select>
                          <button className="text-secondary hover:bg-secondary/10 p-1 rounded transition-colors" onClick={() => saveRole(u.id)}>
                            <span className="material-symbols-outlined text-sm">check</span>
                          </button>
                          <button className="text-slate-400 hover:bg-slate-100 p-1 rounded transition-colors" onClick={() => setEditing(null)}>
                            <span className="material-symbols-outlined text-sm">close</span>
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2 group">
                          <span className="px-2 py-0.5 bg-primary/5 text-primary text-[10px] font-black rounded-full uppercase tracking-tighter">
                            {ROLE_LABELS[u.role] || u.role}
                          </span>
                          {u.id !== currentUser?.id && (
                            <button
                              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-slate-300 hover:text-primary"
                              onClick={() => { setEditing(u.id); setEditRole(u.role) }}
                            >
                              <span className="material-symbols-outlined text-xs">edit</span>
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <span className={`w-2 h-2 rounded-full mr-2 ${u.is_active ? 'bg-secondary animate-pulse' : 'bg-slate-300'}`}></span>
                        <span className={`text-[10px] font-black uppercase tracking-widest ${u.is_active ? 'text-secondary' : 'text-slate-400'}`}>
                          {u.is_active ? 'Compte Actif' : 'Compte Suspendu'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {u.id !== currentUser?.id && (
                        <button
                          onClick={() => toggleActive(u)}
                          className={`inline-flex items-center px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                            u.is_active
                              ? 'bg-error/5 text-error hover:bg-error hover:text-white'
                              : 'bg-secondary/5 text-secondary hover:bg-secondary hover:text-white'
                          }`}
                        >
                          <span className="material-symbols-outlined text-sm mr-1.5">
                            {u.is_active ? 'block' : 'lock_open'}
                          </span>
                          {u.is_active ? 'Suspendre' : 'Activer'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
