function Input({ label, error, required = false, className = '', ...props }) {
  return (
    <label className="block">
      {label && (
        <span className="mb-2 block text-sm font-medium text-slate-700">
          {label}
          {required && <span className="text-rose-600"> *</span>}
        </span>
      )}
      <input
        className={`h-11 w-full rounded-md border bg-white px-3 text-sm text-slate-900 outline-none transition-all duration-150 ease-in-out placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 ${error ? 'border-rose-500' : 'border-slate-300'} ${className}`}
        {...props}
      />
      {error && <span className="mt-1 block text-xs text-rose-600">{error}</span>}
    </label>
  )
}

export default Input