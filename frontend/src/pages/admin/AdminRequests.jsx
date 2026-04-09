import { useState } from 'react'
import { Button, Card, Modal, StatusBadge, Table } from '../../components/ui'

const adminColumns = [
  { key: 'studentName', title: 'Student Name' },
  { key: 'type', title: 'Type' },
  { key: 'status', title: 'Status', render: (value) => <StatusBadge status={value} /> },
  { key: 'priority', title: 'Priority' },
]

const adminRows = [
  { id: 1, studentName: 'Rohan Mehta', type: 'Finance', status: 'PENDING', priority: 'High' },
  { id: 2, studentName: 'Priya Rao', type: 'Academic', status: 'IN_PROGRESS', priority: 'Medium' },
  { id: 3, studentName: 'Kabir Shah', type: 'Hostel', status: 'PENDING', priority: 'High' },
  { id: 4, studentName: 'Nikita Jain', type: 'Infrastructure', status: 'RESOLVED', priority: 'Low' },
]

function AdminRequests() {
  const [isModalOpen, setIsModalOpen] = useState(false)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Admin Requests Page</h1>
        <Button onClick={() => setIsModalOpen(true)}>Quick Assign</Button>
      </div>

      <Card title="Request Controls" subtitle="Filter by assignee, priority, and department">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <select className="h-11 rounded-md border border-slate-300 bg-white px-3 text-sm dark:border-slate-600 dark:bg-slate-900">
            <option>All Assignees</option>
            <option>Faculty Team A</option>
            <option>Support Team B</option>
          </select>
          <select className="h-11 rounded-md border border-slate-300 bg-white px-3 text-sm dark:border-slate-600 dark:bg-slate-900">
            <option>All Priorities</option>
            <option>High</option>
            <option>Medium</option>
            <option>Low</option>
          </select>
          <select className="h-11 rounded-md border border-slate-300 bg-white px-3 text-sm dark:border-slate-600 dark:bg-slate-900">
            <option>All Departments</option>
            <option>Academic</option>
            <option>Finance</option>
            <option>Hostel</option>
          </select>
          <input
            type="search"
            placeholder="Search student name"
            className="h-11 rounded-md border border-slate-300 bg-white px-3 text-sm dark:border-slate-600 dark:bg-slate-900"
          />
        </div>
      </Card>

      <Table columns={adminColumns} data={adminRows} />

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Quick Assign Request">
        <div className="space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Assign selected requests to a department coordinator for faster resolution.
          </p>
          <select className="h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm dark:border-slate-600 dark:bg-slate-900">
            <option>Select assignee</option>
            <option>Coordinator - Academic</option>
            <option>Coordinator - Finance</option>
            <option>Coordinator - Hostel</option>
          </select>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => setIsModalOpen(false)}>Assign</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default AdminRequests