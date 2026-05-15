import React, { useState } from 'react'
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import {
  FiFileText, FiUsers, FiLogOut, FiMenu,
  FiHome, FiTrendingUp, FiBell, FiChevronRight,
  FiLayers, FiMapPin,
} from 'react-icons/fi'

const navItems = [
  { to: '/dashboard', icon: <FiHome />, label: 'Tableau de bord', exact: true },
  { to: '/dashboard/plaintes', icon: <FiFileText />, label: 'Plaintes' },
  { to: '/dashboard/analytique', icon: <FiTrendingUp />, label: 'Analytique' },
  { to: '/dashboard/utilisateurs', icon: <FiUsers />, label: 'Utilisateurs', roles: ['ADMIN_PLATEFORME'] },
  { to: '/dashboard/etablissements', icon: <FiMapPin />, label: 'Établissements', roles: ['ADMIN_PLATEFORME'] },
  { to: '/dashboard/referentiels', icon: <FiLayers />, label: 'Référentiels', roles: ['ADMIN_PLATEFORME'] },
]

export default function DashboardLayout() {
  const { user, logout } = useAuth()
  const [collapsed, setCollapsed] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()

  const handleLogout = () => { logout(); navigate('/') }

  const isActive = (item) => item.exact
    ? location.pathname === item.to
    : location.pathname.startsWith(item.to)

  const visibleItems = navItems.filter(item =>
    !item.roles || (user && item.roles.includes(user.role))
  )

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-dark)' }}>
      {/* Sidebar */}
      <aside style={{
        width: collapsed ? 64 : 240, flexShrink: 0,
        background: 'var(--bg-sidebar)',
        borderRight: '1px solid var(--border-color)',
        display: 'flex', flexDirection: 'column',
        transition: 'width 0.3s ease', overflow: 'hidden',
        position: 'sticky', top: 0, height: '100vh',
      }}>
        {/* Logo */}
        <div style={{
          padding: collapsed ? '1.25rem 0' : '1.25rem 1.25rem',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex', alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'space-between',
          gap: '0.75rem',
        }}>
          {!collapsed && (
            <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{
                width: 32, height: 32, borderRadius: '8px',
                background: 'var(--color-primary)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 800, color: 'white', fontSize: '0.9rem',
              }}>P</div>
              <div>
                <div style={{ fontWeight: 800, fontSize: '0.875rem', color: 'var(--text-primary)' }}>PGP-USS</div>
                <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>Dashboard</div>
              </div>
            </Link>
          )}
          <button onClick={() => setCollapsed(!collapsed)} style={{
            background: 'rgba(0,119,182,0.1)', border: '1px solid rgba(0,119,182,0.2)',
            borderRadius: '8px', padding: '0.4rem', cursor: 'pointer',
            color: 'var(--text-muted)', display: 'flex', transition: 'all 0.2s',
          }}>
            {collapsed ? <FiChevronRight /> : <FiMenu />}
          </button>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '1rem 0.5rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          {visibleItems.map(item => (
            <Link key={item.to} to={item.to} title={collapsed ? item.label : ''} style={{
              display: 'flex', alignItems: 'center', gap: '0.75rem',
              padding: collapsed ? '0.75rem' : '0.65rem 0.875rem',
              borderRadius: '10px', textDecoration: 'none',
              fontSize: '0.875rem', fontWeight: 500,
              background: isActive(item) ? 'rgba(0,135,81,0.08)' : 'transparent',
              color: isActive(item) ? 'var(--color-primary)' : 'var(--text-secondary)',
              border: isActive(item) ? '1px solid rgba(0,135,81,0.2)' : '1px solid transparent',
              justifyContent: collapsed ? 'center' : 'flex-start',
              transition: 'all 0.2s',
            }}>
              <span style={{ fontSize: '1rem', flexShrink: 0 }}>{item.icon}</span>
              {!collapsed && item.label}
            </Link>
          ))}
        </nav>

        {/* User + Logout */}
        <div style={{ padding: '0.75rem 0.5rem', borderTop: '1px solid var(--border-color)' }}>
          {!collapsed && user && (
            <div style={{
              padding: '0.75rem', borderRadius: '10px',
              background: '#f4f7f6',
              border: '1px solid var(--border-color)',
              marginBottom: '0.5rem',
            }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)' }}>{user.full_name}</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{user.role?.replace('_', ' ')}</div>
            </div>
          )}
          <button onClick={handleLogout} style={{
            display: 'flex', alignItems: 'center', gap: '0.75rem',
            padding: collapsed ? '0.75rem' : '0.65rem 0.875rem',
            borderRadius: '10px', background: 'rgba(239,71,111,0.05)',
            border: '1px solid rgba(239,71,111,0.1)',
            color: '#EF476F', cursor: 'pointer', width: '100%',
            fontSize: '0.875rem', fontWeight: 500,
            justifyContent: collapsed ? 'center' : 'flex-start',
            transition: 'all 0.2s',
          }}>
            <FiLogOut style={{ flexShrink: 0 }} />
            {!collapsed && 'Déconnexion'}
          </button>
        </div>
      </aside>

      {/* Main */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Top bar */}
        <header style={{
          padding: '0 1.5rem', height: 56,
          background: 'var(--bg-card)',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          position: 'sticky', top: 0, zIndex: 50,
        }}>
          <h1 style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
            {visibleItems.find(i => i.exact ? location.pathname === i.to : location.pathname.startsWith(i.to))?.label || 'Dashboard'}
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Link to="/espace/notifications" style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>
              <FiBell />
            </Link>
            <Link to="/" style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textDecoration: 'none' }}>
              ← Site public
            </Link>
          </div>
        </header>

        {/* Page content */}
        <main style={{ flex: 1, padding: '1.5rem', overflowY: 'auto' }}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
