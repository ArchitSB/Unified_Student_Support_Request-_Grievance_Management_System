import { NavLink } from 'react-router-dom'

const navItemBaseClass =
  'flex h-11 items-center rounded-md px-3 text-sm font-medium transition-colors duration-150 ease-in-out'

const studentLinks = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/create-request', label: 'Create Request' },
  { to: '/my-requests', label: 'My Requests' },
]

const adminLinks = [
  { to: '/admin/dashboard', label: 'Admin Dashboard' },
  { to: '/admin/requests', label: 'Admin Requests' },
]

function Sidebar({ isOpen, onClose, userRole, onLogout }) {
  const linkClassName = ({ isActive }) =>
    `${navItemBaseClass} ${isActive ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-200' : 'text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800'}`

  const visibleLinks = userRole === 'ADMIN' ? adminLinks : studentLinks

  return (
    <>
      <button
        type="button"
        className={`fixed inset-0 z-30 bg-slate-900/40 transition md:hidden ${isOpen ? 'block' : 'hidden'}`}
        onClick={onClose}
        aria-label="Close sidebar"
      />

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-slate-200 bg-white p-4 transition-transform duration-150 ease-in-out dark:border-slate-700 dark:bg-slate-900 md:static md:w-64 md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="mb-6 rounded-xl border border-indigo-200 bg-indigo-50/60 p-4 dark:border-indigo-400/20 dark:bg-indigo-500/10">
          <p className="text-xs font-medium uppercase tracking-wide text-indigo-700 dark:text-indigo-300">
            Unified Support
          </p>
          <h2 className="mt-2 text-lg font-semibold text-slate-900 dark:text-slate-100">Control Panel</h2>
        </div>

        <nav>
          <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
            {userRole === 'ADMIN' ? 'Admin' : 'Student'}
          </p>
          <div className="space-y-1">
            {visibleLinks.map((link) => (
              <NavLink key={link.to} to={link.to} className={linkClassName} onClick={onClose}>
                {link.label}
              </NavLink>
            ))}
          </div>
        </nav>

        <button
          type="button"
          onClick={onLogout}
          className="mt-auto flex h-11 items-center justify-center rounded-md border border-slate-300 text-sm font-medium text-slate-700 transition hover:bg-slate-100 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          Logout
        </button>
      </aside>
    </>
  )
}

export default Sidebar