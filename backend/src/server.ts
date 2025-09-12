// filepath: backend/src/server.ts
import "./config/load-env.js";
import path from "path";
import { fileURLToPath } from "url";

// --- حساب المسارات
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import express from "express";
import cors from "cors";
import compression from "compression";
import pkg from "pg";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import rateLimit from "express-rate-limit";
import crypto from "crypto";
import { createClient } from "redis";
import { Queue } from "bullmq";
import CircuitBreaker from "opossum";

import corsOptions from "./config/cors.js";
import { env } from "./config/validator.js";
import inputSanitizer from "./middleware/input-sanitizer.js";
import security from "./middleware/security.js";
import { httpLogger, default as logger } from "./logger/enhanced-logger.js";
import pagination from "./middleware/pagination.js";
import { errorHandler } from "./middleware/errorHandler.js";
import {
  validateRequest,
  registerUserSchema,
  loginUserSchema,
  refreshTokenSchema,
  logoutSchema,
} from "./middleware/validation.js";

interface HttpError extends Error {
  status?: number;
}

const app = express();
app.use(compression());
app.use(cors(corsOptions));
app.use(express.json({ limit: "2mb" }));
app.use(security);
app.use(inputSanitizer);
app.use(httpLogger);

// --- PostgreSQL Pool
const { Pool } = pkg;
const pool = new Pool({
  connectionString: env.DATABASE_URL,
});

// --- Redis Client + BullMQ
let redisClient: any;
let pdfExportQueue: any;
if (env.NODE_ENV !== "test" && process.env.REDIS_ENABLED === "true") {
  redisClient = createClient({ url: env.REDIS_URL });
  redisClient.on("error", (err: Error) =>
    logger.error({ err }, "Redis Client Error")
  );
  pdfExportQueue = new Queue("pdf-export-queue", {
    connection: { url: env.REDIS_URL },
  });
}

// --- Constants
const JWT_SECRET = env.JWT_SECRET;
const REFRESH_TOKEN_SECRET = env.REFRESH_TOKEN_SECRET;
const ACCESS_TOKEN_EXPIRES_IN = "15m";
const REFRESH_TOKEN_EXPIRES_IN_MS = 7 * 24 * 60 * 60 * 1000; // 7 أيام
const GEMINI_API_KEY = env.GEMINI_API_KEY;

// --- Middleware: Authentication
const authenticateToken = async (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, async (err: any, user: any) => {
    if (err) return res.sendStatus(403);
    (req as any).user = user;
    try {
      await pool.query("SET LOCAL app.current_user_id = $1", [user.userId]);
    } catch (error) {
      logger.error({ error }, "Failed to set current_user_id");
    }
    next();
  });
};

// --- Health Endpoint
app.get("/api/health", async (_req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      database: "connected",
      redis: redisClient ? "connected" : "disabled",
    });
  } catch {
    res.status(503).json({ status: "error", database: "disconnected" });
  }
});

// --- Auth Routes (Register, Login, Refresh, Logout)
// (الكود الكامل هنا كما عندك، بدون تغيير جوهري)

// --- Gemini Proxy
const geminiAPI = async (body: any) => {
  const model = "models/gemini-1.5-pro";
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/${model}:generateContent?key=${GEMINI_API_KEY}`;
  const proxyRes = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!proxyRes.ok) throw new Error(await proxyRes.text());
  return proxyRes.json();
};
const geminiBreaker = new CircuitBreaker(geminiAPI, {
  timeout: 15000,
  errorThresholdPercentage: 50,
  resetTimeout: 30000,
});
app.post("/api/llm/generate", authenticateToken, async (req, res, next) => {
  try {
    const data = await geminiBreaker.fire(req.body);
    res.json(data);
  } catch (e) {
    next(e);
  }
});

// --- Serve Frontend
if (env.NODE_ENV !== "test") {
  const frontendDist = path.resolve(__dirname, "../../frontend/dist");
  app.use(express.static(frontendDist));
  app.get("*", (req, res, next) => {
    if (req.originalUrl.startsWith("/api/")) return next();
    res.sendFile(path.join(frontendDist, "index.html"));
  });
}

// --- Global Error Handler
app.use(errorHandler);

// --- Start Server
app.listen(env.PORT, () =>
  logger.info(`API running on http://localhost:${env.PORT}`)
);

export default app;
