import React, { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { authAPI } from '../../api'
import { useAuth } from '../../contexts/AuthContext'

export default function InternalAgentsPage() {
  const { user } = useAuth()
  const [agents, setAgents] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({ first_name: '', last_name: '', email: '', phone: '', password: '' })

  const filtered = useMemo(() => {
    const q = (search || '').trim().toLowerCase()
    if (!q) return agents
    return agents.filter(a =>
      `${a.full_name || ''} ${a.email || ''} ${a.phone || ''}`.toLowerCase().includes(q)
    )
  }, [agents, search])

  const load = async () => {
    setLoading(true)
    try {
      const { data } = await authAPI.users({ role: 'AGENT_INTERNE' })
      setAgents(data.results || data)
    } catch {
      setAgents([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const create = async () => {
    try {
      if (!form.first_name.trim()) {
        toast.error('Le prénom est requis')
        return
      }
      await authAPI.createUser(form)
      toast.success('Agent interne créé')
      setShowCreate(false)
      setForm({ first_name: '', last_name: '', email: '', phone: '', password: '' })
      load()
    } catch (e) {
      const err = e.response?.data
      toast.error(err?.non_field_errors?.[0] || err?.error || err?.email?.[0] || err?.phone?.[0] || 'Erreur')
    }
  }

  const toggleActive = async (agent) => {
    try {
      await authAPI.updateUser(agent.id, { is_active: !agent.is_active })
      toast.success(agent.is_active ? 'Agent désactivé' : 'Agent activé')
      load()
    } catch (e) {
      const err = e.response?.data
      toast.error(err?.error || 'Erreur')
    }
  }

  if (user?.role !== 'PFE') {
    return <div className="loading-center text-muted">Accès réservé au PFE.</div>
  }

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 className="page-title">Agents internes</h1>
        <p className="page-subtitle">Gestion des agents internes de votre établissement</p>
      </div>

      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
        <input
          className="form-input"
          style={{ flex: 1, minWidth: 240 }}
          placeholder="Rechercher (nom, email, téléphone)..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
          + Ajouter un agent
        </button>
      </div>

      {loading ? (
        <div className="loading-center"><div className="spinner" /></div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>AGENT</th>
                <th>EMAIL</th>
                <th>TÉLÉPHONE</th>
                <th>STATUT</th>
                <th>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={5} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>Aucun agent</td></tr>
              ) : filtered.map(a => (
                <tr key={a.id}>
                  <td>
                    <div style={{ fontWeight: 700 }}>{a.full_name || `${a.first_name || ''} ${a.last_name || ''}`}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>#{a.id?.slice(0, 8)}</div>
                  </td>
                  <td style={{ fontSize: '0.85rem' }}>{a.email || '—'}</td>
                  <td style={{ fontSize: '0.85rem' }}>{a.phone || '—'}</td>
                  <td>
                    <span className={`badge ${a.is_active ? 'badge-resolue' : 'badge-rejetee'}`}>
                      {a.is_active ? 'Actif' : 'Inactif'}
                    </span>
                  </td>
                  <td>
                    <button className={`btn btn-sm ${a.is_active ? 'btn-danger' : 'btn-secondary'}`} onClick={() => toggleActive(a)}>
                      {a.is_active ? 'Désactiver' : 'Activer'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Créer un agent interne</h3>
              <button className="modal-close" onClick={() => setShowCreate(false)}>✕</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <input className="form-input" placeholder="Prénom *" value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} />
              <input className="form-input" placeholder="Nom" value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} />
              <input className="form-input" placeholder="Email (optionnel)" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              <input className="form-input" placeholder="Téléphone (optionnel)" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              <input className="form-input" type="password" placeholder="Mot de passe (optionnel)" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <button className="btn btn-ghost" onClick={() => setShowCreate(false)}>Annuler</button>
                <button className="btn btn-primary" onClick={create}>Créer</button>
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                Astuce: si vous laissez le mot de passe vide, un mot de passe temporaire est défini et l’agent devra le changer à la première connexion.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

