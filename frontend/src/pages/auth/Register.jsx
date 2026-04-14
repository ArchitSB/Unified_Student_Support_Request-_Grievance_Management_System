import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button, Input } from '../../components/ui'
import { useAuth } from '../../context/AuthContext'
import { authApi } from '../../lib/api'

function Register() {
  const steps = ['Personal Info', 'University Details', 'Password Setup']
  const navigate = useNavigate()
  const { login } = useAuth()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    department: '',
    universityId: '',
    batch: '',
    password: '',
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
      const response = await authApi.register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        department: formData.department,
        universityId: formData.universityId,
        batch: formData.batch,
      })
      const authPayload = response?.data

      if (!authPayload?.token || !authPayload?.user) {
        throw new Error('Invalid registration response from server')
      }

      login(authPayload)
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setError(err.message || 'Unable to register. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="grid min-h-screen grid-cols-1 bg-slate-50 dark:bg-slate-900 lg:grid-cols-2">
      <section className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <p className="text-sm font-medium text-indigo-600 dark:text-indigo-300">Student onboarding</p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-900 dark:text-slate-100">Create your account</h1>

          <div className="mt-6 grid gap-2 sm:grid-cols-3">
            {steps.map((step, index) => (
              <div
                key={step}
                className={`rounded-md border px-3 py-2 text-xs font-medium ${index === 0 ? 'border-indigo-300 bg-indigo-50 text-indigo-700 dark:border-indigo-400/30 dark:bg-indigo-500/10 dark:text-indigo-300' : 'border-slate-200 text-slate-500 dark:border-slate-700 dark:text-slate-400'}`}
              >
                {step}
              </div>
            ))}
          </div>

          <form className="mt-6 grid gap-4 sm:grid-cols-2" onSubmit={handleSubmit}>
            <Input
              label="Full Name"
              name="name"
              placeholder="Archit Singh"
              required
              className="sm:col-span-2"
              value={formData.name}
              onChange={handleChange}
            />
            <Input
              label="Email"
              name="email"
              type="email"
              placeholder="student@university.edu"
              required
              value={formData.email}
              onChange={handleChange}
            />
            <Input
              label="Department"
              name="department"
              placeholder="Computer Science"
              required
              value={formData.department}
              onChange={handleChange}
            />
            <Input
              label="University ID"
              name="universityId"
              placeholder="U123456"
              required
              value={formData.universityId}
              onChange={handleChange}
            />
            <Input
              label="Batch"
              name="batch"
              placeholder="2023-2027"
              required
              value={formData.batch}
              onChange={handleChange}
            />
            <Input
              label="Password"
              name="password"
              type="password"
              placeholder="Create password"
              required
              value={formData.password}
              onChange={handleChange}
            />

            {error ? <p className="sm:col-span-2 text-sm text-rose-600">{error}</p> : null}

            <Button type="submit" className="sm:col-span-2" disabled={isSubmitting}>
              {isSubmitting ? 'Creating account...' : 'Register'}
            </Button>

            <p className="sm:col-span-2 text-center text-sm text-slate-500 dark:text-slate-400">
              Already have an account?{' '}
              <Link to="/login" className="font-medium text-indigo-600 dark:text-indigo-300">
                Login
              </Link>
            </p>

            <p className="sm:col-span-2 text-center text-sm text-slate-500 dark:text-slate-400">
              Admin onboarding?{' '}
              <Link to="/admin/register" className="font-medium text-indigo-600 dark:text-indigo-300">
                Register as admin
              </Link>
            </p>
          </form>
        </div>
      </section>

      <section className="relative hidden items-center justify-center overflow-hidden bg-gradient-to-br from-slate-900 to-indigo-700 lg:flex">
        <div className="absolute left-10 top-10 h-56 w-56 rounded-full bg-indigo-400/30 blur-3xl" />
        <div className="absolute bottom-10 right-10 h-64 w-64 rounded-full bg-purple-400/20 blur-3xl" />
        <div className="relative max-w-md rounded-2xl border border-white/30 bg-white/10 p-8 text-white backdrop-blur">
          <h2 className="text-2xl font-semibold">From submission to resolution — all in one dashboard.</h2>
          <ul className="mt-4 space-y-2 text-sm text-indigo-100">
            <li>• Real-time status tracking</li>
            <li>• Priority-based grievance workflow</li>
            <li>• Transparent communication timeline</li>
          </ul>
        </div>
      </section>
    </div>
  )
}

export default Register