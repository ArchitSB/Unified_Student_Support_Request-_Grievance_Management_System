import { useCallback, useEffect, useMemo, useState } from 'react'
import { Button, Card, Modal, StatusBadge, Table, ToastStack } from '../../components/ui'
import { useToast } from '../../hooks/useToast'
import { adminApi, superAdminApi } from '../../lib/api'

function SuperAdminRequests() {
  const [requests, setRequests] = useState([])
  const [admins, setAdmins] = useState([])
  const [filters, setFilters] = useState({ status: '', priority: '', type: '', search: '' })
  const [selectedRequestId, setSelectedRequestId] = useState('')
  const [selectedAssigneeId, setSelectedAssigneeId] = useState('')
  const [overrideStatus, setOverrideStatus] = useState('IN_PROGRESS')
  const [overrideRemark, setOverrideRemark] = useState('')
  const [isReassignOpen, setIsReassignOpen] = useState(false)
  const [isOverrideOpen, setIsOverrideOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const { toasts, pushToast, removeToast } = useToast()

  const load = useCallback(async (activeFilters = filters) => {
    const [requestsResponse, adminsResponse] = await Promise.all([
      adminApi.listRequests({
        page: 1,
        limit: 100,
        status: activeFilters.status || undefined,
        priority: activeFilters.priority || undefined,
        type: activeFilters.type || undefined,
        search: activeFilters.search || undefined,
      }),
      adminApi.listAdmins(),
    ])

    setRequests(requestsResponse?.data || [])
    setAdmins(adminsResponse?.data || [])
  }, [filters])

  useEffect(() => {
    let isMounted = true

    const init = async () => {
      setIsLoading(true)
      setError('')

      try {
        await load()
      } catch (err) {
        if (isMounted) setError(err.message || 'Failed to load requests')
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }

    init()

    return () => {
      isMounted = false
    }
  }, [load])

  const rows = useMemo(
    () =>
      requests.map((item) => ({
        id: item._id,
        student: item.studentId?.name || 'Unknown',
        title: item.title,
        type: item.type,
        priority: item.priority,
        status: item.status,
        assignee: item.assignedTo?.name || 'Unassigned',
      })),
    [requests],
  )

  const columns = [
    { key: 'student', title: 'Student' },
    { key: 'title', title: 'Title' },
    { key: 'type', title: 'Type' },
    { key: 'priority', title: 'Priority' },
    { key: 'status', title: 'Status', render: (value) => <StatusBadge status={value} /> },
    { key: 'assignee', title: 'Assignee' },
    {
      key: 'actions',
      title: 'Actions',
      render: (_value, row) => (
        <div className="flex gap-2">
          <Button
            className="h-9 px-3 text-xs"
            variant="secondary"
            onClick={() => {
              setSelectedRequestId(row.id)
              setSelectedAssigneeId('')
              setIsReassignOpen(true)
            }}
          >
            Reassign
          </Button>
          <Button
            className="h-9 px-3 text-xs"
            onClick={() => {
              setSelectedRequestId(row.id)
              setOverrideStatus('IN_PROGRESS')
              setOverrideRemark('')
              setIsOverrideOpen(true)
            }}
          >
            Override
          </Button>
        </div>
      ),
    },
  ]

  const handleFilterChange = (event) => {
    const { name, value } = event.target
    setFilters((prev) => ({ ...prev, [name]: value }))
  }

  const handleReassign = async () => {
    if (!selectedRequestId || !selectedAssigneeId) {
      setError('Please choose request and assignee')
      return
    }

    setError('')

    try {
      await superAdminApi.reassignRequest(selectedRequestId, selectedAssigneeId)
      await load()
      setIsReassignOpen(false)
      pushToast({ type: 'success', title: 'Reassigned', message: 'Request reassigned successfully.' })
    } catch (err) {
      setError(err.message || 'Failed to reassign request')
      pushToast({ type: 'error', title: 'Reassign failed', message: err.message || 'Failed to reassign request.' })
    }
  }

  const handleOverride = async () => {
    if (!selectedRequestId || !overrideStatus) {
      setError('Please choose request and status')
      return
    }

    setError('')

    try {
      await superAdminApi.overrideRequest(selectedRequestId, {
        status: overrideStatus,
        remark: overrideRemark,
      })
      await load()
      setIsOverrideOpen(false)
      pushToast({ type: 'success', title: 'Overridden', message: 'Request status overridden successfully.' })
    } catch (err) {
      setError(err.message || 'Failed to override request')
      pushToast({ type: 'error', title: 'Override failed', message: err.message || 'Failed to override request.' })
    }
  }

  return (
    <div className="space-y-6">
      <ToastStack toasts={toasts} onClose={removeToast} />

      <div>
        <h2 className="text-2xl font-semibold">All Requests</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">Global request control with super-admin actions.</p>
      </div>

      {error ? <p className="text-sm text-rose-600">{error}</p> : null}

      <Card title="Filters" subtitle="Refine request dataset for operations">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <select name="status" value={filters.status} onChange={handleFilterChange} className="h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm dark:border-slate-600 dark:bg-slate-900">
            <option value="">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="RESOLVED">Resolved</option>
            <option value="REJECTED">Rejected</option>
          </select>
          <select name="priority" value={filters.priority} onChange={handleFilterChange} className="h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm dark:border-slate-600 dark:bg-slate-900">
            <option value="">All Priorities</option>
            <option value="URGENT">Urgent</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
          <select name="type" value={filters.type} onChange={handleFilterChange} className="h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm dark:border-slate-600 dark:bg-slate-900">
            <option value="">All Types</option>
            <option value="ACADEMIC">Academic</option>
            <option value="FINANCE">Finance</option>
            <option value="HOSTEL">Hostel</option>
            <option value="INFRASTRUCTURE">Infrastructure</option>
            <option value="OTHER">Other</option>
          </select>
          <input name="search" value={filters.search} onChange={handleFilterChange} type="search" placeholder="Search title or student" className="h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm dark:border-slate-600 dark:bg-slate-900" />
        </div>
      </Card>

      <Table columns={columns} data={rows} isLoading={isLoading} />

      <Modal isOpen={isReassignOpen} onClose={() => setIsReassignOpen(false)} title="Reassign Request">
        <div className="space-y-4">
          <select className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm dark:border-slate-600 dark:bg-slate-900" value={selectedAssigneeId} onChange={(event) => setSelectedAssigneeId(event.target.value)}>
            <option value="">Select assignee</option>
            {admins.map((admin) => (
              <option key={admin._id} value={admin._id}>{admin.name} ({admin.role})</option>
            ))}
          </select>

          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setIsReassignOpen(false)}>Cancel</Button>
            <Button onClick={handleReassign}>Reassign</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={isOverrideOpen} onClose={() => setIsOverrideOpen(false)} title="Override Request Status">
        <div className="space-y-4">
          <select className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm dark:border-slate-600 dark:bg-slate-900" value={overrideStatus} onChange={(event) => setOverrideStatus(event.target.value)}>
            <option value="PENDING">Pending</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="RESOLVED">Resolved</option>
            <option value="REJECTED">Rejected</option>
          </select>
          <textarea rows={4} className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900" placeholder="Optional override remark" value={overrideRemark} onChange={(event) => setOverrideRemark(event.target.value)} />

          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setIsOverrideOpen(false)}>Cancel</Button>
            <Button onClick={handleOverride}>Apply Override</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default SuperAdminRequests
