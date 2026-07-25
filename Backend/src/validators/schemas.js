const { z } = require('zod');
const { LEAD_STATUSES } = require('../constants');

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const publicLeadSchema = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email().max(255),
  phone: z.string().max(40).optional().default(''),
  company: z.string().max(120).optional().default(''),
  source: z.string().max(80).optional().default('website'),
});

const createLeadSchema = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email().max(255),
  phone: z.string().max(40).optional().default(''),
  company: z.string().max(120).optional().default(''),
  source: z.string().max(80).optional().default('manual'),
  assignedTo: z.string().min(1).optional(),
});

const createUserSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email().max(255),
  password: z.string().min(8).max(128),
  role: z.enum(['admin', 'member']).default('member'),
});

const updateUserSchema = z
  .object({
    name: z.string().min(1).max(100).optional(),
    email: z.string().email().max(255).optional(),
    password: z.string().min(8).max(128).optional(),
    role: z.enum(['admin', 'member']).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field is required',
  });

const updateProfileSchema = z
  .object({
    name: z.string().min(1).max(100).optional(),
    email: z.string().email().max(255).optional(),
    password: z.string().min(8).max(128).optional(),
    currentPassword: z.string().min(1).optional(),
  })
  .refine((data) => data.name !== undefined || data.email !== undefined || data.password !== undefined, {
    message: 'At least one profile field is required',
  })
  .refine((data) => !data.password || Boolean(data.currentPassword), {
    message: 'Current password is required to set a new password',
    path: ['currentPassword'],
  });

const updateLeadSchema = z
  .object({
    name: z.string().min(1).max(120).optional(),
    email: z.string().email().max(255).optional(),
    phone: z.string().max(40).optional(),
    company: z.string().max(120).optional(),
    source: z.string().max(80).optional(),
    status: z.enum(LEAD_STATUSES).optional(),
    assignedTo: z.union([z.string().min(1), z.null()]).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field is required',
  });

const noteSchema = z.object({
  body: z.string().min(1).max(5000),
});

const listLeadsQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  status: z.enum(LEAD_STATUSES).optional(),
  assignedTo: z.string().optional(),
  q: z.string().optional(),
});

module.exports = {
  loginSchema,
  publicLeadSchema,
  createLeadSchema,
  updateLeadSchema,
  noteSchema,
  listLeadsQuerySchema,
  createUserSchema,
  updateUserSchema,
  updateProfileSchema,
};
