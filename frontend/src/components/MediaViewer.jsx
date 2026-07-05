import React, { useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { FiX, FiDownload, FiChevronLeft, FiChevronRight, FiMaximize2, FiFile, FiFilm, FiImage, FiMusic, FiFileText } from 'react-icons/fi'

/** Detecte le type de média à partir du mimetype ou du nom de fichier. */
function detectType(att) {
  const mime = (att.file_type || att.mimetype || '').toLowerCase()
  const name = (att.file_name || att.filename || '').toLowerCase()

  if (mime.startsWith('image/') || /\.(jpe?g|png|gif|webp|svg|bmp)$/i.test(name)) return 'image'
  if (mime.startsWith('video/') || /\.(mp4|webm|mov|avi|mkv|ogv)$/i.test(name)) return 'video'
  if (mime.startsWith('audio/') || /\.(mp3|wav|ogg|m4a|webm|aac|flac)$/i.test(name)) return 'audio'
  if (mime === 'application/pdf' || name.endsWith('.pdf')) return 'pdf'
  return 'file'
}

function fileUrl(att) {
  return att.file_url || att.media_url || att.file || att.url || null
}

function FileIcon({ type, size = 20 }) {
  const icons = { image: FiImage, video: FiFilm, audio: FiMusic, pdf: FiFileText, file: FiFile }
  const Icon = icons[type] || FiFile
  return <Icon size={size} />
}

/** Miniature cliquable pour un fichier. */
function AttachmentThumbnail({ att, onClick, index }) {
  const type = detectType(att)
  const url = fileUrl(att)
  const name = att.file_name || att.filename || `Fichier ${index + 1}`
  const size = att.file_size ? `${(att.file_size / 1024).toFixed(0)} Ko` : ''

  return (
    <div
      onClick={() => onClick(index)}
      role="button"
      tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && onClick(index)}
      style={{
        cursor: 'pointer',
        border: '1px solid var(--border-color)',
        borderRadius: 8,
        overflow: 'hidden',
        background: 'var(--bg-page)',
        transition: 'box-shadow 0.15s, transform 0.15s',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.15)'
        e.currentTarget.style.transform = 'translateY(-2px)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.boxShadow = 'none'
        e.currentTarget.style.transform = 'none'
      }}
    >
      {/* Preview zone */}
      <div style={{
        height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'var(--bg-surface, #1e1e2e)', position: 'relative', overflow: 'hidden',
      }}>
        {type === 'image' && url ? (
          <img
            src={url} alt={name}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            onError={e => { e.target.style.display = 'none' }}
          />
        ) : type === 'video' && url ? (
          <div style={{ position: 'relative', width: '100%', height: '100%' }}>
            <video
              src={url}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              muted preload="metadata"
            />
            <div style={{
              position: 'absolute', inset: 0, display: 'flex', alignItems: 'center',
              justifyContent: 'center', background: 'rgba(0,0,0,0.4)',
            }}>
              <div style={{
                width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,255,255,0.9)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <span style={{ fontSize: 16, marginLeft: 3 }}>▶</span>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ color: 'var(--color-primary, #7c3aed)', opacity: 0.8 }}>
            <FileIcon type={type} size={40} />
          </div>
        )}
        {/* Expand button */}
        <div style={{
          position: 'absolute', top: 6, right: 6, background: 'rgba(0,0,0,0.5)',
          borderRadius: 4, padding: '2px 4px', color: '#fff', opacity: 0,
          transition: 'opacity 0.15s',
        }} className="thumb-expand">
          <FiMaximize2 size={12} />
        </div>
      </div>

      {/* Info zone */}
      <div style={{ padding: '0.5rem 0.75rem' }}>
        <div style={{
          fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-primary)',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>{name}</div>
        <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'flex', gap: '0.5rem', marginTop: 2 }}>
          <span style={{ textTransform: 'uppercase', color: 'var(--color-primary, #7c3aed)' }}>{type}</span>
          {size && <span>{size}</span>}
        </div>

        {/* Audio inline */}
        {type === 'audio' && url && (
          <audio controls src={url} style={{ width: '100%', marginTop: '0.5rem', height: 32 }}
            onClick={e => e.stopPropagation()}>
            <track kind="captions" />
          </audio>
        )}
      </div>
    </div>
  )
}

/** Modal lightbox principal. */
function MediaModal({ attachments, initialIndex, onClose }) {
  const [current, setCurrent] = useState(initialIndex)
  const att = attachments[current]
  const type = detectType(att)
  const url = fileUrl(att)
  const name = att.file_name || att.filename || `Fichier ${current + 1}`

  const prev = useCallback(() => setCurrent(i => (i - 1 + attachments.length) % attachments.length), [attachments.length])
  const next = useCallback(() => setCurrent(i => (i + 1) % attachments.length), [attachments.length])

  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') prev()
      if (e.key === 'ArrowRight') next()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose, prev, next])

  return createPortal(
    <div
      role="dialog" aria-modal="true" aria-label={`Visualiser : ${name}`}
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.92)',
        display: 'flex', flexDirection: 'column',
        animation: 'fadeIn 0.15s ease',
      }}
    >
      {/* Header */}
      <div
        onClick={e => e.stopPropagation()}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0.75rem 1.25rem', background: 'rgba(0,0,0,0.5)',
          backdropFilter: 'blur(8px)', flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#fff', minWidth: 0 }}>
          <FileIcon type={type} size={18} />
          <span style={{ fontSize: '0.9rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {name}
          </span>
          {attachments.length > 1 && (
            <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', flexShrink: 0 }}>
              {current + 1} / {attachments.length}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
          {url && (
            <a
              href={url} download={name}
              onClick={e => e.stopPropagation()}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.4rem',
                padding: '0.4rem 0.75rem', borderRadius: 6,
                background: 'rgba(255,255,255,0.1)', color: '#fff',
                fontSize: '0.8rem', fontWeight: 500, textDecoration: 'none',
                border: '1px solid rgba(255,255,255,0.15)',
              }}
            >
              <FiDownload size={14} /> Télécharger
            </a>
          )}
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: 6, color: '#fff', cursor: 'pointer',
              padding: '0.4rem', display: 'flex', alignItems: 'center',
            }}
          >
            <FiX size={18} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div
        onClick={e => e.stopPropagation()}
        style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', padding: '1rem', position: 'relative' }}
      >
        {/* Navigation prev */}
        {attachments.length > 1 && (
          <button onClick={prev} style={{
            position: 'absolute', left: '0.5rem', top: '50%', transform: 'translateY(-50%)',
            zIndex: 10, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: '50%', width: 40, height: 40, display: 'flex', alignItems: 'center',
            justifyContent: 'center', color: '#fff', cursor: 'pointer',
          }}>
            <FiChevronLeft size={20} />
          </button>
        )}

        {/* Viewer */}
        {type === 'image' && url && (
          <img
            src={url} alt={name}
            style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: 4, userSelect: 'none' }}
          />
        )}

        {type === 'video' && url && (
          <video
            controls autoPlay
            src={url}
            style={{ maxWidth: '100%', maxHeight: '100%', borderRadius: 4 }}
          >
            <track kind="captions" />
            Votre navigateur ne supporte pas la lecture vidéo.
          </video>
        )}

        {type === 'audio' && url && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ color: 'var(--color-primary, #7c3aed)', marginBottom: '1.5rem' }}>
              <FiMusic size={64} />
            </div>
            <div style={{ color: '#fff', fontWeight: 600, marginBottom: '1rem', fontSize: '1rem' }}>{name}</div>
            <audio controls autoPlay src={url} style={{ width: 380, maxWidth: '90vw' }}>
              <track kind="captions" />
            </audio>
          </div>
        )}

        {type === 'pdf' && url && (
          <iframe
            src={`${url}#view=FitH`}
            title={name}
            style={{ width: '100%', height: '100%', border: 'none', borderRadius: 4, background: '#fff' }}
          />
        )}

        {type === 'file' && (
          <div style={{ textAlign: 'center', color: '#fff' }}>
            <FiFile size={64} style={{ marginBottom: '1rem', opacity: 0.6 }} />
            <div style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem' }}>{name}</div>
            <p style={{ color: 'rgba(255,255,255,0.5)', marginBottom: '1.5rem' }}>
              Aperçu non disponible pour ce type de fichier.
            </p>
            {url && (
              <a href={url} download={name} style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                padding: '0.6rem 1.25rem', borderRadius: 8,
                background: 'var(--color-primary, #7c3aed)', color: '#fff',
                fontWeight: 600, textDecoration: 'none',
              }}>
                <FiDownload /> Télécharger
              </a>
            )}
          </div>
        )}

        {/* Navigation next */}
        {attachments.length > 1 && (
          <button onClick={next} style={{
            position: 'absolute', right: '0.5rem', top: '50%', transform: 'translateY(-50%)',
            zIndex: 10, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: '50%', width: 40, height: 40, display: 'flex', alignItems: 'center',
            justifyContent: 'center', color: '#fff', cursor: 'pointer',
          }}>
            <FiChevronRight size={20} />
          </button>
        )}
      </div>

      {/* Filmstrip (si > 1 fichier) */}
      {attachments.length > 1 && (
        <div
          onClick={e => e.stopPropagation()}
          style={{
            display: 'flex', gap: '0.5rem', padding: '0.75rem 1.25rem',
            overflowX: 'auto', background: 'rgba(0,0,0,0.5)', flexShrink: 0,
          }}
        >
          {attachments.map((a, i) => {
            const t = detectType(a)
            const u = fileUrl(a)
            const active = i === current
            return (
              <div
                key={i}
                onClick={() => setCurrent(i)}
                role="button" tabIndex={0}
                onKeyDown={e => e.key === 'Enter' && setCurrent(i)}
                style={{
                  width: 56, height: 56, flexShrink: 0, borderRadius: 6, overflow: 'hidden',
                  border: `2px solid ${active ? 'var(--color-primary, #7c3aed)' : 'rgba(255,255,255,0.15)'}`,
                  cursor: 'pointer', background: '#1e1e2e',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  opacity: active ? 1 : 0.5, transition: 'opacity 0.15s, border-color 0.15s',
                }}
              >
                {t === 'image' && u
                  ? <img src={u} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <FileIcon type={t} size={20} />
                }
              </div>
            )
          })}
        </div>
      )}
    </div>,
    document.body,
  )
}

/**
 * MediaViewer — composant principal.
 *
 * Props:
 *   attachments: Array<{ file_url|media_url|file|url, file_type|mimetype, file_name|filename, file_size? }>
 *   voiceUrl?: string — URL du message vocal (affiché séparément)
 */
export default function MediaViewer({ attachments = [], voiceUrl }) {
  const [lightbox, setLightbox] = useState(null) // index ou null

  if (!voiceUrl && (!attachments || attachments.length === 0)) return null

  return (
    <div>
      {/* Message vocal */}
      {voiceUrl && (
        <div style={{ marginBottom: '1rem' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.35rem', color: 'var(--text-muted)' }}>
            🎤 Message vocal déposé
          </div>
          <audio controls src={voiceUrl} style={{ width: '100%', maxWidth: 420 }}>
            <track kind="captions" />
          </audio>
        </div>
      )}

      {/* Pièces jointes */}
      {attachments.length > 0 && (
        <div>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.75rem', color: 'var(--text-muted)' }}>
            📎 Pièces jointes ({attachments.length})
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
            gap: '0.75rem',
          }}>
            {attachments.map((att, i) => (
              <AttachmentThumbnail key={att.id || i} att={att} index={i} onClick={setLightbox} />
            ))}
          </div>
        </div>
      )}

      {/* Lightbox */}
      {lightbox !== null && (
        <MediaModal
          attachments={attachments}
          initialIndex={lightbox}
          onClose={() => setLightbox(null)}
        />
      )}

      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
      `}</style>
    </div>
  )
}
