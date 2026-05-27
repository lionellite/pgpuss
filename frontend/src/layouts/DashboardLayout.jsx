import React, { useState } from 'react'
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import {
  FiFileText, FiUsers, FiLogOut, FiMenu,
  FiHome, FiTrendingUp, FiBell, FiChevronRight,
  FiLayers, FiMapPin, FiPhone, FiUser,
} from 'react-icons/fi'
import GovFlagBar from '../components/GovFlagBar'

const getNavItems = (role) => {
  const items = [
    { to: '/dashboard', icon: <FiHome aria-hidden />, label: 'Tableau de bord', exact: true },
    { to: '/dashboard/plaintes', icon: <FiFileText aria-hidden />, label: 'Plaintes' },
  ]

  if (role === 'AGENT_CALL_CENTER') {
    items.push({ to: '/deposer', icon: <FiPhone aria-hidden />, label: 'Saisie plainte 136' })
  }

  items.push({ to: '/dashboard/analytique', icon: <FiTrendingUp aria-hidden />, label: 'Analytique' })

  if (role === 'PFE') {
    items.push({ to: '/dashboard/agents-internes', icon: <FiUser aria-hidden />, label: 'Agents internes' })
  }

  if (role === 'ADMIN_PLATEFORME') {
    items.push(
      { to: '/dashboard/utilisateurs', icon: <FiUsers aria-hidden />, label: 'Utilisateurs' },
      { to: '/dashboard/etablissements', icon: <FiMapPin aria-hidden />, label: 'Établissements' },
      { to: '/dashboard/referentiels', icon: <FiLayers aria-hidden />, label: 'Référentiels' },
    )
  }

  return items
}

export default function DashboardLayout() {
  const { user, logout } = useAuth()
  const [collapsed, setCollapsed] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const isActive = (item) =>
    item.exact ? location.pathname === item.to : location.pathname.startsWith(item.to)

  const visibleItems = getNavItems(user?.role)
  const currentPage = visibleItems.find((i) => isActive(i))?.label || 'Tableau de bord'

  return (
    <div className="dashboard-shell">
      <a href="#contenu-dashboard" className="skip-link">
        Aller au contenu
      </a>
      <GovFlagBar />

      <div className="dashboard-body">
      <aside
        className={`dashboard-sidebar${collapsed ? ' is-collapsed' : ''}`}
        aria-label="Navigation du tableau de bord"
      >
        <div className="dashboard-sidebar__head">
          <Link to="/" className="site-brand" style={{ textDecoration: 'none' }}>
            <img src="/logo.png" alt="PGP-USS" width={36} height={36} />
            {!collapsed && (
              <div>
                <div className="site-brand__title" style={{ fontSize: '0.875rem' }}>PGP-USS</div>
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
              key={item.to}
              to={item.to}
              title={collapsed ? item.label : undefined}
              className={`dashboard-nav__link${isActive(item) ? ' is-active' : ''}`}
            >
              {item.icon}
              {!collapsed && item.label}
            </Link>
          ))}
        </nav>

        <div className="dashboard-sidebar__foot">
          {!collapsed && user && (
            <div className="dashboard-user-card">
              <div className="dashboard-user-card__name">{user.full_name}</div>
              <div className="dashboard-user-card__role">{user.role?.replace(/_/g, ' ')}</div>
            </div>
          )}
          <button
            type="button"
            className="dashboard-nav__link user-menu__item--danger"
            style={{ width: '100%', border: '1px solid rgba(232,17,45,0.2)', background: '#fef2f2' }}
            onClick={handleLogout}
          >
            <FiLogOut aria-hidden />
            {!collapsed && 'Déconnexion'}
          </button>
        </div>
      </aside>

      <div className="dashboard-main">
        <header className="dashboard-topbar">
          <span className="dashboard-topbar__title">{currentPage}</span>
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
