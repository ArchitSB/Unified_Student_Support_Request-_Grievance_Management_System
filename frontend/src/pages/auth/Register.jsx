import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button, Input } from '../../components/ui'
import { useAuth } from '../../context/AuthContext'
import { authApi } from '../../lib/api'

const steps = [
  { id: 0, label: 'Personal Info' },
  { id: 1, label: 'University Details' },
  { id: 2, label: 'Password Setup' },
]

const stepFieldMap = {
  0: ['name', 'email'],
  1: ['departmentId', 'universityId', 'program', 'batch', 'semester'],
  2: ['password', 'confirmPassword'],
}

const initialFormData = {
  name: '',
  email: '',
  departmentId: '',
  department: '',
  universityId: '',
  batch: '',
  program: '',
  semester: '',
  password: '',
  confirmPassword: '',
}

function Register() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [currentStep, setCurrentStep] = useState(0)
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
      setError('')

      try {
        const response = await authApi.getBootstrap()
        if (!isMounted) return
        setDepartments(response?.data?.departments || [])
      } catch (err) {
        if (isMounted) {
          setError(err.message || 'Failed to load registration options')
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

  const getStepErrors = (stepIndex) => {
    const nextErrors = {}

    if (stepIndex === 0) {
      if (!formData.name.trim() || formData.name.trim().length < 2) {
        nextErrors.name = 'Enter a valid full name'
      }

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
        nextErrors.email = 'Enter a valid email address'
      }
    }

    if (stepIndex === 1) {
      const hasDepartment = departments.length > 0 ? Boolean(formData.departmentId) : formData.department.trim().length >= 2

      if (!hasDepartment) {
        nextErrors.departmentId = 'Choose your department'
      }

      if (!formData.universityId.trim()) {
        nextErrors.universityId = 'University ID is required'
      }

      if (!formData.program.trim()) {
        nextErrors.program = 'Program is required'
      }

      if (!formData.batch.trim()) {
        nextErrors.batch = 'Batch is required'
      }

      if (!formData.semester || Number(formData.semester) < 1) {
        nextErrors.semester = 'Semester must be at least 1'
      }
    }

    if (stepIndex === 2) {
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

      if (formData.confirmPassword !== formData.password) {
        nextErrors.confirmPassword = 'Passwords do not match'
      }
    }

    return nextErrors
  }

  const validateStep = (stepIndex) => {
    const nextErrors = getStepErrors(stepIndex)

    setFieldErrors((prev) => {
      const retainedErrors = { ...prev }
      stepFieldMap[stepIndex].forEach((fieldName) => {
        delete retainedErrors[fieldName]
      })

      return { ...retainedErrors, ...nextErrors }
    })

    return Object.keys(nextErrors).length === 0
  }

  const goToStep = (targetStep) => {
    if (targetStep < currentStep) {
      setCurrentStep(targetStep)
      return
    }

    for (let stepIndex = currentStep; stepIndex < targetStep; stepIndex += 1) {
      if (!validateStep(stepIndex)) {
        return
      }
    }

    setCurrentStep(targetStep)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')

    const validationResults = [0, 1, 2].map((stepIndex) => ({
      stepIndex,
      errors: getStepErrors(stepIndex),
    }))
    const firstInvalidStep = validationResults.find((result) => Object.keys(result.errors).length > 0)

    setFieldErrors(validationResults.reduce((acc, result) => ({ ...acc, ...result.errors }), {}))

    if (firstInvalidStep) {
      setCurrentStep(firstInvalidStep.stepIndex)
      return
    }

    setIsSubmitting(true)

    try {
      const response = await authApi.register({
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password,
        departmentId: formData.departmentId || undefined,
        department: formData.department || selectedDepartmentLabel,
        universityId: formData.universityId.trim(),
        batch: formData.batch.trim(),
        program: formData.program.trim(),
        semester: Number(formData.semester),
      })
      const authPayload = response?.data

      if (!(authPayload?.accessToken || authPayload?.token) || !authPayload?.refreshToken || !authPayload?.user) {
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
            {steps.map((step) => (
              <button
                type="button"
                key={step.id}
                onClick={() => goToStep(step.id)}
                className={`rounded-md border px-3 py-2 text-left text-xs font-medium transition ${
                  step.id === currentStep
                    ? 'border-indigo-300 bg-indigo-50 text-indigo-700 dark:border-indigo-400/30 dark:bg-indigo-500/10 dark:text-indigo-300'
                    : 'border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-700 dark:border-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
              >
                {step.label}
              </button>
            ))}
          </div>

          <form className="mt-6 grid gap-4 sm:grid-cols-2" onSubmit={handleSubmit}>
            {currentStep === 0 ? (
              <>
                <Input
                  label="Full Name"
                  name="name"
                  placeholder="Archit Singh"
                  required
                  className="sm:col-span-2"
                  value={formData.name}
                  onChange={handleChange}
                  error={fieldErrors.name}
                />
                <Input
                  label="Email"
                  name="email"
                  type="email"
                  placeholder="student@university.edu"
                  required
                  className="sm:col-span-2"
                  value={formData.email}
                  onChange={handleChange}
                  error={fieldErrors.email}
                />
              </>
            ) : null}

            {currentStep === 1 ? (
              <>
                {departments.length > 0 ? (
                  <label className="sm:col-span-2 grid gap-1 text-sm font-medium text-slate-700 dark:text-slate-200">
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
                    placeholder="Computer Science"
                    required
                    className="sm:col-span-2"
                    value={formData.department}
                    onChange={handleChange}
                    error={fieldErrors.departmentId}
                  />
                )}

                <Input
                  label="University ID"
                  name="universityId"
                  placeholder="U123456"
                  required
                  value={formData.universityId}
                  onChange={handleChange}
                  error={fieldErrors.universityId}
                />
                <Input
                  label="Program"
                  name="program"
                  placeholder="B.Tech"
                  required
                  value={formData.program}
                  onChange={handleChange}
                  error={fieldErrors.program}
                />
                <Input
                  label="Batch"
                  name="batch"
                  placeholder="2023-2027"
                  required
                  value={formData.batch}
                  onChange={handleChange}
                  error={fieldErrors.batch}
                />
                <Input
                  label="Semester"
                  name="semester"
                  type="number"
                  min="1"
                  max="20"
                  placeholder="6"
                  required
                  value={formData.semester}
                  onChange={handleChange}
                  error={fieldErrors.semester}
                />
              </>
            ) : null}

            {currentStep === 2 ? (
              <>
                <Input
                  label="Password"
                  name="password"
                  type="password"
                  placeholder="Create password"
                  required
                  className="sm:col-span-2"
                  value={formData.password}
                  onChange={handleChange}
                  error={fieldErrors.password}
                />
                <Input
                  label="Confirm Password"
                  name="confirmPassword"
                  type="password"
                  placeholder="Repeat password"
                  required
                  className="sm:col-span-2"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  error={fieldErrors.confirmPassword}
                />
                <p className="sm:col-span-2 text-xs text-slate-500 dark:text-slate-400">
                  Use 8-64 characters with uppercase, lowercase, number, and special character.
                </p>
              </>
            ) : null}

            {error ? <p className="sm:col-span-2 text-sm text-rose-600">{error}</p> : null}

            <div className="sm:col-span-2 flex flex-wrap justify-between gap-3">
              <Button
                type="button"
                variant="secondary"
                onClick={() => goToStep(Math.max(currentStep - 1, 0))}
                disabled={currentStep === 0}
              >
                Back
              </Button>

              {currentStep < steps.length - 1 ? (
                <Button type="button" onClick={() => goToStep(currentStep + 1)}>
                  Next
                </Button>
              ) : (
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Creating account...' : 'Register'}
                </Button>
              )}
            </div>

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

      <section className="relative hidden items-center justify-center overflow-hidden bg-gradient-to-br from-slate-900 to-cyan-700 lg:flex">
        <div className="absolute left-10 top-10 h-56 w-56 rounded-full bg-indigo-400/30 blur-3xl" />
        <div className="absolute bottom-10 right-10 h-64 w-64 rounded-full bg-cyan-400/20 blur-3xl" />
        <div className="relative max-w-md rounded-2xl border border-white/30 bg-white/10 p-8 text-white backdrop-blur">
          <h2 className="text-2xl font-semibold">From submission to resolution, all in one dashboard.</h2>
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
