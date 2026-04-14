import { z } from 'zod'

const emailSchema = z.string().trim().email().transform((value) => value.toLowerCase())

export const registerSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2),
    email: emailSchema,
    password: z.string().min(8).max(64),
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