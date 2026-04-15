import { useCallback, useEffect, useMemo, useState } from 'react'
import { Button, Card, Modal, Table, ToastStack } from '../../components/ui'
import { useToast } from '../../hooks/useToast'
import { ROLE } from '../../lib/roles'
import { superAdminApi } from '../../lib/api'

const roles = [ROLE.STUDENT, ROLE.TEACHER, ROLE.HOD, ROLE.DEPARTMENT_ADMIN, ROLE.ADMIN, ROLE.SUPER_ADMIN]

function SuperAdminUsers() {
  const [users, setUsers] = useState([])
  const [meta, setMeta] = useState(null)
  const [filters, setFilters] = useState({ role: '', search: '' })
  const [selectedUserId, setSelectedUserId] = useState('')
  const [selectedRole, setSelectedRole] = useState(ROLE.STUDENT)
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const { toasts, pushToast, removeToast } = useToast()

  const load = useCallback(async (activeFilters = filters) => {
    const response = await superAdminApi.listUsers({
      page: 1,
      limit: 100,
      role: activeFilters.role || undefined,
      search: activeFilters.search || undefined,
    })

    setUsers(response?.data || [])
    setMeta(response?.meta || null)
  }, [filters])

  useEffect(() => {
    let isMounted = true

    const init = async () => {
      setIsLoading(true)
      setError('')
      try {
        await load()
      } catch (err) {
        if (isMounted) setError(err.message || 'Failed to load users')
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
      users.map((user) => ({
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.departmentId?.name || user.department || 'N/A',
        isActive: user.isActive ? 'Active' : 'Inactive',
      })),
    [users],
  )

  const columns = [
    { key: 'name', title: 'Name' },
    { key: 'email', title: 'Email' },
    { key: 'role', title: 'Role' },
    { key: 'department', title: 'Department' },
    { key: 'isActive', title: 'State' },
    {
      key: 'actions',
      title: 'Actions',
      render: (_value, row) => {
        const user = users.find((item) => item._id === row.id)

        return (
          <div className="flex gap-2">
            <Button
              className="h-9 px-3 text-xs"
              variant="secondary"
              onClick={() => {
                setSelectedUserId(row.id)
                setSelectedRole(user?.role || ROLE.STUDENT)
                setIsRoleModalOpen(true)
              }}
            >
              Change Role
            </Button>
            <Button
              className="h-9 px-3 text-xs"
              variant={user?.isActive ? 'danger' : 'secondary'}
              onClick={async () => {
                setError('')
                try {
                  await superAdminApi.updateUserActive(row.id, !user?.isActive)
                  await load()
                  pushToast({
                    type: 'success',
                    title: 'User updated',
                    message: `User ${user?.isActive ? 'deactivated' : 'activated'} successfully.`,
                  })
                } catch (err) {
                  setError(err.message || 'Failed to update user state')
                  pushToast({ type: 'error', title: 'Action failed', message: err.message || 'Failed to update user.' })
                }
              }}
            >
              {user?.isActive ? 'Deactivate' : 'Activate'}
            </Button>
          </div>
        )
      },
    },
  ]

  const handleFilterChange = (event) => {
    const { name, value } = event.target
    setFilters((prev) => ({ ...prev, [name]: value }))
  }

  const handleRoleUpdate = async () => {
    if (!selectedUserId || !selectedRole) {
      setError('Please select user and role')
      return
    }

    setError('')

    try {
      await superAdminApi.updateUserRole(selectedUserId, selectedRole)
      await load()
      setIsRoleModalOpen(false)
      pushToast({ type: 'success', title: 'Role changed', message: 'User role updated successfully.' })
    } catch (err) {
      setError(err.message || 'Failed to update role')
      pushToast({ type: 'error', title: 'Role update failed', message: err.message || 'Failed to update role.' })
    }
  }

  return (
    <div className="space-y-6">
      <ToastStack toasts={toasts} onClose={removeToast} />

      <div>
        <h2 className="text-2xl font-semibold">Users & Roles</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">Manage users, privilege levels, and account activity.</p>
      </div>

      {error ? <p className="text-sm text-rose-600">{error}</p> : null}

      <Card title="User Filters" subtitle={meta ? `Total users: ${meta.total}` : 'Filter by role and search text'}>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <select name="role" value={filters.role} onChange={handleFilterChange} className="h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm dark:border-slate-600 dark:bg-slate-900">
            <option value="">All Roles</option>
            {roles.map((role) => (
              <option key={role} value={role}>{role}</option>
            ))}
          </select>
          <input name="search" type="search" value={filters.search} onChange={handleFilterChange} placeholder="Search name or email" className="h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm dark:border-slate-600 dark:bg-slate-900" />
        </div>
      </Card>

      <Table columns={columns} data={rows} isLoading={isLoading} />

      <Modal isOpen={isRoleModalOpen} onClose={() => setIsRoleModalOpen(false)} title="Change User Role">
        <div className="space-y-4">
          <select className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm dark:border-slate-600 dark:bg-slate-900" value={selectedRole} onChange={(event) => setSelectedRole(event.target.value)}>
            {roles.map((role) => (
              <option key={role} value={role}>{role}</option>
            ))}
          </select>

          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setIsRoleModalOpen(false)}>Cancel</Button>
            <Button onClick={handleRoleUpdate}>Update Role</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default SuperAdminUsers
