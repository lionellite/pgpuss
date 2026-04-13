import React, { useState } from 'react'
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import {
  FiMenu, FiX, FiBell, FiUser, FiLogOut, FiLogIn,
  FiHome, FiFileText, FiSearch, FiPlusCircle, FiChevronDown
} from 'react-icons/fi'
import { notificationsAPI } from '../api'
import { useEffect } from 'react'

export default function MainLayout() {
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
    { to: '/', label: 'Accueil', icon: <FiHome /> },
    { to: '/deposer', label: 'Déposer une plainte', icon: <FiPlusCircle /> },
    { to: '/suivi', label: 'Suivi', icon: <FiSearch /> },
  ]

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Navbar */}
      <nav style={{
        background: 'rgba(8,18,32,0.9)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(0,119,182,0.15)',
        position: 'sticky', top: 0, zIndex: 100,
      }}>
        <div className="page-container" style={{
          display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', height: 64,
        }}>
          {/* Logo */}
          <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{
              width: 36, height: 36, borderRadius: '10px',
              background: 'linear-gradient(135deg, #0077B6, #00B4D8)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.1rem', fontWeight: 800, color: 'white',
            }}>P</div>
            <div>
              <div style={{ fontFamily: 'Outfit', fontWeight: 800, fontSize: '1rem', color: '#F0F4FF', lineHeight: 1 }}>PGP-USS</div>
              <div style={{ fontSize: '0.65rem', color: '#8FA3BF', lineHeight: 1 }}>Santé Bénin</div>
            </div>
          </Link>

          {/* Desktop Nav */}
          <div className="hide-mobile" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            {navLinks.map(link => (
              <Link key={link.to} to={link.to} style={{
                display: 'flex', alignItems: 'center', gap: '0.4rem',
                padding: '0.5rem 0.875rem', borderRadius: '8px', fontSize: '0.875rem',
                fontWeight: 500, color: location.pathname === link.to ? '#00B4D8' : '#8FA3BF',
                background: location.pathname === link.to ? 'rgba(0,180,216,0.1)' : 'transparent',
                transition: 'all 0.2s', textDecoration: 'none',
              }}>{link.icon}{link.label}</Link>
            ))}
            {isAgent && (
              <Link to="/dashboard" style={{
                display: 'flex', alignItems: 'center', gap: '0.4rem',
                padding: '0.5rem 0.875rem', borderRadius: '8px', fontSize: '0.875rem',
                fontWeight: 500, color: '#8FA3BF', textDecoration: 'none',
                transition: 'all 0.2s',
              }}><FiFileText /> Dashboard</Link>
            )}
          </div>

          {/* Right side */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
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
        background: '#081220', borderTop: '1px solid rgba(0,119,182,0.1)',
        padding: '2rem 0', marginTop: 'auto',
      }}>
        <div className="page-container" style={{ textAlign: 'center', color: '#4A6080', fontSize: '0.8rem' }}>
          <p>© 2025 PGP-USS — Plateforme de Gestion des Plaintes des Usagers des Services de Santé au Bénin</p>
          <p style={{ marginTop: '0.3rem' }}>Ministère de la Santé du Bénin — Projet de Licence en Informatique 2025–2026</p>
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
