import React, { useEffect, useState } from 'react'
import { adminReferentialsAPI } from '../../api'
import toast from 'react-hot-toast'

const emptyPriority = { code: '', label: '', hours_target: 168, order: 0, is_active: true }

export default function ReferentialsAdminPage() {
  const [priorities, setPriorities] = useState([])
  const [perms, setPerms] = useState([])
  const [newP, setNewP] = useState(emptyPriority)
  const [editPerm, setEditPerm] = useState(null)
  const [permJson, setPermJson] = useState('{}')

  const load = () => {
    Promise.all([
      adminReferentialsAPI.priorityLevels(),
      adminReferentialsAPI.rolePermissions(),
    ])
      .then(([pr, pe]) => {
        setPriorities(pr.data.results || pr.data)
        setPerms(pe.data.results || pe.data)
      })
      .catch(() => toast.error('Accès refusé ou erreur réseau'))
  }

  useEffect(() => {
    load()
  }, [])

  const savePriority = async (row, patch) => {
    try {
      await adminReferentialsAPI.priorityLevelUpdate(row.id, patch)
      toast.success('Priorité mise à jour')
      load()
    } catch {
      toast.error('Erreur enregistrement')
    }
  }

  const createPriority = async (e) => {
    e.preventDefault()
    try {
      await adminReferentialsAPI.priorityLevelCreate(newP)
      toast.success('Priorité créée')
      setNewP(emptyPriority)
      load()
    } catch {
      toast.error('Création impossible (code déjà utilisé ?)')
    }
  }

  const deletePriority = async (id) => {
    if (!window.confirm('Supprimer ce niveau ?')) return
    try {
      await adminReferentialsAPI.priorityLevelDelete(id)
      toast.success('Supprimé')
      load()
    } catch {
      toast.error('Suppression impossible')
    }
  }

  const openPerm = (p) => {
    setEditPerm(p)
    setPermJson(JSON.stringify(p.permissions || {}, null, 2))
  }

  const savePerm = async () => {
    let parsed
    try {
      parsed = JSON.parse(permJson)
    } catch {
      toast.error('JSON invalide')
      return
    }
    try {
      await adminReferentialsAPI.rolePermissionUpdate(editPerm.id, { permissions: parsed })
      toast.success('Permissions enregistrées')
      setEditPerm(null)
      load()
    } catch {
      toast.error('Erreur enregistrement')
    }
  }

  const createPerm = async () => {
    const role = window.prompt('Code rôle (ex: PFE)')
    if (!role) return
    try {
      await adminReferentialsAPI.rolePermissionCreate({ role, permissions: {} })
      toast.success('Entrée créée')
      load()
    } catch {
      toast.error('Création impossible')
    }
  }

  return (
    <div style={{ maxWidth: 960 }}>
      <h1 style={{ fontSize: '1.25rem', marginBottom: '1rem', fontWeight: 800 }}>Référentiels plateforme</h1>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '2rem' }}>
        Niveaux de priorité (délais cibles) et permissions fines par rôle. Réservé à l&apos;administrateur plateforme.
      </p>

      <section className="glass-card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1rem', marginBottom: '1rem', fontWeight: 700 }}>Niveaux de priorité</h2>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table" style={{ width: '100%', fontSize: '0.85rem' }}>
            <thead>
              <tr>
                <th>Code</th>
                <th>Libellé</th>
                <th>Heures cible</th>
                <th>Ordre</th>
                <th>Actif</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {priorities.map((p) => (
                <tr key={p.id}>
                  <td>{p.code}</td>
                  <td>
                    <input
                      className="form-input"
                      style={{ width: '100%', minWidth: 140 }}
                      defaultValue={p.label}
                      aria-label={`Libellé ${p.code}`}
                      onBlur={(e) => {
                        if (e.target.value !== p.label) savePriority(p, { label: e.target.value })
                      }}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      className="form-input"
                      style={{ width: 88 }}
                      defaultValue={p.hours_target}
                      aria-label={`Heures ${p.code}`}
                      onBlur={(e) => {
                        const v = parseInt(e.target.value, 10)
                        if (!Number.isNaN(v) && v !== p.hours_target) savePriority(p, { hours_target: v })
                      }}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      className="form-input"
                      style={{ width: 64 }}
                      defaultValue={p.order}
                      aria-label={`Ordre ${p.code}`}
                      onBlur={(e) => {
                        const v = parseInt(e.target.value, 10)
                        if (!Number.isNaN(v) && v !== p.order) savePriority(p, { order: v })
                      }}
                    />
                  </td>
                  <td>
                    <input
                      type="checkbox"
                      defaultChecked={p.is_active}
                      aria-label={`Actif ${p.code}`}
                      onChange={(e) => savePriority(p, { is_active: e.target.checked })}
                    />
                  </td>
                  <td>
                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => deletePriority(p.id)}>
                      Supprimer
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <form onSubmit={createPriority} style={{ marginTop: '1rem', display: 'grid', gap: '0.75rem', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', alignItems: 'end' }}>
          <div className="form-group">
            <label className="form-label">Nouveau code</label>
            <input className="form-input" value={newP.code} onChange={(e) => setNewP({ ...newP, code: e.target.value })} placeholder="P6" required />
          </div>
          <div className="form-group">
            <label className="form-label">Libellé</label>
            <input className="form-input" value={newP.label} onChange={(e) => setNewP({ ...newP, label: e.target.value })} required />
          </div>
          <div className="form-group">
            <label className="form-label">Heures</label>
            <input type="number" className="form-input" value={newP.hours_target} onChange={(e) => setNewP({ ...newP, hours_target: +e.target.value })} />
          </div>
          <button type="submit" className="btn btn-primary btn-sm">Ajouter</button>
        </form>
      </section>

      <section className="glass-card" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 700 }}>Permissions par rôle (JSON)</h2>
          <button type="button" className="btn btn-secondary btn-sm" onClick={createPerm}>
            Nouvelle ligne
          </button>
        </div>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {perms.map((p) => (
            <li key={p.id} style={{ padding: '0.65rem 0', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
              <strong>{p.role}</strong>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => openPerm(p)}>
                Éditer
              </button>
            </li>
          ))}
        </ul>
      </section>

      {editPerm && (
        <div className="modal-overlay" onClick={() => setEditPerm(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 560 }}>
            <div className="modal-header">
              <h3 className="modal-title">Permissions — {editPerm.role}</h3>
              <button type="button" className="modal-close" onClick={() => setEditPerm(null)}>✕</button>
            </div>
            <textarea className="form-textarea" style={{ minHeight: 240, fontFamily: 'monospace', fontSize: '0.8rem' }} value={permJson} onChange={(e) => setPermJson(e.target.value)} aria-label="JSON permissions" />
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
              <button type="button" className="btn btn-ghost" onClick={() => setEditPerm(null)}>Annuler</button>
              <button type="button" className="btn btn-primary" onClick={savePerm}>Enregistrer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
