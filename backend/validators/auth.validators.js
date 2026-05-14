import { z } from 'zod'

const emailSchema = z.string().trim().email().transform((value) => value.toLowerCase())
const adminDesignationEnum = z.enum(['Professor', 'Teacher', 'Class Coordinator', 'Other'])
const objectIdRegex = /^[a-f\d]{24}$/i
const passwordSchema = z
  .string()
  .min(8)
  .max(64)
  .regex(/[a-z]/, 'Password must include at least one lowercase letter')
  .regex(/[A-Z]/, 'Password must include at least one uppercase letter')
  .regex(/\d/, 'Password must include at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must include at least one special character')

const departmentFieldsSchema = z
  .object({
    department: z.string().trim().min(2).max(120).optional(),
    departmentId: z.string().regex(objectIdRegex, 'Invalid department id').optional(),
  })
  .refine((value) => Boolean(value.department || value.departmentId), {
    message: 'Department selection is required',
    path: ['departmentId'],
  })

export const registerSchema = z.object({
  body: departmentFieldsSchema.extend({
    name: z.string().trim().min(2).max(120),
    email: emailSchema,
    password: passwordSchema,
    universityId: z.string().trim().min(3).max(40).optional(),
    batch: z.string().trim().min(3).max(30).optional(),
    program: z.string().trim().min(2).max(120).optional(),
    semester: z.coerce.number().int().min(1).max(20).optional(),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
})

export const loginSchema = z.object({
  body: z.object({
    email: emailSchema,
    password: z.string().min(1),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
})

export const adminRegisterSchema = z.object({
  body: departmentFieldsSchema.extend({
    name: z.string().trim().min(2).max(120),
    email: emailSchema,
    password: passwordSchema,
    designation: adminDesignationEnum,
    adminSignupKey: z.string().min(1),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
})

export const adminLoginSchema = z.object({
  body: z.object({
    email: emailSchema,
    password: z.string().min(1),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
})

export const refreshSessionSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(1),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
})

export const logoutSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(1),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
})
