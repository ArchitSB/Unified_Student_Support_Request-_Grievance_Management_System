import { useEffect, useState } from 'react'
import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Card } from '../../components/ui'
import { superAdminApi } from '../../lib/api'

const PIE_COLORS = ['#0284c7', '#f97316', '#16a34a', '#dc2626', '#7c3aed', '#0f766e']

function SuperAdminAnalytics() {
  const [analytics, setAnalytics] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let isMounted = true

    const load = async () => {
      setError('')
      try {
        const response = await superAdminApi.getAnalytics()
        if (!isMounted) return
        setAnalytics(response?.data || null)
      } catch (err) {
        if (isMounted) setError(err.message || 'Failed to load analytics')
      }
    }

    load()

    return () => {
      isMounted = false
    }
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">System Analytics</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">Cross-system distribution and performance indicators.</p>
      </div>

      {error ? <p className="text-sm text-rose-600">{error}</p> : null}

      <section className="grid gap-6 lg:grid-cols-2">
        <Card title="Status Distribution" subtitle="Request state breakdown">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={analytics?.statusDistribution || []} dataKey="value" nameKey="label" outerRadius={100}>
                  {(analytics?.statusDistribution || []).map((item, index) => (
                    <Cell key={item.label} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Department Load" subtitle="Request volume by department">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics?.departmentLoad || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="value" fill="#0284c7" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </section>

      <Card title="Role Distribution" subtitle="Current user population by role">
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={analytics?.roleDistribution || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="value" fill="#0f766e" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  )
}

export default SuperAdminAnalytics
