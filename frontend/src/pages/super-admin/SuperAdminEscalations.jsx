import { useCallback, useEffect, useMemo, useState } from 'react'
import { Button, Card, Table, ToastStack } from '../../components/ui'
import { useToast } from '../../hooks/useToast'
import { superAdminApi } from '../../lib/api'

const formatDate = (value) =>
  new Date(value).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })

function SuperAdminEscalations() {
  const [items, setItems] = useState([])
  const [meta, setMeta] = useState(null)
  const [thresholdHours, setThresholdHours] = useState(72)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const { toasts, pushToast, removeToast } = useToast()

  const load = useCallback(async (hours = thresholdHours) => {
    const response = await superAdminApi.listEscalations({ page: 1, limit: 100, thresholdHours: hours })
    setItems(response?.data || [])
    setMeta(response?.meta || null)
  }, [thresholdHours])

  useEffect(() => {
    let isMounted = true

    const init = async () => {
      setIsLoading(true)
      setError('')

      try {
        await load()
      } catch (err) {
        if (isMounted) setError(err.message || 'Failed to load escalations')
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
      items.map((item) => ({
        id: item._id,
        title: item.title,
        student: item.studentId?.name || 'Unknown',
        department: item.departmentId?.name || 'General',
        status: item.status,
        priority: item.priority,
        createdAt: formatDate(item.createdAt),
      })),
    [items],
  )

  const columns = [
    { key: 'title', title: 'Request' },
    { key: 'student', title: 'Student' },
    { key: 'department', title: 'Department' },
    { key: 'status', title: 'Status' },
    { key: 'priority', title: 'Priority' },
    { key: 'createdAt', title: 'Created' },
    {
      key: 'actions',
      title: 'Actions',
      render: (_value, row) => (
        <Button
          className="h-9 px-3 text-xs"
          onClick={async () => {
            setError('')
            try {
              await superAdminApi.manualEscalate(row.id, 'Manual super-admin escalation')
              await load()
              pushToast({ type: 'success', title: 'Escalated', message: 'Request escalated successfully.' })
            } catch (err) {
              setError(err.message || 'Failed to escalate request')
              pushToast({ type: 'error', title: 'Escalation failed', message: err.message || 'Failed to escalate request.' })
            }
          }}
        >
          Manual Escalate
        </Button>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <ToastStack toasts={toasts} onClose={removeToast} />

      <div>
        <h2 className="text-2xl font-semibold">Escalations</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">Overdue requests with one-click manual escalation.</p>
      </div>

      {error ? <p className="text-sm text-rose-600">{error}</p> : null}

      <Card title="Escalation Rules" subtitle={meta ? `Overdue requests: ${meta.total}` : 'Overdue request monitor'}>
        <div className="grid gap-3 sm:grid-cols-[220px_auto] sm:items-center">
          <select
            className="h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm dark:border-slate-600 dark:bg-slate-900"
            value={String(thresholdHours)}
            onChange={(event) => setThresholdHours(Number(event.target.value))}
          >
            <option value="24">Overdue by 24h</option>
            <option value="48">Overdue by 48h</option>
            <option value="72">Overdue by 72h</option>
            <option value="120">Overdue by 120h</option>
          </select>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Requests older than selected threshold and still pending/in-progress are shown here.
          </p>
        </div>
      </Card>

      <Table columns={columns} data={rows} isLoading={isLoading} />
    </div>
  )
}

export default SuperAdminEscalations
