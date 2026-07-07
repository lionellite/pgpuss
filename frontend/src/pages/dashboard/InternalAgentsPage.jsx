import React, { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { authAPI } from '../../api'
import { useAuth } from '../../contexts/AuthContext'

const ALLOWED_ROLES = ['PFE', 'PFZS', 'DDS', 'DQSS', 'CABINET', 'DIRECTEUR_EST']

const SCOPE_LABELS = {
  PFE: 'agents internes de votre établissement',
  PFZS: 'agents internes des établissements de votre zone sanitaire',
  DDS: 'agents internes des établissements de votre département',
  DQSS: 'agents internes des établissements nationaux',
  CABINET: 'agents internes (vue nationale)',
  DIRECTEUR_EST: 'agents internes de votre établissement',
}

const EMPTY_FORM = {
  first_name: '', last_name: '', email: '', phone: '',
  password: '', role: 'AGENT_INTERNE',
}

export default function InternalAgentsPage() {
  const { user } = useAuth()
  const [agents, setAgents] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [editAgent, setEditAgent] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

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

  const openCreate = () => {
    setForm(EMPTY_FORM)
    setEditAgent(null)
    setShowCreate(true)
  }

  const openEdit = (agent) => {
    setForm({
      first_name: agent.first_name || '',
      last_name: agent.last_name || '',
      email: agent.email || '',
      phone: agent.phone || '',
      password: '',
      role: agent.role || 'AGENT_INTERNE',
    })
    setEditAgent(agent)
    setShowCreate(true)
  }

  const save = async () => {
    if (!form.first_name.trim()) { toast.error('Le prénom est requis'); return }
    setSaving(true)
    try {
      if (editAgent) {
        const payload = { first_name: form.first_name, last_name: form.last_name }
        if (form.email) payload.email = form.email
        if (form.phone) payload.phone = form.phone
        if (form.password) payload.password = form.password
        await authAPI.updateUser(editAgent.id, payload)
        toast.success('Agent mis à jour')
      } else {
        const payload = { ...form }
        if (!payload.email) delete payload.email
        if (!payload.phone) delete payload.phone
        if (!payload.password) delete payload.password
        await authAPI.createUser(payload)
        toast.success('Agent créé avec succès')
      }
      setShowCreate(false)
      setEditAgent(null)
      load()
    } catch (e) {
      const err = e.response?.data
      toast.error(
        err?.non_field_errors?.[0] || err?.error || err?.email?.[0] ||
        err?.phone?.[0] || err?.first_name?.[0] || 'Erreur lors de la sauvegarde'
      )
    } finally {
      setSaving(false)
    }
  }

  const toggleActive = async (agent) => {
    try {
      await authAPI.updateUser(agent.id, { is_active: !agent.is_active })
      toast.success(agent.is_active ? 'Agent désactivé' : 'Agent activé')
      load()
    } catch (e) {
      toast.error(e.response?.data?.error || 'Erreur')
    }
  }

  if (!ALLOWED_ROLES.includes(user?.role)) {
    return <div className="loading-center text-muted">Accès non autorisé.</div>
  }

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 className="page-title">Agents internes</h1>
        <p className="page-subtitle">Gestion des {SCOPE_LABELS[user?.role] || 'agents internes'}</p>
      </div>

      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
        <input
          className="form-input"
          style={{ flex: 1, minWidth: 240 }}
          placeholder="Rechercher (nom, email, téléphone)..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button className="btn btn-primary" onClick={openCreate}>
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
                <th>RÔLE</th>
                <th>STATUT</th>
                <th>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>Aucun agent</td></tr>
              ) : filtered.map(a => (
                <tr key={a.id}>
                  <td>
                    <div style={{ fontWeight: 700 }}>{a.full_name || `${a.first_name || ''} ${a.last_name || ''}`}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>#{a.id?.slice(0, 8)}</div>
                  </td>
                  <td style={{ fontSize: '0.85rem' }}>{a.email || '—'}</td>
                  <td style={{ fontSize: '0.85rem' }}>{a.phone || '—'}</td>
                  <td style={{ fontSize: '0.8rem' }}>{a.role_display || a.role || '—'}</td>
                  <td>
                    <span className={`badge ${a.is_active ? 'badge-resolue' : 'badge-rejetee'}`}>
                      {a.is_active ? 'Actif' : 'Inactif'}
                    </span>
                  </td>
                  <td style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <button className="btn btn-sm btn-secondary" onClick={() => openEdit(a)}>
                      Modifier
                    </button>
                    <button
                      className={`btn btn-sm ${a.is_active ? 'btn-danger' : 'btn-ghost'}`}
                      onClick={() => toggleActive(a)}
                    >
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
        <div className="modal-overlay" onClick={() => { setShowCreate(false); setEditAgent(null) }}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{editAgent ? 'Modifier l\'agent' : 'Ajouter un agent interne'}</h3>
              <button className="modal-close" onClick={() => { setShowCreate(false); setEditAgent(null) }}>✕</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <input
                  className="form-input" placeholder="Prénom *"
                  value={form.first_name}
                  onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                  style={{ flex: 1 }}
                />
                <input
                  className="form-input" placeholder="Nom"
                  value={form.last_name}
                  onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                  style={{ flex: 1 }}
                />
              </div>
              <input
                className="form-input" placeholder="Email (optionnel)"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
              <input
                className="form-input" placeholder="Téléphone (optionnel)"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
              <input
                className="form-input" type="password"
                placeholder={editAgent ? 'Nouveau mot de passe (laisser vide pour ne pas changer)' : 'Mot de passe (optionnel)'}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
              {!form.email && !form.phone && (
                <div style={{ fontSize: '0.8rem', color: 'var(--color-danger)', fontWeight: 600 }}>
                  ⚠️ L'email ou le téléphone est requis.
                </div>
              )}
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <button className="btn btn-ghost" onClick={() => { setShowCreate(false); setEditAgent(null) }}>Annuler</button>
                <button className="btn btn-primary" onClick={save} disabled={saving}>
                  {saving ? 'Enregistrement…' : (editAgent ? 'Mettre à jour' : 'Créer')}
                </button>
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                Si le mot de passe est laissé vide, un mot de passe temporaire est généré et l'agent devra le changer à la première connexion.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
