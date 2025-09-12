// filepath: backend/src/config/validator.ts
import { z } from "zod";

export const env = z.object({
  NODE_ENV: z.enum(["development","test","production"]).default("development"),
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().min(1, "DATABASE_URL مفقود"),
  JWT_SECRET: z.string().min(1, "JWT_SECRET مفقود"),
  REFRESH_TOKEN_SECRET: z.string().min(1, "REFRESH_TOKEN_SECRET مفقود"),
  GEMINI_API_KEY: z.string().min(1, "GEMINI_API_KEY مفقود"),
  REDIS_URL: z.string().min(1, "REDIS_URL مفقود"),
  FRONTEND_ORIGIN: z.string().min(1, "FRONTEND_ORIGIN مفقود"),
}).parse(process.env);

export type Env = z.infer<typeof env>;
