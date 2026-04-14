function Table({ columns = [], data = [], isLoading = false }) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, idx) => (
          <div key={idx} className="h-10 animate-pulse rounded-md bg-slate-100 dark:bg-slate-800" />
        ))}
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200/80 bg-white/80 shadow-sm dark:border-slate-700 dark:bg-slate-900/80">
      <table className="min-w-full divide-y divide-slate-200 text-left dark:divide-slate-700">
        <thead className="bg-slate-50/90 dark:bg-slate-800/70">
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300"
              >
                {column.title}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 bg-white dark:divide-slate-700 dark:bg-slate-900">
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-4 py-8 text-center text-sm text-slate-500 dark:text-slate-400"
              >
                No data available.
              </td>
            </tr>
          ) : (
            data.map((row, index) => (
              <tr key={`${row.id || 'row'}-${index}`} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                {columns.map((column) => (
                  <td key={column.key} className="px-4 py-3 text-sm text-slate-700 dark:text-slate-200">
                    {column.render ? column.render(row[column.key], row) : row[column.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}

export default Table