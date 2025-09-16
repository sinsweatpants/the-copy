import "./config/load-env.js";

import express from "express";
import compression from "compression";

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

import { Pool } from "pg";
import { env } from "./config/validator.js";
import corsMiddleware from "./config/cors.js";
import makeLimiter from "./middleware/rate-limit.js";
import securityMiddleware from "./middleware/security.js";
import { httpDuration, metricsHandler } from "./metrics/metrics.js";

// __dirname في بيئة ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

async function configureApp() {
  app.use(corsMiddleware);
  app.use(securityMiddleware);
  app.use(compression());
  app.use(express.json({ limit: "1mb" }));

  app.use((req, res, next) => {
    const end = httpDuration.startTimer();
    res.on("finish", () => {
      const route =
        req.route?.path ??
        req.baseUrl ??
        req.path ??
        req.originalUrl ??
        req.url;
      end({
        method: req.method,
        route,
        status_code: res.statusCode,
      });
    });
    next();
  });

  app.get("/metrics", metricsHandler);

  const limiter = await makeLimiter();
  app.use(limiter);

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

  if (!env.DISABLE_DB) {
    const pg = new Pool({ connectionString: env.DATABASE_URL });
    pg.connect().catch((err) =>
      console.error(JSON.stringify({ level: 50, msg: "[postgres] error", err }))
    );
  } else {
    console.log(JSON.stringify({ level: 30, msg: "Postgres disabled" }));
  }

  app.get("/health", (_req, res) =>
    res.json({ ok: true, env: env.NODE_ENV, port: env.PORT })
  );
}

export default app;

configureApp()
  .then(() => {
    const port = Number(env.PORT) || 5000;
    app.listen(port, "0.0.0.0", () => {
      console.log(
        JSON.stringify({
          level: 30,
          msg: `API on http://0.0.0.0:${port}`,
        })
      );
    });
  })
  .catch((error) => {
    console.error(
      JSON.stringify({ level: 50, msg: "Failed to start server", error })
    );
    process.exit(1);
  });
