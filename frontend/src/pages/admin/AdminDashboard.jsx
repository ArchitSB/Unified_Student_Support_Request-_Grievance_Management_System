import { useEffect, useMemo, useState } from 'react'
import { Card, StatusBadge, Table } from '../../components/ui'
import { adminApi } from '../../lib/api'

const urgentColumns = [
  { key: 'student', title: 'Student' },
  { key: 'request', title: 'Request' },
  { key: 'department', title: 'Department' },
  { key: 'status', title: 'Status', render: (value) => <StatusBadge status={value} /> },
]

function AdminDashboard() {
  const [dashboardData, setDashboardData] = useState({ summary: null, urgentQueue: [] })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let isMounted = true

    const loadDashboard = async () => {
      setIsLoading(true)
      setError('')

      try {
        const response = await adminApi.getDashboardStats()

        if (!isMounted) return

        setDashboardData({
          summary: response?.data?.summary || null,
          urgentQueue: response?.data?.urgentQueue || [],
        })
      } catch (err) {
        if (isMounted) {
          setError(err.message || 'Failed to load admin dashboard')
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    loadDashboard()

    return () => {
      isMounted = false
    }
  }, [])

  const metricCards = useMemo(
    () => [
      { title: 'Open Tickets', value: String(dashboardData.summary?.openTickets || 0), hint: 'Needs triage' },
      { title: 'Unassigned', value: String(dashboardData.summary?.unassigned || 0), hint: 'Assign now' },
      { title: 'SLA Breaches', value: String(dashboardData.summary?.slaBreaches || 0), hint: 'Critical' },
      {
        title: 'Resolved Today',
        value: String(dashboardData.summary?.resolvedToday || 0),
        hint: 'Completed in current day',
      },
    ],
    [dashboardData.summary],
  )

  const urgentRows = useMemo(
    () =>
      dashboardData.urgentQueue.map((item) => ({
        id: item._id,
        student: item.studentId?.name || 'Unknown',
        request: item.title,
        department: item.departmentId?.name || 'General',
        status: item.status,
      })),
    [dashboardData.urgentQueue],
  )

  const typeDistribution = useMemo(() => {
    const totals = dashboardData.urgentQueue.reduce((acc, item) => {
      acc[item.type] = (acc[item.type] || 0) + 1
      return acc
    }, {})

    const totalCount = dashboardData.urgentQueue.length

    return Object.entries(totals)
      .map(([label, count]) => ({
        label,
        value: totalCount > 0 ? Math.round((count / totalCount) * 100) : 0,
      }))
      .sort((a, b) => b.value - a.value)
  }, [dashboardData.urgentQueue])

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Operations Dashboard</h1>

      {error ? <p className="text-sm text-rose-600">{error}</p> : null}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metricCards.map((card) => (
          <Card key={card.title} title={card.title} hoverable>
            <p className="text-3xl font-semibold text-slate-900 dark:text-slate-100">{card.value}</p>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{card.hint}</p>
          </Card>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <Card title="Urgent / Escalated Requests" subtitle="Action needed queue">
          <Table columns={urgentColumns} data={urgentRows} isLoading={isLoading} />
        </Card>

        <Card title="Requests by Type" subtitle="Workload snapshot">
          {typeDistribution.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">No urgent requests to display.</p>
          ) : (
            <div className="space-y-3">
              {typeDistribution.map((item) => (
                <div key={item.label}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span>{item.label}</span>
                    <span className="text-slate-500 dark:text-slate-400">{item.value}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800">
                    <div className="h-2 rounded-full bg-indigo-500" style={{ width: `${item.value}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </section>
    </div>
  )
}

export default AdminDashboard