const priorityMap = {
  LOW: 'bg-slate-100 text-slate-700 border-slate-200',
  MEDIUM: 'bg-sky-100 text-sky-800 border-sky-200',
  HIGH: 'bg-orange-100 text-orange-800 border-orange-200',
  URGENT: 'bg-rose-100 text-rose-800 border-rose-200',
}

function PriorityBadge({ priority = 'MEDIUM' }) {
  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${priorityMap[priority] || priorityMap.MEDIUM}`}
    >
      {priority}
    </span>
  )
}

export default PriorityBadge
