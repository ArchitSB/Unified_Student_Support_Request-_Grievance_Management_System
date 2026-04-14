import { z } from 'zod'

const objectIdRegex = /^[a-f\d]{24}$/i
const requestTypeEnum = z.enum(['ACADEMIC', 'FINANCE', 'HOSTEL', 'INFRASTRUCTURE', 'OTHER'])
const workflowRoleEnum = z.enum(['TEACHER', 'HOD', 'DEPARTMENT_ADMIN', 'SUPER_ADMIN'])

const workflowStepSchema = z.object({
  role: workflowRoleEnum,
  order: z.coerce.number().int().min(1),
})

export const listDepartmentsSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({}).optional(),
  query: z.object({
    search: z.string().trim().optional(),
  }),
})

export const createDepartmentSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2).max(120),
    code: z.string().trim().min(2).max(20),
    hodId: z.string().regex(objectIdRegex, 'Invalid hod id').optional(),
    teachers: z.array(z.string().regex(objectIdRegex, 'Invalid teacher id')).optional().default([]),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
})

export const updateDepartmentSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2).max(120).optional(),
    code: z.string().trim().min(2).max(20).optional(),
    hodId: z.string().regex(objectIdRegex, 'Invalid hod id').nullable().optional(),
    teachers: z.array(z.string().regex(objectIdRegex, 'Invalid teacher id')).optional(),
  }),
  params: z.object({
    id: z.string().regex(objectIdRegex, 'Invalid department id'),
  }),
  query: z.object({}).optional(),
})

export const departmentIdParamsSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({
    id: z.string().regex(objectIdRegex, 'Invalid department id'),
  }),
  query: z.object({}).optional(),
})

export const listWorkflowsSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({}).optional(),
  query: z.object({
    requestType: requestTypeEnum.optional(),
    departmentId: z.string().regex(objectIdRegex, 'Invalid department id').optional(),
    isActive: z.coerce.boolean().optional(),
  }),
})

export const createWorkflowSchema = z.object({
  body: z.object({
    requestType: requestTypeEnum,
    departmentId: z.string().regex(objectIdRegex, 'Invalid department id').nullable().optional(),
    steps: z.array(workflowStepSchema).min(1),
    isActive: z.boolean().optional().default(true),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
})

export const updateWorkflowSchema = z.object({
  body: z.object({
    requestType: requestTypeEnum.optional(),
    departmentId: z.string().regex(objectIdRegex, 'Invalid department id').nullable().optional(),
    steps: z.array(workflowStepSchema).min(1).optional(),
    isActive: z.boolean().optional(),
  }),
  params: z.object({
    id: z.string().regex(objectIdRegex, 'Invalid workflow id'),
  }),
  query: z.object({}).optional(),
})

export const workflowIdParamsSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({
    id: z.string().regex(objectIdRegex, 'Invalid workflow id'),
  }),
  query: z.object({}).optional(),
})
