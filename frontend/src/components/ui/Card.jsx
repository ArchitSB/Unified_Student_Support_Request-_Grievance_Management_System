function Card({ title, subtitle, children, hoverable = false, className = '' }) {
  return (
    <section
      className={`rounded-2xl border border-slate-200/80 bg-white/90 p-5 shadow-sm backdrop-blur transition-all duration-150 ease-in-out dark:border-slate-700 dark:bg-slate-900/80 ${hoverable ? 'hover:-translate-y-0.5 hover:shadow-md' : ''} ${className}`}
    >
      {(title || subtitle) && (
        <header className="mb-4">
          {title && <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">{title}</h3>}
          {subtitle && <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>}
        </header>
      )}
      {children}
    </section>
  )
}

export default Card