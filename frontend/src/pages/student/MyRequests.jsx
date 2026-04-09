import { Button, Card, StatusBadge, Table } from '../../components/ui'

const requestColumns = [
  { key: 'title', title: 'Title' },
  { key: 'type', title: 'Type' },
  { key: 'status', title: 'Status', render: (value) => <StatusBadge status={value} /> },
  { key: 'createdDate', title: 'Created Date' },
]

const requestData = [
  {
    id: 1,
    title: 'Scholarship disbursement delay',
    type: 'Finance',
    status: 'IN_PROGRESS',
    createdDate: '09 Apr 2026',
  },
  {
    id: 2,
    title: 'Library access card issue',
    type: 'Academic',
    status: 'PENDING',
    createdDate: '07 Apr 2026',
  },
  {
    id: 3,
    title: 'Mess quality complaint',
    type: 'Hostel',
    status: 'RESOLVED',
    createdDate: '04 Apr 2026',
  },
]

function MyRequests() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">My Requests Page</h1>
        <Button>Create New Request</Button>
      </div>

      <Card title="Filter Requests" subtitle="Refine by status, category, or date range">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <select className="h-11 rounded-md border border-slate-300 bg-white px-3 text-sm dark:border-slate-600 dark:bg-slate-900">
            <option>All Status</option>
            <option>Pending</option>
            <option>In Progress</option>
            <option>Resolved</option>
          </select>
          <select className="h-11 rounded-md border border-slate-300 bg-white px-3 text-sm dark:border-slate-600 dark:bg-slate-900">
            <option>All Categories</option>
            <option>Academic</option>
            <option>Finance</option>
            <option>Hostel</option>
          </select>
          <input
            type="date"
            className="h-11 rounded-md border border-slate-300 bg-white px-3 text-sm dark:border-slate-600 dark:bg-slate-900"
          />
          <input
            type="search"
            placeholder="Search request title"
            className="h-11 rounded-md border border-slate-300 bg-white px-3 text-sm dark:border-slate-600 dark:bg-slate-900"
          />
        </div>
      </Card>

      <Table columns={requestColumns} data={requestData} />
    </div>
  )
}

export default MyRequests