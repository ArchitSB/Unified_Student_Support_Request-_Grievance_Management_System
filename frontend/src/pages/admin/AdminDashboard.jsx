import { Card, StatusBadge, Table } from '../../components/ui'

const metricCards = [
  { title: 'Open Tickets', value: '112', hint: 'Needs triage' },
  { title: 'Unassigned', value: '18', hint: 'Assign now' },
  { title: 'SLA Breaches', value: '7', hint: 'Critical' },
  { title: 'Resolved Today', value: '29', hint: 'Excellent pace' },
]

const urgentColumns = [
  { key: 'student', title: 'Student' },
  { key: 'request', title: 'Request' },
  { key: 'department', title: 'Department' },
  { key: 'status', title: 'Status', render: (value) => <StatusBadge status={value} /> },
]

const urgentRows = [
  { id: 1, student: 'Ananya Verma', request: 'Fee receipt mismatch', department: 'Finance', status: 'PENDING' },
  { id: 2, student: 'Rahul Das', request: 'Semester marks correction', department: 'Academic', status: 'IN_PROGRESS' },
  { id: 3, student: 'Sana Khan', request: 'Hostel safety complaint', department: 'Hostel', status: 'IN_PROGRESS' },
]

function AdminDashboard() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Admin Dashboard Page</h1>

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
          <Table columns={urgentColumns} data={urgentRows} />
        </Card>

        <Card title="Requests by Department" subtitle="Workload snapshot">
          <div className="space-y-3">
            {[
              { label: 'Academic', value: 34 },
              { label: 'Finance', value: 26 },
              { label: 'Hostel', value: 22 },
              { label: 'IT Support', value: 18 },
            ].map((item) => (
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
        </Card>
      </section>
    </div>
  )
}

export default AdminDashboard