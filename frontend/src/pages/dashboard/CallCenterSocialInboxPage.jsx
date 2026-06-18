import React, { useState, useEffect, useCallback, useRef } from 'react'
import { complaintsAPI, establishmentsAPI } from '../../api'
import { useAuth } from '../../contexts/AuthContext'
import toast from 'react-hot-toast'
import {
  FiInbox, FiRefreshCw, FiPhone, FiMessageSquare, FiFacebook,
  FiCheckCircle, FiClock, FiSearch, FiUser, FiMapPin,
  FiAlertCircle, FiMic, FiPlay, FiPause, FiChevronRight,
  FiX, FiSave, FiFilter,
} from 'react-icons/fi'

/* ─── helpers ──────────────────────────────────────────────────────────── */

const SOURCE_ICON = {
  whatsapp: <FiPhone style={{ color: '#25d366' }} />,
  openwa: <FiPhone style={{ color: '#25d366' }} />,
  meta: <FiPhone style={{ color: '#25d366' }} />,
  facebook: <FiFacebook style={{ color: '#1877f2' }} />,
  messenger: <FiFacebook style={{ color: '#1877f2' }} />,
}

const SOURCE_LABEL = {
  whatsapp: 'WhatsApp',
  openwa: 'WhatsApp',
  meta: 'WhatsApp (Meta)',
  facebook: 'Facebook',
  messenger: 'Messenger',
}

function getSourceIcon(src) {
  return SOURCE_ICON[(src || '').toLowerCase()] ?? <FiMessageSquare />
}
function getSourceLabel(src) {
  return SOURCE_LABEL[(src || '').toLowerCase()] ?? (src || 'Chatbot social')
}

function relativeTime(dateStr) {
  if (!dateStr) return ''
  const diff = (Date.now() - new Date(dateStr)) / 1000
  if (diff < 60) return 'à l\'instant'
  if (diff < 3600) return `il y a ${Math.floor(diff / 60)} min`
  if (diff < 86400) return `il y a ${Math.floor(diff / 3600)} h`
  return `il y a ${Math.floor(diff / 86400)} j`
}

/* ─── Audio Player compact ──────────────────────────────────────────────── */
function AudioPlayer({ url }) {
  const [playing, setPlaying] = useState(false)
  const ref = useRef(null)

  if (!url) return null

  const toggle = () => {
    if (!ref.current) return
    if (playing) { ref.current.pause(); setPlaying(false) }
    else { ref.current.play(); setPlaying(true) }
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(0,76,76,0.07)', borderRadius: 8, padding: '0.4rem 0.8rem' }}>
      <FiMic size={14} style={{ color: 'var(--color-primary)' }} />
      <audio ref={ref} src={url} onEnded={() => setPlaying(false)} style={{ display: 'none' }} />
      <button
        type="button"
        onClick={toggle}
        style={{ background: 'var(--color-primary)', border: 'none', borderRadius: '50%', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', cursor: 'pointer' }}
        aria-label={playing ? 'Pause' : 'Écouter le message vocal'}
      >
        {playing ? <FiPause size={12} /> : <FiPlay size={12} />}
      </button>
      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Message vocal</span>
    </div>
  )
}

/* ─── Inbox Card ────────────────────────────────────────────────────────── */
function InboxCard({ complaint, selected, onSelect }) {
  const pending = complaint.pending_call_center_completion
  return (
    <button
      type="button"
      onClick={() => onSelect(complaint)}
      style={{
        width: '100%', textAlign: 'left', border: 'none', cursor: 'pointer',
        padding: '1rem 1.25rem',
        background: selected
          ? 'linear-gradient(135deg, rgba(0,76,76,0.12), rgba(0,141,90,0.08))'
          : pending ? 'rgba(255,152,0,0.04)' : 'transparent',
        borderBottom: '1px solid var(--border-color)',
        borderLeft: selected ? '3px solid var(--color-primary)' : '3px solid transparent',
        transition: 'all 0.15s',
        display: 'flex', gap: '0.75rem', alignItems: 'flex-start',
      }}
    >
      <div style={{ fontSize: '1.2rem', marginTop: 2 }}>{getSourceIcon(complaint.social_source)}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontWeight: 700, fontSize: '0.8rem', color: 'var(--text-primary)', fontFamily: 'monospace' }}>
            {complaint.ticket_number}
          </span>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', flexShrink: 0 }}>
            {relativeTime(complaint.created_at)}
          </span>
        </div>
        <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: 2 }}>
          {getSourceLabel(complaint.social_source)} — {complaint.social_sender_id || complaint.complainant_phone || 'Inconnu'}
        </div>
        <div style={{
          fontSize: '0.8rem', color: 'var(--text-primary)',
          marginTop: 4, overflow: 'hidden', textOverflow: 'ellipsis',
          whiteSpace: 'nowrap', maxWidth: '100%',
          opacity: 0.85,
        }}>
          {complaint.social_raw_message || complaint.title}
        </div>
        {pending && (
          <span style={{
            display: 'inline-block', marginTop: 4,
            fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.05em',
            background: 'linear-gradient(90deg,#ff9800,#f57c00)',
            color: '#fff', borderRadius: 4, padding: '1px 6px',
          }}>
            EN ATTENTE
          </span>
        )}
        {!pending && (
          <span style={{
            display: 'inline-block', marginTop: 4,
            fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.05em',
            background: 'linear-gradient(90deg,var(--color-secondary),var(--color-primary))',
            color: '#fff', borderRadius: 4, padding: '1px 6px',
          }}>
            TRAITÉ
          </span>
        )}
      </div>
    </button>
  )
}

/* ─── Complete Form ─────────────────────────────────────────────────────── */
function CompleteForm({ complaint, categories, establishments, onSuccess, onCancel }) {
  const [form, setForm] = useState({
    establishment: '',
    establishment_name_manual: '',
    establishment_address_manual: '',
    category: '',
    subcategory: '',
    priority: '',
    title: complaint.title || '',
    description: complaint.description !== 'Message vocal joint à la plainte.' ? (complaint.description || '') : '',
    complainant_name: complaint.complainant_name?.replace(/^FB:/, '') || '',
    complainant_phone: complaint.complainant_phone || complaint.social_sender_id || '',
    complainant_email: '',
    agent_notes: '',
    useManualEst: false,
  })
  const [submitting, setSubmitting] = useState(false)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const selectedCategory = categories.find(c => c.id === form.category)
  const subcats = selectedCategory?.subcategories || []

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const payload = {
        category: form.category || undefined,
        subcategory: form.subcategory || undefined,
        priority: form.priority || undefined,
        title: form.title.trim() || undefined,
        description: form.description.trim() || undefined,
        complainant_name: form.complainant_name.trim() || undefined,
        complainant_phone: form.complainant_phone.trim() || undefined,
        complainant_email: form.complainant_email.trim() || undefined,
        agent_notes: form.agent_notes.trim() || undefined,
      }
      if (form.useManualEst) {
        payload.establishment_name_manual = form.establishment_name_manual.trim()
        payload.establishment_address_manual = form.establishment_address_manual.trim()
      } else {
        payload.establishment = form.establishment || undefined
      }
      await complaintsAPI.callcenterSocialComplete(complaint.id, payload)
      toast.success('Plainte finalisée avec succès !')
      onSuccess()
    } catch (err) {
      const data = err.response?.data
      if (typeof data === 'object') {
        const msgs = Object.values(data).flat()
        toast.error(msgs[0] || 'Erreur lors de la finalisation')
      } else {
        toast.error('Erreur réseau')
      }
    } finally {
      setSubmitting(false)
    }
  }

  const inputStyle = {
    width: '100%', padding: '0.6rem 0.875rem',
    border: '1.5px solid var(--border-color)',
    borderRadius: 8, fontSize: '0.875rem',
    background: 'var(--bg-input, rgba(0,0,0,0.04))',
    color: 'var(--text-primary)', outline: 'none',
    transition: 'border-color 0.15s',
    boxSizing: 'border-box',
  }
  const labelStyle = { fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4, display: 'block', letterSpacing: '0.04em' }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>

      {/* Établissement */}
      <div>
        <label style={labelStyle}>ÉTABLISSEMENT CONCERNÉ *</label>
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <button type="button" onClick={() => set('useManualEst', false)}
            style={{ ...inputStyle, width: 'auto', padding: '0.4rem 0.875rem', background: !form.useManualEst ? 'var(--color-primary)' : undefined, color: !form.useManualEst ? '#fff' : undefined, border: !form.useManualEst ? 'none' : undefined, cursor: 'pointer' }}>
            Liste
          </button>
          <button type="button" onClick={() => set('useManualEst', true)}
            style={{ ...inputStyle, width: 'auto', padding: '0.4rem 0.875rem', background: form.useManualEst ? 'var(--color-primary)' : undefined, color: form.useManualEst ? '#fff' : undefined, border: form.useManualEst ? 'none' : undefined, cursor: 'pointer' }}>
            Saisie libre
          </button>
        </div>
        {!form.useManualEst ? (
          <select style={inputStyle} value={form.establishment} onChange={e => set('establishment', e.target.value)} required>
            <option value="">— Sélectionner un établissement —</option>
            {establishments.map(est => (
              <option key={est.id} value={est.id}>{est.name}</option>
            ))}
          </select>
        ) : (
          <>
            <input style={{ ...inputStyle, marginBottom: '0.4rem' }} placeholder="Nom de l'établissement *"
              value={form.establishment_name_manual} onChange={e => set('establishment_name_manual', e.target.value)} required />
            <input style={inputStyle} placeholder="Adresse / localisation (optionnel)"
              value={form.establishment_address_manual} onChange={e => set('establishment_address_manual', e.target.value)} />
          </>
        )}
      </div>

      {/* Catégorie */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
        <div>
          <label style={labelStyle}>CATÉGORIE *</label>
          <select style={inputStyle} value={form.category} onChange={e => { set('category', e.target.value); set('subcategory', '') }} required>
            <option value="">— Type de plainte —</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.display_name || cat.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label style={labelStyle}>SOUS-CATÉGORIE</label>
          <select style={inputStyle} value={form.subcategory} onChange={e => set('subcategory', e.target.value)} disabled={!subcats.length}>
            <option value="">— Optionnel —</option>
            {subcats.map(sc => (
              <option key={sc.id} value={sc.id}>{sc.display_name || sc.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Priorité */}
      <div>
        <label style={labelStyle}>PRIORITÉ (optionnel — NLP auto)</label>
        <select style={inputStyle} value={form.priority} onChange={e => set('priority', e.target.value)}>
          <option value="">Auto (NLP)</option>
          {['P1','P2','P3','P4','P5'].map(p => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
      </div>

      {/* Titre & Description */}
      <div>
        <label style={labelStyle}>TITRE DE LA PLAINTE</label>
        <input style={inputStyle} placeholder="Titre résumé de la plainte"
          value={form.title} onChange={e => set('title', e.target.value)} />
      </div>
      <div>
        <label style={labelStyle}>DESCRIPTION COMPLÉTÉE</label>
        <textarea style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }}
          placeholder="Décrivez la plainte d'après le message reçu..."
          value={form.description} onChange={e => set('description', e.target.value)} />
      </div>

      {/* Identité plaignant */}
      <div>
        <label style={labelStyle}>IDENTITÉ DU PLAIGNANT</label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
          <input style={inputStyle} placeholder="Nom complet" value={form.complainant_name} onChange={e => set('complainant_name', e.target.value)} />
          <input style={inputStyle} placeholder="Téléphone" value={form.complainant_phone} onChange={e => set('complainant_phone', e.target.value)} />
        </div>
        <input style={{ ...inputStyle, marginTop: '0.4rem' }} placeholder="Email (optionnel)" type="email"
          value={form.complainant_email} onChange={e => set('complainant_email', e.target.value)} />
      </div>

      {/* Notes agent */}
      <div>
        <label style={labelStyle}>NOTES INTERNES (historique)</label>
        <textarea style={{ ...inputStyle, minHeight: 60, resize: 'vertical' }}
          placeholder="Notes sur la prise en charge, remarques..."
          value={form.agent_notes} onChange={e => set('agent_notes', e.target.value)} />
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', paddingTop: '0.5rem' }}>
        <button type="button" onClick={onCancel}
          style={{ padding: '0.6rem 1.25rem', border: '1.5px solid var(--border-color)', borderRadius: 8, background: 'transparent', cursor: 'pointer', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          <FiX style={{ marginRight: 4 }} />Annuler
        </button>
        <button type="submit" disabled={submitting}
          style={{ padding: '0.6rem 1.5rem', border: 'none', borderRadius: 8, background: submitting ? '#ccc' : 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))', color: '#fff', fontWeight: 700, fontSize: '0.875rem', cursor: submitting ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <FiSave />
          {submitting ? 'Finalisation...' : 'Finaliser la plainte'}
        </button>
      </div>
    </form>
  )
}

/* ─── Detail Panel ──────────────────────────────────────────────────────── */
function DetailPanel({ complaint, categories, establishments, onComplete, onClose }) {
  const [showForm, setShowForm] = useState(false)

  const handleSuccess = () => {
    setShowForm(false)
    onComplete()
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexShrink: 0 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: 4 }}>
            {getSourceIcon(complaint.social_source)}
            <span style={{ fontWeight: 800, fontSize: '0.9rem', fontFamily: 'monospace', color: 'var(--color-primary)' }}>
              {complaint.ticket_number}
            </span>
            {complaint.pending_call_center_completion ? (
              <span style={{ fontSize: '0.68rem', fontWeight: 700, background: 'linear-gradient(90deg,#ff9800,#f57c00)', color: '#fff', borderRadius: 4, padding: '2px 6px' }}>EN ATTENTE</span>
            ) : (
              <span style={{ fontSize: '0.68rem', fontWeight: 700, background: 'linear-gradient(90deg,var(--color-secondary),var(--color-primary))', color: '#fff', borderRadius: 4, padding: '2px 6px' }}>TRAITÉ</span>
            )}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            {getSourceLabel(complaint.social_source)} · {new Date(complaint.created_at).toLocaleString('fr-FR')}
          </div>
        </div>
        <button type="button" onClick={onClose}
          style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4 }}>
          <FiX />
        </button>
      </div>

      {/* Scrollable body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

        {/* Audio */}
        {complaint.voice_file_url && (
          <div>
            <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>MESSAGE VOCAL</p>
            <AudioPlayer url={complaint.voice_file_url} />
          </div>
        )}

        {/* Message brut */}
        <div>
          <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>MESSAGE BRUT REÇU</p>
          <div style={{
            background: 'rgba(0,76,76,0.05)', border: '1px solid var(--border-color)',
            borderRadius: 10, padding: '0.875rem 1rem',
            fontSize: '0.875rem', lineHeight: 1.6, color: 'var(--text-primary)',
            whiteSpace: 'pre-wrap', wordBreak: 'break-word',
          }}>
            {complaint.social_raw_message || complaint.description || '—'}
          </div>
        </div>

        {/* Infos expéditeur */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          <div style={{ background: 'rgba(0,0,0,0.03)', borderRadius: 8, padding: '0.75rem' }}>
            <p style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 4 }}>EXPÉDITEUR</p>
            <p style={{ fontSize: '0.875rem', fontWeight: 600 }}>{complaint.social_sender_id || complaint.complainant_phone || '—'}</p>
          </div>
          <div style={{ background: 'rgba(0,0,0,0.03)', borderRadius: 8, padding: '0.75rem' }}>
            <p style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 4 }}>CANAL</p>
            <p style={{ fontSize: '0.875rem', fontWeight: 600 }}>{getSourceLabel(complaint.social_source)}</p>
          </div>
        </div>

        {/* Déjà complété */}
        {!complaint.pending_call_center_completion && complaint.call_center_completed_at && (
          <div style={{ background: 'rgba(0,141,90,0.07)', border: '1px solid rgba(0,141,90,0.2)', borderRadius: 10, padding: '0.875rem 1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: 6 }}>
              <FiCheckCircle style={{ color: 'var(--color-secondary)' }} />
              <span style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--color-secondary)' }}>Plainte finalisée</span>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Le {new Date(complaint.call_center_completed_at).toLocaleString('fr-FR')}
            </p>
            {complaint.establishment_name && (
              <p style={{ fontSize: '0.8rem', marginTop: 4 }}><strong>Établissement :</strong> {complaint.establishment_name}</p>
            )}
            {complaint.category_name && (
              <p style={{ fontSize: '0.8rem', marginTop: 2 }}><strong>Catégorie :</strong> {complaint.category_name}</p>
            )}
          </div>
        )}

        {/* Formulaire de complétion */}
        {complaint.pending_call_center_completion && (
          <>
            {!showForm ? (
              <button
                type="button"
                onClick={() => setShowForm(true)}
                style={{
                  width: '100%', padding: '0.875rem', border: 'none', borderRadius: 10,
                  background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))',
                  color: '#fff', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                  boxShadow: '0 4px 12px rgba(0,76,76,0.3)',
                }}
              >
                <FiCheckCircle />
                Compléter et finaliser la plainte
              </button>
            ) : (
              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                <p style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1rem' }}>
                  Remplissez les champs manquants
                </p>
                <CompleteForm
                  complaint={complaint}
                  categories={categories}
                  establishments={establishments}
                  onSuccess={handleSuccess}
                  onCancel={() => setShowForm(false)}
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

/* ─── Main Page ─────────────────────────────────────────────────────────── */
export default function CallCenterSocialInboxPage() {
  const { user } = useAuth()
  const [inbox, setInbox] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [showCompleted, setShowCompleted] = useState(false)
  const [sourceFilter, setSourceFilter] = useState('')
  const [search, setSearch] = useState('')
  const [categories, setCategories] = useState([])
  const [establishments, setEstablishments] = useState([])

  const loadInbox = useCallback(() => {
    setLoading(true)
    complaintsAPI.callcenterSocialInbox({
      completed: showCompleted ? 'true' : undefined,
      source: sourceFilter || undefined,
    })
      .then(({ data }) => setInbox(Array.isArray(data) ? data : (data.results || [])))
      .catch(() => setInbox([]))
      .finally(() => setLoading(false))
  }, [showCompleted, sourceFilter])

  useEffect(() => { loadInbox() }, [loadInbox])

  useEffect(() => {
    complaintsAPI.categories().then(({ data }) => setCategories(Array.isArray(data) ? data : (data.results || []))).catch(() => {})
    establishmentsAPI.list({ page_size: 500 }).then(({ data }) => setEstablishments(Array.isArray(data) ? data : (data.results || []))).catch(() => {})
  }, [])

  const pending = inbox.filter(c => c.pending_call_center_completion)
  const completed = inbox.filter(c => !c.pending_call_center_completion)

  const filtered = inbox.filter(c => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      (c.ticket_number || '').toLowerCase().includes(q) ||
      (c.social_raw_message || '').toLowerCase().includes(q) ||
      (c.social_sender_id || '').toLowerCase().includes(q) ||
      (c.complainant_phone || '').toLowerCase().includes(q)
    )
  })

  const handleComplete = () => {
    loadInbox()
    setSelected(s => s ? { ...s, pending_call_center_completion: false } : null)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Page Header */}
      <div style={{ padding: '0 0 1.5rem', borderBottom: '1px solid var(--border-color)', marginBottom: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FiInbox style={{ color: 'var(--color-primary)' }} />
            Boîte de réception sociale
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: 4 }}>
            Plaintes WhatsApp & Facebook — à compléter et finaliser
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Badges compteurs */}
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <span style={{
              display: 'flex', alignItems: 'center', gap: '0.3rem',
              background: 'linear-gradient(90deg,#ff9800,#f57c00)', color: '#fff',
              borderRadius: 8, padding: '0.35rem 0.75rem', fontSize: '0.8rem', fontWeight: 700,
            }}>
              <FiClock size={12} /> {pending.length} en attente
            </span>
            <span style={{
              display: 'flex', alignItems: 'center', gap: '0.3rem',
              background: 'linear-gradient(90deg,var(--color-secondary),var(--color-primary))', color: '#fff',
              borderRadius: 8, padding: '0.35rem 0.75rem', fontSize: '0.8rem', fontWeight: 700,
            }}>
              <FiCheckCircle size={12} /> {completed.length} traités
            </span>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={loadInbox}>
            <FiRefreshCw /> Actualiser
          </button>
        </div>
      </div>

      {/* Filtres */}
      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 180 }}>
          <FiSearch style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', pointerEvents: 'none' }} />
          <input
            className="form-input" style={{ paddingLeft: '2.25rem', width: '100%' }}
            placeholder="Ticket, téléphone, message..."
            value={search} onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select className="form-select" style={{ width: 'auto', minWidth: 130 }}
          value={sourceFilter} onChange={e => setSourceFilter(e.target.value)}>
          <option value="">Tous canaux</option>
          <option value="whatsapp">WhatsApp</option>
          <option value="facebook">Facebook</option>
        </select>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', cursor: 'pointer', userSelect: 'none' }}>
          <input type="checkbox" checked={showCompleted} onChange={e => setShowCompleted(e.target.checked)} style={{ accentColor: 'var(--color-primary)' }} />
          Afficher les traités
        </label>
      </div>

      {/* Layout 2 colonnes */}
      <div style={{ display: 'grid', gridTemplateColumns: selected ? '340px 1fr' : '1fr', gap: '1rem', flex: 1, minHeight: 0, overflow: 'hidden' }}>

        {/* Inbox list */}
        <div style={{ border: '1px solid var(--border-color)', borderRadius: 12, overflow: 'hidden', display: 'flex', flexDirection: 'column', background: 'var(--bg-card, #fff)' }}>
          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, gap: '0.75rem', color: 'var(--text-secondary)', padding: '3rem' }}>
              <div className="spinner" style={{ width: 20, height: 20 }} />
              Chargement...
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, gap: '0.75rem', color: 'var(--text-secondary)', padding: '3rem', textAlign: 'center' }}>
              <FiInbox size={32} style={{ opacity: 0.4 }} />
              <p style={{ fontSize: '0.9rem' }}>
                {showCompleted ? 'Aucune plainte trouvée.' : 'Aucune plainte en attente. ✓'}
              </p>
            </div>
          ) : (
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {filtered.map(c => (
                <InboxCard
                  key={c.id}
                  complaint={c}
                  selected={selected?.id === c.id}
                  onSelect={setSelected}
                />
              ))}
            </div>
          )}
        </div>

        {/* Detail panel */}
        {selected && (
          <div style={{ border: '1px solid var(--border-color)', borderRadius: 12, overflow: 'hidden', background: 'var(--bg-card, #fff)' }}>
            <DetailPanel
              complaint={selected}
              categories={categories}
              establishments={establishments}
              onComplete={handleComplete}
              onClose={() => setSelected(null)}
            />
          </div>
        )}
      </div>
    </div>
  )
}
