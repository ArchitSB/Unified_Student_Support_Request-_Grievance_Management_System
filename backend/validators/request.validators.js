import { z } from 'zod'

const objectIdRegex = /^[a-f\d]{24}$/i

const requestTypeEnum = z.enum(['ACADEMIC', 'FINANCE', 'HOSTEL', 'INFRASTRUCTURE', 'OTHER'])
const requestPriorityEnum = z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT'])
const requestStatusEnum = z.enum(['PENDING', 'IN_PROGRESS', 'ESCALATED', 'RESOLVED', 'REJECTED', 'REOPENED'])
const requestSortEnum = z.enum(['newest', 'oldest', 'highest_priority', 'sla_risk', 'unresolved'])
const commentVisibilityEnum = z.enum(['PUBLIC', 'INTERNAL_ONLY'])

export const createRequestSchema = z.object({
  body: z.object({
    title: z.string().trim().min(3).max(150),
    description: z.string().trim().min(10).max(5000),
    type: requestTypeEnum.default('OTHER'),
    category: z.string().trim().min(2).max(120).optional(),
    subcategory: z.string().trim().max(120).optional(),
    priority: requestPriorityEnum.default('MEDIUM'),
    departmentId: z.string().regex(objectIdRegex, 'Invalid department id').optional(),
    taggedTeacherId: z.string().regex(objectIdRegex, 'Invalid tagged teacher id').optional(),
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
    category: z.string().trim().min(2).max(120).optional(),
    subcategory: z.string().trim().max(120).optional(),
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
    sortBy: requestSortEnum.optional(),
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
    departmentId: z.string().regex(objectIdRegex, 'Invalid department id').optional(),
    stage: z.coerce.number().int().positive().optional(),
    search: z.string().trim().optional(),
    sortBy: requestSortEnum.optional(),
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

export const requestActionSchema = z.object({
  body: z.object({
    action: z.enum(['APPROVE', 'REJECT', 'FORWARD']),
    remark: z.string().trim().max(2000).optional().default(''),
  }),
  params: z.object({
    id: z.string().regex(objectIdRegex, 'Invalid request id'),
  }),
  query: z.object({}).optional(),
})

export const createCommentSchema = z.object({
  body: z.object({
    message: z.string().trim().min(1).max(2000),
    visibility: commentVisibilityEnum.default('PUBLIC'),
    parentCommentId: z.string().regex(objectIdRegex, 'Invalid parent comment id').nullable().optional(),
  }),
  params: z.object({
    id: z.string().regex(objectIdRegex, 'Invalid request id'),
  }),
  query: z.object({}).optional(),
})

export const workspaceParamsSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({
    id: z.string().regex(objectIdRegex, 'Invalid request id'),
  }),
  query: z.object({}).optional(),
})

export const reopenRequestSchema = z.object({
  body: z.object({
    message: z.string().trim().min(3).max(1000),
  }),
  params: z.object({
    id: z.string().regex(objectIdRegex, 'Invalid request id'),
  }),
  query: z.object({}).optional(),
})

export const feedbackSchema = z.object({
  body: z.object({
    rating: z.coerce.number().int().min(1).max(5),
    review: z.string().trim().max(1000).optional().default(''),
  }),
  params: z.object({
    id: z.string().regex(objectIdRegex, 'Invalid request id'),
  }),
  query: z.object({}).optional(),
})

export const listNotificationsSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({}).optional(),
  query: z.object({
    limit: z.coerce.number().int().positive().max(50).default(12),
  }),
})

export const notificationIdParamsSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({
    id: z.string().regex(objectIdRegex, 'Invalid notification id'),
  }),
  query: z.object({}).optional(),
})
