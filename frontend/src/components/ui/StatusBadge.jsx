const statusMap = {
  PENDING: 'bg-amber-100 text-amber-800 border-amber-200',
  IN_PROGRESS: 'bg-sky-100 text-sky-800 border-sky-200',
  RESOLVED: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  REJECTED: 'bg-rose-100 text-rose-800 border-rose-200',
}

function StatusBadge({ status = 'PENDING' }) {
  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${statusMap[status] || statusMap.PENDING}`}
    >
      {status.replace('_', ' ')}
    </span>
  )
}

export default StatusBadge