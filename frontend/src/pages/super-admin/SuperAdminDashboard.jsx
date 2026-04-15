import { useEffect, useMemo, useState } from 'react'
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Card } from '../../components/ui'
import { superAdminApi } from '../../lib/api'

function SuperAdminDashboard() {
  const [dashboard, setDashboard] = useState(null)
  const [analytics, setAnalytics] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let isMounted = true

    const load = async () => {
      setError('')
      try {
        const [dashboardResponse, analyticsResponse] = await Promise.all([
          superAdminApi.getDashboard(),
          superAdminApi.getAnalytics(),
        ])

        if (!isMounted) return

        setDashboard(dashboardResponse?.data || null)
        setAnalytics(analyticsResponse?.data || null)
      } catch (err) {
        if (isMounted) setError(err.message || 'Failed to load super admin dashboard')
      }
    }

    load()

    return () => {
      isMounted = false
    }
  }, [])

  const cards = useMemo(
    () => [
      { title: 'Open Tickets', value: String(dashboard?.summary?.openTickets || 0) },
      { title: 'Unassigned', value: String(dashboard?.summary?.unassigned || 0) },
      { title: 'Overdue', value: String(dashboard?.summary?.overdue || 0) },
      { title: 'Resolved Today', value: String(dashboard?.summary?.resolvedToday || 0) },
    ],
    [dashboard],
  )

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Super Admin Dashboard</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">Global system pulse with trend lines and high-risk alerts.</p>
      </div>

      {error ? <p className="text-sm text-rose-600">{error}</p> : null}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <Card key={card.title} title={card.title} hoverable>
            <p className="text-3xl font-semibold text-slate-900 dark:text-slate-100">{card.value}</p>
          </Card>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <Card title="Request Trend (Last 6 Months)" subtitle="New request intake trend">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={analytics?.monthlyTrend || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Line type="monotone" dataKey="value" stroke="#0f766e" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Alerts" subtitle="Urgent and overdue signals">
          {dashboard?.latestAlerts?.length ? (
            <div className="space-y-3">
              {dashboard.latestAlerts.map((alert) => (
                <div key={alert._id} className="rounded-xl border border-slate-200 p-3 dark:border-slate-700">
                  <p className="text-sm font-semibold">{alert.title}</p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    {alert.priority} • {alert.status}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500 dark:text-slate-400">No critical alerts right now.</p>
          )}
        </Card>
      </section>
    </div>
  )
}

export default SuperAdminDashboard
