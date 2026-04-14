import { useEffect, useMemo, useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { getDefaultPathForRole, isAdminRole, normalizeRole, ROLE } from '../../lib/roles'
import Sidebar from './Sidebar'
import Navbar from './Navbar'

const getInitialTheme = () => {
  if (typeof window === 'undefined') return 'light'

  const storedTheme = localStorage.getItem('theme')
  if (storedTheme) return storedTheme

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function MainLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [theme, setTheme] = useState(getInitialTheme)
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const userRole = normalizeRole(user?.role)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    localStorage.setItem('theme', theme)
  }, [theme])

  const breadcrumbs = useMemo(() => {
    const chunks = location.pathname.split('/').filter(Boolean)

    if (chunks.length === 0) return ['Home']

    return ['Home', ...chunks.map((chunk) => chunk.replace('-', ' '))]
  }, [location.pathname])

  const handleThemeToggle = () => {
    setTheme((prevTheme) => (prevTheme === 'dark' ? 'light' : 'dark'))
  }

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-900 dark:text-slate-100">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} userRole={userRole} onLogout={logout} />

      <div className="flex min-h-screen flex-1 flex-col">
        <Navbar
          breadcrumbs={breadcrumbs}
          theme={theme}
          user={user}
          onLogout={logout}
          onNotificationsClick={() => navigate(isAdminRole(userRole) ? '/admin/requests' : '/my-requests')}
          onProfileClick={() => navigate(getDefaultPathForRole(userRole))}
          onThemeToggle={handleThemeToggle}
          onMenuClick={() => setIsSidebarOpen((prev) => !prev)}
          roleLabel={userRole === ROLE.STUDENT ? 'Student Workspace' : 'Operations Workspace'}
        />
        <main className="flex-1 p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default MainLayout