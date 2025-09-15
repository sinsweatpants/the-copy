import cors from "cors";
import type { RequestHandler } from "express";
import { env } from "./validator.js";

const allowed = new Set(env.FRONTEND_ORIGINS.split(",").map((o) => o.trim()));

const baseOptions = {
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  exposedHeaders: ["Content-Length"],
  credentials: true,
  maxAge: 600,
  optionsSuccessStatus: 204,
};

const corsMiddleware: RequestHandler = (req, res, next) => {
  const origin = req.header("Origin");
  if (!origin || allowed.has(origin)) {
    return cors({ ...baseOptions, origin })(req, res, next);
  }
  res.status(403).send("Not allowed by CORS");
};

export default corsMiddleware;
