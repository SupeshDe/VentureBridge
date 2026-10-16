import React, { Suspense, lazy } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import DashboardLayout from './layouts/DashboardLayout'
import { ErrorBoundary } from './components/common/ErrorBoundary'
import { Loading } from './components/common/Loading'
import './styles.css'

// Eager landing + auth (keep fast LCP)
import Landing from './pages/Landing'
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'

// Lazy pages — enterprise code-splitting
const EntrepreneurDashboard = lazy(() => import('./pages/entrepreneur/EntrepreneurDashboard'))
const InvestorDashboard = lazy(() => import('./pages/investor/InvestorDashboard'))
const StartupProfile = lazy(() => import('./pages/startup/StartupProfile'))
const InvestorProfile = lazy(() => import('./pages/investor/InvestorProfile'))
const DiscoverInvestors = lazy(() => import('./pages/discover/DiscoverInvestors'))
const DiscoverStartups = lazy(() => import('./pages/discover/DiscoverStartups'))
const InvestorPublicProfile = lazy(() => import('./pages/discover/InvestorPublicProfile'))
const StartupPublicProfile = lazy(() => import('./pages/discover/StartupPublicProfile'))
const Requests = lazy(() => import('./pages/requests/Requests'))
const Connections = lazy(() => import('./pages/connections/Connections'))
const Messages = lazy(() => import('./pages/chat/Messages'))
const Notifications = lazy(() => import('./pages/notifications/Notifications'))
const Documents = lazy(() => import('./pages/Documents'))
const Settings = lazy(() => import('./pages/Settings'))
const Favourites = lazy(() => import('./pages/Favourites'))
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'))
const AdminUsers = lazy(() => import('./pages/admin/AdminUsers'))
const AdminStartups = lazy(() => import('./pages/admin/AdminStartups'))
const AdminInvestors = lazy(() => import('./pages/admin/AdminInvestors'))
const AdminVerification = lazy(() => import('./pages/admin/AdminVerification'))
const AdminIndustries = lazy(() => import('./pages/admin/AdminIndustries'))
const AdminContent = lazy(() => import('./pages/admin/AdminContent'))
const AdminReports = lazy(() => import('./pages/admin/AdminReports'))
const AdminProfileDetails = lazy(() => import('./pages/admin/AdminProfileDetails'))

function ProtectedRoute({ children, allowedRoles = [] }) {
  const { isAuthenticated, isLoading, user } = useAuth()
  if (isLoading) return <div className="loading-screen">Loading…</div>
  if (!isAuthenticated) return <Navigate to="/auth/login" replace />
  if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) return <Navigate to="/dashboard" replace />
  return children
}

function PublicRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth()
  if (isLoading) return <div className="loading-screen">Loading…</div>
  if (isAuthenticated) return <Navigate to="/dashboard" replace />
  return children
}

function DashboardRoute() {
  const { user } = useAuth()
  if (user?.role === 'entrepreneur') return <EntrepreneurDashboard />
  if (user?.role === 'investor') return <InvestorDashboard />
  if (user?.role === 'admin') return <AdminDashboard />
  return <Navigate to="/auth/login" replace />
}

function SuspenseWrap({ children }) {
  return <Suspense fallback={<Loading />}>{children}</Suspense>
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/auth/login" element={<PublicRoute><Login /></PublicRoute>} />
            <Route path="/auth/register" element={<PublicRoute><Register /></PublicRoute>} />

            <Route path="/" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
              <Route path="dashboard" element={<SuspenseWrap><DashboardRoute /></SuspenseWrap>} />

              {/* Entrepreneur */}
              <Route path="startup/profile" element={<ProtectedRoute allowedRoles={['entrepreneur']}><SuspenseWrap><StartupProfile /></SuspenseWrap></ProtectedRoute>} />
              <Route path="discover/investors" element={<ProtectedRoute allowedRoles={['entrepreneur']}><SuspenseWrap><DiscoverInvestors /></SuspenseWrap></ProtectedRoute>} />
              <Route path="investors/:id" element={<ProtectedRoute allowedRoles={['entrepreneur']}><SuspenseWrap><InvestorPublicProfile /></SuspenseWrap></ProtectedRoute>} />
              <Route path="favourites" element={<ProtectedRoute allowedRoles={['entrepreneur', 'investor']}><SuspenseWrap><Favourites /></SuspenseWrap></ProtectedRoute>} />

              {/* Investor */}
              <Route path="investor/profile" element={<ProtectedRoute allowedRoles={['investor']}><SuspenseWrap><InvestorProfile /></SuspenseWrap></ProtectedRoute>} />
              <Route path="discover/startups" element={<ProtectedRoute allowedRoles={['investor']}><SuspenseWrap><DiscoverStartups /></SuspenseWrap></ProtectedRoute>} />
              <Route path="startups/:id" element={<ProtectedRoute allowedRoles={['investor']}><SuspenseWrap><StartupPublicProfile /></SuspenseWrap></ProtectedRoute>} />

              {/* Shared */}
              <Route path="requests" element={<SuspenseWrap><Requests /></SuspenseWrap>} />
              <Route path="connections" element={<SuspenseWrap><Connections /></SuspenseWrap>} />
              <Route path="messages" element={<SuspenseWrap><Messages /></SuspenseWrap>} />
              <Route path="notifications" element={<SuspenseWrap><Notifications /></SuspenseWrap>} />
              <Route path="documents" element={<SuspenseWrap><Documents /></SuspenseWrap>} />
              <Route path="settings" element={<SuspenseWrap><Settings /></SuspenseWrap>} />

              {/* Admin */}
              <Route path="admin/dashboard" element={<ProtectedRoute allowedRoles={['admin']}><SuspenseWrap><AdminDashboard /></SuspenseWrap></ProtectedRoute>} />
              <Route path="admin/verification" element={<ProtectedRoute allowedRoles={['admin']}><SuspenseWrap><AdminVerification /></SuspenseWrap></ProtectedRoute>} />
              <Route path="admin/users" element={<ProtectedRoute allowedRoles={['admin']}><SuspenseWrap><AdminUsers /></SuspenseWrap></ProtectedRoute>} />
              <Route path="admin/startups" element={<ProtectedRoute allowedRoles={['admin']}><SuspenseWrap><AdminStartups /></SuspenseWrap></ProtectedRoute>} />
              <Route path="admin/investors" element={<ProtectedRoute allowedRoles={['admin']}><SuspenseWrap><AdminInvestors /></SuspenseWrap></ProtectedRoute>} />
              <Route path="admin/industries" element={<ProtectedRoute allowedRoles={['admin']}><SuspenseWrap><AdminIndustries /></SuspenseWrap></ProtectedRoute>} />
              <Route path="admin/content" element={<ProtectedRoute allowedRoles={['admin']}><SuspenseWrap><AdminContent /></SuspenseWrap></ProtectedRoute>} />
              <Route path="admin/reports" element={<ProtectedRoute allowedRoles={['admin']}><SuspenseWrap><AdminReports /></SuspenseWrap></ProtectedRoute>} />
              <Route path="admin/profiles/:type/:id" element={<ProtectedRoute allowedRoles={['admin']}><SuspenseWrap><AdminProfileDetails /></SuspenseWrap></ProtectedRoute>} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  )
}
