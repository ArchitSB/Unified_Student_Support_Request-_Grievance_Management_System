function Button({
  children,
  type = 'button',
  variant = 'primary',
  className = '',
  ...props
}) {
  const variants = {
    primary: 'bg-amber-500 text-slate-950 hover:bg-amber-400',
    secondary: 'bg-slate-100 text-slate-800 hover:bg-slate-200',
    ghost: 'bg-transparent text-slate-700 hover:bg-slate-100',
    danger: 'bg-rose-600 text-white hover:bg-rose-700',
  }

  return (
    <button
      type={type}
      className={`inline-flex h-11 items-center justify-center rounded-xl px-4 text-sm font-semibold transition-all duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-60 ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

export default Button