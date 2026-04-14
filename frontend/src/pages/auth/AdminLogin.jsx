import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button, Input } from '../../components/ui'
import { useAuth } from '../../context/AuthContext'
import { authApi } from '../../lib/api'
import { getDefaultPathForRole } from '../../lib/roles'

function AdminLogin() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [formData, setFormData] = useState({ email: '', password: '' })
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
      const response = await authApi.adminLogin(formData)
      const authPayload = response?.data

      if (!authPayload?.token || !authPayload?.user) {
        throw new Error('Invalid admin login response from server')
      }

      login(authPayload)
      navigate(getDefaultPathForRole(authPayload.user.role), { replace: true })
    } catch (err) {
      setError(err.message || 'Unable to login as admin. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="grid min-h-screen grid-cols-1 bg-slate-50 dark:bg-slate-900 lg:grid-cols-2">
      <section className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <p className="text-sm font-medium text-indigo-600 dark:text-indigo-300">Admin Access</p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-900 dark:text-slate-100">Admin login</h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Manage requests, assignments, and operational dashboards.
          </p>

          <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
            <Input
              label="Admin Email"
              name="email"
              type="email"
              placeholder="admin@university.edu"
              value={formData.email}
              onChange={handleChange}
              required
            />
            <Input
              label="Password"
              name="password"
              type="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              required
            />

            {error ? <p className="text-sm text-rose-600">{error}</p> : null}

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Signing in...' : 'Admin Login'}
            </Button>
          </form>

          <p className="mt-4 text-center text-sm text-slate-500 dark:text-slate-400">
            Need an admin account?{' '}
            <Link to="/admin/register" className="font-medium text-indigo-600 dark:text-indigo-300">
              Admin signup
            </Link>
          </p>

          <p className="mt-2 text-center text-sm text-slate-500 dark:text-slate-400">
            Student account?{' '}
            <Link to="/login" className="font-medium text-indigo-600 dark:text-indigo-300">
              Student login
            </Link>
          </p>
        </div>
      </section>

      <section className="relative hidden items-center justify-center overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-800 lg:flex">
        <div className="absolute -top-20 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-indigo-300/20 blur-3xl" />
        <div className="relative max-w-md rounded-2xl border border-white/20 bg-white/10 p-8 text-white backdrop-blur">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-200">Operations Console</p>
          <h2 className="mt-3 text-3xl font-semibold">Prioritize, assign, and resolve at scale.</h2>
          <p className="mt-3 text-slate-200">
            Centralized admin controls for triage, SLA monitoring, and workflow management.
          </p>
        </div>
      </section>
    </div>
  )
}

export default AdminLogin
