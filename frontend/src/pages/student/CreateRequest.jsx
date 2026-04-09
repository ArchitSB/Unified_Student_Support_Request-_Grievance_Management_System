import { Button, Form, Input } from '../../components/ui'

function CreateRequest() {
  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      <h1 className="text-2xl font-semibold">Create Request Page</h1>

      <Form
        title="Submit a new grievance"
        subtitle="Provide complete details to help the support team resolve your issue quickly."
      >
        <div className="grid gap-4">
          <Input label="Title" placeholder="Internet not working in Hostel Block C" required />

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">
              Description <span className="text-rose-600">*</span>
            </span>
            <textarea
              rows={5}
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition-all duration-150 ease-in-out placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
              placeholder="Describe the issue, timeline, and expected resolution..."
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">Request Type</span>
            <select className="h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition-all duration-150 ease-in-out focus:ring-2 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100">
              <option>Academic</option>
              <option>Infrastructure</option>
              <option>Hostel</option>
              <option>Finance</option>
              <option>Other</option>
            </select>
          </label>

          <div className="flex flex-wrap gap-3">
            <Button type="submit">Submit Request</Button>
            <Button type="button" variant="secondary">
              Save as Draft
            </Button>
          </div>
        </div>
      </Form>
    </div>
  )
}

export default CreateRequest