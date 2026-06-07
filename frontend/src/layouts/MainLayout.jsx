import React, { useState, useEffect } from 'react'
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import {
  FiMenu, FiX, FiBell, FiUser, FiLogOut, FiLogIn,
  FiHome, FiFileText, FiSearch, FiPlusCircle, FiChevronDown,
} from 'react-icons/fi'
import { notificationsAPI } from '../api'
import { useTranslation } from 'react-i18next'
import GovFlagBar from '../components/GovFlagBar'

export default function MainLayout() {
  const { t, i18n } = useTranslation()
  const { user, logout, isAgent } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const [dropOpen, setDropOpen] = useState(false)
  const [unread, setUnread] = useState(0)
  const [searchTicket, setSearchTicket] = useState('')
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    if (user) {
      notificationsAPI.unreadCount()
        .then(({ data }) => setUnread(data.unread_count))
        .catch(() => {})
    }
  }, [user, location.pathname])

  useEffect(() => {
    setMenuOpen(false)
    setDropOpen(false)
  }, [location.pathname])

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const handleSearch = (e) => {
    e.preventDefault()
    const q = searchTicket.trim()
    if (q) navigate(`/suivi?ticket=${encodeURIComponent(q)}`)
  }

  const navLinks = [
    { to: '/', label: t('home'), icon: <FiHome aria-hidden /> },
    { to: '/#comment', label: 'Comment ça marche', icon: null },
    { to: '/#statistiques', label: 'Statistiques', icon: null },
    { to: '/#contact', label: 'Contact', icon: null },
  ]

  const isActive = (path) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path)

  return (
    <div className="site-shell">
      <a href="#contenu-principal" className="skip-link">
        Aller au contenu principal
      </a>
      <GovFlagBar />

      <header className="site-header" role="banner">
        <div className="site-header__inner">
          <Link to="/" className="site-brand">
            <span className="material-symbols-outlined site-brand__icon material-symbols-outlined--filled" aria-hidden>account_balance</span>
            <span className="site-brand__name">PGP-USS Bénin</span>
          </Link>

          <form
            className="site-search hide-mobile"
            onSubmit={handleSearch}
            role="search"
            aria-label="Rechercher une plainte"
          >
            <label className="sr-only" htmlFor="header-ticket">Numéro de ticket</label>
            <input
              id="header-ticket"
              className="site-search__input form-input"
              value={searchTicket}
              onChange={(e) => setSearchTicket(e.target.value)}
              placeholder="N° ticket…"
              autoComplete="off"
            />
            <button type="submit" className="site-search__btn btn btn-primary btn-sm" aria-label="Rechercher">
              <FiSearch aria-hidden />
            </button>
          </form>

          <nav className="site-nav hide-mobile" aria-label="Navigation principale">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`site-nav__link${isActive(link.to) ? ' is-active' : ''}`}
              >
                {link.label}
              </Link>
            ))}
            {isAgent && (
              <Link
                to="/dashboard"
                className={`site-nav__link${location.pathname.startsWith('/dashboard') ? ' is-active' : ''}`}
              >
                Espace gestion
              </Link>
            )}
          </nav>

          <div className="site-header__actions">
            <label className="sr-only" htmlFor="lang-select">Langue</label>
            <select
              id="lang-select"
              className="lang-select hide-mobile"
              value={i18n.language}
              onChange={(e) => i18n.changeLanguage(e.target.value)}
              aria-label="Choisir la langue"
            >
              <option value="fr">Français</option>
              <option value="fon">Fon</option>
              <option value="yo">Yoruba</option>
            </select>

            {user ? (
              <>
                <Link
                  to="/espace/notifications"
                  className="notif-link"
                  aria-label={unread > 0 ? `${unread} notifications non lues` : 'Notifications'}
                >
                  <FiBell aria-hidden />
                  {unread > 0 && (
                    <span className="notif-badge" aria-hidden>
                      {unread > 9 ? '9+' : unread}
                    </span>
                  )}
                </Link>
                <div className="user-menu">
                  <button
                    type="button"
                    className="user-menu__trigger"
                    onClick={() => setDropOpen(!dropOpen)}
                    aria-expanded={dropOpen}
                    aria-haspopup="true"
                  >
                    <FiUser aria-hidden />
                    <span className="hide-mobile">{user.first_name}</span>
                    <FiChevronDown aria-hidden />
                  </button>
                  {dropOpen && (
                    <div className="user-menu__dropdown" role="menu">
                      <Link to="/espace/plaintes" className="user-menu__item" role="menuitem">
                        <FiFileText aria-hidden /> Mes plaintes
                      </Link>
                      <Link to="/espace/profil" className="user-menu__item" role="menuitem">
                        <FiUser aria-hidden /> Mon profil
                      </Link>
                      {isAgent && (
                        <Link to="/dashboard" className="user-menu__item" role="menuitem">
                          <FiHome aria-hidden /> Tableau de bord
                        </Link>
                      )}
                      <hr className="user-menu__sep" />
                      <button
                        type="button"
                        className="user-menu__item user-menu__item--danger"
                        onClick={handleLogout}
                        role="menuitem"
                      >
                        <FiLogOut aria-hidden /> Déconnexion
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link to="/connexion" className="btn btn-outline-primary btn-sm hide-mobile">
                  Se connecter
                </Link>
                <Link to="/deposer" className="btn btn-primary btn-primary--container btn-sm">
                  Déposer une plainte
                </Link>
              </>
            )}

            <button
              type="button"
              className="mobile-nav-toggle hide-desktop"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-expanded={menuOpen}
              aria-controls="mobile-nav"
              aria-label={menuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
            >
              {menuOpen ? <FiX aria-hidden /> : <FiMenu aria-hidden />}
            </button>
          </div>
        </div>

        {menuOpen && (
          <nav id="mobile-nav" className="mobile-nav-panel hide-desktop" aria-label="Navigation mobile">
            <form className="mobile-nav-search" onSubmit={handleSearch} role="search">
              <label className="sr-only" htmlFor="mobile-ticket">Numéro de ticket</label>
              <input
                id="mobile-ticket"
                className="form-input"
                value={searchTicket}
                onChange={(e) => setSearchTicket(e.target.value)}
                placeholder="Rechercher un ticket…"
              />
              <button type="submit" className="btn btn-primary btn-sm">Rechercher</button>
            </form>
            {navLinks.map((link) => (
              <Link key={link.to} to={link.to}>
                {link.icon}
                {link.label}
              </Link>
            ))}
            {isAgent && (
              <Link to="/dashboard">
                <FiHome aria-hidden /> Espace gestion
              </Link>
            )}
            {!user && (
              <Link to="/connexion">
                <FiLogIn aria-hidden /> Connexion
              </Link>
            )}
          </nav>
        )}
      </header>

      <main id="contenu-principal" className="site-main" tabIndex={-1}>
        <Outlet />
      </main>

      <footer id="contact" className="site-footer" role="contentinfo">
        <div className="page-container">
          <div className="site-footer__grid">
            <div>
              <div className="site-brand" style={{ marginBottom: '1rem' }}>
                <span className="material-symbols-outlined site-brand__icon material-symbols-outlined--filled" aria-hidden>account_balance</span>
                <span className="site-brand__name">PGP-USS</span>
              </div>
              <p className="site-footer__text">
                Plateforme de Gestion des Plaintes des Usagers des Services de Santé. Une initiative du Ministère de la Santé de la République du Bénin.
              </p>
            </div>
            <div>
              <h2 className="site-footer__title">Navigation</h2>
              <ul className="site-footer__links">
                <li><Link to="/">Accueil</Link></li>
                <li><Link to="/#statistiques">Statistiques Nationales</Link></li>
                <li><Link to="/deposer">Déposer une plainte</Link></li>
                <li><Link to="/#contact">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h2 className="site-footer__title">Liens Utiles</h2>
              <ul className="site-footer__links">
                <li><a href="https://sante.gouv.bj" target="_blank" rel="noopener noreferrer">Ministère de la Santé</a></li>
                <li><a href="tel:136">Ligne Verte 136</a></li>
                <li><a href="https://gouv.bj" target="_blank" rel="noopener noreferrer">Portail Gouvernemental</a></li>
              </ul>
            </div>
            <div>
              <h2 className="site-footer__title">Contact</h2>
              <p className="site-footer__text">Ligne verte : <a href="tel:136">136</a></p>
              <p className="site-footer__text">Courriel : contact@sante.gouv.bj</p>
            </div>
          </div>
          <div className="site-footer__bottom">
            <p>© {new Date().getFullYear()} Ministère de la Santé du Bénin. Tous droits réservés.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
