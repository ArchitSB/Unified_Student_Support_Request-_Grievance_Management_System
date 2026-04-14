import { z } from 'zod'

const emailSchema = z.string().trim().email().transform((value) => value.toLowerCase())

export const registerSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2),
    email: emailSchema,
    password: z.string().min(8).max(64),
    department: z.string().trim().min(2).max(120).optional(),
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
  body: z.object({
    name: z.string().trim().min(2),
    email: emailSchema,
    password: z.string().min(8).max(64),
    department: z.string().trim().min(2).max(120),
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