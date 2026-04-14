const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1'

const getAuthToken = () => localStorage.getItem('auth_token')

export class ApiClientError extends Error {
  constructor(message, status = 0, data = null) {
    super(message)
    this.name = 'ApiClientError'
    this.status = status
    this.data = data
  }
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

export const apiRequest = async (path, options = {}) => {
  const token = getAuthToken()
  const queryString = buildQueryString(options.query)

  const response = await fetch(`${API_BASE_URL}${path}${queryString}`, {
    method: options.method || 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  })

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    const message = data?.message || 'Request failed'
    throw new ApiClientError(message, response.status, data)
  }

  return data
}

export const authApi = {
  register: (payload) => apiRequest('/auth/register', { method: 'POST', body: payload }),
  login: (payload) => apiRequest('/auth/login', { method: 'POST', body: payload }),
  adminRegister: (payload) => apiRequest('/auth/admin/register', { method: 'POST', body: payload }),
  adminLogin: (payload) => apiRequest('/auth/admin/login', { method: 'POST', body: payload }),
  getMe: () => apiRequest('/auth/me'),
}

export const studentApi = {
  createRequest: (payload) => apiRequest('/requests', { method: 'POST', body: payload }),
  listMyRequests: (query = {}) => apiRequest('/requests/my', { query }),
  getRequestById: (id) => apiRequest(`/requests/${id}`),
  updateRequest: (id, payload) => apiRequest(`/requests/${id}`, { method: 'PATCH', body: payload }),
  getRequestUpdates: (id) => apiRequest(`/requests/${id}/updates`),
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
}
