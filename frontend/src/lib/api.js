const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1'
export const API_ORIGIN = API_BASE_URL.replace(/\/api\/v1\/?$/, '')

export const getAuthToken = () => localStorage.getItem('auth_token')
export const getRefreshToken = () => localStorage.getItem('auth_refresh_token')

export const getStoredUser = () => {
  const raw = localStorage.getItem('auth_user')
  if (!raw) return null

  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export const persistAuthSession = ({ accessToken, refreshToken, user, token }) => {
  const nextAccessToken = accessToken || token || ''

  if (nextAccessToken) {
    localStorage.setItem('auth_token', nextAccessToken)
  }

  if (refreshToken) {
    localStorage.setItem('auth_refresh_token', refreshToken)
  }

  if (user) {
    localStorage.setItem('auth_user', JSON.stringify(user))
  }
}

export const clearAuthSession = () => {
  localStorage.removeItem('auth_token')
  localStorage.removeItem('auth_refresh_token')
  localStorage.removeItem('auth_user')
}

export class ApiClientError extends Error {
  constructor(message, status = 0, data = null) {
    super(message)
    this.name = 'ApiClientError'
    this.status = status
    this.data = data
  }
}

export const resolveApiAssetUrl = (value) => {
  if (!value) return ''
  if (/^https?:\/\//i.test(value)) return value
  return `${API_ORIGIN}${value.startsWith('/') ? value : `/${value}`}`
}

const buildQueryString = (query = {}) => {
  const searchParams = new URLSearchParams()

  Object.entries(query).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') {
      return
    }

    searchParams.set(key, String(value))
  })

  const result = searchParams.toString()
  return result ? `?${result}` : ''
}

let refreshPromise = null

const refreshAccessToken = async () => {
  const refreshToken = getRefreshToken()
  if (!refreshToken) {
    throw new ApiClientError('Session expired. Please login again.', 401)
  }

  if (!refreshPromise) {
    refreshPromise = fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
    })
      .then(async (response) => {
        const data = await response.json().catch(() => ({}))

        if (!response.ok) {
          clearAuthSession()
          throw new ApiClientError(data?.message || 'Session expired. Please login again.', response.status, data)
        }

        const authPayload = data?.data || {}
        persistAuthSession(authPayload)
        return authPayload
      })
      .finally(() => {
        refreshPromise = null
      })
  }

  return refreshPromise
}

export const apiRequest = async (path, options = {}, retryState = { attemptedRefresh: false }) => {
  const token = getAuthToken()
  const queryString = buildQueryString(options.query)
  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData
  const headers = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  }

  const response = await fetch(`${API_BASE_URL}${path}${queryString}`, {
    method: options.method || 'GET',
    headers,
    body: isFormData ? options.body : options.body ? JSON.stringify(options.body) : undefined,
  })

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    const isRefreshEligiblePath = path === '/auth/me' || !path.startsWith('/auth/')
    const shouldAttemptRefresh =
      response.status === 401 &&
      !retryState.attemptedRefresh &&
      isRefreshEligiblePath &&
      Boolean(getRefreshToken())

    if (shouldAttemptRefresh) {
      await refreshAccessToken()
      return apiRequest(path, options, { attemptedRefresh: true })
    }

    const message = data?.message || 'Request failed'
    throw new ApiClientError(message, response.status, data)
  }

  return data
}

export const authApi = {
  getBootstrap: () => apiRequest('/auth/bootstrap'),
  register: (payload) => apiRequest('/auth/register', { method: 'POST', body: payload }),
  login: (payload) => apiRequest('/auth/login', { method: 'POST', body: payload }),
  adminRegister: (payload) => apiRequest('/auth/admin/register', { method: 'POST', body: payload }),
  adminLogin: (payload) => apiRequest('/auth/admin/login', { method: 'POST', body: payload }),
  refresh: (payload) => apiRequest('/auth/refresh', { method: 'POST', body: payload }),
  logout: (payload) => apiRequest('/auth/logout', { method: 'POST', body: payload }),
  getMe: () => apiRequest('/auth/me'),
}

export const studentApi = {
  createRequest: (payload) => apiRequest('/requests', { method: 'POST', body: payload }),
  listMyRequests: (query = {}) => apiRequest('/requests/my', { query }),
  getRequestById: (id) => apiRequest(`/requests/${id}`),
  updateRequest: (id, payload) => apiRequest(`/requests/${id}`, { method: 'PATCH', body: payload }),
  getRequestUpdates: (id) => apiRequest(`/requests/${id}/updates`),
  getWorkspace: (id) => apiRequest(`/requests/${id}/workspace`),
  addComment: (id, payload) => apiRequest(`/requests/${id}/comments`, { method: 'POST', body: payload }),
  uploadAttachment: (id, file) => {
    const formData = new FormData()
    formData.append('file', file)
    return apiRequest(`/requests/${id}/attachments`, { method: 'POST', body: formData })
  },
  reopenRequest: (id, payload) => apiRequest(`/requests/${id}/reopen`, { method: 'POST', body: payload }),
  submitFeedback: (id, payload) => apiRequest(`/requests/${id}/feedback`, { method: 'POST', body: payload }),
  listNotifications: (query = {}) => apiRequest('/requests/notifications', { query }),
  markNotificationRead: (id) => apiRequest(`/requests/notifications/${id}/read`, { method: 'PATCH' }),
}

export const adminApi = {
  listRequests: (query = {}) => apiRequest('/admin/requests', { query }),
  updateStatus: (id, status) => apiRequest(`/admin/requests/${id}/status`, { method: 'PATCH', body: { status } }),
  assignRequest: (id, assignedTo) =>
    apiRequest(`/admin/requests/${id}/assign`, { method: 'PATCH', body: { assignedTo } }),
  requestAction: (id, payload) => apiRequest(`/requests/${id}/action`, { method: 'POST', body: payload }),
  getDashboardStats: () => apiRequest('/admin/dashboard/stats'),
  listAdmins: () => apiRequest('/admin/users'),
  listDepartments: (query = {}) => apiRequest('/admin/departments', { query }),
  createDepartment: (payload) => apiRequest('/admin/departments', { method: 'POST', body: payload }),
  updateDepartment: (id, payload) => apiRequest(`/admin/departments/${id}`, { method: 'PATCH', body: payload }),
  deleteDepartment: (id) => apiRequest(`/admin/departments/${id}`, { method: 'DELETE' }),
  listWorkflows: (query = {}) => apiRequest('/admin/workflows', { query }),
  createWorkflow: (payload) => apiRequest('/admin/workflows', { method: 'POST', body: payload }),
  updateWorkflow: (id, payload) => apiRequest(`/admin/workflows/${id}`, { method: 'PATCH', body: payload }),
  deleteWorkflow: (id) => apiRequest(`/admin/workflows/${id}`, { method: 'DELETE' }),
  getWorkspace: (id) => apiRequest(`/requests/${id}/workspace`),
  addComment: (id, payload) => apiRequest(`/requests/${id}/comments`, { method: 'POST', body: payload }),
  uploadAttachment: (id, file) => {
    const formData = new FormData()
    formData.append('file', file)
    return apiRequest(`/requests/${id}/attachments`, { method: 'POST', body: formData })
  },
  listNotifications: (query = {}) => apiRequest('/requests/notifications', { query }),
  markNotificationRead: (id) => apiRequest(`/requests/notifications/${id}/read`, { method: 'PATCH' }),
}

export const superAdminApi = {
  getDashboard: () => apiRequest('/admin/super/dashboard'),
  getAnalytics: () => apiRequest('/admin/super/analytics'),
  listUsers: (query = {}) => apiRequest('/admin/super/users', { query }),
  updateUserRole: (id, role) => apiRequest(`/admin/super/users/${id}/role`, { method: 'PATCH', body: { role } }),
  updateUserActive: (id, isActive) =>
    apiRequest(`/admin/super/users/${id}/active`, { method: 'PATCH', body: { isActive } }),
  listEscalations: (query = {}) => apiRequest('/admin/super/escalations', { query }),
  manualEscalate: (id, remark = '') =>
    apiRequest(`/admin/super/escalations/${id}/manual`, { method: 'POST', body: { remark } }),
  overrideRequest: (id, payload) =>
    apiRequest(`/admin/super/requests/${id}/override`, { method: 'PATCH', body: payload }),
  reassignRequest: (id, assignedTo) =>
    apiRequest(`/admin/super/requests/${id}/reassign`, { method: 'PATCH', body: { assignedTo } }),
  getReports: () => apiRequest('/admin/super/reports'),
  getWorkspace: (id) => apiRequest(`/requests/${id}/workspace`),
  addComment: (id, payload) => apiRequest(`/requests/${id}/comments`, { method: 'POST', body: payload }),
  uploadAttachment: (id, file) => {
    const formData = new FormData()
    formData.append('file', file)
    return apiRequest(`/requests/${id}/attachments`, { method: 'POST', body: formData })
  },
  listNotifications: (query = {}) => apiRequest('/requests/notifications', { query }),
  markNotificationRead: (id) => apiRequest(`/requests/notifications/${id}/read`, { method: 'PATCH' }),
}
