import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button, Input } from '../../components/ui'
import { useAuth } from '../../context/AuthContext'
import { authApi } from '../../lib/api'
import { getDefaultPathForRole } from '../../lib/roles'

function Login() {
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
      const response = await authApi.login(formData)
      const authPayload = response?.data

      if (!authPayload?.token || !authPayload?.user) {
        throw new Error('Invalid login response from server')
      }

      login(authPayload)
      navigate(getDefaultPathForRole(authPayload.user.role), { replace: true })
    } catch (err) {
      setError(err.message || 'Unable to login. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="grid min-h-screen grid-cols-1 bg-slate-50 dark:bg-slate-900 lg:grid-cols-2">
      <section className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <p className="text-sm font-medium text-indigo-600 dark:text-indigo-300">Welcome back</p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-900 dark:text-slate-100">Login to your account</h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Track grievances, updates, and support messages in one place.
          </p>

          <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
            <Input
              label="Email"
              name="email"
              type="email"
              placeholder="student@university.edu"
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
              {isSubmitting ? 'Logging in...' : 'Login'}
            </Button>
          </form>

          <p className="mt-4 text-center text-sm text-slate-500 dark:text-slate-400">
            New student?{' '}
            <Link to="/register" className="font-medium text-indigo-600 dark:text-indigo-300">
              Create account
            </Link>
          </p>

          <p className="mt-2 text-center text-sm text-slate-500 dark:text-slate-400">
            Admin user?{' '}
            <Link to="/admin/login" className="font-medium text-indigo-600 dark:text-indigo-300">
              Admin login
            </Link>
          </p>
        </div>
      </section>

      <section className="relative hidden items-center justify-center overflow-hidden bg-gradient-to-br from-amber-500 via-orange-500 to-rose-500 lg:flex">
        <div className="absolute -top-20 h-72 w-72 rounded-full bg-white/20 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-cyan-300/20 blur-3xl" />
        <div className="relative max-w-md rounded-2xl border border-white/30 bg-white/10 p-8 text-white backdrop-blur">
          <p className="text-xs uppercase tracking-[0.2em] text-indigo-100">Unified Student Support</p>
          <h2 className="mt-3 text-3xl font-semibold">Transparent grievance resolution, faster than ever.</h2>
          <p className="mt-3 text-indigo-100">
            Submit requests, monitor progress, and communicate with support staff through a unified workflow.
          </p>
        </div>
      </section>
    </div>
  )
}

export default Login