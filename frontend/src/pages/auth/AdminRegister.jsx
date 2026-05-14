import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button, Input } from '../../components/ui'
import { useAuth } from '../../context/AuthContext'
import { authApi } from '../../lib/api'

const adminDesignations = ['Professor', 'Teacher', 'Class Coordinator', 'Other']

const initialFormData = {
  name: '',
  email: '',
  departmentId: '',
  department: '',
  designation: 'Other',
  password: '',
  confirmPassword: '',
  adminSignupKey: '',
}

function AdminRegister() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [departments, setDepartments] = useState([])
  const [formData, setFormData] = useState(initialFormData)
  const [fieldErrors, setFieldErrors] = useState({})
  const [error, setError] = useState('')
  const [isBootstrapLoading, setIsBootstrapLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    let isMounted = true

    const loadBootstrap = async () => {
      setIsBootstrapLoading(true)

      try {
        const response = await authApi.getBootstrap()
        if (!isMounted) return
        setDepartments(response?.data?.departments || [])
      } catch (err) {
        if (isMounted) {
          setError(err.message || 'Failed to load department options')
        }
      } finally {
        if (isMounted) {
          setIsBootstrapLoading(false)
        }
      }
    }

    loadBootstrap()

    return () => {
      isMounted = false
    }
  }, [])

  const selectedDepartmentLabel = useMemo(() => {
    return departments.find((department) => department._id === formData.departmentId)?.name || ''
  }, [departments, formData.departmentId])

  const handleChange = (event) => {
    const { name, value } = event.target

    if (name === 'departmentId') {
      const selectedDepartment = departments.find((department) => department._id === value)
      setFormData((prev) => ({
        ...prev,
        departmentId: value,
        department: selectedDepartment?.name || '',
      }))
      setFieldErrors((prev) => ({ ...prev, departmentId: '' }))
      return
    }

    setFormData((prev) => ({ ...prev, [name]: value }))
    setFieldErrors((prev) => ({ ...prev, [name]: '' }))
  }

  const validateForm = () => {
    const nextErrors = {}
    const hasDepartment = departments.length > 0 ? Boolean(formData.departmentId) : formData.department.trim().length >= 2

    if (!formData.name.trim() || formData.name.trim().length < 2) nextErrors.name = 'Enter a valid full name'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) nextErrors.email = 'Enter a valid email address'
    if (!hasDepartment) nextErrors.departmentId = 'Choose a department'

    if (!formData.password || formData.password.length < 8) {
      nextErrors.password = 'Password must be at least 8 characters'
    } else if (!/[a-z]/.test(formData.password)) {
      nextErrors.password = 'Password must include a lowercase letter'
    } else if (!/[A-Z]/.test(formData.password)) {
      nextErrors.password = 'Password must include an uppercase letter'
    } else if (!/\d/.test(formData.password)) {
      nextErrors.password = 'Password must include a number'
    } else if (!/[^A-Za-z0-9]/.test(formData.password)) {
      nextErrors.password = 'Password must include a special character'
    }

    if (formData.confirmPassword !== formData.password) nextErrors.confirmPassword = 'Passwords do not match'
    if (!formData.adminSignupKey.trim()) nextErrors.adminSignupKey = 'Signup key is required'

    setFieldErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')

    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)

    try {
      const response = await authApi.adminRegister({
        name: formData.name.trim(),
        email: formData.email.trim(),
        departmentId: formData.departmentId || undefined,
        department: formData.department || selectedDepartmentLabel,
        designation: formData.designation,
        password: formData.password,
        adminSignupKey: formData.adminSignupKey,
      })
      const authPayload = response?.data

      if (!(authPayload?.accessToken || authPayload?.token) || !authPayload?.refreshToken || !authPayload?.user) {
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
              error={fieldErrors.name}
            />
            <Input
              label="Admin Email"
              name="email"
              type="email"
              placeholder="admin@university.edu"
              required
              value={formData.email}
              onChange={handleChange}
              error={fieldErrors.email}
            />
            {departments.length > 0 ? (
              <label className="grid gap-1 text-sm font-medium text-slate-700 dark:text-slate-200">
                Department
                <select
                  name="departmentId"
                  required
                  value={formData.departmentId}
                  onChange={handleChange}
                  disabled={isBootstrapLoading}
                  className="h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-indigo-400 dark:focus:ring-indigo-500/30"
                >
                  <option value="">{isBootstrapLoading ? 'Loading departments...' : 'Select department'}</option>
                  {departments.map((department) => (
                    <option key={department._id} value={department._id}>
                      {department.name} ({department.code})
                    </option>
                  ))}
                </select>
                {fieldErrors.departmentId ? <span className="text-xs text-rose-600">{fieldErrors.departmentId}</span> : null}
              </label>
            ) : (
              <Input
                label="Department"
                name="department"
                placeholder="Support Operations"
                required
                value={formData.department}
                onChange={handleChange}
                error={fieldErrors.departmentId}
              />
            )}
            <label className="grid gap-1 text-sm font-medium text-slate-700 dark:text-slate-200">
              Designation
              <select
                name="designation"
                required
                value={formData.designation}
                onChange={handleChange}
                className="h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-indigo-400 dark:focus:ring-indigo-500/30"
              >
                {adminDesignations.map((designation) => (
                  <option key={designation} value={designation}>
                    {designation}
                  </option>
                ))}
              </select>
            </label>
            <Input
              label="Password"
              name="password"
              type="password"
              placeholder="Create secure password"
              required
              value={formData.password}
              onChange={handleChange}
              error={fieldErrors.password}
            />
            <Input
              label="Confirm Password"
              name="confirmPassword"
              type="password"
              placeholder="Repeat secure password"
              required
              value={formData.confirmPassword}
              onChange={handleChange}
              error={fieldErrors.confirmPassword}
            />
            <Input
              label="Admin Signup Key"
              name="adminSignupKey"
              type="password"
              placeholder="Enter issued key"
              required
              value={formData.adminSignupKey}
              onChange={handleChange}
              error={fieldErrors.adminSignupKey}
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
