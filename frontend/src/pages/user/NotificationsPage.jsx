import React, { useState, useEffect } from 'react'
import { notificationsAPI } from '../../api'
import { FiBell, FiCheckDouble, FiFileText } from 'react-icons/fi'
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
    toast.success('Toutes les notifications marquées comme lues')
    load()
  }

  const markRead = async (id) => {
    await notificationsAPI.markRead(id)
    setNotifications(ns => ns.map(n => n.id === id ? { ...n, is_read: true } : n))
  }

  return (
    <div style={{ padding: '2rem 0' }}>
      <div className="page-container" style={{ maxWidth: 720 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
          <div>
            <h1 className="page-title">Notifications</h1>
            <p className="page-subtitle">{notifications.filter(n => !n.is_read).length} non lues</p>
          </div>
          {notifications.some(n => !n.is_read) && (
            <button className="btn btn-ghost btn-sm" onClick={markAllRead}>
              <FiCheckDouble /> Tout marquer comme lu
            </button>
          )}
        </div>

        {loading ? <div className="loading-center"><div className="spinner" /></div> :
          notifications.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem' }}>
              <FiBell style={{ fontSize: '3rem', color: '#4A6080', marginBottom: '1rem' }} />
              <p style={{ color: '#8FA3BF' }}>Aucune notification</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {notifications.map(n => (
                <div key={n.id} onClick={() => !n.is_read && markRead(n.id)} style={{
                  padding: '1rem 1.25rem', borderRadius: '12px',
                  background: n.is_read ? 'rgba(15,30,53,0.4)' : 'rgba(0,119,182,0.08)',
                  border: n.is_read ? '1px solid rgba(0,119,182,0.1)' : '1px solid rgba(0,119,182,0.25)',
                  cursor: n.is_read ? 'default' : 'pointer',
                  transition: 'all 0.2s',
                  display: 'flex', gap: '1rem', alignItems: 'flex-start',
                }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                    background: n.is_read ? 'rgba(8,18,32,0.5)' : 'rgba(0,119,182,0.15)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: n.is_read ? '#4A6080' : '#00B4D8',
                  }}>
                    <FiFileText />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.875rem', fontWeight: n.is_read ? 400 : 600, color: n.is_read ? '#8FA3BF' : '#F0F4FF', marginBottom: '0.2rem' }}>
                      {n.title}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#4A6080' }}>{n.message}</div>
                    {n.complaint_ticket && (
                      <Link to={`/espace/plaintes/${n.complaint}`} style={{ fontSize: '0.75rem', color: '#00B4D8', marginTop: '0.25rem', display: 'inline-block' }}>
                        Voir plainte {n.complaint_ticket} →
                      </Link>
                    )}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#4A6080', flexShrink: 0 }}>
                    {new Date(n.created_at).toLocaleDateString('fr-FR')}
                    {!n.is_read && <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#00B4D8', margin: '0.3rem auto 0' }} />}
                  </div>
                </div>
              ))}
            </div>
          )}
      </div>
    </div>
  )
}
