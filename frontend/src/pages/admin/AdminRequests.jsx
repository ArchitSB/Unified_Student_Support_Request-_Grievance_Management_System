import { useCallback, useEffect, useMemo, useState } from 'react'
import { Button, Card, Modal, StatusBadge, Table, ToastStack } from '../../components/ui'
import { useToast } from '../../hooks/useToast'
import { adminApi } from '../../lib/api'

const ACTIONS = ['APPROVE', 'REJECT', 'FORWARD']

const adminColumns = [
  { key: 'studentName', title: 'Student' },
  { key: 'title', title: 'Request' },
  { key: 'departmentName', title: 'Department' },
  { key: 'type', title: 'Type' },
  { key: 'status', title: 'Status', render: (value) => <StatusBadge status={value} /> },
  { key: 'priority', title: 'Priority' },
  { key: 'step', title: 'Step' },
  { key: 'assignedToName', title: 'Assignee' },
]

function AdminRequests() {
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false)
  const [isActionModalOpen, setIsActionModalOpen] = useState(false)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [selectedRequestId, setSelectedRequestId] = useState('')
  const [selectedAssigneeId, setSelectedAssigneeId] = useState('')
  const [selectedAction, setSelectedAction] = useState('APPROVE')
  const [actionRemark, setActionRemark] = useState('')
  const [adminUsers, setAdminUsers] = useState([])
  const [requests, setRequests] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [filters, setFilters] = useState({ status: '', priority: '', type: '', search: '' })
  const { toasts, pushToast, removeToast } = useToast()

  const selectedRequest = useMemo(
    () => requests.find((item) => item._id === selectedRequestId) || null,
    [requests, selectedRequestId],
  )

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
        departmentName: item.departmentId?.name || 'General',
        type: item.type,
        status: item.status,
        priority: item.priority,
        step: String(item.currentStep || 1),
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
            <Button
              className="h-9 px-3 text-xs"
              variant="ghost"
              onClick={() => {
                setSelectedRequestId(row.id)
                setIsDetailsOpen(true)
              }}
            >
              Details
            </Button>
            <Button
              className="h-9 px-3 text-xs"
              variant="secondary"
              onClick={() => {
                setSelectedRequestId(row.id)
                setSelectedAssigneeId('')
                setIsAssignModalOpen(true)
              }}
            >
              Assign
            </Button>
            <Button
              className="h-9 px-3 text-xs"
              onClick={() => {
                setSelectedRequestId(row.id)
                setSelectedAction('APPROVE')
                setActionRemark('')
                setIsActionModalOpen(true)
              }}
            >
              Workflow Action
            </Button>
          </div>
        ),
      },
    ],
    [],
  )

  const handleFilterChange = (event) => {
    const { name, value } = event.target
    setFilters((prev) => ({ ...prev, [name]: value }))
  }

  const handleAssign = async () => {
    if (!selectedRequestId || !selectedAssigneeId) {
      setError('Please select both request and assignee')
      pushToast({ type: 'error', title: 'Assignment failed', message: 'Please select both request and assignee.' })
      return
    }

    setError('')
    const assignee = adminUsers.find((item) => item._id === selectedAssigneeId)
    const previousRequests = requests

    setRequests((prev) =>
      prev.map((item) =>
        item._id === selectedRequestId
          ? {
              ...item,
              assignedTo: assignee ? { _id: assignee._id, name: assignee.name, role: assignee.role } : item.assignedTo,
              status: item.status === 'PENDING' ? 'IN_PROGRESS' : item.status,
            }
          : item,
      ),
    )

    try {
      await adminApi.assignRequest(selectedRequestId, selectedAssigneeId)
      await loadRequests(filters)
      pushToast({ type: 'success', title: 'Assigned', message: 'Request assigned successfully.' })
      setIsAssignModalOpen(false)
    } catch (err) {
      setRequests(previousRequests)
      setError(err.message || 'Failed to assign request')
      pushToast({ type: 'error', title: 'Assignment failed', message: err.message || 'Failed to assign request.' })
    }
  }

  const handleActionSubmit = async () => {
    if (!selectedRequestId || !selectedAction) {
      setError('Please select a request action')
      pushToast({ type: 'error', title: 'Action failed', message: 'Please select a request action.' })
      return
    }

    setError('')
    const previousRequests = requests

    setRequests((prev) =>
      prev.map((item) => {
        if (item._id !== selectedRequestId) return item

        const nowIso = new Date().toISOString()
        const nextHistory = [
          ...(item.approvalHistory || []),
          {
            actorId: { name: 'You' },
            role: 'SELF',
            action: selectedAction === 'REJECT' ? 'REJECTED' : selectedAction === 'FORWARD' ? 'FORWARDED' : 'APPROVED',
            remark: actionRemark,
            timestamp: nowIso,
          },
        ]

        if (selectedAction === 'REJECT') {
          return { ...item, status: 'REJECTED', approvalHistory: nextHistory }
        }

        return {
          ...item,
          status: 'IN_PROGRESS',
          currentStep: Number(item.currentStep || 1) + 1,
          approvalHistory: nextHistory,
        }
      }),
    )

    try {
      await adminApi.requestAction(selectedRequestId, {
        action: selectedAction,
        remark: actionRemark,
      })
      await loadRequests(filters)
      pushToast({ type: 'success', title: 'Action processed', message: 'Workflow action completed successfully.' })
      setIsActionModalOpen(false)
    } catch (err) {
      setRequests(previousRequests)
      setError(err.message || 'Failed to process workflow action')
      pushToast({ type: 'error', title: 'Action failed', message: err.message || 'Failed to process workflow action.' })
    }
  }

  return (
    <div className="space-y-6">
      <ToastStack toasts={toasts} onClose={removeToast} />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Request Operations</h1>
        <Button
          onClick={() => {
            setSelectedRequestId(requests[0]?._id || '')
            setSelectedAssigneeId('')
            setIsAssignModalOpen(true)
          }}
        >
          Quick Assign
        </Button>
      </div>

      {error ? <p className="text-sm text-rose-600">{error}</p> : null}

      <Card title="Request Filters" subtitle="Filter by status, urgency, and request category">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <select
            name="status"
            value={filters.status}
            onChange={handleFilterChange}
            className="h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm dark:border-slate-600 dark:bg-slate-900"
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
            className="h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm dark:border-slate-600 dark:bg-slate-900"
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
            className="h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm dark:border-slate-600 dark:bg-slate-900"
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
            placeholder="Search title or text"
            className="h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm dark:border-slate-600 dark:bg-slate-900"
          />
        </div>
      </Card>

      <Table columns={columns} data={rows} isLoading={isLoading} />

      <Modal isOpen={isAssignModalOpen} onClose={() => setIsAssignModalOpen(false)} title="Assign Request">
        <div className="space-y-4">
          <select
            className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm dark:border-slate-600 dark:bg-slate-900"
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
            className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm dark:border-slate-600 dark:bg-slate-900"
            value={selectedAssigneeId}
            onChange={(event) => setSelectedAssigneeId(event.target.value)}
          >
            <option value="">Select assignee</option>
            {adminUsers.map((admin) => (
              <option key={admin._id} value={admin._id}>
                {admin.name} ({admin.role})
              </option>
            ))}
          </select>

          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setIsAssignModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAssign}>Assign</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={isActionModalOpen} onClose={() => setIsActionModalOpen(false)} title="Workflow Action">
        <div className="space-y-4">
          <select
            className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm dark:border-slate-600 dark:bg-slate-900"
            value={selectedAction}
            onChange={(event) => setSelectedAction(event.target.value)}
          >
            {ACTIONS.map((action) => (
              <option key={action} value={action}>
                {action}
              </option>
            ))}
          </select>

          <textarea
            rows={4}
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900"
            placeholder="Add optional remark"
            value={actionRemark}
            onChange={(event) => setActionRemark(event.target.value)}
          />

          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setIsActionModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleActionSubmit}>Submit Action</Button>
          </div>
        </div>
      </Modal>

      <aside
        className={`fixed inset-y-0 right-0 z-60 w-full max-w-xl border-l border-slate-200 bg-white p-5 shadow-xl transition-transform duration-200 ease-out dark:border-slate-700 dark:bg-slate-900 ${isDetailsOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">Request Details</h2>
          <Button variant="secondary" className="h-9 px-3 text-xs" onClick={() => setIsDetailsOpen(false)}>
            Close
          </Button>
        </div>

        {selectedRequest ? (
          <div className="space-y-5 overflow-y-auto pb-6">
            <Card title={selectedRequest.title} subtitle={`${selectedRequest.type} • ${selectedRequest.priority}`}>
              <p className="text-sm text-slate-600 dark:text-slate-300">{selectedRequest.description}</p>
              <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                <p>
                  <span className="font-medium">Student:</span> {selectedRequest.studentId?.name || 'Unknown'}
                </p>
                <p>
                  <span className="font-medium">Department:</span> {selectedRequest.departmentId?.name || 'General'}
                </p>
                <p>
                  <span className="font-medium">Status:</span> {selectedRequest.status}
                </p>
                <p>
                  <span className="font-medium">Current Step:</span> {selectedRequest.currentStep || 1}
                </p>
              </div>
            </Card>

            <Card title="Approval Timeline" subtitle="Chronological action history">
              {selectedRequest.approvalHistory?.length ? (
                <div className="space-y-3">
                  {selectedRequest.approvalHistory
                    .slice()
                    .reverse()
                    .map((event, index) => (
                      <div key={`${event.timestamp || ''}-${index}`} className="rounded-xl border border-slate-200 p-3 dark:border-slate-700">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                            {(event.actorId && event.actorId.name) || 'System'}
                          </p>
                          <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-300">{event.action}</p>
                        </div>
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Role: {event.role}</p>
                        {event.remark ? (
                          <p className="mt-2 text-sm text-slate-700 dark:text-slate-200">{event.remark}</p>
                        ) : null}
                        {event.timestamp ? (
                          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                            {new Date(event.timestamp).toLocaleString('en-IN')}
                          </p>
                        ) : null}
                      </div>
                    ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500 dark:text-slate-400">No approval actions yet.</p>
              )}
            </Card>
          </div>
        ) : (
          <p className="text-sm text-slate-500 dark:text-slate-400">Select a request to view details.</p>
        )}
      </aside>

      {isDetailsOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-50 bg-slate-900/30"
          onClick={() => setIsDetailsOpen(false)}
          aria-label="Close request details"
        />
      ) : null}
    </div>
  )
}

export default AdminRequests
