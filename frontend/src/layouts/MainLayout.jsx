import React, { useState, useEffect } from 'react'
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import {
  FiMenu, FiX, FiBell, FiUser, FiLogOut, FiLogIn,
  FiHome, FiFileText, FiSearch, FiPlusCircle, FiChevronDown, FiGlobe
} from 'react-icons/fi'
import { notificationsAPI } from '../api'
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
    { to: '/', label: t('home') },
    { to: '/deposer', label: t('submit_complaint') },
    { to: '/suivi', label: t('track_complaint') },
  ]

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng)
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--background)' }}>
      {/* Top Banner (Bénin Flag Colors) */}
      <div style={{ height: 4, display: 'flex' }}>
        <div style={{ flex: 1, background: 'var(--color-primary-bj)' }} />
        <div style={{ flex: 1, background: 'var(--color-secondary-bj)' }} />
        <div style={{ flex: 1, background: 'var(--color-accent-bj)' }} />
      </div>

      {/* Navbar */}
      <nav style={{
        background: '#ffffff',
        borderBottom: '1px solid var(--surface-container)',
        position: 'sticky', top: 0, zIndex: 100,
      }}>
        <div className="page-container" style={{
          display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', height: 72,
        }}>
          {/* Logo and Branding */}
          <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <img src="https://gouv.bj/assets/img/logo-benin.png" alt="République du Bénin" style={{ height: 44 }}
                 onError={(e) => { e.target.style.display = 'none' }} />
            <div style={{ borderLeft: '1px solid var(--surface-container)', paddingLeft: '1rem' }}>
              <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--primary)', letterSpacing: '-0.02em', fontFamily: 'Public Sans' }}>PGP-USS</div>
              <div style={{ fontSize: '0.65rem', color: 'var(--outline)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>Santé Bénin</div>
            </div>
          </Link>

          {/* Desktop Nav - Max 7 items as per standards */}
          <div className="hide-mobile" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {navLinks.map(link => (
              <Link key={link.to} to={link.to} style={{
                padding: '0.5rem 1rem', fontSize: '0.875rem',
                fontWeight: 700, color: location.pathname === link.to ? 'var(--primary)' : 'var(--on-surface-variant)',
                borderBottom: location.pathname === link.to ? '3px solid var(--primary)' : '3px solid transparent',
                textDecoration: 'none',
                textTransform: 'uppercase',
                letterSpacing: '0.025em'
              }}>{link.label}</Link>
            ))}
            {isAgent && (
              <Link to="/dashboard" style={{
                padding: '0.5rem 1rem', fontSize: '0.875rem',
                fontWeight: 700, color: 'var(--on-surface-variant)', textDecoration: 'none',
                textTransform: 'uppercase', letterSpacing: '0.025em'
              }}>Dashboard</Link>
            )}
          </div>

          {/* Right side */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {/* Language Selector */}
            <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center', background: 'var(--surface-container-low)', padding: '0.4rem 0.6rem', borderRadius: '4px' }}>
              <FiGlobe style={{ color: 'var(--outline)', fontSize: '0.9rem' }} />
              <select
                value={i18n.language}
                onChange={(e) => changeLanguage(e.target.value)}
                style={{
                  border: 'none', background: 'none', fontSize: '0.7rem',
                  fontWeight: 800, color: 'var(--on-surface)', cursor: 'pointer', outline: 'none'
                }}
              >
                <option value="fr">FR</option>
                <option value="fon">FON</option>
                <option value="yo">YOR</option>
              </select>
            </div>

            {user ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Link to="/espace/notifications" style={{ position: 'relative', color: 'var(--outline)', fontSize: '1.25rem', display: 'flex' }}>
                  <FiBell />
                  {unread > 0 && (
                    <span style={{
                      position: 'absolute', top: -4, right: -4,
                      background: 'var(--error)', color: 'white',
                      borderRadius: '50%', width: 16, height: 16,
                      fontSize: '0.6rem', fontWeight: 800,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>{unread > 9 ? '9+' : unread}</span>
                  )}
                </Link>
                <div style={{ position: 'relative' }}>
                  <button onClick={() => setDropOpen(!dropOpen)} className="btn btn-ghost" style={{
                    padding: '0.4rem 0.8rem', textTransform: 'none', fontSize: '0.8rem', borderRadius: '50px'
                  }}>
                    <FiUser style={{ color: 'var(--primary)' }} />
                    <span className="hide-mobile">{user.first_name}</span>
                    <FiChevronDown />
                  </button>
                  {dropOpen && (
                    <div style={{
                      position: 'absolute', right: 0, top: '120%',
                      background: '#ffffff', border: '1px solid var(--outline-variant)',
                      borderRadius: '8px', padding: '0.5rem', minWidth: 200,
                      boxShadow: 'var(--shadow-lg)', zIndex: 200,
                    }}>
                      <Link to="/espace/plaintes" onClick={() => setDropOpen(false)} style={dropItemStyle}>
                        <FiFileText /> Mes plaintes
                      </Link>
                      <Link to="/espace/profil" onClick={() => setDropOpen(false)} style={dropItemStyle}>
                        <FiUser /> Mon profil
                      </Link>
                      <hr style={{ border: 'none', borderTop: '1px solid var(--surface-container)', margin: '0.5rem 0' }} />
                      <button onClick={handleLogout} style={{ ...dropItemStyle, width: '100%', background: 'none', cursor: 'pointer', color: 'var(--error)', border: 'none', textAlign: 'left' }}>
                        <FiLogOut /> Déconnexion
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <Link to="/connexion" className="btn btn-ghost" style={{ fontSize: '0.75rem' }}>Connexion</Link>
                <Link to="/inscription" className="btn btn-primary" style={{ fontSize: '0.75rem' }}>S'inscrire</Link>
              </div>
            )}
            <button className="hide-desktop" style={{ background: 'none', border: 'none', color: 'var(--outline)', fontSize: '1.5rem', cursor: 'pointer' }}
              onClick={() => setMenuOpen(!menuOpen)}>
              {menuOpen ? <FiX /> : <FiMenu />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div style={{ background: '#fff', borderTop: '1px solid var(--surface-container)', padding: '1rem' }}>
            {navLinks.map(link => (
              <Link key={link.to} to={link.to} onClick={() => setMenuOpen(false)}
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '1rem', color: 'var(--on-surface)', borderRadius: '8px', marginBottom: '0.25rem', textDecoration: 'none', fontWeight: 700 }}>
                {link.label}
              </Link>
            ))}
          </div>
        )}
      </nav>

      {/* Content */}
      <main style={{ flex: 1 }}>
        <Outlet />
      </main>

      {/* Footer - Sobere as per standards */}
      <footer style={{
        background: '#ffffff', borderTop: '1px solid var(--surface-container)',
        padding: '4rem 0', marginTop: 'auto',
      }}>
        <div className="page-container">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '3rem', marginBottom: '3rem' }}>
            <div>
               <h4 style={{ fontSize: '0.9rem', fontWeight: 900, marginBottom: '1.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>PGP-USS Bénin</h4>
               <p style={{ fontSize: '0.875rem', color: 'var(--on-surface-variant)', lineHeight: 1.6 }}>
                 Service officiel de recueil et de traitement des plaintes pour l'amélioration continue des services de santé en République du Bénin.
               </p>
            </div>
            <div>
              <h4 style={{ fontSize: '0.75rem', fontWeight: 900, marginBottom: '1.25rem', color: 'var(--outline)', textTransform: 'uppercase' }}>Navigation</h4>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <li><Link to="/deposer" style={footerLinkStyle}>Déposer une plainte</Link></li>
                <li><Link to="/suivi" style={footerLinkStyle}>Suivre mon dossier</Link></li>
                <li><Link to="/connexion" style={footerLinkStyle}>Espace citoyen</Link></li>
              </ul>
            </div>
            <div>
              <h4 style={{ fontSize: '0.75rem', fontWeight: 900, marginBottom: '1.25rem', color: 'var(--outline)', textTransform: 'uppercase' }}>Contact & Support</h4>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <li style={{ fontSize: '0.875rem', color: 'var(--on-surface-variant)' }}>Numéro vert : <strong>136</strong></li>
                <li style={{ fontSize: '0.875rem', color: 'var(--on-surface-variant)' }}>Email : contact@sante.gouv.bj</li>
                <li><a href="https://sante.gouv.bj" target="_blank" rel="noreferrer" style={footerLinkStyle}>Ministère de la Santé</a></li>
              </ul>
            </div>
          </div>
          <div style={{ borderTop: '1px solid var(--surface-container)', paddingTop: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <p style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--outline)', textTransform: 'uppercase' }}>
              © 2024 République du Bénin — Ministère de la Santé
            </p>
            <div style={{ display: 'flex', gap: '1.5rem' }}>
               <Link to="#" style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--outline)', textTransform: 'uppercase' }}>Mentions Légales</Link>
               <Link to="#" style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--outline)', textTransform: 'uppercase' }}>Confidentialité</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

const dropItemStyle = {
  display: 'flex', alignItems: 'center', gap: '0.75rem',
  padding: '0.75rem 1rem', borderRadius: '4px',
  fontSize: '0.875rem', color: 'var(--on-surface-variant)', textDecoration: 'none',
  transition: 'background 0.2s', fontWeight: 600
}

const footerLinkStyle = {
  fontSize: '0.875rem',
  color: 'var(--on-surface)',
  fontWeight: 600,
  textDecoration: 'none'
}
