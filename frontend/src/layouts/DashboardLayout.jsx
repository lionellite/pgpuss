import React, { useState, useEffect, useCallback } from 'react'
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import {
  FiFileText, FiUsers, FiLogOut, FiMenu,
  FiHome, FiTrendingUp, FiBell, FiChevronRight,
  FiLayers, FiMapPin, FiPhone, FiUser, FiInbox, FiShield,
} from 'react-icons/fi'
import GovFlagBar from '../components/GovFlagBar'
import { ROLE_LABELS } from '../constants/roles'
import { complaintsAPI } from '../api'

const getNavItems = (role) => {
  const items = [
    { to: '/dashboard', icon: <FiHome aria-hidden />, label: 'Tableau de bord', exact: true },
    { to: '/dashboard/plaintes', icon: <FiFileText aria-hidden />, label: 'Plaintes' },
  ]

  if (role === 'AGENT_CALL_CENTER') {
    items.push(
      { to: '/dashboard/social-inbox', icon: <FiInbox aria-hidden />, label: 'Boîte sociale', socialInbox: true },
      { to: '/deposer', icon: <FiPhone aria-hidden />, label: 'Saisie plainte 136' },
    )
  }

  items.push({ to: '/dashboard/analytique', icon: <FiTrendingUp aria-hidden />, label: 'Analytique' })

  if (role === 'PFE') {
    items.push({ to: '/dashboard/agents-internes', icon: <FiUser aria-hidden />, label: 'Agents internes' })
  }

  if (role === 'ADMIN_PLATEFORME') {
    items.push(
      { to: '/dashboard/social-inbox', icon: <FiInbox aria-hidden />, label: 'Boîte sociale', socialInbox: true },
      { to: '/dashboard/utilisateurs', icon: <FiUsers aria-hidden />, label: 'Utilisateurs' },
      { to: '/dashboard/etablissements', icon: <FiMapPin aria-hidden />, label: 'Établissements' },
      { to: '/dashboard/zones-sanitaires', icon: <FiMapPin aria-hidden />, label: 'Zones Sanitaires' },
      { to: '/dashboard/referentiels', icon: <FiLayers aria-hidden />, label: 'Référentiels' },
      { to: '/dashboard/journal-audit', icon: <FiShield aria-hidden />, label: 'Journal d\'audit' },
    )
  }

  if (role === 'CABINET') {
    items.push(
      { to: '/dashboard/journal-audit', icon: <FiShield aria-hidden />, label: 'Journal d\'audit' },
    )
  }

  return items
}

export default function DashboardLayout() {
  const { user, logout } = useAuth()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [pendingCount, setPendingCount] = useState(0)
  const location = useLocation()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const isActive = (item) =>
    item.exact ? location.pathname === item.to : location.pathname.startsWith(item.to)

  // Polling du compteur de plaintes sociales en attente
  const fetchPending = useCallback(() => {
    if (!user || !['AGENT_CALL_CENTER', 'ADMIN_PLATEFORME'].includes(user.role)) return
    complaintsAPI.callcenterSocialInbox({ completed: undefined })
      .then(({ data }) => {
        const list = Array.isArray(data) ? data : (data.results || [])
        setPendingCount(list.filter(c => c.pending_call_center_completion).length)
      })
      .catch(() => {})
  }, [user])

  useEffect(() => {
    fetchPending()
    const interval = setInterval(fetchPending, 60_000) // refresh chaque minute
    return () => clearInterval(interval)
  }, [fetchPending])

  // Rafraîchir le compteur quand on quitte la page social-inbox
  useEffect(() => {
    if (!location.pathname.includes('social-inbox')) {
      fetchPending()
    }
    // Fermer le menu mobile au changement de page
    setMobileOpen(false)
  }, [location.pathname, fetchPending])

  const visibleItems = getNavItems(user?.role)
  const currentPage = visibleItems.find((i) => isActive(i))?.label || 'Tableau de bord'

  return (
    <div className="dashboard-shell">
      <a href="#contenu-dashboard" className="skip-link">
        Aller au contenu
      </a>
      <GovFlagBar />

      <div className="dashboard-body">
        {/* Overlay mobile */}
        {mobileOpen && (
          <div className="dashboard-sidebar-overlay" onClick={() => setMobileOpen(false)} />
        )}
      <aside
        className={`dashboard-sidebar${collapsed ? ' is-collapsed' : ''}${mobileOpen ? ' is-mobile-open' : ''}`}
        aria-label="Navigation du tableau de bord"
      >
        <div className="dashboard-sidebar__head">
          <Link to="/" className="site-brand" style={{ textDecoration: 'none' }}>
            <img src="/logo.png" alt="Plateforme de Gestion des Plaintes" width={36} height={36} />
            {!collapsed && (
              <div>
                <div className="site-brand__title" style={{ fontSize: '0.875rem' }}>Gestion des plaintes</div>
                <div className="site-brand__subtitle">Gestion</div>
              </div>
            )}
          </Link>
          <button
            type="button"
            className="btn-icon"
            onClick={() => setCollapsed(!collapsed)}
            aria-label={collapsed ? 'Déplier le menu' : 'Réduire le menu'}
          >
            {collapsed ? <FiChevronRight aria-hidden /> : <FiMenu aria-hidden />}
          </button>
        </div>

        <nav className="dashboard-nav">
          {visibleItems.map((item) => (
            <Link
              key={item.to + item.label}
              to={item.to}
              title={collapsed ? item.label : undefined}
              className={`dashboard-nav__link${isActive(item) ? ' is-active' : ''}`}
              style={{ position: 'relative' }}
            >
              {item.icon}
              {!collapsed && item.label}
              {/* Badge de comptage pour la boîte sociale */}
              {item.socialInbox && pendingCount > 0 && (
                <span
                  aria-label={`${pendingCount} plainte(s) en attente`}
                  style={{
                    position: 'absolute',
                    top: 6, right: collapsed ? 4 : 8,
                    minWidth: 18, height: 18,
                    background: 'linear-gradient(135deg,#ff9800,#f44336)',
                    color: '#fff',
                    borderRadius: 9,
                    fontSize: '0.65rem',
                    fontWeight: 800,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: '0 4px',
                    boxShadow: '0 2px 6px rgba(244,67,54,0.4)',
                    lineHeight: 1,
                    letterSpacing: 0,
                    animation: 'pulse-badge 2s infinite',
                  }}
                >
                  {pendingCount > 99 ? '99+' : pendingCount}
                </span>
              )}
            </Link>
          ))}
        </nav>

        <div className="dashboard-sidebar__foot">
          {!collapsed && user && (
            <div className="dashboard-user-card">
              <div className="dashboard-user-card__name">{user.full_name}</div>
              <div className="dashboard-user-card__role">{ROLE_LABELS[user.role] || user.role}</div>
            </div>
          )}
          <button
            type="button"
            className="dashboard-nav__link user-menu__item--danger"
            style={{ width: '100%', border: '1px solid rgba(211,47,47,0.2)', background: 'rgba(211,47,47,0.06)' }}
            onClick={handleLogout}
          >
            <FiLogOut aria-hidden />
            {!collapsed && 'Déconnexion'}
          </button>
        </div>
      </aside>

      <div className="dashboard-main">
        <header className="dashboard-topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button
              type="button"
              className="btn-icon mobile-menu-toggle"
              onClick={() => setMobileOpen(true)}
              aria-label="Ouvrir le menu"
            >
              <FiMenu aria-hidden />
            </button>
            <span className="dashboard-topbar__title">{currentPage}</span>
          </div>
          <div className="site-header__actions">
            <Link to="/espace/notifications" className="notif-link" aria-label="Notifications">
              <FiBell aria-hidden />
            </Link>
            <Link to="/" className="text-muted" style={{ fontSize: '0.8rem' }}>
              Retour au site public
            </Link>
          </div>
        </header>

        <main id="contenu-dashboard" className="dashboard-content" tabIndex={-1}>
          <Outlet />
        </main>
      </div>
      </div>
    </div>
  )
}
