import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

const navLinks = [
  { to: '/super-admin/dashboard', label: 'Overview' },
  { to: '/super-admin/analytics', label: 'System Analytics' },
  { to: '/super-admin/requests', label: 'All Requests' },
  { to: '/super-admin/workflows', label: 'Workflow Builder' },
  { to: '/super-admin/departments', label: 'Departments' },
  { to: '/super-admin/users', label: 'Users & Roles' },
  { to: '/super-admin/escalations', label: 'Escalations' },
  { to: '/super-admin/reports', label: 'Reports' },
]

function SuperAdminLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  return (
    <div className="flex min-h-screen bg-slate-100 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <aside className="hidden w-72 shrink-0 border-r border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 lg:block">
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900/70 dark:bg-emerald-900/20">
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">Super Admin</p>
          <h2 className="mt-1 text-lg font-semibold">System Control</h2>
        </div>

        <nav className="mt-5 space-y-1">
          {navLinks.map((link) => {
            const isActive = location.pathname === link.to

            return (
              <button
                type="button"
                key={link.to}
                onClick={() => navigate(link.to)}
                className={`flex h-11 w-full items-center rounded-xl px-3 text-left text-sm font-medium transition ${
                  isActive
                    ? 'bg-emerald-500 text-white'
                    : 'text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800'
                }`}
              >
                {link.label}
              </button>
            )
          })}

          <button
            type="button"
            className="mt-4 flex h-11 w-full items-center rounded-xl px-3 text-left text-sm font-medium text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            Settings
          </button>
        </nav>
      </aside>

      <div className="flex min-h-screen flex-1 flex-col">
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur dark:border-slate-800 dark:bg-slate-900/90 md:px-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h1 className="text-base font-semibold">Super Admin Control Panel</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">Global governance, analytics, escalation, and overrides</p>
            </div>

            <div className="flex items-center gap-2">
              <div className="hidden rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-600 dark:border-slate-700 dark:text-slate-300 md:block">
                {user?.name || 'Super Admin'}
              </div>
              <button
                type="button"
                onClick={() => navigate('/admin/dashboard')}
                className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
              >
                Admin View
              </button>
              <button
                type="button"
                onClick={logout}
                className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
              >
                Logout
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default SuperAdminLayout
