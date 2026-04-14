import { useCallback, useEffect, useMemo, useState } from 'react'
import { Button, Card, Modal, StatusBadge, Table } from '../../components/ui'
import { adminApi } from '../../lib/api'

const adminColumns = [
  { key: 'studentName', title: 'Student Name' },
  { key: 'title', title: 'Title' },
  { key: 'type', title: 'Type' },
  { key: 'status', title: 'Status', render: (value) => <StatusBadge status={value} /> },
  { key: 'priority', title: 'Priority' },
  { key: 'assignedToName', title: 'Assignee' },
]

function AdminRequests() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedRequestId, setSelectedRequestId] = useState('')
  const [selectedAssigneeId, setSelectedAssigneeId] = useState('')
  const [adminUsers, setAdminUsers] = useState([])
  const [requests, setRequests] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [filters, setFilters] = useState({ status: '', priority: '', type: '', search: '' })

  const loadRequests = useCallback(async (activeFilters) => {
    const response = await adminApi.listRequests({
      page: 1,
      limit: 50,
      status: activeFilters.status || undefined,
      priority: activeFilters.priority || undefined,
      type: activeFilters.type || undefined,
      search: activeFilters.search || undefined,
    })

    setRequests(response?.data || [])
  }, [])

  useEffect(() => {
    let isMounted = true

    const timeoutId = setTimeout(async () => {
      setIsLoading(true)
      setError('')

      try {
        const [requestsResponse, usersResponse] = await Promise.all([
          adminApi.listRequests({
            page: 1,
            limit: 50,
            status: filters.status || undefined,
            priority: filters.priority || undefined,
            type: filters.type || undefined,
            search: filters.search || undefined,
          }),
          adminApi.listAdmins(),
        ])

        if (!isMounted) return

        setRequests(requestsResponse?.data || [])
        setAdminUsers(usersResponse?.data || [])
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

  const rows = useMemo(
    () =>
      requests.map((item) => ({
        id: item._id,
        studentName: item.studentId?.name || 'Unknown',
        title: item.title,
        type: item.type,
        status: item.status,
        priority: item.priority,
        assignedToName: item.assignedTo?.name || 'Unassigned',
      })),
    [requests],
  )

  const columns = useMemo(
    () => [
      ...adminColumns,
      {
        key: 'actions',
        title: 'Actions',
        render: (_value, row) => (
          <div className="flex flex-wrap gap-2">
            <select
              className="h-9 rounded-md border border-slate-300 bg-white px-2 text-xs dark:border-slate-600 dark:bg-slate-900"
              defaultValue=""
              onChange={async (event) => {
                const nextStatus = event.target.value
                if (!nextStatus) return

                try {
                  await adminApi.updateStatus(row.id, nextStatus)
                  await loadRequests(filters)
                } catch (err) {
                  setError(err.message || 'Failed to update status')
                } finally {
                  event.target.value = ''
                }
              }}
            >
              <option value="">Set status</option>
              <option value="PENDING">Pending</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="RESOLVED">Resolved</option>
              <option value="REJECTED">Rejected</option>
            </select>

            <Button
              className="h-9 px-3 text-xs"
              variant="secondary"
              onClick={() => {
                setSelectedRequestId(row.id)
                setSelectedAssigneeId('')
                setIsModalOpen(true)
              }}
            >
              Assign
            </Button>
          </div>
        ),
      },
    ],
    [filters, loadRequests],
  )

  const handleFilterChange = (event) => {
    const { name, value } = event.target
    setFilters((prev) => ({ ...prev, [name]: value }))
  }

  const handleAssign = async () => {
    if (!selectedRequestId || !selectedAssigneeId) {
      setError('Please select an assignee')
      return
    }

    try {
      await adminApi.assignRequest(selectedRequestId, selectedAssigneeId)
      await loadRequests(filters)
      setIsModalOpen(false)
    } catch (err) {
      setError(err.message || 'Failed to assign request')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Admin Requests Page</h1>
        <Button
          onClick={() => {
            setSelectedRequestId(requests[0]?._id || '')
            setSelectedAssigneeId('')
            setIsModalOpen(true)
          }}
        >
          Quick Assign
        </Button>
      </div>

      {error ? <p className="text-sm text-rose-600">{error}</p> : null}

      <Card title="Request Controls" subtitle="Filter by assignee, priority, and department">
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
            name="priority"
            value={filters.priority}
            onChange={handleFilterChange}
            className="h-11 rounded-md border border-slate-300 bg-white px-3 text-sm dark:border-slate-600 dark:bg-slate-900"
          >
            <option value="">All Priorities</option>
            <option value="URGENT">Urgent</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
          <select
            name="type"
            value={filters.type}
            onChange={handleFilterChange}
            className="h-11 rounded-md border border-slate-300 bg-white px-3 text-sm dark:border-slate-600 dark:bg-slate-900"
          >
            <option value="">All Types</option>
            <option value="ACADEMIC">Academic</option>
            <option value="FINANCE">Finance</option>
            <option value="HOSTEL">Hostel</option>
            <option value="INFRASTRUCTURE">Infrastructure</option>
            <option value="OTHER">Other</option>
          </select>
          <input
            name="search"
            value={filters.search}
            onChange={handleFilterChange}
            type="search"
            placeholder="Search student name"
            className="h-11 rounded-md border border-slate-300 bg-white px-3 text-sm dark:border-slate-600 dark:bg-slate-900"
          />
        </div>
      </Card>

      <Table columns={columns} data={rows} isLoading={isLoading} />

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Quick Assign Request">
        <div className="space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Assign selected requests to a department coordinator for faster resolution.
          </p>

          <select
            className="h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm dark:border-slate-600 dark:bg-slate-900"
            value={selectedRequestId}
            onChange={(event) => setSelectedRequestId(event.target.value)}
          >
            <option value="">Select request</option>
            {requests.map((item) => (
              <option key={item._id} value={item._id}>
                {item.title} - {item.studentId?.name || 'Unknown'}
              </option>
            ))}
          </select>

          <select
            className="h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm dark:border-slate-600 dark:bg-slate-900"
            value={selectedAssigneeId}
            onChange={(event) => setSelectedAssigneeId(event.target.value)}
          >
            <option value="">Select assignee</option>
            {adminUsers.map((admin) => (
              <option key={admin._id} value={admin._id}>
                {admin.name} ({admin.email})
              </option>
            ))}
          </select>

          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAssign}>Assign</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default AdminRequests