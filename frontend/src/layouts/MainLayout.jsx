import React, { useState } from 'react'
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import {
  FiMenu, FiX, FiBell, FiUser, FiLogOut, FiLogIn,
  FiHome, FiFileText, FiSearch, FiPlusCircle, FiChevronDown, FiGlobe
} from 'react-icons/fi'
import { notificationsAPI } from '../api'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'

export default function MainLayout() {
  const { t, i18n } = useTranslation()
  const { user, logout, isAgent } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const [dropOpen, setDropOpen] = useState(false)
  const [unread, setUnread] = useState(0)
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    if (user) {
      notificationsAPI.unreadCount()
        .then(({ data }) => setUnread(data.unread_count))
        .catch(() => {})
    }
  }, [user, location.pathname])

  const handleLogout = () => {
    logout()
    navigate('/')
    setDropOpen(false)
  }

  const navLinks = [
    { to: '/', label: t('home'), icon: <FiHome /> },
    { to: '/deposer', label: t('submit_complaint'), icon: <FiPlusCircle /> },
    { to: '/suivi', label: t('track_complaint'), icon: <FiSearch /> },
  ]

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng)
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#fff' }}>
      {/* Top Banner (Bénin Flag Colors) */}
      <div style={{ height: 4, display: 'flex' }}>
        <div style={{ flex: 1, background: '#008751' }} />
        <div style={{ flex: 1, background: '#fcd116' }} />
        <div style={{ flex: 1, background: '#e8112d' }} />
      </div>

      {/* Navbar */}
      <nav style={{
        background: '#ffffff',
        borderBottom: '1px solid #eee',
        position: 'sticky', top: 0, zIndex: 100,
        boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
      }}>
        <div className="page-container" style={{
          display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', height: 72,
        }}>
          {/* Logo and Branding */}
          <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <img src="https://gouv.bj/assets/img/logo-benin.png" alt="République du Bénin" style={{ height: 44 }}
                 onError={(e) => { e.target.style.display = 'none' }} />
            <div style={{ borderLeft: '1px solid #ddd', paddingLeft: '1rem' }}>
              <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#111', letterSpacing: '-0.02em' }}>PGP-USS</div>
              <div style={{ fontSize: '0.7rem', color: '#666', textTransform: 'uppercase', fontWeight: 600 }}>Santé Bénin</div>
            </div>
          </Link>

          {/* Desktop Nav - Max 7 items */}
          <div className="hide-mobile" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {navLinks.map(link => (
              <Link key={link.to} to={link.to} style={{
                padding: '0.5rem 1rem', fontSize: '0.9rem',
                fontWeight: 600, color: location.pathname === link.to ? 'var(--color-primary)' : '#444',
                borderBottom: location.pathname === link.to ? '2px solid var(--color-primary)' : '2px solid transparent',
                textDecoration: 'none',
              }}>{link.label}</Link>
            ))}
            {isAgent && (
              <Link to="/dashboard" style={{
                padding: '0.5rem 1rem', fontSize: '0.9rem',
                fontWeight: 600, color: '#444', textDecoration: 'none',
              }}>Dashboard</Link>
            )}
          </div>

          {/* Right side */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {/* Language Selector */}
            <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center', marginRight: '0.5rem' }}>
              <FiGlobe style={{ color: '#666', fontSize: '0.9rem' }} />
              <select
                value={i18n.language}
                onChange={(e) => changeLanguage(e.target.value)}
                style={{
                  border: 'none', background: 'none', fontSize: '0.75rem',
                  fontWeight: 600, color: '#333', cursor: 'pointer', outline: 'none'
                }}
              >
                <option value="fr">FR</option>
                <option value="fon">FON</option>
                <option value="yo">YOR</option>
              </select>
            </div>

            {user ? (
              <>
                {/* Notifications bell */}
                <Link to="/espace/notifications" style={{ position: 'relative', color: '#8FA3BF', fontSize: '1.25rem' }}>
                  <FiBell />
                  {unread > 0 && (
                    <span style={{
                      position: 'absolute', top: -6, right: -6,
                      background: '#EF476F', color: 'white',
                      borderRadius: '50%', width: 18, height: 18,
                      fontSize: '0.65rem', fontWeight: 700,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>{unread > 9 ? '9+' : unread}</span>
                  )}
                </Link>
                {/* User dropdown */}
                <div style={{ position: 'relative' }}>
                  <button onClick={() => setDropOpen(!dropOpen)} style={{
                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                    background: 'rgba(0,119,182,0.1)', border: '1px solid rgba(0,119,182,0.2)',
                    borderRadius: '10px', padding: '0.4rem 0.75rem',
                    color: '#F0F4FF', cursor: 'pointer', fontSize: '0.875rem',
                  }}>
                    <FiUser style={{ color: '#00B4D8' }} />
                    <span className="hide-mobile">{user.first_name}</span>
                    <FiChevronDown style={{ fontSize: '0.75rem', color: '#8FA3BF' }} />
                  </button>
                  {dropOpen && (
                    <div style={{
                      position: 'absolute', right: 0, top: '110%',
                      background: '#0F1E35', border: '1px solid rgba(0,119,182,0.2)',
                      borderRadius: '12px', padding: '0.5rem', minWidth: 180,
                      boxShadow: '0 8px 32px rgba(0,0,0,0.4)', zIndex: 200,
                    }}>
                      <Link to="/espace/plaintes" onClick={() => setDropOpen(false)} style={dropItemStyle}>
                        <FiFileText /> Mes plaintes
                      </Link>
                      <Link to="/espace/profil" onClick={() => setDropOpen(false)} style={dropItemStyle}>
                        <FiUser /> Mon profil
                      </Link>
                      {isAgent && (
                        <Link to="/dashboard" onClick={() => setDropOpen(false)} style={dropItemStyle}>
                          <FiHome /> Dashboard
                        </Link>
                      )}
                      <hr style={{ border: 'none', borderTop: '1px solid rgba(0,119,182,0.1)', margin: '0.25rem 0' }} />
                      <button onClick={handleLogout} style={{ ...dropItemStyle, width: '100%', background: 'none', cursor: 'pointer', color: '#EF476F', border: 'none', textAlign: 'left' }}>
                        <FiLogOut /> Déconnexion
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link to="/connexion" className="btn btn-ghost btn-sm"><FiLogIn /> Connexion</Link>
                <Link to="/inscription" className="btn btn-primary btn-sm">S'inscrire</Link>
              </>
            )}
            {/* Mobile menu */}
            <button className="hide-desktop" style={{ background: 'none', border: 'none', color: '#8FA3BF', fontSize: '1.5rem', cursor: 'pointer' }}
              onClick={() => setMenuOpen(!menuOpen)}>
              {menuOpen ? <FiX /> : <FiMenu />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div style={{ background: '#081220', borderTop: '1px solid rgba(0,119,182,0.1)', padding: '1rem' }}>
            {navLinks.map(link => (
              <Link key={link.to} to={link.to} onClick={() => setMenuOpen(false)}
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem', color: '#F0F4FF', borderRadius: '8px', marginBottom: '0.25rem', textDecoration: 'none' }}>
                {link.icon}{link.label}
              </Link>
            ))}
          </div>
        )}
      </nav>

      {/* Content */}
      <main style={{ flex: 1 }}>
        <Outlet />
      </main>

      {/* Footer */}
      <footer style={{
        background: '#f8f9fa', borderTop: '1px solid #eee',
        padding: '3rem 0', marginTop: 'auto',
      }}>
        <div className="page-container">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '2rem', marginBottom: '2rem' }}>
            <div>
              <h4 style={{ fontSize: '0.9rem', marginBottom: '1rem', color: '#111' }}>À propos</h4>
              <p style={{ fontSize: '0.8rem', color: '#666' }}>Plateforme officielle de gestion des plaintes des services de santé au Bénin.</p>
            </div>
            <div>
              <h4 style={{ fontSize: '0.9rem', marginBottom: '1rem', color: '#111' }}>Liens utiles</h4>
              <ul style={{ listStyle: 'none', fontSize: '0.8rem', color: '#666' }}>
                <li><Link to="/deposer">Déposer une plainte</Link></li>
                <li><Link to="/suivi">Suivre une plainte</Link></li>
                <li><a href="https://sante.gouv.bj" target="_blank" rel="noreferrer">Ministère de la Santé</a></li>
              </ul>
            </div>
            <div>
              <h4 style={{ fontSize: '0.9rem', marginBottom: '1rem', color: '#111' }}>Contact</h4>
              <p style={{ fontSize: '0.8rem', color: '#666' }}>Numéro vert : 136</p>
              <p style={{ fontSize: '0.8rem', color: '#666' }}>Email : contact@sante.gouv.bj</p>
            </div>
          </div>
          <div style={{ borderTop: '1px solid #ddd', paddingTop: '1.5rem', textAlign: 'center', color: '#777', fontSize: '0.75rem' }}>
            <p>© 2025 République du Bénin — Ministère de la Santé. Tous droits réservés.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

const dropItemStyle = {
  display: 'flex', alignItems: 'center', gap: '0.5rem',
  padding: '0.5rem 0.75rem', borderRadius: '8px',
  fontSize: '0.875rem', color: '#F0F4FF', textDecoration: 'none',
  transition: 'background 0.15s', marginBottom: '0.1rem',
}
