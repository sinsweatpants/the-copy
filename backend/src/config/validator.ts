import { z } from 'zod';
import logger from '../logger/enhanced-logger.js';

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(32),
  REFRESH_TOKEN_SECRET: z.string().min(32),
  GEMINI_API_KEY: z.string().min(1),
  REDIS_URL: z.string().min(1),
  FRONTEND_ORIGIN: z.string().url(),
  RATE_LIMIT_PER_MIN: z.string().optional(),
  HEAVY_LIMIT: z.string().optional(),
});

export default function validateEnv() {
  if (process.env.NODE_ENV === 'test') return;
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    logger.error({ errors: parsed.error.flatten().fieldErrors }, 'Invalid environment variables');
    throw new Error('Invalid environment variables');
  }
}
