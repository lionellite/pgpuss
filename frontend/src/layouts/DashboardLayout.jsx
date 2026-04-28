import React, { useState } from 'react'
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const navItems = [
  { to: '/dashboard', icon: 'dashboard', label: 'Tableau de bord', exact: true },
  { to: '/dashboard/plaintes', icon: 'assignment_late', label: 'File de plaintes' },
  { to: '/dashboard/analytique', icon: 'assessment', label: 'Rapports' },
  { to: '/dashboard/utilisateurs', icon: 'group', label: 'Utilisateurs', roles: ['ADMIN_NATIONAL'] },
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
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--background)' }}>
      {/* SideNavBar */}
      <aside style={{
        width: collapsed ? '80px' : '256px',
        position: 'fixed', left: 0, top: 0, bottom: 0,
        background: 'var(--surface-container-low)',
        borderRight: '1px solid var(--outline-variant)',
        display: 'flex', flexDirection: 'column',
        padding: '1rem 0', zIndex: 50,
        transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      }}>
        {/* Branding */}
        <div style={{ padding: '0 1.5rem', marginBottom: '2rem', overflow: 'hidden', whiteSpace: 'nowrap' }}>
          <h1 style={{
            fontSize: '1.25rem', fontWeight: 900, color: 'var(--primary)',
            letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '0.75rem'
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>health_and_safety</span>
            {!collapsed && 'PGPUSS-Bénin'}
          </h1>
          {!collapsed && <p style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700, color: 'var(--outline)', marginTop: '0.25rem' }}>Administration</p>}
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          {visibleItems.map(item => (
            <Link key={item.to} to={item.to} style={{
              display: 'flex', alignItems: 'center',
              padding: '0.75rem 1.5rem',
              textDecoration: 'none',
              fontSize: '0.875rem',
              fontWeight: 500,
              color: isActive(item) ? 'var(--primary)' : 'var(--on-surface-variant)',
              background: isActive(item) ? 'rgba(0, 78, 159, 0.08)' : 'transparent',
              borderRight: isActive(item) ? '4px solid var(--primary)' : '4px solid transparent',
              transition: 'all 0.2s',
              overflow: 'hidden', whiteSpace: 'nowrap',
            }}>
              <span className="material-symbols-outlined" style={{ marginRight: collapsed ? 0 : '12px' }}>{item.icon}</span>
              {!collapsed && item.label}
            </Link>
          ))}
        </nav>

        {/* Bottom Actions */}
        <div style={{ marginTop: 'auto', padding: '0 0.5rem' }}>
          <button onClick={() => setCollapsed(!collapsed)} style={{
            width: '100%', padding: '0.75rem', background: 'none', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'flex-start',
            color: 'var(--outline)',
          }}>
             <span className="material-symbols-outlined">{collapsed ? 'chevron_right' : 'chevron_left'}</span>
             {!collapsed && <span style={{ marginLeft: '12px', fontSize: '0.875rem' }}>Réduire</span>}
          </button>
          <button onClick={handleLogout} style={{
            width: '100%', padding: '0.75rem', background: 'none', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'flex-start',
            color: 'var(--error)', transition: 'all 0.2s',
          }}>
            <span className="material-symbols-outlined">logout</span>
            {!collapsed && <span style={{ marginLeft: '12px', fontSize: '0.875rem', fontWeight: 600 }}>Déconnexion</span>}
          </button>
        </div>
      </aside>

      {/* Main Canvas */}
      <main style={{
        flex: 1,
        marginLeft: collapsed ? '80px' : '256px',
        minHeight: '100vh',
        display: 'flex', flexDirection: 'column',
        transition: 'margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      }}>
        {/* TopAppBar */}
        <header style={{
          position: 'sticky', top: 0, zIndex: 40,
          background: 'var(--surface)',
          borderBottom: '1px solid var(--outline-variant)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0.75rem 1.5rem', height: '64px',
        }}>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--primary)' }}>
            {visibleItems.find(i => isActive(i))?.label || 'Administration'}
          </h2>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            {/* Search */}
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }} className="hide-mobile">
              <span className="material-symbols-outlined" style={{ position: 'absolute', left: '12px', color: 'var(--outline)', fontSize: '20px' }}>search</span>
              <input
                type="text"
                placeholder="Rechercher un dossier..."
                style={{
                  padding: '0.5rem 1rem 0.5rem 2.5rem',
                  background: 'var(--surface-container)',
                  border: 'none', borderRadius: '8px',
                  fontSize: '0.875rem', width: '240px',
                  outline: 'none',
                }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <button style={{
                padding: '0.5rem', borderRadius: '50%', border: 'none', background: 'none',
                cursor: 'pointer', color: 'var(--on-surface-variant)', position: 'relative'
              }}>
                <span className="material-symbols-outlined">notifications</span>
                <span style={{ position: 'absolute', top: '8px', right: '8px', width: '8px', height: '8px', background: 'var(--error)', borderRadius: '50%', border: '2px solid var(--surface)' }}></span>
              </button>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginLeft: '0.5rem' }}>
                <div style={{ textAlign: 'right' }} className="hide-mobile">
                  <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--on-surface)' }}>{user?.full_name}</div>
                  <div style={{ fontSize: '0.6875rem', color: 'var(--outline)', textTransform: 'uppercase' }}>{user?.role?.replace('_', ' ')}</div>
                </div>
                <div style={{
                  width: '36px', height: '36px', borderRadius: '50%',
                  background: 'var(--primary-container)', color: 'var(--on-primary-container)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 700, fontSize: '0.875rem'
                }}>
                  {user?.first_name?.[0]}{user?.last_name?.[0]}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Content Content */}
        <div style={{ padding: '2rem', flex: 1 }}>
          <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
            <Outlet />
          </div>
        </div>

        {/* Footer */}
        <footer style={{
          padding: '1.5rem 2rem',
          borderTop: '1px solid var(--surface-container)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em',
          color: 'var(--outline)'
        }}>
          <p>© 2024 PGPUSS-Bénin - Ministère de la Santé</p>
          <div style={{ display: 'flex', gap: '1.5rem' }}>
            <Link to="#" style={{ color: 'inherit' }}>Confidentialité</Link>
            <Link to="#" style={{ color: 'inherit' }}>Support</Link>
          </div>
        </footer>
      </main>
    </div>
  )
}
