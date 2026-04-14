import {
  createDepartment,
  createWorkflowConfig,
  deleteDepartment,
  deleteWorkflowConfig,
  listDepartments,
  listWorkflowConfigs,
  updateDepartment,
  updateWorkflowConfig,
} from '../services/adminConfig.service.js'
import { sendSuccess } from '../utils/apiResponse.js'

export const listDepartmentsHandler = async (req, res) => {
  const data = await listDepartments({ actor: req.user, query: req.validated.query })

  return sendSuccess(res, {
    message: 'Fetched departments',
    data,
  })
}

export const createDepartmentHandler = async (req, res) => {
  const data = await createDepartment({ actor: req.user, payload: req.validated.body })

  return sendSuccess(res, {
    statusCode: 201,
    message: 'Department created successfully',
    data,
  })
}

export const updateDepartmentHandler = async (req, res) => {
  const data = await updateDepartment({
    actor: req.user,
    departmentId: req.validated.params.id,
    payload: req.validated.body,
  })

  return sendSuccess(res, {
    message: 'Department updated successfully',
    data,
  })
}

export const deleteDepartmentHandler = async (req, res) => {
  const data = await deleteDepartment({
    actor: req.user,
    departmentId: req.validated.params.id,
  })

  return sendSuccess(res, {
    message: 'Department deleted successfully',
    data,
  })
}

export const listWorkflowsHandler = async (req, res) => {
  const data = await listWorkflowConfigs({ actor: req.user, query: req.validated.query })

  return sendSuccess(res, {
    message: 'Fetched workflow configurations',
    data,
  })
}

export const createWorkflowHandler = async (req, res) => {
  const data = await createWorkflowConfig({ actor: req.user, payload: req.validated.body })

  return sendSuccess(res, {
    statusCode: 201,
    message: 'Workflow configuration created successfully',
    data,
  })
}

export const updateWorkflowHandler = async (req, res) => {
  const data = await updateWorkflowConfig({
    actor: req.user,
    workflowId: req.validated.params.id,
    payload: req.validated.body,
  })

  return sendSuccess(res, {
    message: 'Workflow configuration updated successfully',
    data,
  })
}

export const deleteWorkflowHandler = async (req, res) => {
  const data = await deleteWorkflowConfig({
    actor: req.user,
    workflowId: req.validated.params.id,
  })

  return sendSuccess(res, {
    message: 'Workflow configuration deleted successfully',
    data,
  })
}
