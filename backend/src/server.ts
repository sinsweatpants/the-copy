import express from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import logger from "./logger.js";
import pkg from 'pg';
const { Pool } = pkg;
import puppeteer from "puppeteer";
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import rateLimit from 'express-rate-limit';
import crypto from 'crypto';

import { errorHandler } from "./middleware/errorHandler.js";
import { validateRequest, registerUserSchema, loginUserSchema } from "./middleware/validation.js";

const app = express();
if (process.env.NODE_ENV === 'production') {
  app.use(cors({
    origin: process.env.CORS_ORIGIN,
  }));
} else {
  app.use(cors());
}
app.use(express.json({ limit: "2mb" }));
app.use(pinoHttp({ logger }));

// Rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests from this IP, please try again after 15 minutes',
});
// @ts-ignore
app.use('/api', apiLimiter);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 requests per windowMs on auth routes
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many authentication requests from this IP, please try again after 15 minutes',
});
// @ts-ignore
app.use('/api/auth', authLimiter);

import { createClient } from 'redis';

// PG Pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Redis Client
const redisClient = createClient({
  url: process.env.REDIS_URL,
});

redisClient.on('error', (err) => logger.error('Redis Client Error', err));

app.post('/api/auth/refresh', async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.sendStatus(401);
    }

    const result = await pool.query('SELECT * FROM refresh_tokens WHERE token = $1', [refreshToken]);
    const storedToken = result.rows[0];

    if (!storedToken) {
      return res.sendStatus(403);
    }

    if (new Date(storedToken.expires_at) < new Date()) {
      await pool.query('DELETE FROM refresh_tokens WHERE id = $1', [storedToken.id]);
      return res.status(403).json({ error: 'Refresh token expired' });
    }

    const userResult = await pool.query('SELECT * FROM users WHERE id = $1', [storedToken.user_id]);
    const user = userResult.rows[0];

    if (!user) {
      return res.sendStatus(403);
    }

    if (!JWT_SECRET) throw new Error("JWT_SECRET is required for signing");
    const accessToken = jwt.sign({ userId: user.id, email: user.email, username: user.username }, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRES_IN });

    res.json({ accessToken });

  } catch (error) {
    next(error);
  }
});

app.post('/api/auth/logout', async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (refreshToken) {
      await pool.query('DELETE FROM refresh_tokens WHERE token = $1', [refreshToken]);
    }
    res.sendStatus(204);
  } catch (error) {
    next(error);
  }
});


const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) throw new Error("JWT_SECRET is required");

// TODO: Move to .env
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET ?? 'a-very-secret-refresh-key';
const ACCESS_TOKEN_EXPIRES_IN = '15m';
const REFRESH_TOKEN_EXPIRES_IN_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is required");

// --- Auth Middleware
const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.sendStatus(401);
  }

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};


// --- Helpers
function ok(res: any, data: unknown) {
  res.json({ ok: true, data });
}
function notFound(res: any) {
  res.status(404).json({ ok: false, error: "Not found" });
}

// --- Health Check ---
app.get('/health', async (req, res) => {
  try {
    // Check database connection
    await pool.query('SELECT 1');
    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV,
      database: 'connected',
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      database: 'disconnected',
      error: (error as Error).message,
    });
  }
});

// --- API

// --- Auth Endpoints ---

// Register new user
app.post('/api/auth/register', validateRequest(registerUserSchema), async (req, res, next) => {
  try {
    const { email, username, password } = req.body;

    // Check if user exists
    const existingUserResult = await pool.query('SELECT id FROM users WHERE email = $1 OR username = $2', [email, username]);
    if (existingUserResult.rows.length > 0) {
      return res.status(409).json({ error: 'User already exists' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Insert user
    const newUserResult = await pool.query(
      'INSERT INTO users (email, username, password_hash) VALUES ($1, $2, $3) RETURNING id, email, username',
      [email, username, passwordHash]
    );
    const user = newUserResult.rows[0];

    // Generate JWT
    if (!JWT_SECRET) throw new Error("JWT_SECRET is required for signing");
    const token = jwt.sign({ userId: user.id, email: user.email, username: user.username }, JWT_SECRET, { expiresIn: '7d' });

    res.json({ token, user });
  } catch (error) {
    next(error);
  }
});

// Login
app.post('/api/auth/login', validateRequest(loginUserSchema), async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const passwordMatch = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate tokens
    if (!JWT_SECRET) throw new Error("JWT_SECRET is required for signing");
    const accessToken = jwt.sign({ userId: user.id, email: user.email, username: user.username }, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRES_IN });
    const refreshToken = crypto.randomBytes(64).toString('hex');
    const refreshTokenExpiry = new Date(Date.now() + REFRESH_TOKEN_EXPIRES_IN_MS);

    // Store refresh token
    await pool.query(
      'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
      [user.id, refreshToken, refreshTokenExpiry]
    );

    res.json({
      accessToken,
      refreshToken,
      user: { id: user.id, email: user.email, username: user.username }
    });
  } catch (error) {
    next(error);
  }
});


// --- Gemini Proxy ---
app.post('/api/gemini-proxy', authenticateToken, async (req, res, next) => {
  try {
    const model = "models/gemini-1.5-pro";
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/${model}:generateContent?key=${GEMINI_API_KEY}`;

    const proxyRes = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req.body)
    });

    if (!proxyRes.ok) {
      const errorText = await proxyRes.text();
      logger.error({ error: "Gemini API error", details: errorText });
      return res.status(proxyRes.status).json({ error: "Gemini API error", details: errorText });
    }

    const data = await proxyRes.json();
    res.json(data);

  } catch (error) {
    next(error);
  }
});


// Apply auth middleware
app.use('/api/screenplays', authenticateToken);
app.use('/api/users/:userId', authenticateToken);


// Screenplay metadata
app.get("/api/screenplays/:id", async (req, res, next) => {
  try {
    const result = await pool.query("SELECT * FROM screenplays WHERE id=$1", [req.params.id]);
    const row = result.rows[0];
    if (!row) return notFound(res);
    ok(res, row);
  } catch(e) { next(e); }
});

// Screenplay content
app.get("/api/screenplays/:id/content", async (req, res, next) => {
  const cacheKey = `screenplay:content:${req.params.id}`;
  try {
    const cachedData = await redisClient.get(cacheKey);
    if (cachedData) {
      return ok(res, JSON.parse(cachedData));
    }

    const result = await pool.query("SELECT html, updated_at FROM screenplay_content WHERE screenplay_id=$1", [req.params.id]);
    const data = result.rows[0] ?? { html: "", updatedAt: null };

    // Cache for 1 hour
    await redisClient.set(cacheKey, JSON.stringify(data), { EX: 3600 });

    ok(res, data);
  } catch(e) { next(e); }
});

app.put("/api/screenplays/:id/content", async (req, res, next) => {
  const cacheKey = `screenplay:content:${req.params.id}`;
  try {
    const { html } = req.body ?? { html: "" };
    const now = new Date();
    const result = await pool.query(`
      INSERT INTO screenplay_content (screenplay_id, html, updated_at)
      VALUES ($1, $2, $3)
      ON CONFLICT(screenplay_id) DO UPDATE SET html=excluded.html, updated_at=excluded.updated_at
      RETURNING updated_at
    `, [req.params.id, html ?? "", now]);

    // Invalidate cache
    await redisClient.del(cacheKey);

    ok(res, { updatedAt: result.rows[0].updated_at });
  } catch(e) { next(e); }
});

// Characters
app.get("/api/screenplays/:id/characters", async (req, res, next) => {
  const cacheKey = `screenplay:characters:${req.params.id}`;
  try {
    const cachedData = await redisClient.get(cacheKey);
    if (cachedData) {
      return ok(res, JSON.parse(cachedData));
    }

    const result = await pool.query("SELECT * FROM characters WHERE screenplay_id=$1", [req.params.id]);
    const data = result.rows;

    // Cache for 1 hour
    await redisClient.set(cacheKey, JSON.stringify(data), { EX: 3600 });

    ok(res, data);
  } catch(e) { next(e); }
});

app.post("/api/screenplays/:id/characters", async (req, res, next) => {
  const cacheKey = `screenplay:characters:${req.params.id}`;
  try {
    const { name, role } = req.body ?? {};
    const result = await pool.query(
      `INSERT INTO characters (screenplay_id, name, role) VALUES ($1, $2, $3) RETURNING id, name, role`,
      [req.params.id, name ?? "بدون اسم", role ?? ""]
    );

    // Invalidate cache
    await redisClient.del(cacheKey);

    ok(res, result.rows[0]);
  } catch(e) { next(e); }
});

// Dialogues
app.get("/api/characters/:id/dialogues", async (req, res, next) => {
  try {
    const result = await pool.query("SELECT * FROM dialogues WHERE character_id=$1", [req.params.id]);
    ok(res, result.rows);
  } catch(e) { next(e); }
});

app.put("/api/dialogues/:dialogueId", async (req, res, next) => {
  try {
    const { text } = req.body ?? {};
    await pool.query("UPDATE dialogues SET text=$1 WHERE id=$2", [text ?? "", req.params.dialogueId]);
    ok(res, { id: req.params.dialogueId, text });
  } catch(e) { next(e); }
});

// Sprints
app.get("/api/users/:userId/sprints/active", async (req, res, next) => {
  try {
    const result = await pool.query("SELECT * FROM sprints WHERE user_id=$1 AND is_active=true ORDER BY started_at DESC LIMIT 1", [req.params.userId]);
    ok(res, result.rows[0] ?? null);
  } catch(e) { next(e); }
});

app.post("/api/users/:userId/sprints", async (req, res, next) => {
  try {
    const result = await pool.query(
      `INSERT INTO sprints (user_id, is_active) VALUES ($1, true) RETURNING id, started_at, is_active`,
      [req.params.userId]
    );
    ok(res, result.rows[0]);
  } catch(e) { next(e); }
});

app.put("/api/users/:userId/sprints/:sprintId", async (req, res, next) => {
  try {
    const { action, durationSec } = req.body ?? {};
    if (action === "end") {
      await pool.query(
        `UPDATE sprints SET is_active=false, ended_at=current_timestamp, duration_sec=$1 WHERE id=$2 AND user_id=$3`,
        [durationSec ?? null, req.params.sprintId, req.params.userId]
      );
    } else if (action === "pause") {
      await pool.query(
        `UPDATE sprints SET is_active=false WHERE id=$1 AND user_id=$2`,
        [req.params.sprintId, req.params.userId]
      );
    }
    ok(res, { id: req.params.sprintId, action });
  } catch(e) { next(e); }
});

// Stash
app.get("/api/users/:userId/stash", async (req, res, next) => {
  try {
    const result = await pool.query("SELECT * FROM stash WHERE user_id=$1 ORDER BY created_at DESC", [req.params.userId]);
    ok(res, result.rows);
  } catch(e) { next(e); }
});

app.post("/api/users/:userId/stash", async (req, res, next) => {
  try {
    const { text, type } = req.body ?? {};
    const wordCount = (text ?? "").trim().split(/\s+/).filter(Boolean).length;
    const result = await pool.query(
      `INSERT INTO stash (user_id, text, type, word_count) VALUES ($1, $2, $3, $4) RETURNING id`,
      [req.params.userId, text ?? "", type ?? "snippet", wordCount]
    );
    ok(res, { id: result.rows[0].id });
  } catch(e) { next(e); }
});

app.delete("/api/users/:userId/stash/:itemId", async (req, res, next) => {
  try {
    await pool.query("DELETE FROM stash WHERE id=$1 AND user_id=$2", [req.params.itemId, req.params.userId]);
    ok(res, true);
  } catch(e) { next(e); }
});

// Export PDF
app.post("/api/export/pdf", async (req, res) => {
  try {
    const { html, title = "screenplay" } = req.body ?? {};
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    const style = `
      <style>
        @page { size: A4; margin: 1in 1in 1in 1.5in; }
        html, body { font-family: system-ui, sans-serif; }
        body { direction: rtl; }
        .screenplay-page { padding: 0; }
        .action { margin: 0.08in 0; text-align: right; }
        .dialogue { margin-right: 1.5in; margin-left: 1.5in; text-align: center; margin-top: 0.06in; margin-bottom: 0.06in; }
        .character { font-weight: 700; text-align: center; }
        .parenthetical { text-align: center; font-style: italic; }
        .transition { text-align: center; margin: 0.12in 0; }
        .scene-header-line1 { display: flex; justify-content: space-between; margin: 0.2in 0 0 0; font-weight: bold; }
        .scene-header-location { text-align: center; margin-top: 0.05in; font-weight: bold; text-decoration: underline; }
        .basmala { text-align: left; margin: 0.2in 0; font-weight: bold; }
      </style>
    `;

    await page.setContent(`
      <!doctype html>
      <html lang="ar" dir="rtl">
        <head><meta charset="utf-8"/>${style}</head>
        <body>
          <div class="screenplay-page">
            ${html}
          </div>
        </body>
      </html>
    `, { waitUntil: "networkidle0" });

    const pdf = await page.pdf({
      format: "A4",
      margin: { top: "1in", bottom: "1in", left: "1in", right: "1.5in" },
      printBackground: true,
      displayHeaderFooter: true,
      headerTemplate: `<div style="font-size:8px; width:100%; padding:0 1in; text-align:center; direction:rtl;"></div>`,
      footerTemplate: `
        <div style="font-size:10px; width:100%; padding:0 1in; direction:rtl;">
          <div style="text-align:center; width:100%;">
            <span class="pageNumber"></span> / <span class="totalPages"></span>
          </div>
        </div>`,
    });

    await browser.close();
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${title}.pdf"`);
    res.send(Buffer.from(pdf));
  } catch (e: any) {
    logger.error(e, "PDF export failed");
    res.status(500).json({ ok: false, error: e?.message ?? "PDF error" });
  }
});

// Global error handler - MUST be last
app.use(errorHandler);

const PORT = process.env.PORT ?? 4000;

async function startServer() {
  try {
    await redisClient.connect();
    logger.info('Connected to Redis');
    app.listen(PORT, () => {
      logger.info(`API on http://localhost:${PORT}`);
    });
  } catch (err) {
    logger.error(err, 'Failed to start server');
    process.exit(1);
  }
}

if (process.env.NODE_ENV !== 'test') {
    startServer();
}


export default app;