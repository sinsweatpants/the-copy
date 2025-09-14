// filepath: backend/src/server.ts
import "./config/load-env.js";

import express from "express";
import cors from "cors";
import compression from "compression";
import rateLimit from "express-rate-limit";

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

import { Pool } from "pg";
import { env } from "./config/validator.js";

// __dirname في بيئة ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// إعدادات وسطيات أساسية
app.use(cors({ origin: env.FRONTEND_ORIGIN, credentials: true }));
app.use(compression());
app.use(express.json({ limit: "1mb" }));

// تحديد معدل الطلبات
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

// مسار الصحّة لازم يكون قبل تقديم الـ frontend
app.get("/health", (_req, res) =>
  res.json({ ok: true, env: env.NODE_ENV, port: env.PORT })
);

// اتصال PostgreSQL (Pool) لو مش معطّل
if (!env.DISABLE_DB) {
  if (env.DATABASE_URL) {
    const pg = new Pool({ connectionString: env.DATABASE_URL });
    pg.connect()
      .then(() =>
        console.log(JSON.stringify({ level: 30, msg: "Postgres connected" }))
      )
      .catch((err) =>
        console.error(
          JSON.stringify({ level: 50, msg: "[postgres] error", err })
        )
      );
  }
} else {
  console.log(JSON.stringify({ level: 30, msg: "Database disabled" }));
}

// تعطيل Redis لو مفيش URL أو معطّل
if (env.DISABLE_REDIS || !env.REDIS_URL) {
  console.log(JSON.stringify({ level: 30, msg: "Redis disabled" }));
}

// تقديم واجهة React إن وُجد build
const frontendDist = path.resolve(__dirname, "../../frontend/dist");
try {
  if (fs.existsSync(frontendDist)) {
    app.use(express.static(frontendDist));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(frontendDist, "index.html"));
    });
    console.log(
      JSON.stringify({
        level: 30,
        msg: `Serving frontend from: ${frontendDist}`,
      })
    );
  } else {
    console.warn(
      JSON.stringify({
        level: 40,
        msg: `Frontend dist not found at: ${frontendDist}`,
      })
    );
  }
} catch (err) {
  console.error(
    JSON.stringify({
      level: 50,
      msg: "Error checking for frontend dist directory",
      err,
    })
  );
}

// تشغيل الخادم على 0.0.0.0 (يسمع من أي مكان)
app.listen(env.PORT, "0.0.0.0", () => {
  console.log(
    JSON.stringify({
      level: 30,
      msg: `API on http://0.0.0.0:${env.PORT}`,
    })
  );
});
