function Form({ title, subtitle, children, onSubmit, className = '' }) {
  return (
    <form
      onSubmit={onSubmit}
      className={`rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900 ${className}`}
    >
      {(title || subtitle) && (
        <header className="mb-5">
          {title && <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">{title}</h2>}
          {subtitle && <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>}
        </header>
      )}

      {children}
    </form>
  )
}

export default Form