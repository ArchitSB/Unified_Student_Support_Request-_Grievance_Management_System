import { z } from 'zod'

const objectIdRegex = /^[a-f\d]{24}$/i

const requestStatusEnum = z.enum(['PENDING', 'IN_PROGRESS', 'RESOLVED', 'REJECTED'])
const userRoleEnum = z.enum(['STUDENT', 'TEACHER', 'HOD', 'DEPARTMENT_ADMIN', 'SUPER_ADMIN', 'ADMIN'])

export const listSystemUsersSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({}).optional(),
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
    role: userRoleEnum.optional(),
    isActive: z.coerce.boolean().optional(),
    search: z.string().trim().optional(),
  }),
})

export const updateUserRoleSchema = z.object({
  body: z.object({
    role: userRoleEnum,
  }),
  params: z.object({
    id: z.string().regex(objectIdRegex, 'Invalid user id'),
  }),
  query: z.object({}).optional(),
})

export const updateUserActiveSchema = z.object({
  body: z.object({
    isActive: z.boolean(),
  }),
  params: z.object({
    id: z.string().regex(objectIdRegex, 'Invalid user id'),
  }),
  query: z.object({}).optional(),
})

export const listEscalationsSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({}).optional(),
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
    thresholdHours: z.coerce.number().int().positive().max(24 * 30).default(72),
  }),
})

export const requestIdParamsSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({
    id: z.string().regex(objectIdRegex, 'Invalid request id'),
  }),
  query: z.object({}).optional(),
})

export const manualEscalateSchema = z.object({
  body: z.object({
    remark: z.string().trim().max(2000).optional().default(''),
  }),
  params: z.object({
    id: z.string().regex(objectIdRegex, 'Invalid request id'),
  }),
  query: z.object({}).optional(),
})

export const overrideRequestSchema = z.object({
  body: z.object({
    status: requestStatusEnum,
    remark: z.string().trim().max(2000).optional().default(''),
  }),
  params: z.object({
    id: z.string().regex(objectIdRegex, 'Invalid request id'),
  }),
  query: z.object({}).optional(),
})

export const reassignRequestSchema = z.object({
  body: z.object({
    assignedTo: z.string().regex(objectIdRegex, 'Invalid assignee id'),
  }),
  params: z.object({
    id: z.string().regex(objectIdRegex, 'Invalid request id'),
  }),
  query: z.object({}).optional(),
})
