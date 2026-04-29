import React, { useState } from 'react'
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import {
  FiBarChart2, FiFileText, FiUsers, FiLogOut, FiMenu,
  FiX, FiHome, FiTrendingUp, FiBell, FiChevronRight
} from 'react-icons/fi'

const navItems = [
  { to: '/dashboard', icon: <FiHome />, label: 'Tableau de bord', exact: true },
  { to: '/dashboard/plaintes', icon: <FiFileText />, label: 'Plaintes' },
  { to: '/dashboard/analytique', icon: <FiTrendingUp />, label: 'Analytique' },
  { to: '/dashboard/utilisateurs', icon: <FiUsers />, label: 'Utilisateurs', roles: ['ADMIN_NATIONAL'] },
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
                background: 'linear-gradient(135deg, #0077B6, #00B4D8)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 800, color: 'white', fontSize: '0.9rem', fontFamily: 'Outfit',
              }}>P</div>
              <div>
                <div style={{ fontFamily: 'Outfit', fontWeight: 800, fontSize: '0.875rem', color: '#F0F4FF' }}>PGP-USS</div>
                <div style={{ fontSize: '0.6rem', color: '#4A6080' }}>Dashboard</div>
              </div>
            </Link>
          )}
          <button onClick={() => setCollapsed(!collapsed)} style={{
            background: 'rgba(0,119,182,0.1)', border: '1px solid rgba(0,119,182,0.2)',
            borderRadius: '8px', padding: '0.4rem', cursor: 'pointer',
            color: '#8FA3BF', display: 'flex', transition: 'all 0.2s',
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
              background: isActive(item) ? 'rgba(0,119,182,0.15)' : 'transparent',
              color: isActive(item) ? '#00B4D8' : '#8FA3BF',
              border: isActive(item) ? '1px solid rgba(0,119,182,0.2)' : '1px solid transparent',
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
              background: 'rgba(0,119,182,0.05)',
              border: '1px solid rgba(0,119,182,0.1)',
              marginBottom: '0.5rem',
            }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#F0F4FF' }}>{user.full_name}</div>
              <div style={{ fontSize: '0.7rem', color: '#4A6080' }}>{user.role?.replace('_', ' ')}</div>
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
          background: 'rgba(8,18,32,0.8)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          position: 'sticky', top: 0, zIndex: 50,
        }}>
          <h1 style={{ fontSize: '0.875rem', color: '#8FA3BF', fontWeight: 500 }}>
            {visibleItems.find(i => i.exact ? location.pathname === i.to : location.pathname.startsWith(i.to))?.label || 'Dashboard'}
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Link to="/espace/notifications" style={{ color: '#8FA3BF', fontSize: '1.1rem' }}>
              <FiBell />
            </Link>
            <Link to="/" style={{ fontSize: '0.8rem', color: '#8FA3BF', textDecoration: 'none' }}>
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
