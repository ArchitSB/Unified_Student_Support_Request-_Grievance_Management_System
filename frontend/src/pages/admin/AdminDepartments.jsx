import { useEffect, useMemo, useState } from 'react'
import { Button, Card, Modal, Table, ToastStack } from '../../components/ui'
import { useToast } from '../../hooks/useToast'
import { adminApi } from '../../lib/api'

const initialForm = {
  name: '',
  code: '',
  hodId: '',
  teachers: [],
}

function AdminDepartments() {
  const [departments, setDepartments] = useState([])
  const [users, setUsers] = useState([])
  const [form, setForm] = useState(initialForm)
  const [editingId, setEditingId] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const { toasts, pushToast, removeToast } = useToast()

  const loadData = async () => {
    const [departmentsResponse, usersResponse] = await Promise.all([
      adminApi.listDepartments(),
      adminApi.listAdmins(),
    ])

    setDepartments(departmentsResponse?.data || [])
    setUsers(usersResponse?.data || [])
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
          setError(err.message || 'Failed to load departments')
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

  const hodUsers = useMemo(() => users.filter((user) => user.role === 'HOD'), [users])
  const teacherUsers = useMemo(() => users.filter((user) => user.role === 'TEACHER'), [users])

  const rows = useMemo(
    () =>
      departments.map((department) => ({
        id: department._id,
        name: department.name,
        code: department.code,
        hod: department.hodId?.name || 'Not set',
        teacherCount: String(department.teachers?.length || 0),
      })),
    [departments],
  )

  const handleOpenCreate = () => {
    setEditingId('')
    setForm(initialForm)
    setIsModalOpen(true)
  }

  const handleOpenEdit = (departmentId) => {
    const department = departments.find((item) => item._id === departmentId)
    if (!department) return

    setEditingId(departmentId)
    setForm({
      name: department.name || '',
      code: department.code || '',
      hodId: department.hodId?._id || '',
      teachers: (department.teachers || []).map((teacher) => teacher._id),
    })
    setIsModalOpen(true)
  }

  const handleSave = async () => {
    if (!form.name.trim() || !form.code.trim()) {
      setError('Department name and code are required')
      return
    }

    setError('')

    const payload = {
      name: form.name.trim(),
      code: form.code.trim().toUpperCase(),
      hodId: form.hodId || undefined,
      teachers: form.teachers,
    }

    try {
      if (editingId) {
        const previousDepartments = departments
        setDepartments((prev) =>
          prev.map((department) =>
            department._id === editingId
              ? {
                  ...department,
                  name: payload.name,
                  code: payload.code,
                }
              : department,
          ),
        )

        await adminApi.updateDepartment(editingId, payload)
        pushToast({ type: 'success', title: 'Department updated', message: 'Department updated successfully.' })

        if (!previousDepartments.length) {
          await loadData()
        }
      } else {
        const optimisticDepartment = {
          _id: `tmp-${Date.now()}`,
          name: payload.name,
          code: payload.code,
          hodId: null,
          teachers: payload.teachers,
        }

        setDepartments((prev) => [optimisticDepartment, ...prev])
        await adminApi.createDepartment(payload)
        pushToast({ type: 'success', title: 'Department created', message: 'Department created successfully.' })
      }

      await loadData()
      setIsModalOpen(false)
    } catch (err) {
      await loadData()
      setError(err.message || 'Failed to save department')
      pushToast({ type: 'error', title: 'Department save failed', message: err.message || 'Failed to save department.' })
    }
  }

  const handleDelete = async (departmentId) => {
    const previousDepartments = departments
    setDepartments((prev) => prev.filter((department) => department._id !== departmentId))

    setError('')

    try {
      await adminApi.deleteDepartment(departmentId)
      pushToast({ type: 'success', title: 'Department deleted', message: 'Department deleted successfully.' })
    } catch (err) {
      setDepartments(previousDepartments)
      setError(err.message || 'Failed to delete department')
      pushToast({ type: 'error', title: 'Delete failed', message: err.message || 'Failed to delete department.' })
    }
  }

  const columns = [
    { key: 'name', title: 'Name' },
    { key: 'code', title: 'Code' },
    { key: 'hod', title: 'HOD' },
    { key: 'teacherCount', title: 'Teachers' },
    {
      key: 'actions',
      title: 'Actions',
      render: (_value, row) => (
        <div className="flex gap-2">
          <Button className="h-9 px-3 text-xs" variant="secondary" onClick={() => handleOpenEdit(row.id)}>
            Edit
          </Button>
          <Button className="h-9 px-3 text-xs" variant="danger" onClick={() => handleDelete(row.id)}>
            Delete
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <ToastStack toasts={toasts} onClose={removeToast} />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Department Management</h1>
        <Button onClick={handleOpenCreate}>Create Department</Button>
      </div>

      {error ? <p className="text-sm text-rose-600">{error}</p> : null}

      <Card title="Departments" subtitle="Create and maintain department ownership for routing and workflow scope">
        <Table columns={columns} data={rows} isLoading={isLoading} />
      </Card>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingId ? 'Edit Department' : 'Create Department'}
      >
        <div className="space-y-4">
          <input
            className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm dark:border-slate-600 dark:bg-slate-900"
            placeholder="Department name"
            value={form.name}
            onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
          />

          <input
            className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm dark:border-slate-600 dark:bg-slate-900"
            placeholder="Department code"
            value={form.code}
            onChange={(event) => setForm((prev) => ({ ...prev, code: event.target.value }))}
          />

          <select
            className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm dark:border-slate-600 dark:bg-slate-900"
            value={form.hodId}
            onChange={(event) => setForm((prev) => ({ ...prev, hodId: event.target.value }))}
          >
            <option value="">No HOD assigned</option>
            {hodUsers.map((user) => (
              <option key={user._id} value={user._id}>
                {user.name}
              </option>
            ))}
          </select>

          <select
            multiple
            className="min-h-28 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900"
            value={form.teachers}
            onChange={(event) =>
              setForm((prev) => ({
                ...prev,
                teachers: Array.from(event.target.selectedOptions).map((option) => option.value),
              }))
            }
          >
            {teacherUsers.map((user) => (
              <option key={user._id} value={user._id}>
                {user.name}
              </option>
            ))}
          </select>

          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>{editingId ? 'Update' : 'Create'}</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default AdminDepartments
