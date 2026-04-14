import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Card, StatusBadge, Table } from '../../components/ui'
import { studentApi } from '../../lib/api'

const requestColumns = [
  { key: 'title', title: 'Title' },
  { key: 'type', title: 'Type' },
  { key: 'status', title: 'Status', render: (value) => <StatusBadge status={value} /> },
  { key: 'createdDate', title: 'Created Date' },
]

const formatDate = (value) =>
  new Date(value).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })

function MyRequests() {
  const navigate = useNavigate()
  const [filters, setFilters] = useState({ status: '', type: '', search: '' })
  const [requests, setRequests] = useState([])
  const [meta, setMeta] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let isMounted = true

    const timeoutId = setTimeout(async () => {
      setIsLoading(true)
      setError('')

      try {
        const response = await studentApi.listMyRequests({
          page: 1,
          limit: 50,
          status: filters.status || undefined,
          type: filters.type || undefined,
          search: filters.search || undefined,
        })

        if (!isMounted) return

        setRequests(response?.data || [])
        setMeta(response?.meta || null)
      } catch (err) {
        if (isMounted) {
          setError(err.message || 'Failed to load requests')
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }, 250)

    return () => {
      isMounted = false
      clearTimeout(timeoutId)
    }
  }, [filters])

  const tableData = useMemo(
    () =>
      requests.map((item) => ({
        id: item._id,
        title: item.title,
        type: item.type,
        status: item.status,
        createdDate: formatDate(item.createdAt),
      })),
    [requests],
  )

  const handleFilterChange = (event) => {
    const { name, value } = event.target
    setFilters((prev) => ({ ...prev, [name]: value }))
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">My Requests Page</h1>
        <Button onClick={() => navigate('/create-request')}>Create New Request</Button>
      </div>

      {error ? <p className="text-sm text-rose-600">{error}</p> : null}

      <Card title="Filter Requests" subtitle="Refine by status, category, or date range">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <select
            name="status"
            value={filters.status}
            onChange={handleFilterChange}
            className="h-11 rounded-md border border-slate-300 bg-white px-3 text-sm dark:border-slate-600 dark:bg-slate-900"
          >
            <option value="">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="RESOLVED">Resolved</option>
            <option value="REJECTED">Rejected</option>
          </select>
          <select
            name="type"
            value={filters.type}
            onChange={handleFilterChange}
            className="h-11 rounded-md border border-slate-300 bg-white px-3 text-sm dark:border-slate-600 dark:bg-slate-900"
          >
            <option value="">All Categories</option>
            <option value="ACADEMIC">Academic</option>
            <option value="FINANCE">Finance</option>
            <option value="HOSTEL">Hostel</option>
            <option value="INFRASTRUCTURE">Infrastructure</option>
            <option value="OTHER">Other</option>
          </select>

          <div className="flex items-center rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-500 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-300">
            {meta ? `Total: ${meta.total}` : 'Total: 0'}
          </div>

          <input
            name="search"
            type="search"
            value={filters.search}
            onChange={handleFilterChange}
            placeholder="Search request title"
            className="h-11 rounded-md border border-slate-300 bg-white px-3 text-sm dark:border-slate-600 dark:bg-slate-900"
          />
        </div>
      </Card>

      <Table columns={requestColumns} data={tableData} isLoading={isLoading} />
    </div>
  )
}

export default MyRequests