import { z } from 'zod'

const objectIdRegex = /^[a-f\d]{24}$/i

const requestTypeEnum = z.enum(['ACADEMIC', 'FINANCE', 'HOSTEL', 'INFRASTRUCTURE', 'OTHER'])
const requestPriorityEnum = z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT'])
const requestStatusEnum = z.enum(['PENDING', 'IN_PROGRESS', 'RESOLVED', 'REJECTED'])

export const createRequestSchema = z.object({
  body: z.object({
    title: z.string().trim().min(3).max(150),
    description: z.string().trim().min(10).max(5000),
    type: requestTypeEnum.default('OTHER'),
    priority: requestPriorityEnum.default('MEDIUM'),
    attachments: z.array(z.string().url()).optional().default([]),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
})

export const updateOwnRequestSchema = z.object({
  body: z.object({
    title: z.string().trim().min(3).max(150).optional(),
    description: z.string().trim().min(10).max(5000).optional(),
    type: requestTypeEnum.optional(),
    priority: requestPriorityEnum.optional(),
  }),
  params: z.object({
    id: z.string().regex(objectIdRegex, 'Invalid request id'),
  }),
  query: z.object({}).optional(),
})

export const listMyRequestsSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({}).optional(),
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(10),
    status: requestStatusEnum.optional(),
    type: requestTypeEnum.optional(),
    search: z.string().trim().optional(),
  }),
})

export const getRequestByIdSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({
    id: z.string().regex(objectIdRegex, 'Invalid request id'),
  }),
  query: z.object({}).optional(),
})

export const adminListRequestsSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({}).optional(),
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
    status: requestStatusEnum.optional(),
    type: requestTypeEnum.optional(),
    priority: requestPriorityEnum.optional(),
    assignee: z.string().regex(objectIdRegex, 'Invalid assignee id').optional(),
    search: z.string().trim().optional(),
  }),
})

export const updateStatusSchema = z.object({
  body: z.object({
    status: requestStatusEnum,
  }),
  params: z.object({
    id: z.string().regex(objectIdRegex, 'Invalid request id'),
  }),
  query: z.object({}).optional(),
})

export const assignRequestSchema = z.object({
  body: z.object({
    assignedTo: z.string().regex(objectIdRegex, 'Invalid assignee id'),
  }),
  params: z.object({
    id: z.string().regex(objectIdRegex, 'Invalid request id'),
  }),
  query: z.object({}).optional(),
})