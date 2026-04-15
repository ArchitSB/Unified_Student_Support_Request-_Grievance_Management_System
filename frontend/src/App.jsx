import { Navigate, Route, Routes } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import MainLayout from './components/layout/MainLayout'
import SuperAdminLayout from './components/layout/SuperAdminLayout'
import { useAuth } from './context/AuthContext'
import { ADMIN_ROLES, getDefaultPathForRole, ROLE } from './lib/roles'
import AdminDepartments from './pages/admin/AdminDepartments'
import AdminLogin from './pages/auth/AdminLogin'
import AdminRegister from './pages/auth/AdminRegister'
import AdminWorkflows from './pages/admin/AdminWorkflows'
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminRequests from './pages/admin/AdminRequests'
import CreateRequest from './pages/student/CreateRequest'
import Dashboard from './pages/student/Dashboard'
import MyRequests from './pages/student/MyRequests'
import SuperAdminAnalytics from './pages/super-admin/SuperAdminAnalytics'
import SuperAdminDashboard from './pages/super-admin/SuperAdminDashboard'
import SuperAdminDepartments from './pages/super-admin/SuperAdminDepartments'
import SuperAdminEscalations from './pages/super-admin/SuperAdminEscalations'
import SuperAdminReports from './pages/super-admin/SuperAdminReports'
import SuperAdminRequests from './pages/super-admin/SuperAdminRequests'
import SuperAdminUsers from './pages/super-admin/SuperAdminUsers'
import SuperAdminWorkflows from './pages/super-admin/SuperAdminWorkflows'

function App() {
  const { user, isAuthenticated, isAuthLoading } = useAuth()

  if (isAuthLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-600 dark:bg-slate-900 dark:text-slate-300">
        Loading your workspace...
      </div>
    )
  }

  const defaultPath = getDefaultPathForRole(user?.role)

  return (
    <Routes>
      <Route path="/login" element={isAuthenticated ? <Navigate to={defaultPath} replace /> : <Login />} />
      <Route path="/register" element={isAuthenticated ? <Navigate to={defaultPath} replace /> : <Register />} />
      <Route path="/admin/login" element={isAuthenticated ? <Navigate to={defaultPath} replace /> : <AdminLogin />} />
      <Route
        path="/admin/register"
        element={isAuthenticated ? <Navigate to={defaultPath} replace /> : <AdminRegister />}
      />

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
            <ProtectedRoute allowedRoles={[ROLE.STUDENT]}>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/create-request"
          element={
            <ProtectedRoute allowedRoles={[ROLE.STUDENT]}>
              <CreateRequest />
            </ProtectedRoute>
          }
        />
        <Route
          path="/my-requests"
          element={
            <ProtectedRoute allowedRoles={[ROLE.STUDENT]}>
              <MyRequests />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute allowedRoles={ADMIN_ROLES}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/requests"
          element={
            <ProtectedRoute allowedRoles={ADMIN_ROLES}>
              <AdminRequests />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/workflows"
          element={
            <ProtectedRoute allowedRoles={[ROLE.ADMIN, ROLE.DEPARTMENT_ADMIN, ROLE.SUPER_ADMIN]}>
              <AdminWorkflows />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/departments"
          element={
            <ProtectedRoute allowedRoles={[ROLE.SUPER_ADMIN]}>
              <AdminDepartments />
            </ProtectedRoute>
          }
        />
      </Route>

      <Route
        element={
          <ProtectedRoute allowedRoles={[ROLE.SUPER_ADMIN]}>
            <SuperAdminLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/super-admin/dashboard" element={<SuperAdminDashboard />} />
        <Route path="/super-admin/analytics" element={<SuperAdminAnalytics />} />
        <Route path="/super-admin/requests" element={<SuperAdminRequests />} />
        <Route path="/super-admin/workflows" element={<SuperAdminWorkflows />} />
        <Route path="/super-admin/departments" element={<SuperAdminDepartments />} />
        <Route path="/super-admin/users" element={<SuperAdminUsers />} />
        <Route path="/super-admin/escalations" element={<SuperAdminEscalations />} />
        <Route path="/super-admin/reports" element={<SuperAdminReports />} />
      </Route>

      <Route path="*" element={<Navigate to={isAuthenticated ? defaultPath : '/login'} replace />} />
    </Routes>
  )
}

export default App
