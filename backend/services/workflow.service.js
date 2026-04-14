import mongoose from 'mongoose'

import { Department } from '../models/Department.js'
import { User } from '../models/User.js'
import { WorkflowConfig } from '../models/WorkflowConfig.js'
import { ApiError } from '../utils/ApiError.js'

const normalizeRole = (role) => String(role || '').trim().toUpperCase()

export const resolveDepartmentId = async ({ departmentId, studentUser }) => {
  if (departmentId) {
    if (!mongoose.Types.ObjectId.isValid(departmentId)) {
      throw new ApiError(400, 'Invalid department id')
    }

    const department = await Department.findById(departmentId).select('_id').lean()
    if (!department) {
      throw new ApiError(404, 'Department not found')
    }

    return department._id
  }

  if (studentUser?.departmentId) {
    return studentUser.departmentId
  }

  return null
}

export const resolveWorkflowForRequest = async ({ requestType, departmentId }) => {
  const workflow = await WorkflowConfig.findOne({
    requestType,
    departmentId: departmentId || null,
    isActive: true,
  })
    .sort({ updatedAt: -1 })
    .lean()

  if (workflow) {
    return workflow
  }

  const globalFallbackWorkflow = await WorkflowConfig.findOne({
    requestType,
    departmentId: null,
    isActive: true,
  })
    .sort({ updatedAt: -1 })
    .lean()

  return globalFallbackWorkflow
}

const fallbackWorkflowMap = {
  ACADEMIC: ['TEACHER', 'HOD'],
  FINANCE: ['DEPARTMENT_ADMIN'],
  HOSTEL: ['DEPARTMENT_ADMIN'],
  INFRASTRUCTURE: ['DEPARTMENT_ADMIN'],
  OTHER: ['DEPARTMENT_ADMIN'],
}

export const resolveWorkflowOrFallback = async ({ requestType, departmentId }) => {
  const configuredWorkflow = await resolveWorkflowForRequest({ requestType, departmentId })
  if (configuredWorkflow) {
    return configuredWorkflow
  }

  const roles = fallbackWorkflowMap[requestType] || fallbackWorkflowMap.OTHER

  return {
    _id: null,
    requestType,
    departmentId: departmentId || null,
    steps: roles.map((role, index) => ({ role, order: index + 1 })),
    isFallback: true,
  }
}

const resolveUserByRole = async ({ role, departmentId }) => {
  const normalizedRole = normalizeRole(role)

  if (normalizedRole === 'HOD') {
    const department = await Department.findById(departmentId).select('hodId').lean()
    return department?.hodId || null
  }

  if (normalizedRole === 'TEACHER') {
    const teacher = await User.findOne({
      role: 'TEACHER',
      departmentId: departmentId || null,
      isActive: true,
    })
      .sort({ createdAt: 1 })
      .select('_id')
      .lean()

    return teacher?._id || null
  }

  if (normalizedRole === 'DEPARTMENT_ADMIN') {
    const admin = await User.findOne({
      role: { $in: ['DEPARTMENT_ADMIN', 'ADMIN'] },
      departmentId: departmentId || null,
      isActive: true,
    })
      .sort({ createdAt: 1 })
      .select('_id')
      .lean()

    return admin?._id || null
  }

  if (normalizedRole === 'SUPER_ADMIN') {
    const superAdmin = await User.findOne({ role: 'SUPER_ADMIN', isActive: true })
      .sort({ createdAt: 1 })
      .select('_id')
      .lean()

    return superAdmin?._id || null
  }

  return null
}

export const resolveInitialAssignee = async ({ workflow, taggedTeacherId, departmentId }) => {
  const firstStep = [...workflow.steps].sort((a, b) => a.order - b.order)[0]
  if (!firstStep) {
    throw new ApiError(400, 'Workflow has no steps')
  }

  const firstStepRole = normalizeRole(firstStep.role)

  if (taggedTeacherId && firstStepRole === 'TEACHER') {
    const teacher = await User.findOne({
      _id: taggedTeacherId,
      role: 'TEACHER',
      isActive: true,
      ...(departmentId ? { departmentId } : {}),
    })
      .select('_id')
      .lean()

    if (!teacher) {
      throw new ApiError(400, 'Tagged teacher is invalid for this workflow')
    }

    return {
      currentStep: firstStep.order,
      assignedTo: teacher._id,
    }
  }

  const assignedTo = await resolveUserByRole({ role: firstStepRole, departmentId })

  if (!assignedTo) {
    throw new ApiError(400, `Unable to resolve assignee for first workflow step role ${firstStepRole}`)
  }

  return {
    currentStep: firstStep.order,
    assignedTo,
  }
}

export const resolveNextStepAssignment = async ({ workflow, nextStepOrder, departmentId }) => {
  const nextStep = workflow.steps.find((step) => step.order === nextStepOrder)
  if (!nextStep) {
    return null
  }

  const assignedTo = await resolveUserByRole({ role: nextStep.role, departmentId })
  if (!assignedTo) {
    throw new ApiError(400, `Unable to resolve assignee for workflow step role ${nextStep.role}`)
  }

  return {
    assignedTo,
    role: normalizeRole(nextStep.role),
  }
}

export const canRoleActOnStep = ({ userRole, workflowStepRole }) => {
  const normalizedUserRole = normalizeRole(userRole)
  const normalizedStepRole = normalizeRole(workflowStepRole)

  // Legacy ADMIN behaves as department admin for compatibility.
  if (normalizedUserRole === 'ADMIN' && normalizedStepRole === 'DEPARTMENT_ADMIN') {
    return true
  }

  return normalizedUserRole === normalizedStepRole
}

export const normalizeUserRole = normalizeRole
