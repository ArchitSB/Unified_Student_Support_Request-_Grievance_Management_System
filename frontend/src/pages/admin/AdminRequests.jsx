import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Button, Card, Modal, StatusBadge, Table, ToastStack } from '../../components/ui'
import TicketDetailsDrawer from '../../components/tickets/TicketDetailsDrawer'
import { useToast } from '../../hooks/useToast'
import { adminApi } from '../../lib/api'

const ACTIONS = ['APPROVE', 'REJECT', 'FORWARD']

const adminColumns = [
  { key: 'ticketId', title: 'Ticket ID' },
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
  const [searchParams, setSearchParams] = useSearchParams()
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
  const [filters, setFilters] = useState({ status: '', priority: '', type: '', search: '', sortBy: 'newest' })
  const { toasts, pushToast, removeToast } = useToast()
  const requestIdFromQuery = searchParams.get('requestId')

  const loadRequests = useCallback(async (activeFilters) => {
    const response = await adminApi.listRequests({
      page: 1,
      limit: 50,
      status: activeFilters.status || undefined,
      priority: activeFilters.priority || undefined,
      type: activeFilters.type || undefined,
      search: activeFilters.search || undefined,
      sortBy: activeFilters.sortBy || undefined,
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
            sortBy: filters.sortBy || undefined,
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

  useEffect(() => {
    if (!requestIdFromQuery) return
    setSelectedRequestId(requestIdFromQuery)
    setIsDetailsOpen(true)
  }, [requestIdFromQuery])

  const rows = useMemo(
    () =>
      requests.map((item) => ({
        id: item._id,
        ticketId: item.ticketId || 'Pending',
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

  const handleDetailsClose = () => {
    setIsDetailsOpen(false)
    if (!requestIdFromQuery) return

    const nextParams = new URLSearchParams(searchParams)
    nextParams.delete('requestId')
    setSearchParams(nextParams, { replace: true })
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
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <select
            name="status"
            value={filters.status}
            onChange={handleFilterChange}
            className="h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm dark:border-slate-600 dark:bg-slate-900"
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
            placeholder="Search ticket, title, student, category"
            className="h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm dark:border-slate-600 dark:bg-slate-900"
          />
          <select
            name="sortBy"
            value={filters.sortBy}
            onChange={handleFilterChange}
            className="h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm dark:border-slate-600 dark:bg-slate-900"
          >
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="highest_priority">Highest Priority</option>
            <option value="sla_risk">SLA Risk</option>
            <option value="unresolved">Unresolved</option>
          </select>
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

      <TicketDetailsDrawer
        isOpen={isDetailsOpen}
        requestId={selectedRequestId}
        onClose={handleDetailsClose}
        api={adminApi}
        userRole="ADMIN"
        onRequestMutated={() => loadRequests(filters)}
      />
    </div>
  )
}

export default AdminRequests
