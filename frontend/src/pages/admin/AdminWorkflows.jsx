import { useEffect, useMemo, useState } from 'react'
import { Button, Card, Modal, Table, ToastStack } from '../../components/ui'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../hooks/useToast'
import { adminApi } from '../../lib/api'
import { normalizeRole, ROLE } from '../../lib/roles'

const REQUEST_TYPES = ['ACADEMIC', 'FINANCE', 'HOSTEL', 'INFRASTRUCTURE', 'OTHER']
const STEP_ROLES = ['TEACHER', 'HOD', 'DEPARTMENT_ADMIN', 'SUPER_ADMIN']

const createInitialWorkflowForm = (departmentId = '') => ({
  requestType: 'OTHER',
  departmentId,
  isActive: true,
  steps: [
    { order: 1, role: 'TEACHER' },
    { order: 2, role: 'HOD' },
  ],
})

function AdminWorkflows() {
  const { user } = useAuth()
  const [workflows, setWorkflows] = useState([])
  const [departments, setDepartments] = useState([])
  const [form, setForm] = useState(createInitialWorkflowForm(user?.departmentId || ''))
  const [editingWorkflowId, setEditingWorkflowId] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const { toasts, pushToast, removeToast } = useToast()

  const normalizedRole = normalizeRole(user?.role)
  const isSuperAdmin = normalizedRole === ROLE.SUPER_ADMIN

  const loadData = async () => {
    const [workflowsResponse, departmentsResponse] = await Promise.all([
      adminApi.listWorkflows(),
      adminApi.listDepartments(),
    ])

    setWorkflows(workflowsResponse?.data || [])
    setDepartments(departmentsResponse?.data || [])
  }

  useEffect(() => {
    let isMounted = true

    const init = async () => {
      setIsLoading(true)
      setError('')

      try {
        await loadData()
      } catch (err) {
        if (isMounted) {
          setError(err.message || 'Failed to load workflow configuration')
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    init()

    return () => {
      isMounted = false
    }
  }, [])

  const tableRows = useMemo(
    () =>
      workflows.map((workflow) => ({
        id: workflow._id,
        requestType: workflow.requestType,
        department: workflow.departmentId?.name || 'Global',
        steps: (workflow.steps || [])
          .slice()
          .sort((a, b) => a.order - b.order)
          .map((step) => `${step.order}:${step.role}`)
          .join(' -> '),
        isActive: workflow.isActive ? 'Yes' : 'No',
      })),
    [workflows],
  )

  const openCreateModal = () => {
    setEditingWorkflowId('')
    setForm(createInitialWorkflowForm(user?.departmentId || ''))
    setIsModalOpen(true)
  }

  const openEditModal = (workflowId) => {
    const workflow = workflows.find((item) => item._id === workflowId)
    if (!workflow) return

    setEditingWorkflowId(workflowId)
    setForm({
      requestType: workflow.requestType,
      departmentId: workflow.departmentId?._id || '',
      isActive: workflow.isActive,
      steps: (workflow.steps || [])
        .slice()
        .sort((a, b) => a.order - b.order)
        .map((step, index) => ({
          role: step.role,
          order: step.order || index + 1,
        })),
    })
    setIsModalOpen(true)
  }

  const handleSave = async () => {
    if (!form.steps.length) {
      setError('Workflow must include at least one step')
      return
    }

    setError('')

    const payload = {
      requestType: form.requestType,
      departmentId: form.departmentId || null,
      isActive: Boolean(form.isActive),
      steps: form.steps
        .map((step, index) => ({
          role: step.role,
          order: Number(step.order) || index + 1,
        }))
        .sort((a, b) => a.order - b.order),
    }

    try {
      if (editingWorkflowId) {
        setWorkflows((prev) =>
          prev.map((workflow) =>
            workflow._id === editingWorkflowId
              ? {
                  ...workflow,
                  requestType: payload.requestType,
                  isActive: payload.isActive,
                  steps: payload.steps,
                }
              : workflow,
          ),
        )

        await adminApi.updateWorkflow(editingWorkflowId, payload)
        pushToast({ type: 'success', title: 'Workflow updated', message: 'Workflow updated successfully.' })
      } else {
        const optimisticWorkflow = {
          _id: `tmp-${Date.now()}`,
          requestType: payload.requestType,
          departmentId: departments.find((department) => department._id === payload.departmentId) || null,
          steps: payload.steps,
          isActive: payload.isActive,
        }

        setWorkflows((prev) => [optimisticWorkflow, ...prev])
        await adminApi.createWorkflow(payload)
        pushToast({ type: 'success', title: 'Workflow created', message: 'Workflow created successfully.' })
      }

      await loadData()
      setIsModalOpen(false)
    } catch (err) {
      await loadData()
      setError(err.message || 'Failed to save workflow configuration')
      pushToast({ type: 'error', title: 'Workflow save failed', message: err.message || 'Failed to save workflow.' })
    }
  }

  const handleDelete = async (workflowId) => {
    const previousWorkflows = workflows
    setWorkflows((prev) => prev.filter((workflow) => workflow._id !== workflowId))

    setError('')

    try {
      await adminApi.deleteWorkflow(workflowId)
      pushToast({ type: 'success', title: 'Workflow deleted', message: 'Workflow deleted successfully.' })
    } catch (err) {
      setWorkflows(previousWorkflows)
      setError(err.message || 'Failed to delete workflow')
      pushToast({ type: 'error', title: 'Delete failed', message: err.message || 'Failed to delete workflow.' })
    }
  }

  const handleToggleActive = async (workflowId, isActive) => {
    const previousWorkflows = workflows
    setWorkflows((prev) =>
      prev.map((workflow) => (workflow._id === workflowId ? { ...workflow, isActive: !isActive } : workflow)),
    )

    setError('')

    try {
      await adminApi.updateWorkflow(workflowId, { isActive: !isActive })
      pushToast({ type: 'success', title: 'Workflow status updated', message: 'Workflow status updated successfully.' })
    } catch (err) {
      setWorkflows(previousWorkflows)
      setError(err.message || 'Failed to update workflow status')
      pushToast({ type: 'error', title: 'Status update failed', message: err.message || 'Failed to update workflow status.' })
    }
  }

  const columns = [
    { key: 'requestType', title: 'Request Type' },
    { key: 'department', title: 'Department' },
    { key: 'steps', title: 'Steps' },
    { key: 'isActive', title: 'Active' },
    {
      key: 'actions',
      title: 'Actions',
      render: (_value, row) => {
        const target = workflows.find((workflow) => workflow._id === row.id)

        return (
          <div className="flex flex-wrap gap-2">
            <Button className="h-9 px-3 text-xs" variant="secondary" onClick={() => openEditModal(row.id)}>
              Edit
            </Button>
            <Button
              className="h-9 px-3 text-xs"
              variant="secondary"
              onClick={() => handleToggleActive(row.id, Boolean(target?.isActive))}
            >
              {target?.isActive ? 'Deactivate' : 'Activate'}
            </Button>
            <Button className="h-9 px-3 text-xs" variant="danger" onClick={() => handleDelete(row.id)}>
              Delete
            </Button>
          </div>
        )
      },
    },
  ]

  return (
    <div className="space-y-6">
      <ToastStack toasts={toasts} onClose={removeToast} />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Workflow Configuration</h1>
        <Button onClick={openCreateModal}>Create Workflow</Button>
      </div>

      {error ? <p className="text-sm text-rose-600">{error}</p> : null}

      <Card title="Workflow Rules" subtitle="Define approval ladders by request type and department">
        <Table columns={columns} data={tableRows} isLoading={isLoading} />
      </Card>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingWorkflowId ? 'Edit Workflow' : 'Create Workflow'}
      >
        <div className="space-y-4">
          <select
            className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm dark:border-slate-600 dark:bg-slate-900"
            value={form.requestType}
            onChange={(event) => setForm((prev) => ({ ...prev, requestType: event.target.value }))}
          >
            {REQUEST_TYPES.map((requestType) => (
              <option key={requestType} value={requestType}>
                {requestType}
              </option>
            ))}
          </select>

          <select
            className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm dark:border-slate-600 dark:bg-slate-900"
            value={form.departmentId}
            onChange={(event) => setForm((prev) => ({ ...prev, departmentId: event.target.value }))}
            disabled={!isSuperAdmin}
          >
            {isSuperAdmin ? <option value="">Global workflow</option> : null}
            {departments.map((department) => (
              <option key={department._id} value={department._id}>
                {department.name}
              </option>
            ))}
          </select>

          <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(event) => setForm((prev) => ({ ...prev, isActive: event.target.checked }))}
            />
            Mark workflow as active
          </label>

          <div className="space-y-3 rounded-xl border border-slate-200 p-3 dark:border-slate-700">
            <p className="text-sm font-medium text-slate-700 dark:text-slate-200">Approval steps</p>
            {form.steps.map((step, index) => (
              <div key={`${step.role}-${index}`} className="grid gap-2 sm:grid-cols-[1fr_auto]">
                <select
                  className="h-10 rounded-xl border border-slate-300 bg-white px-3 text-sm dark:border-slate-600 dark:bg-slate-900"
                  value={step.role}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      steps: prev.steps.map((item, itemIndex) =>
                        itemIndex === index ? { ...item, role: event.target.value } : item,
                      ),
                    }))
                  }
                >
                  {STEP_ROLES.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
                <Button
                  variant="danger"
                  className="h-10 px-3 text-xs"
                  onClick={() =>
                    setForm((prev) => ({
                      ...prev,
                      steps: prev.steps.filter((_item, itemIndex) => itemIndex !== index),
                    }))
                  }
                >
                  Remove
                </Button>
              </div>
            ))}

            <Button
              variant="secondary"
              onClick={() =>
                setForm((prev) => ({
                  ...prev,
                  steps: [...prev.steps, { order: prev.steps.length + 1, role: 'HOD' }],
                }))
              }
            >
              Add Step
            </Button>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>{editingWorkflowId ? 'Update' : 'Create'}</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default AdminWorkflows
