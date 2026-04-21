import { z } from 'zod';
import { UserRole, Plan } from '@prisma/client';

// Schema for user ID in parameters
export const userIdParamSchema = z.object({
  params: z.object({
    id: z.string().uuid({ message: 'Invalid user ID format' }),
  }),
});

// Schema for updating user details
export const updateUserSchema = z.object({
  params: z.object({
    id: z.string().uuid({ message: 'Invalid user ID format' }),
  }),
  body: z.object({
    email: z.string().email({ message: 'Invalid email format' }).optional(),
    fullName: z.string().min(2, { message: 'Full name must be at least 2 characters' }).optional(),
    companyName: z.string().optional(),
    plan: z.nativeEnum(Plan, { message: 'Invalid plan type' }).optional(),
    role: z.nativeEnum(UserRole, { message: 'Invalid user role' }).optional(),
    settings: z.object({
      twoFactorEnabled: z.boolean().optional(),
      emailNotificationsEnabled: z.boolean().optional(),
      pushNotificationsEnabled: z.boolean().optional(),
    }).optional(),
  }).partial(), // Allow partial updates
});

// Schema for deleting a user (uses userIdParamSchema)
export const deleteUserSchema = userIdParamSchema;

// Schema for getting a single user (uses userIdParamSchema)
export const getUserSchema = userIdParamSchema;
