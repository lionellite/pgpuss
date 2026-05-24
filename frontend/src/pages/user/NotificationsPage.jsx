import React, { useState, useEffect } from 'react'
import { notificationsAPI } from '../../api'
import { FiBell, FiCheck, FiFileText } from 'react-icons/fi'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)

  const load = () => {
    notificationsAPI.list()
      .then(({ data }) => setNotifications(data.results || data))
      .finally(() => setLoading(false))
  }
  useEffect(load, [])

  const markAllRead = async () => {
    await notificationsAPI.markAllRead()
    toast.success('Toutes les notifications ont été marquées comme lues')
    load()
  }

  const markRead = async (id) => {
    await notificationsAPI.markRead(id)
    setNotifications((ns) => ns.map((n) => (n.id === id ? { ...n, is_read: true } : n)))
  }

  const unread = notifications.filter((n) => !n.is_read).length

  return (
    <section className="section" style={{ paddingTop: '2rem' }} aria-labelledby="notif-title">
      <div className="page-container" style={{ maxWidth: 720 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 id="notif-title" className="page-title">Notifications</h1>
            <p className="page-subtitle">{unread} non lue{unread > 1 ? 's' : ''}</p>
          </div>
          {unread > 0 && (
            <button type="button" className="btn btn-ghost btn-sm" onClick={markAllRead}>
              <FiCheck aria-hidden /> Tout marquer comme lu
            </button>
          )}
        </div>

        {loading ? (
          <div className="loading-center"><div className="spinner" /></div>
        ) : notifications.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem' }}>
            <FiBell aria-hidden style={{ fontSize: '2.5rem', color: 'var(--text-muted)', marginBottom: '1rem' }} />
            <p className="text-muted">Aucune notification</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {notifications.map((n) => (
              <div
                key={n.id}
                role={n.is_read ? undefined : 'button'}
                tabIndex={n.is_read ? undefined : 0}
                onClick={() => !n.is_read && markRead(n.id)}
                onKeyDown={(e) => e.key === 'Enter' && !n.is_read && markRead(n.id)}
                className={`notification-item${n.is_read ? '' : ' is-unread'}`}
              >
                <div className="notification-item__icon">
                  <FiFileText aria-hidden />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.875rem', fontWeight: n.is_read ? 400 : 600, marginBottom: '0.2rem' }}>
                    {n.title}
                  </div>
                  <div className="text-muted" style={{ fontSize: '0.8rem' }}>{n.message}</div>
                  {n.complaint_ticket && (
                    <Link
                      to={`/espace/plaintes/${n.complaint}`}
                      style={{ fontSize: '0.75rem', marginTop: '0.25rem', display: 'inline-block' }}
                    >
                      Voir la plainte {n.complaint_ticket}
                    </Link>
                  )}
                </div>
                <div className="text-muted" style={{ fontSize: '0.7rem', flexShrink: 0, textAlign: 'right' }}>
                  {new Date(n.created_at).toLocaleDateString('fr-FR')}
                  {!n.is_read && (
                    <span
                      style={{
                        display: 'block',
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        background: 'var(--color-primary)',
                        margin: '0.35rem auto 0',
                      }}
                      aria-hidden
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
