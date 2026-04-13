import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'

// Layouts
import MainLayout from './layouts/MainLayout'
import DashboardLayout from './layouts/DashboardLayout'
import AuthLayout from './layouts/AuthLayout'

// Public Pages
import LandingPage from './pages/public/LandingPage'
import LoginPage from './pages/public/LoginPage'
import RegisterPage from './pages/public/RegisterPage'
import TrackPage from './pages/public/TrackPage'
import DepotPage from './pages/public/DepotPage'

// User Pages
import MesPlaintesPage from './pages/user/MesPlaintesPage'
import DetailPlaintePage from './pages/user/DetailPlaintePage'
import NotificationsPage from './pages/user/NotificationsPage'
import ProfilPage from './pages/user/ProfilPage'

// Dashboard Pages
import DashboardHome from './pages/dashboard/DashboardHome'
import PlaintesListPage from './pages/dashboard/PlaintesListPage'
import PlainteDetailPage from './pages/dashboard/PlainteDetailPage'
import AnalyticsPage from './pages/dashboard/AnalyticsPage'
import UsersPage from './pages/dashboard/UsersPage'

function PrivateRoute({ children, roles }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="loading-center"><div className="spinner"/></div>
  if (!user) return <Navigate to="/connexion" replace />
  if (roles && !roles.includes(user.role)) return <Navigate to="/espace/plaintes" replace />
  return children
}

function AgentRoute({ children }) {
  return (
    <PrivateRoute roles={[
      'AGENT_RECEPTION', 'GESTIONNAIRE_SERVICE', 'MEDIATEUR',
      'DIRECTEUR', 'RESPONSABLE_QUALITE', 'ADMIN_NATIONAL', 'AUDITEUR'
    ]}>
      {children}
    </PrivateRoute>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public - Main Layout */}
        <Route element={<MainLayout />}>
          <Route path="/" element={<LandingPage />} />
          <Route path="/suivi" element={<TrackPage />} />
          <Route path="/deposer" element={<DepotPage />} />
        </Route>

        {/* Auth Layout */}
        <Route element={<AuthLayout />}>
          <Route path="/connexion" element={<LoginPage />} />
          <Route path="/inscription" element={<RegisterPage />} />
        </Route>

        {/* User Space */}
        <Route element={<PrivateRoute><MainLayout /></PrivateRoute>}>
          <Route path="/espace/plaintes" element={<MesPlaintesPage />} />
          <Route path="/espace/plaintes/:id" element={<DetailPlaintePage />} />
          <Route path="/espace/deposer" element={<DepotPage />} />
          <Route path="/espace/notifications" element={<NotificationsPage />} />
          <Route path="/espace/profil" element={<ProfilPage />} />
        </Route>

        {/* Dashboard - agent/gestionnaire/admin */}
        <Route element={<AgentRoute><DashboardLayout /></AgentRoute>}>
          <Route path="/dashboard" element={<DashboardHome />} />
          <Route path="/dashboard/plaintes" element={<PlaintesListPage />} />
          <Route path="/dashboard/plaintes/:id" element={<PlainteDetailPage />} />
          <Route path="/dashboard/analytique" element={<AnalyticsPage />} />
          <Route path="/dashboard/utilisateurs" element={<UsersPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  )
}
