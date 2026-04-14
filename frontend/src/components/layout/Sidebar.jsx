import { NavLink } from 'react-router-dom'
import { normalizeRole, ROLE } from '../../lib/roles'

const navItemBaseClass =
  'group flex h-11 items-center rounded-xl px-3 text-sm font-medium transition-colors duration-150 ease-in-out'

const studentLinks = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/create-request', label: 'Create Request' },
  { to: '/my-requests', label: 'My Requests' },
]

const operationsLinks = [
  { to: '/admin/dashboard', label: 'Admin Dashboard' },
  { to: '/admin/requests', label: 'Admin Requests' },
]

function Sidebar({ isOpen, onClose, userRole, onLogout }) {
  const linkClassName = ({ isActive }) =>
    `${navItemBaseClass} ${isActive ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white' : 'text-slate-600 hover:bg-white/60 dark:text-slate-200 dark:hover:bg-slate-700/60'}`

  const normalizedRole = normalizeRole(userRole)
  const isStudent = normalizedRole === ROLE.STUDENT
  const isSuperAdmin = normalizedRole === ROLE.SUPER_ADMIN
  const canManageWorkflows = [ROLE.ADMIN, ROLE.DEPARTMENT_ADMIN, ROLE.SUPER_ADMIN].includes(normalizedRole)
  const visibleLinks = isStudent
    ? studentLinks
    : [
        ...operationsLinks,
        ...(canManageWorkflows ? [{ to: '/admin/workflows', label: 'Workflow Rules' }] : []),
        ...(isSuperAdmin ? [{ to: '/admin/departments', label: 'Departments' }] : []),
      ]

  return (
    <>
      <button
        type="button"
        className={`fixed inset-0 z-30 bg-slate-900/40 transition md:hidden ${isOpen ? 'block' : 'hidden'}`}
        onClick={onClose}
        aria-label="Close sidebar"
      />

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-slate-200/70 bg-gradient-to-b from-amber-50 to-slate-50 p-4 transition-transform duration-150 ease-in-out dark:border-slate-700 dark:from-slate-900 dark:to-slate-900 md:static md:w-64 md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="mb-6 rounded-2xl border border-amber-300/60 bg-gradient-to-r from-amber-100 to-orange-100 p-4 dark:border-slate-600 dark:from-slate-800 dark:to-slate-800">
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-900 dark:text-amber-200">
            Unified Support
          </p>
          <h2 className="mt-1 text-lg font-semibold text-slate-900 dark:text-slate-100">Campus Console</h2>
        </div>

        <nav>
          <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">
            {isStudent ? 'Student' : 'Operations'}
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
          className="mt-auto flex h-11 items-center justify-center rounded-xl border border-slate-300 bg-white text-sm font-medium text-slate-700 transition hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
        >
          Logout
        </button>
      </aside>
    </>
  )
}

export default Sidebar