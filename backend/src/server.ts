import "./config/load-env.js";

import express from "express";
import compression from "compression";
import rateLimit from "express-rate-limit";

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

import { Pool } from "pg";
import { env } from "./config/validator.js";
import corsMiddleware from "./config/cors.js";

// __dirname في بيئة ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// إعدادات وسطيات أساسية
app.use(corsMiddleware);
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

// اتصال PostgreSQL (Pool) - يتفعل فقط لو مش متعطل
if (!env.DISABLE_DB) {
  const pg = new Pool({ connectionString: env.DATABASE_URL });
  pg.connect().catch((err) =>
    console.error(JSON.stringify({ level: 50, msg: "[postgres] error", err }))
  );
} else {
  console.log(JSON.stringify({ level: 30, msg: "Postgres disabled" }));
}

// مسار صحّة بسيط
app.get("/health", (_req, res) =>
  res.json({ ok: true, env: env.NODE_ENV, port: env.PORT })
);

// تشغيل الخادم مع تحويل PORT لرقم
const port = Number(env.PORT) || 5000;
app.listen(port, "0.0.0.0", () => {
  console.log(
    JSON.stringify({
      level: 30,
      msg: `API on http://0.0.0.0:${port}`,
    })
  );
});
