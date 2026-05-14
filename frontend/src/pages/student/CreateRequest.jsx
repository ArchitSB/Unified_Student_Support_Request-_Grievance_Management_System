import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Form, Input } from '../../components/ui'
import { studentApi } from '../../lib/api'

const draftStorageKey = 'student_request_draft'

const initialFormData = {
  title: '',
  description: '',
  type: 'OTHER',
  priority: 'MEDIUM',
  category: '',
  subcategory: '',
}

const templateMap = {
  HOSTEL: {
    title: 'Hostel room maintenance issue',
    description: 'Room facilities require urgent attention. Mention block, room number, issue timeline, and impact on stay.',
    priority: 'HIGH',
    category: 'Hostel Complaint',
    subcategory: 'Maintenance',
  },
  FINANCE: {
    title: 'Fee payment or scholarship issue',
    description: 'Explain the payment discrepancy, semester, transaction reference, and expected finance resolution.',
    priority: 'HIGH',
    category: 'Fee Issue',
    subcategory: 'Scholarship / Payment',
  },
  ACADEMIC: {
    title: 'Academic grievance requiring review',
    description: 'Describe the subject, faculty interaction, assessment issue, and the academic outcome being requested.',
    priority: 'MEDIUM',
    category: 'Academic Issue',
    subcategory: 'Assessment / Attendance',
  },
  INFRASTRUCTURE: {
    title: 'Infrastructure disruption impacting academics',
    description: 'Mention exact lab/classroom/location, affected systems, date/time of issue, and operational impact.',
    priority: 'MEDIUM',
    category: 'Infrastructure Issue',
    subcategory: 'Network / Equipment',
  },
}

function CreateRequest() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState(() => {
    const savedDraft = localStorage.getItem(draftStorageKey)
    if (!savedDraft) return initialFormData

    try {
      return { ...initialFormData, ...JSON.parse(savedDraft) }
    } catch {
      return initialFormData
    }
  })
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormData((prev) => {
      const next = { ...prev, [name]: value }
      localStorage.setItem(draftStorageKey, JSON.stringify(next))
      return next
    })
  }

  const applyTemplate = (type) => {
    const template = templateMap[type]
    const next = {
      ...formData,
      type,
      ...template,
    }
    setFormData(next)
    localStorage.setItem(draftStorageKey, JSON.stringify(next))
  }

  const saveDraft = () => {
    localStorage.setItem(draftStorageKey, JSON.stringify(formData))
    setSuccessMessage('Draft saved locally')
  }

  const clearDraft = () => {
    localStorage.removeItem(draftStorageKey)
    setFormData(initialFormData)
    setSuccessMessage('Draft cleared')
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setSuccessMessage('')
    setIsSubmitting(true)

    try {
      await studentApi.createRequest(formData)
      setSuccessMessage('Request created successfully')
      setFormData(initialFormData)
      localStorage.removeItem(draftStorageKey)
      navigate('/my-requests', { replace: true })
    } catch (err) {
      setError(err.message || 'Failed to create request')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      <h1 className="text-2xl font-semibold">Create Request</h1>

      <Form
        title="Submit a new grievance"
        subtitle="Provide complete details to help the support team resolve your issue quickly."
        onSubmit={handleSubmit}
      >
        <div className="grid gap-4">
          <div className="flex flex-wrap gap-2">
            {Object.keys(templateMap).map((templateKey) => (
              <Button key={templateKey} type="button" variant="secondary" className="h-9 px-3 text-xs" onClick={() => applyTemplate(templateKey)}>
                {templateKey === 'HOSTEL'
                  ? 'Hostel Template'
                  : templateKey === 'FINANCE'
                    ? 'Fee Template'
                    : templateKey === 'ACADEMIC'
                      ? 'Academic Template'
                      : 'Infra Template'}
              </Button>
            ))}
          </div>

          <Input
            label="Title"
            name="title"
            placeholder="Internet not working in Hostel Block C"
            value={formData.title}
            onChange={handleChange}
            required
          />

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">
              Description <span className="text-rose-600">*</span>
            </span>
            <textarea
              rows={5}
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition-all duration-150 ease-in-out placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
              placeholder="Describe the issue, timeline, and expected resolution..."
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
            />
          </label>

          <Input
            label="Category"
            name="category"
            placeholder="Hostel Complaint"
            value={formData.category}
            onChange={handleChange}
          />

          <Input
            label="Subcategory"
            name="subcategory"
            placeholder="Maintenance"
            value={formData.subcategory}
            onChange={handleChange}
          />

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">Request Type</span>
            <select
              className="h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition-all duration-150 ease-in-out focus:ring-2 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
              name="type"
              value={formData.type}
              onChange={handleChange}
            >
              <option value="ACADEMIC">Academic</option>
              <option value="INFRASTRUCTURE">Infrastructure</option>
              <option value="HOSTEL">Hostel</option>
              <option value="FINANCE">Finance</option>
              <option value="OTHER">Other</option>
            </select>
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">Priority</span>
            <select
              className="h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition-all duration-150 ease-in-out focus:ring-2 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
              name="priority"
              value={formData.priority}
              onChange={handleChange}
            >
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="URGENT">Urgent</option>
            </select>
          </label>

          {error ? <p className="text-sm text-rose-600">{error}</p> : null}
          {successMessage ? <p className="text-sm text-emerald-600">{successMessage}</p> : null}

          <div className="flex flex-wrap gap-3">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Submitting...' : 'Submit Request'}
            </Button>
            <Button type="button" variant="secondary" onClick={saveDraft}>
              Save Draft
            </Button>
            <Button type="button" variant="secondary" onClick={clearDraft}>
              Clear Draft
            </Button>
            <Button type="button" variant="secondary" onClick={() => navigate('/my-requests')}>
              View My Requests
            </Button>
          </div>
        </div>
      </Form>
    </div>
  )
}

export default CreateRequest
