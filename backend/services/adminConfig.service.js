import mongoose from 'mongoose'

import { Department } from '../models/Department.js'
import { Request } from '../models/Request.js'
import { User } from '../models/User.js'
import { WorkflowConfig } from '../models/WorkflowConfig.js'
import { ApiError } from '../utils/ApiError.js'
import { normalizeUserRole } from './workflow.service.js'

const ensureObjectId = (value, fieldName) => {
  if (!value) return
  if (!mongoose.Types.ObjectId.isValid(value)) {
    throw new ApiError(400, `Invalid ${fieldName}`)
  }
}

const getScope = (actor) => {
  const role = normalizeUserRole(actor.role)
  const isSuperAdmin = role === 'SUPER_ADMIN'

  return {
    role,
    isSuperAdmin,
    departmentId: actor.departmentId || null,
  }
}

const assertCanManageDepartments = (scope) => {
  if (!scope.isSuperAdmin) {
    throw new ApiError(403, 'Only SUPER_ADMIN can manage departments')
  }
}

const assertDepartmentScope = (scope, departmentId) => {
  if (scope.isSuperAdmin) return

  if (!scope.departmentId || String(scope.departmentId) !== String(departmentId || '')) {
    throw new ApiError(403, 'Forbidden: outside department scope')
  }
}

const assertValidActorsForDepartment = async ({ hodId, teachers = [], departmentId }) => {
  if (hodId) {
    const hod = await User.findById(hodId).select('role departmentId isActive').lean()
    if (!hod || !hod.isActive || normalizeUserRole(hod.role) !== 'HOD') {
      throw new ApiError(400, 'hodId must reference an active HOD user')
    }

    if (departmentId && hod.departmentId && String(hod.departmentId) !== String(departmentId)) {
      throw new ApiError(400, 'HOD must belong to target department')
    }
  }

  if (teachers.length > 0) {
    const teacherUsers = await User.find({ _id: { $in: teachers } }).select('role departmentId isActive').lean()

    if (teacherUsers.length !== teachers.length) {
      throw new ApiError(400, 'One or more teacher ids are invalid')
    }

    const invalidTeacher = teacherUsers.find(
      (teacher) =>
        !teacher.isActive ||
        normalizeUserRole(teacher.role) !== 'TEACHER' ||
        (departmentId && teacher.departmentId && String(teacher.departmentId) !== String(departmentId)),
    )

    if (invalidTeacher) {
      throw new ApiError(400, 'Teachers must be active TEACHER users within target department')
    }
  }
}

const normalizeSteps = (steps) => {
  const normalizedSteps = [...steps]
    .map((step) => ({ role: normalizeUserRole(step.role), order: Number(step.order) }))
    .sort((a, b) => a.order - b.order)

  const seenOrders = new Set()
  for (const step of normalizedSteps) {
    if (seenOrders.has(step.order)) {
      throw new ApiError(400, 'Workflow steps must have unique order values')
    }

    seenOrders.add(step.order)
  }

  return normalizedSteps
}

export const listDepartments = async ({ actor, query }) => {
  const scope = getScope(actor)
  const filter = {}

  if (query.search) {
    filter.$or = [
      { name: { $regex: query.search, $options: 'i' } },
      { code: { $regex: query.search, $options: 'i' } },
    ]
  }

  if (!scope.isSuperAdmin) {
    filter._id = scope.departmentId || null
  }

  return Department.find(filter)
    .sort({ name: 1 })
    .populate('hodId', 'name email role')
    .populate('teachers', 'name email role')
    .lean()
}

export const createDepartment = async ({ actor, payload }) => {
  const scope = getScope(actor)
  assertCanManageDepartments(scope)

  const code = payload.code.trim().toUpperCase()
  const existing = await Department.findOne({ $or: [{ code }, { name: payload.name.trim() }] }).lean()
  if (existing) {
    throw new ApiError(409, 'Department with same name or code already exists')
  }

  await assertValidActorsForDepartment({
    hodId: payload.hodId,
    teachers: payload.teachers,
  })

  const department = await Department.create({
    name: payload.name.trim(),
    code,
    hodId: payload.hodId || null,
    teachers: payload.teachers || [],
  })

  return Department.findById(department._id)
    .populate('hodId', 'name email role')
    .populate('teachers', 'name email role')
    .lean()
}

export const updateDepartment = async ({ actor, departmentId, payload }) => {
  ensureObjectId(departmentId, 'department id')

  const scope = getScope(actor)
  assertCanManageDepartments(scope)

  const department = await Department.findById(departmentId)
  if (!department) {
    throw new ApiError(404, 'Department not found')
  }

  const nextCode = payload.code ? payload.code.trim().toUpperCase() : department.code
  const nextName = payload.name ? payload.name.trim() : department.name

  const duplicate = await Department.findOne({
    _id: { $ne: departmentId },
    $or: [{ code: nextCode }, { name: nextName }],
  }).lean()

  if (duplicate) {
    throw new ApiError(409, 'Another department already uses this name or code')
  }

  await assertValidActorsForDepartment({
    hodId: payload.hodId === null ? null : payload.hodId || department.hodId,
    teachers: payload.teachers || department.teachers,
    departmentId: department._id,
  })

  if (payload.name !== undefined) department.name = nextName
  if (payload.code !== undefined) department.code = nextCode
  if (payload.hodId !== undefined) department.hodId = payload.hodId
  if (payload.teachers !== undefined) department.teachers = payload.teachers

  await department.save()

  return Department.findById(department._id)
    .populate('hodId', 'name email role')
    .populate('teachers', 'name email role')
    .lean()
}

export const deleteDepartment = async ({ actor, departmentId }) => {
  ensureObjectId(departmentId, 'department id')

  const scope = getScope(actor)
  assertCanManageDepartments(scope)

  const [userCount, requestCount, workflowCount] = await Promise.all([
    User.countDocuments({ departmentId }),
    Request.countDocuments({ departmentId }),
    WorkflowConfig.countDocuments({ departmentId }),
  ])

  if (userCount > 0 || requestCount > 0 || workflowCount > 0) {
    throw new ApiError(400, 'Cannot delete department with linked users, requests, or workflows')
  }

  const deleted = await Department.findByIdAndDelete(departmentId).lean()
  if (!deleted) {
    throw new ApiError(404, 'Department not found')
  }

  return deleted
}

export const listWorkflowConfigs = async ({ actor, query }) => {
  const scope = getScope(actor)
  const filter = {}

  if (query.requestType) filter.requestType = query.requestType
  if (query.isActive !== undefined) filter.isActive = query.isActive

  if (query.departmentId) {
    ensureObjectId(query.departmentId, 'department id')
    filter.departmentId = query.departmentId
  }

  if (!scope.isSuperAdmin) {
    filter.departmentId = scope.departmentId || null
  }

  return WorkflowConfig.find(filter)
    .sort({ requestType: 1, updatedAt: -1 })
    .populate('departmentId', 'name code')
    .lean()
}

export const createWorkflowConfig = async ({ actor, payload }) => {
  const scope = getScope(actor)
  const departmentId = payload.departmentId || null

  if (departmentId) {
    ensureObjectId(departmentId, 'department id')
  }

  if (!scope.isSuperAdmin) {
    if (!departmentId || String(departmentId) !== String(scope.departmentId || '')) {
      throw new ApiError(403, 'You can only create workflows for your own department')
    }
  }

  const steps = normalizeSteps(payload.steps)

  const existing = await WorkflowConfig.findOne({
    requestType: payload.requestType,
    departmentId,
  }).lean()

  if (existing) {
    throw new ApiError(409, 'Workflow already exists for this requestType and department scope')
  }

  const workflow = await WorkflowConfig.create({
    requestType: payload.requestType,
    departmentId,
    steps,
    isActive: payload.isActive,
  })

  return WorkflowConfig.findById(workflow._id).populate('departmentId', 'name code').lean()
}

export const updateWorkflowConfig = async ({ actor, workflowId, payload }) => {
  ensureObjectId(workflowId, 'workflow id')

  const scope = getScope(actor)
  const workflow = await WorkflowConfig.findById(workflowId)

  if (!workflow) {
    throw new ApiError(404, 'Workflow config not found')
  }

  assertDepartmentScope(scope, workflow.departmentId)

  const nextDepartmentId = payload.departmentId !== undefined ? payload.departmentId : workflow.departmentId

  if (nextDepartmentId) {
    ensureObjectId(nextDepartmentId, 'department id')
  }

  if (!scope.isSuperAdmin) {
    if (!nextDepartmentId || String(nextDepartmentId) !== String(scope.departmentId || '')) {
      throw new ApiError(403, 'You can only move workflows inside your department scope')
    }
  }

  const nextRequestType = payload.requestType || workflow.requestType

  const duplicate = await WorkflowConfig.findOne({
    _id: { $ne: workflow._id },
    requestType: nextRequestType,
    departmentId: nextDepartmentId || null,
  }).lean()

  if (duplicate) {
    throw new ApiError(409, 'Another workflow already exists for this requestType and department scope')
  }

  if (payload.requestType !== undefined) workflow.requestType = payload.requestType
  if (payload.departmentId !== undefined) workflow.departmentId = payload.departmentId
  if (payload.steps !== undefined) workflow.steps = normalizeSteps(payload.steps)
  if (payload.isActive !== undefined) workflow.isActive = payload.isActive

  await workflow.save()

  return WorkflowConfig.findById(workflow._id).populate('departmentId', 'name code').lean()
}

export const deleteWorkflowConfig = async ({ actor, workflowId }) => {
  ensureObjectId(workflowId, 'workflow id')

  const scope = getScope(actor)
  const workflow = await WorkflowConfig.findById(workflowId).lean()
  if (!workflow) {
    throw new ApiError(404, 'Workflow config not found')
  }

  assertDepartmentScope(scope, workflow.departmentId)

  await WorkflowConfig.deleteOne({ _id: workflowId })
  return workflow
}
