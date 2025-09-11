import { z } from 'zod';

export const passwordSchema = z.string()
  .min(12, { message: 'Password must be at least 12 characters long' })
  .regex(/[A-Z]/, { message: 'Password must include an uppercase letter' })
  .regex(/[a-z]/, { message: 'Password must include a lowercase letter' })
  .regex(/[0-9]/, { message: 'Password must include a number' })
  .regex(/[^A-Za-z0-9]/, { message: 'Password must include a symbol' });
