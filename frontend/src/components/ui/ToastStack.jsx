const toneClass = {
  success: 'border-emerald-200 bg-emerald-50 text-emerald-900',
  error: 'border-rose-200 bg-rose-50 text-rose-900',
  info: 'border-sky-200 bg-sky-50 text-sky-900',
}

function ToastStack({ toasts = [], onClose }) {
  return (
    <div className="pointer-events-none fixed right-4 top-4 z-[70] flex w-[min(92vw,380px)] flex-col gap-3">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto rounded-xl border px-4 py-3 shadow-sm ${toneClass[toast.type] || toneClass.info}`}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              {toast.title ? <p className="text-sm font-semibold">{toast.title}</p> : null}
              {toast.message ? <p className="mt-0.5 text-sm">{toast.message}</p> : null}
            </div>
            <button type="button" className="text-xs opacity-70" onClick={() => onClose(toast.id)}>
              Close
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

export default ToastStack
