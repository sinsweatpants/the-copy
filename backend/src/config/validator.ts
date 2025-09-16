import { z } from "zod";

// تعريف الـ schema الأساسي
const baseSchema = z.object({
  NODE_ENV: z.string().default("development"),
  PORT: z.string().default("4000"),

  // قواعد البيانات
  DATABASE_URL: z.string().optional(),
  DISABLE_DB: z.string().transform((v) => v === "true").optional(),

  // Redis
  REDIS_URL: z.string().optional(),
  DISABLE_REDIS: z.string().transform((v) => v === "true").optional(),

  // JWT
  JWT_SECRET: z.string().min(20, "JWT_SECRET لازم يبقى سترنج طويل ومعقد"),
  REFRESH_TOKEN_SECRET: z
    .string()
    .min(20, "REFRESH_TOKEN_SECRET لازم يبقى سترنج طويل ومعقد"),

  // Gemini
  GEMINI_API_KEY: z.string().min(10, "مفتاح GEMINI_API_KEY مفقود"),

  // Frontend
  FRONTEND_ORIGINS: z.string(),
  EXTERNAL_API_BASE: z.string().optional(),
});

// معالجة الـ flags
const parsed = baseSchema.safeParse(process.env);

if (!parsed.success) {
  console.error(
    JSON.stringify({ level: 50, errors: parsed.error.format(), msg: "Invalid environment variables" })
  );
  throw new Error("Invalid environment variables");
}

// منطق تعطيل قاعدة البيانات و Redis
const env = parsed.data;

if (!env.DISABLE_DB && !env.DATABASE_URL) {
  throw new Error("DATABASE_URL مفقود ولم يتم تعطيل قاعدة البيانات");
}

if (!env.DISABLE_REDIS && !env.REDIS_URL) {
  throw new Error("REDIS_URL مفقود ولم يتم تعطيل Redis");
}

export { env };
