import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, Button, StatusBadge } from '../../components/ui'
import { studentApi } from '../../lib/api'

const formatDate = (value) =>
  new Date(value).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })

function Dashboard() {
  const navigate = useNavigate()
  const [summary, setSummary] = useState({ total: 0, pendingAction: 0, resolved: 0 })
  const [recentActivity, setRecentActivity] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let isMounted = true

    const loadDashboard = async () => {
      setIsLoading(true)
      setError('')

      try {
        const [totalRes, pendingRes, inProgressRes, resolvedRes, recentRes] = await Promise.all([
          studentApi.listMyRequests({ page: 1, limit: 1 }),
          studentApi.listMyRequests({ page: 1, limit: 1, status: 'PENDING' }),
          studentApi.listMyRequests({ page: 1, limit: 1, status: 'IN_PROGRESS' }),
          studentApi.listMyRequests({ page: 1, limit: 1, status: 'RESOLVED' }),
          studentApi.listMyRequests({ page: 1, limit: 5 }),
        ])

        if (!isMounted) return

        setSummary({
          total: totalRes?.meta?.total || 0,
          pendingAction: (pendingRes?.meta?.total || 0) + (inProgressRes?.meta?.total || 0),
          resolved: resolvedRes?.meta?.total || 0,
        })
        setRecentActivity(recentRes?.data || [])
      } catch (err) {
        if (isMounted) {
          setError(err.message || 'Failed to load dashboard data')
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

  const metrics = useMemo(
    () => [
      { title: 'Total Requests', value: String(summary.total), delta: 'All submissions to date' },
      { title: 'Pending Action', value: String(summary.pendingAction), delta: 'Pending + in progress' },
      { title: 'Resolved', value: String(summary.resolved), delta: 'Successfully closed requests' },
    ],
    [summary],
  )

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Student Dashboard</h1>

      {error ? <p className="text-sm text-rose-600">{error}</p> : null}

      <section className="grid gap-4 md:grid-cols-3">
        {metrics.map((metric) => (
          <Card key={metric.title} title={metric.title} hoverable>
            <p className="text-3xl font-semibold text-slate-900 dark:text-slate-100">{metric.value}</p>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{metric.delta}</p>
          </Card>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <Card title="Recent Activity" subtitle="Latest updates on your requests">
          {isLoading ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">Loading recent activity...</p>
          ) : recentActivity.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">No requests yet. Create your first request.</p>
          ) : (
            <div className="space-y-3">
              {recentActivity.map((item) => (
                <div
                  key={item._id}
                  className="flex items-center justify-between rounded-lg border border-slate-200 p-3 dark:border-slate-700"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{item.title}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{formatDate(item.createdAt)}</p>
                  </div>
                  <StatusBadge status={item.status} />
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card title="Quick Actions" subtitle="Stay productive">
          <div className="space-y-3">
            <Button className="w-full" onClick={() => navigate('/create-request')}>
              Submit New Grievance
            </Button>
            <Button variant="secondary" className="w-full" onClick={() => navigate('/my-requests')}>
              Track My Requests
            </Button>
          </div>
        </Card>
      </section>
    </div>
  )
}

export default Dashboard