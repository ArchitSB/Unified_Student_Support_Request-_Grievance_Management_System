const getInitials = (name = '') =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((segment) => segment[0]?.toUpperCase() || '')
    .join('') || 'US'

function Navbar({
  breadcrumbs = [],
  theme = 'light',
  user,
  roleLabel = 'Workspace',
  onLogout,
  onNotificationsClick,
  onProfileClick,
  onThemeToggle,
  onMenuClick,
}) {
  const userInitials = getInitials(user?.name)

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200/70 bg-white/90 px-4 py-3 backdrop-blur md:px-6 dark:border-slate-700 dark:bg-slate-900/90">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-300 text-slate-600 hover:bg-slate-100 md:hidden dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
            onClick={onMenuClick}
            aria-label="Toggle menu"
          >
            ☰
          </button>

          <div>
            <h1 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              Unified Student Support System
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">{roleLabel}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-3">
          <div className="hidden h-10 items-center rounded-xl border border-slate-300/80 bg-slate-50 px-3 text-sm text-slate-500 md:flex dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300">
            Requests and workflow updates
          </div>

          <button
            type="button"
            onClick={onNotificationsClick}
            className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-300 text-sm text-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
            aria-label="Open relevant requests"
          >
            🔔
            <span className="absolute right-1.5 top-1.5 h-2.5 w-2.5 rounded-full bg-rose-500" />
          </button>

          <button
            type="button"
            onClick={onThemeToggle}
            className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-300 px-3 text-sm text-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            {theme === 'dark' ? '☀ Light' : '🌙 Dark'}
          </button>

          <button
            type="button"
            onClick={onProfileClick}
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-300 px-3 text-sm text-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-200">
              {userInitials}
            </span>
            {user?.name || 'Profile'}
          </button>

          <button
            type="button"
            onClick={onLogout}
            className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-300 px-3 text-sm text-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            Logout
          </button>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
        {breadcrumbs.map((crumb, index) => (
          <span key={`${crumb}-${index}`} className="capitalize">
            {index > 0 && <span className="mx-1 text-slate-300 dark:text-slate-500">/</span>}
            {crumb}
          </span>
        ))}
      </div>
    </header>
  )
}

export default Navbar