import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button, Input } from '../../components/ui'
import { useAuth } from '../../context/AuthContext'
import { authApi } from '../../lib/api'

function AdminRegister() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    department: '',
    password: '',
    adminSignupKey: '',
  })
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      const response = await authApi.adminRegister(formData)
      const authPayload = response?.data

      if (!authPayload?.token || !authPayload?.user) {
        throw new Error('Invalid admin registration response from server')
      }

      login(authPayload)
      navigate('/admin/dashboard', { replace: true })
    } catch (err) {
      setError(err.message || 'Unable to create admin account. Please verify details.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="grid min-h-screen grid-cols-1 bg-slate-50 dark:bg-slate-900 lg:grid-cols-2">
      <section className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <p className="text-sm font-medium text-indigo-600 dark:text-indigo-300">Admin Onboarding</p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-900 dark:text-slate-100">Create admin account</h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Authorized personnel can register with a valid admin signup key.
          </p>

          <form className="mt-6 grid gap-4 sm:grid-cols-2" onSubmit={handleSubmit}>
            <Input
              label="Full Name"
              name="name"
              placeholder="Admin Name"
              required
              className="sm:col-span-2"
              value={formData.name}
              onChange={handleChange}
            />
            <Input
              label="Admin Email"
              name="email"
              type="email"
              placeholder="admin@university.edu"
              required
              value={formData.email}
              onChange={handleChange}
            />
            <Input
              label="Department"
              name="department"
              placeholder="Support Operations"
              required
              value={formData.department}
              onChange={handleChange}
            />
            <Input
              label="Password"
              name="password"
              type="password"
              placeholder="Create secure password"
              required
              value={formData.password}
              onChange={handleChange}
            />
            <Input
              label="Admin Signup Key"
              name="adminSignupKey"
              type="password"
              placeholder="Enter issued key"
              required
              value={formData.adminSignupKey}
              onChange={handleChange}
            />

            {error ? <p className="sm:col-span-2 text-sm text-rose-600">{error}</p> : null}

            <Button type="submit" className="sm:col-span-2" disabled={isSubmitting}>
              {isSubmitting ? 'Creating admin account...' : 'Register Admin'}
            </Button>

            <p className="sm:col-span-2 text-center text-sm text-slate-500 dark:text-slate-400">
              Already have admin access?{' '}
              <Link to="/admin/login" className="font-medium text-indigo-600 dark:text-indigo-300">
                Admin login
              </Link>
            </p>

            <p className="sm:col-span-2 text-center text-sm text-slate-500 dark:text-slate-400">
              Student account?{' '}
              <Link to="/register" className="font-medium text-indigo-600 dark:text-indigo-300">
                Student register
              </Link>
            </p>
          </form>
        </div>
      </section>

      <section className="relative hidden items-center justify-center overflow-hidden bg-gradient-to-br from-emerald-900 via-slate-900 to-slate-800 lg:flex">
        <div className="absolute left-10 top-10 h-56 w-56 rounded-full bg-emerald-400/20 blur-3xl" />
        <div className="absolute bottom-10 right-10 h-64 w-64 rounded-full bg-cyan-400/15 blur-3xl" />
        <div className="relative max-w-md rounded-2xl border border-white/20 bg-white/10 p-8 text-white backdrop-blur">
          <h2 className="text-2xl font-semibold">Secure admin access for governance and operations.</h2>
          <ul className="mt-4 space-y-2 text-sm text-slate-200">
            <li>• Dedicated admin authentication flow</li>
            <li>• Role-based access restrictions</li>
            <li>• Controlled onboarding via signup key</li>
          </ul>
        </div>
      </section>
    </div>
  )
}

export default AdminRegister
