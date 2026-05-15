import React, { useEffect, useState } from 'react'
import { complaintsAPI } from '../api'
import toast from 'react-hot-toast'

export default function ComplaintDocumentsEditor({ complaintId, userRole }) {
  const [documents, setDocuments] = useState([])
  const [loading, setLoading] = useState(true)
  const [drafts, setDrafts] = useState({})
  const [saving, setSaving] = useState({})

  const load = () => {
    complaintsAPI.documents(complaintId)
      .then(({ data }) => {
        const list = data.results || data
        setDocuments(Array.isArray(list) ? list : [])
        const init = {}
        ;(Array.isArray(list) ? list : []).forEach((d) => {
          init[d.id] = { body: d.body || '', status: d.status || 'DRAFT' }
        })
        setDrafts(init)
      })
      .catch(() => toast.error('Impossible de charger les documents'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    setLoading(true)
    load()
  }, [complaintId])

  const canEdit = (doc) =>
    userRole === 'ADMIN_PLATEFORME' || (doc.allowed_roles || []).includes(userRole)

  const save = async (docId) => {
    const payload = drafts[docId]
    if (!payload) return
    setSaving((s) => ({ ...s, [docId]: true }))
    try {
      await complaintsAPI.updateDocument(complaintId, docId, {
        body: payload.body,
        status: payload.status,
      })
      toast.success('Document enregistré')
      load()
    } catch {
      toast.error('Enregistrement impossible (droits ou réseau)')
    } finally {
      setSaving((s) => ({ ...s, [docId]: false }))
    }
  }

  if (loading) {
    return <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Chargement…</p>
  }

  if (!documents.length) {
    return <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Aucun document pour ce dossier.</p>
  }

  const missingRequired = documents.filter((d) => d.is_required && !String(d.body || '').trim())

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '70vh', overflowY: 'auto' }}>
      {missingRequired.length > 0 && (
        <div
          role="status"
          style={{
            padding: '0.75rem',
            background: '#fffbeb',
            border: '1px solid #fcd34d',
            borderRadius: 'var(--radius-md)',
            fontSize: '0.8rem',
            color: '#92400e',
          }}
        >
          Documents obligatoires à compléter :{' '}
          {missingRequired.map((d) => d.doc_type_display || d.doc_type).join(', ')}
        </div>
      )}
      {documents.map((d) => {
        const editable = canEdit(d)
        const dr = drafts[d.id] || { body: d.body || '', status: d.status || 'DRAFT' }
        return (
          <article
            key={d.id}
            style={{
              padding: '1rem',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-surface)',
            }}
          >
            <header style={{ marginBottom: '0.5rem' }}>
              <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                {d.doc_type_display || d.doc_type}
                {d.is_required && (
                  <span className="badge badge-p2" style={{ marginLeft: '0.5rem', fontSize: '0.65rem' }}>
                    Obligatoire
                  </span>
                )}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                {new Date(d.created_at).toLocaleString('fr-FR')}
                {d.created_by_name ? ` · ${d.created_by_name}` : ''}
                {d.last_edited_by_name ? ` · Dernière rédaction : ${d.last_edited_by_name}` : ''}
              </div>
            </header>
            {!editable && (
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                Lecture seule — rédaction réservée aux rôles habilités.
              </p>
            )}
            <label className="form-label" htmlFor={`doc-body-${d.id}`}>
              Contenu
            </label>
            <textarea
              id={`doc-body-${d.id}`}
              className="form-textarea"
              style={{ minHeight: 100, width: '100%', marginBottom: '0.75rem' }}
              readOnly={!editable}
              value={dr.body}
              onChange={(e) =>
                setDrafts((prev) => ({
                  ...prev,
                  [d.id]: { ...dr, body: e.target.value },
                }))
              }
            />
            {editable && (
              <>
                <label className="form-label" htmlFor={`doc-status-${d.id}`}>
                  Statut
                </label>
                <select
                  id={`doc-status-${d.id}`}
                  className="form-select"
                  style={{ width: '100%', marginBottom: '0.75rem' }}
                  value={dr.status}
                  onChange={(e) =>
                    setDrafts((prev) => ({
                      ...prev,
                      [d.id]: { ...dr, status: e.target.value },
                    }))
                  }
                >
                  <option value="DRAFT">Brouillon</option>
                  <option value="SUBMITTED">Soumis / figé</option>
                </select>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  disabled={saving[d.id]}
                  onClick={() => save(d.id)}
                >
                  {saving[d.id] ? 'Enregistrement…' : 'Enregistrer'}
                </button>
              </>
            )}
          </article>
        )
      })}
    </div>
  )
}
