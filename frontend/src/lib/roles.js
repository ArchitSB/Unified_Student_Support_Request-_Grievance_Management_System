export const ROLE = {
  STUDENT: 'STUDENT',
  TEACHER: 'TEACHER',
  HOD: 'HOD',
  DEPARTMENT_ADMIN: 'DEPARTMENT_ADMIN',
  SUPER_ADMIN: 'SUPER_ADMIN',
  ADMIN: 'ADMIN',
}

export const normalizeRole = (role) => String(role || '').trim().toUpperCase()

export const ADMIN_ROLES = [
  ROLE.ADMIN,
  ROLE.TEACHER,
  ROLE.HOD,
  ROLE.DEPARTMENT_ADMIN,
  ROLE.SUPER_ADMIN,
]

export const isAdminRole = (role) => ADMIN_ROLES.includes(normalizeRole(role))

export const getDefaultPathForRole = (role) => {
  const normalized = normalizeRole(role)
  if (normalized === ROLE.STUDENT || !normalized) {
    return '/dashboard'
  }

  return isAdminRole(normalized) ? '/admin/dashboard' : '/dashboard'
}