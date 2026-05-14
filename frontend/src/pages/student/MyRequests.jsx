import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Button, Card, StatusBadge, Table } from '../../components/ui'
import TicketDetailsDrawer from '../../components/tickets/TicketDetailsDrawer'
import { studentApi } from '../../lib/api'

const requestColumns = [
  { key: 'ticketId', title: 'Ticket ID' },
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
  const [searchParams, setSearchParams] = useSearchParams()
  const [filters, setFilters] = useState({ status: '', type: '', search: '', sortBy: 'newest' })
  const [requests, setRequests] = useState([])
  const [meta, setMeta] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedRequestId, setSelectedRequestId] = useState('')
  const [isWorkspaceOpen, setIsWorkspaceOpen] = useState(false)
  const requestIdFromQuery = searchParams.get('requestId')

  const loadRequests = async (activeFilters = filters) => {
    const response = await studentApi.listMyRequests({
      page: 1,
      limit: 50,
      status: activeFilters.status || undefined,
      type: activeFilters.type || undefined,
      search: activeFilters.search || undefined,
      sortBy: activeFilters.sortBy || undefined,
    })

    setRequests(response?.data || [])
    setMeta(response?.meta || null)
  }

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
          sortBy: filters.sortBy || undefined,
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

  useEffect(() => {
    if (!requestIdFromQuery) return
    setSelectedRequestId(requestIdFromQuery)
    setIsWorkspaceOpen(true)
  }, [requestIdFromQuery])

  const handleWorkspaceClose = () => {
    setIsWorkspaceOpen(false)
    if (!requestIdFromQuery) return

    const nextParams = new URLSearchParams(searchParams)
    nextParams.delete('requestId')
    setSearchParams(nextParams, { replace: true })
  }

  const tableData = useMemo(
    () =>
      requests.map((item) => ({
        id: item._id,
        ticketId: item.ticketId || 'Pending',
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
        <h1 className="text-2xl font-semibold">My Requests</h1>
        <Button onClick={() => navigate('/create-request')}>Create New Request</Button>
      </div>

      {error ? <p className="text-sm text-rose-600">{error}</p> : null}

      <Card title="Filter Requests" subtitle="Refine by status, category, or date range">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <select
            name="status"
            value={filters.status}
            onChange={handleFilterChange}
            className="h-11 rounded-md border border-slate-300 bg-white px-3 text-sm dark:border-slate-600 dark:bg-slate-900"
          >
            <option value="">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="ESCALATED">Escalated</option>
            <option value="RESOLVED">Resolved</option>
            <option value="REJECTED">Rejected</option>
            <option value="REOPENED">Reopened</option>
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

          <select
            name="sortBy"
            value={filters.sortBy}
            onChange={handleFilterChange}
            className="h-11 rounded-md border border-slate-300 bg-white px-3 text-sm dark:border-slate-600 dark:bg-slate-900"
          >
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="highest_priority">Highest Priority</option>
            <option value="sla_risk">SLA Risk</option>
            <option value="unresolved">Unresolved</option>
          </select>
        </div>
      </Card>

      <Table
        columns={[
          ...requestColumns,
          {
            key: 'actions',
            title: 'Actions',
            render: (_value, row) => (
              <Button
                className="h-9 px-3 text-xs"
                variant="secondary"
                onClick={() => {
                  setSelectedRequestId(row.id)
                  setIsWorkspaceOpen(true)
                }}
              >
                Open Workspace
              </Button>
            ),
          },
        ]}
        data={tableData}
        isLoading={isLoading}
      />

      <TicketDetailsDrawer
        isOpen={isWorkspaceOpen}
        requestId={selectedRequestId}
        onClose={handleWorkspaceClose}
        api={studentApi}
        userRole="STUDENT"
        onRequestMutated={() => loadRequests()}
      />
    </div>
  )
}

export default MyRequests
