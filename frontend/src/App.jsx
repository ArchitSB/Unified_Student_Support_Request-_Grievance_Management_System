import { Navigate, Route, Routes } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import MainLayout from './components/layout/MainLayout'
import { useAuth } from './context/AuthContext'
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminRequests from './pages/admin/AdminRequests'
import CreateRequest from './pages/student/CreateRequest'
import Dashboard from './pages/student/Dashboard'
import MyRequests from './pages/student/MyRequests'

function App() {
  const { user, isAuthenticated, isAuthLoading } = useAuth()

  if (isAuthLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-600 dark:bg-slate-900 dark:text-slate-300">
        Loading your workspace...
      </div>
    )
  }

  const defaultPath = isAuthenticated && user?.role === 'ADMIN' ? '/admin/dashboard' : '/dashboard'

  return (
    <Routes>
      <Route path="/login" element={isAuthenticated ? <Navigate to={defaultPath} replace /> : <Login />} />
      <Route path="/register" element={isAuthenticated ? <Navigate to={defaultPath} replace /> : <Register />} />

      <Route
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute allowedRoles={['STUDENT']}>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/create-request"
          element={
            <ProtectedRoute allowedRoles={['STUDENT']}>
              <CreateRequest />
            </ProtectedRoute>
          }
        />
        <Route
          path="/my-requests"
          element={
            <ProtectedRoute allowedRoles={['STUDENT']}>
              <MyRequests />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/requests"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AdminRequests />
            </ProtectedRoute>
          }
        />
      </Route>

      <Route path="*" element={<Navigate to={isAuthenticated ? defaultPath : '/login'} replace />} />
    </Routes>
  )
}

export default App
