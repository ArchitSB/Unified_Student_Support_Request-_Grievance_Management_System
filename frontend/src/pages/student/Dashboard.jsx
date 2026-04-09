import { Card, Button, StatusBadge } from '../../components/ui'

const metrics = [
  { title: 'Total Requests', value: '24', delta: '+3 this week' },
  { title: 'Pending Action', value: '6', delta: '2 urgent' },
  { title: 'Resolved', value: '18', delta: '75% closure rate' },
]

const recentActivity = [
  { id: 1, title: 'Hostel internet issue', status: 'IN_PROGRESS', time: '2h ago' },
  { id: 2, title: 'Exam cell query', status: 'PENDING', time: 'Yesterday' },
  { id: 3, title: 'Library card renewal', status: 'RESOLVED', time: '2 days ago' },
]

function Dashboard() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Student Dashboard Page</h1>

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
          <div className="space-y-3">
            {recentActivity.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between rounded-lg border border-slate-200 p-3 dark:border-slate-700"
              >
                <div>
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{item.title}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{item.time}</p>
                </div>
                <StatusBadge status={item.status} />
              </div>
            ))}
          </div>
        </Card>

        <Card title="Quick Actions" subtitle="Stay productive">
          <div className="space-y-3">
            <Button className="w-full">Submit New Grievance</Button>
            <Button variant="secondary" className="w-full">
              View Support Guidelines
            </Button>
          </div>
        </Card>
      </section>
    </div>
  )
}

export default Dashboard