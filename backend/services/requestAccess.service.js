import { ApiError } from '../utils/ApiError.js'
import { normalizeUserRole } from './workflow.service.js'

export const assertRequestAccess = (request, user) => {
  const userRole = normalizeUserRole(user.role)

  if (userRole === 'SUPER_ADMIN') {
    return
  }

  if (userRole === 'STUDENT') {
    if (String(request.studentId) !== String(user._id)) {
      throw new ApiError(403, 'Forbidden: request does not belong to this student')
    }
    return
  }

  if (userRole === 'TEACHER') {
    if (String(request.assignedTo || '') !== String(user._id)) {
      throw new ApiError(403, 'Forbidden: request is not assigned to this teacher')
    }
    return
  }

  if (userRole === 'HOD' || userRole === 'DEPARTMENT_ADMIN' || userRole === 'ADMIN') {
    if (!request.departmentId || String(request.departmentId) !== String(user.departmentId || '')) {
      throw new ApiError(403, 'Forbidden: request is outside your department')
    }
    return
  }

  throw new ApiError(403, 'Forbidden: insufficient permission for request access')
}

export const applyRoleScopeFilter = ({ baseFilter = {}, user }) => {
  const userRole = normalizeUserRole(user.role)

  if (userRole === 'SUPER_ADMIN') {
    return { ...baseFilter }
  }

  if (userRole === 'STUDENT') {
    return { ...baseFilter, studentId: user._id }
  }

  if (userRole === 'TEACHER') {
    return { ...baseFilter, assignedTo: user._id }
  }

  if (userRole === 'HOD' || userRole === 'DEPARTMENT_ADMIN' || userRole === 'ADMIN') {
    return {
      ...baseFilter,
      ...(user.departmentId ? { departmentId: user.departmentId } : { _id: null }),
    }
  }

  return { ...baseFilter, _id: null }
}
