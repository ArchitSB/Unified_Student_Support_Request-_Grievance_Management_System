function Card({ title, subtitle, children, hoverable = false, className = '' }) {
  return (
    <section
      className={`rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-150 ease-in-out ${hoverable ? 'hover:-translate-y-0.5 hover:shadow-md' : ''} ${className}`}
    >
      {(title || subtitle) && (
        <header className="mb-4">
          {title && <h3 className="text-base font-semibold text-slate-900">{title}</h3>}
          {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
        </header>
      )}
      {children}
    </section>
  )
}

export default Card