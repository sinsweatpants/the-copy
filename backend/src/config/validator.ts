// filepath: backend/src/config/validator.ts
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(4000),

  DISABLE_DB: z.string().optional(),
  DISABLE_REDIS: z.string().optional(),

  DATABASE_URL: z.string().optional(),
  REDIS_URL: z.string().optional(),

  JWT_SECRET: z.string().min(1, "JWT_SECRET مفقود"),
  REFRESH_TOKEN_SECRET: z.string().min(1, "REFRESH_TOKEN_SECRET مفقود"),
  GEMINI_API_KEY: z.string().min(1, "GEMINI_API_KEY مفقود"),

  FRONTEND_ORIGIN: z.string().min(1, "FRONTEND_ORIGIN مفقود"),
});

export const env = (() => {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const errors = parsed.error.flatten().fieldErrors;
    console.error(
      JSON.stringify({ level: 50, errors, msg: "Invalid environment variables" })
    );
    throw new Error("Invalid environment variables");
  }

  const data = parsed.data;

  // تحقق منطقي: لازم DATABASE_URL لو DISABLE_DB مش موجود
  if (!data.DISABLE_DB && !data.DATABASE_URL) {
    throw new Error("DATABASE_URL مفقود (ولم يتم تعطيل قاعدة البيانات)");
  }

  // تحقق منطقي: لازم REDIS_URL لو DISABLE_REDIS مش موجود
  if (!data.DISABLE_REDIS && !data.REDIS_URL) {
    throw new Error("REDIS_URL مفقود (ولم يتم تعطيل Redis)");
  }

  return data;
})();
export type Env = z.infer<typeof envSchema>;
