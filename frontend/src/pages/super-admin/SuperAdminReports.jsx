import { useEffect, useState } from 'react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Card } from '../../components/ui'
import { superAdminApi } from '../../lib/api'

function SuperAdminReports() {
  const [report, setReport] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let isMounted = true

    const load = async () => {
      setError('')
      try {
        const response = await superAdminApi.getReports()
        if (!isMounted) return
        setReport(response?.data || null)
      } catch (err) {
        if (isMounted) setError(err.message || 'Failed to load reports')
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
        <h2 className="text-2xl font-semibold">Reports</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">Snapshot reporting for request types, priorities, and statuses.</p>
      </div>

      {error ? <p className="text-sm text-rose-600">{error}</p> : null}

      <section className="grid gap-6 lg:grid-cols-3">
        <Card title="By Type" subtitle="Request category volume">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={report?.requestByType || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="value" fill="#0ea5e9" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="By Priority" subtitle="Urgency distribution">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={report?.requestByPriority || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="value" fill="#f97316" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="By Status" subtitle="Lifecycle distribution">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={report?.requestByStatus || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="value" fill="#16a34a" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </section>

      <Card title="Generated" subtitle="Report metadata">
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Generated at: {report?.generatedAt ? new Date(report.generatedAt).toLocaleString('en-IN') : 'N/A'}
        </p>
      </Card>
    </div>
  )
}

export default SuperAdminReports
