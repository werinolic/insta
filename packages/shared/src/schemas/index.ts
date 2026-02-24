import { z } from 'zod';

const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/^(?=.*[a-zA-Z])(?=.*[0-9])/, 'Password must contain at least one letter and one number');

export const registerSchema = z.object({
  email: z.email(),
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username must be at most 30 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username may only contain letters, numbers and underscores'),
  password: passwordSchema,
  fullName: z.string().min(1).max(100).optional(),
});

export const loginSchema = z.object({
  emailOrUsername: z.string().min(1),
  password: z.string().min(1),
});

export const updateProfileSchema = z.object({
  fullName: z.string().max(100).optional(),
  bio: z.string().max(150).optional(),
  website: z.url().or(z.literal('')).optional(),
  avatarUrl: z.url().optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: passwordSchema,
});
