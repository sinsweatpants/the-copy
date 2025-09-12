import express from "express";
import cors from "cors";
import validateEnv from './config/validator.js';
import corsOptions from './config/cors.js';
import inputSanitizer from './middleware/input-sanitizer.js';
import security from './middleware/security.js';
import { httpLogger, default as logger } from './logger/enhanced-logger.js';
import pagination from './middleware/pagination.js';
import pkg from 'pg';
const { Pool } = pkg;
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import rateLimit from 'express-rate-limit';
import crypto from 'crypto';

import { errorHandler } from "./middleware/errorHandler.js";
import { validateRequest, registerUserSchema, loginUserSchema, refreshTokenSchema, logoutSchema } from "./middleware/validation.js";
import compression from 'compression';
import { getEnv } from './config/secrets.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface HttpError extends Error {
  status?: number;
}

validateEnv();

const app = express();
app.use(compression());
app.use(cors(corsOptions));
app.use(express.json({ limit: "2mb" }));
app.use(security);
app.use(inputSanitizer);
app.use(httpLogger);

// Rate limiting
const RATE_LIMIT_PER_MIN = parseInt(process.env.RATE_LIMIT_PER_MIN || '20', 10);
const HEAVY_LIMIT = parseInt(process.env.HEAVY_LIMIT || '5', 10);

const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: RATE_LIMIT_PER_MIN,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests from this IP, please try again later',
});
// @ts-ignore
app.use('/api', apiLimiter);

const heavyLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: HEAVY_LIMIT,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many heavy requests, please slow down',
});
// @ts-ignore
app.use('/api/llm', heavyLimiter);

const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: Math.max(1, Math.floor(RATE_LIMIT_PER_MIN / 10)),
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many authentication requests from this IP, please try again later',
});
// @ts-ignore
app.use('/api/auth', authLimiter);

import { createClient } from 'redis';
import { Queue } from 'bullmq';
import CircuitBreaker from 'opossum';

// PG Pool
const pool = new Pool({
  connectionString: getEnv('DATABASE_URL'),
});

// Redis Client
let redisClient: any;
let pdfExportQueue: any;
if (process.env.NODE_ENV !== 'test' && process.env.REDIS_ENABLED === 'true') {
  redisClient = createClient({
    url: getEnv('REDIS_URL'),
  });
  redisClient.on('error', (err: Error) => logger.error({ err }, 'Redis Client Error'));

  // BullMQ Queue for PDF Exports
  pdfExportQueue = new Queue('pdf-export-queue', {
    connection: {
      url: getEnv('REDIS_URL'),
    },
  });
}

app.post('/api/auth/refresh', validateRequest(refreshTokenSchema), async (req, res, next) => {
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

    const accessToken = jwt.sign({ userId: user.id, email: user.email, username: user.username }, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRES_IN });

    res.json({ accessToken });

  } catch (error) {
    next(error);
  }
});

app.post('/api/auth/logout', validateRequest(logoutSchema), async (req, res, next) => {
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


const JWT_SECRET = getEnv('JWT_SECRET');
const REFRESH_TOKEN_SECRET = getEnv('REFRESH_TOKEN_SECRET');
const ACCESS_TOKEN_EXPIRES_IN = '15m';
const REFRESH_TOKEN_EXPIRES_IN_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

const GEMINI_API_KEY = getEnv('GEMINI_API_KEY');

// --- Auth Middleware
const authenticateToken = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.sendStatus(401);
  }

  jwt.verify(token, JWT_SECRET, async (err: Error | null, user: any) => {
    if (err) return res.sendStatus(403);
    (req as any).user = user;
    
    // Set the current user ID for RLS policies
    try {
      await pool.query('SET LOCAL app.current_user_id = $1', [user.userId]);
    } catch (error) {
      logger.error({ error }, 'Failed to set current_user_id');
    }
    
    next();
  });
};

// Health Check Endpoint
app.get('/api/health', async (req: express.Request, res: express.Response) => {
  try {
    // Check database connection
    await pool.query('SELECT 1');
    
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      database: 'connected',
      redis: redisClient ? 'connected' : 'disabled'
    });
  } catch (error) {
    logger.error({ error }, 'Health check failed');
    res.status(503).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: 'Database connection failed'
    });
  }
});

// --- Helpers
function ok(res: express.Response, data: unknown) {
  res.json({ ok: true, data });
}
function notFound(res: express.Response) {
  res.status(404).json({ ok: false, error: "Not found" });
}

// --- Health Check ---
app.get('/health', async (_req: express.Request, res: express.Response) => {
  const status = { database: 'unknown', redis: 'unknown' };
  try {
    await pool.query('SELECT 1');
    status.database = 'connected';
  } catch {
    status.database = 'disconnected';
  }
  try {
    if (redisClient) {
      await redisClient.ping();
      status.redis = 'connected';
    } else {
      status.redis = 'skipped';
    }
  } catch {
    status.redis = 'disconnected';
  }
  const healthy = status.database === 'connected' && status.redis === 'connected';
  res.status(healthy ? 200 : 503).json({
    status: healthy ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    ...status,
  });
});

// --- API

// --- Auth Endpoints ---

// Register new user
app.post('/api/auth/register', validateRequest(registerUserSchema), async (req: express.Request, res: express.Response, next: express.NextFunction) => {
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
    const token = jwt.sign({ userId: user.id, email: user.email, username: user.username }, JWT_SECRET, { expiresIn: '7d' });

    res.json({ token, user });
  } catch (error) {
    next(error);
  }
});

// Login
app.post('/api/auth/login', validateRequest(loginUserSchema), async (req: express.Request, res: express.Response, next: express.NextFunction) => {
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

const geminiAPI = async (body: any) => {
    const model = "models/gemini-1.5-pro";
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/${model}:generateContent?key=${GEMINI_API_KEY}`;

    const proxyRes = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
    });

    if (!proxyRes.ok) {
        const errorText = await proxyRes.text();
        logger.error({ error: "Gemini API error", details: errorText });
        const error: HttpError = new Error(`Gemini API error: ${proxyRes.status} ${errorText}`);
        error.status = proxyRes.status;
        throw error;
    }

    return proxyRes.json();
}

const geminiBreakerOptions = {
    timeout: 15000, // 15 seconds
    errorThresholdPercentage: 50,
    resetTimeout: 30000 // 30 seconds
};

const geminiBreaker = new CircuitBreaker(geminiAPI, geminiBreakerOptions);

geminiBreaker.on('open', () => logger.warn('Gemini circuit breaker opened'));
geminiBreaker.on('close', () => logger.info('Gemini circuit breaker closed'));
geminiBreaker.on('halfOpen', () => logger.info('Gemini circuit breaker is half-open'));
geminiBreaker.on('fallback', () => logger.warn('Gemini API fallback triggered'));


app.post('/api/llm/generate', authenticateToken, async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    try {
        logger.info({ userId: (req as any).user.userId }, 'LLM request');
        const data = await geminiBreaker.fire(req.body);
        res.json(data);
    } catch (error) {
        next(error);
    }
});


// Apply auth middleware
app.use('/api/screenplays', authenticateToken);
app.use('/api/users/:userId', authenticateToken);
app.use('/api/characters', authenticateToken);
app.use('/api/dialogues', authenticateToken);


app.get('/api/screenplays', pagination, async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  try {
    const { page, limit, offset } = (req as any).pagination;
    const userId = (req as any).user.userId;
    const result = await pool.query(
      'SELECT * FROM screenplays WHERE owner_user_id=$1 ORDER BY created_at DESC LIMIT $2 OFFSET $3',
      [userId, limit, offset]
    );
    const totalRes = await pool.query('SELECT COUNT(*) FROM screenplays WHERE owner_user_id=$1', [userId]);
    const total = parseInt(totalRes.rows[0].count, 10);
    ok(res, { screenplays: result.rows, page, limit, total, hasNext: offset + limit < total });
  } catch (e) { next(e); }
});

// Screenplay metadata
app.get("/api/screenplays/:id", async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  try {
    const userId = (req as any).user.userId;
    const result = await pool.query("SELECT * FROM screenplays WHERE id=$1 AND owner_user_id=$2", [req.params.id, userId]);
    const row = result.rows[0];
    if (!row) return notFound(res);
    ok(res, row);
  } catch(e) { next(e); }
});

// Screenplay content
app.get("/api/screenplays/:id/content", async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const cacheKey = `screenplay:content:${req.params.id}`;
  try {
    const cachedData = await redisClient.get(cacheKey);
    if (cachedData) {
      return ok(res, JSON.parse(cachedData));
    }

    const userId = (req as any).user.userId;
    const result = await pool.query("SELECT html, updated_at FROM screenplay_content WHERE screenplay_id=$1 AND owner_user_id=$2", [req.params.id, userId]);
    const data = result.rows[0] ?? { html: "", updatedAt: null };

    // Cache for 1 hour
    await redisClient.set(cacheKey, JSON.stringify(data), { EX: 3600 });

    ok(res, data);
  } catch(e) { next(e); }
});

app.put("/api/screenplays/:id/content", async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const cacheKey = `screenplay:content:${req.params.id}`;
  try {
    const { html } = req.body ?? { html: "" };
    const now = new Date();
    const userId = (req as any).user.userId;
    const result = await pool.query(`
      INSERT INTO screenplay_content (screenplay_id, html, updated_at, owner_user_id)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT(screenplay_id) DO UPDATE SET html=excluded.html, updated_at=excluded.updated_at
      RETURNING updated_at
    `, [req.params.id, html ?? "", now, userId]);

    // Invalidate cache
    await redisClient.del(cacheKey);

    ok(res, { updatedAt: result.rows[0].updated_at });
  } catch(e) { next(e); }
});

// Characters
app.get("/api/screenplays/:id/characters", async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const cacheKey = `screenplay:characters:${req.params.id}`;
  try {
    const cachedData = await redisClient.get(cacheKey);
    if (cachedData) {
      return ok(res, JSON.parse(cachedData));
    }

    const userId = (req as any).user.userId;
    const result = await pool.query("SELECT * FROM characters WHERE screenplay_id=$1 AND owner_user_id=$2", [req.params.id, userId]);
    const data = result.rows;

    // Cache for 1 hour
    await redisClient.set(cacheKey, JSON.stringify(data), { EX: 3600 });

    ok(res, data);
  } catch(e) { next(e); }
});

app.post("/api/screenplays/:id/characters", async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const cacheKey = `screenplay:characters:${req.params.id}`;
  try {
    const { name, role } = req.body ?? {};
    const userId = (req as any).user.userId;
    const result = await pool.query(
      `INSERT INTO characters (screenplay_id, name, role, owner_user_id) VALUES ($1, $2, $3, $4) RETURNING id, name, role`,
      [req.params.id, name ?? "بدون اسم", role ?? "", userId]
    );

    // Invalidate cache
    await redisClient.del(cacheKey);

    ok(res, result.rows[0]);
  } catch(e) { next(e); }
});

// Dialogues
app.get("/api/characters/:id/dialogues", async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  try {
    const userId = (req as any).user.userId;
    const result = await pool.query("SELECT * FROM dialogues WHERE character_id=$1 AND owner_user_id=$2", [req.params.id, userId]);
    ok(res, result.rows);
  } catch(e) { next(e); }
});

app.put("/api/dialogues/:dialogueId", async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  try {
    const { text } = req.body ?? {};
    const userId = (req as any).user.userId;
    await pool.query("UPDATE dialogues SET text=$1 WHERE id=$2 AND owner_user_id=$3", [text ?? "", req.params.dialogueId, userId]);
    ok(res, { id: req.params.dialogueId, text });
  } catch(e) { next(e); }
});

// Sprints
app.get("/api/users/:userId/sprints/active", async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  try {
    const userId = (req as any).user.userId;
    if (req.params.userId !== userId) return res.sendStatus(403);
    const result = await pool.query("SELECT * FROM sprints WHERE owner_user_id=$1 AND is_active=true ORDER BY started_at DESC LIMIT 1", [userId]);
    ok(res, result.rows[0] ?? null);
  } catch(e) { next(e); }
});

app.post("/api/users/:userId/sprints", async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  try {
    const userId = (req as any).user.userId;
    if (req.params.userId !== userId) return res.sendStatus(403);
    const result = await pool.query(
      `INSERT INTO sprints (owner_user_id, is_active) VALUES ($1, true) RETURNING id, started_at, is_active`,
      [userId]
    );
    ok(res, result.rows[0]);
  } catch(e) { next(e); }
});

app.put("/api/users/:userId/sprints/:sprintId", async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  try {
    const userId = (req as any).user.userId;
    if (req.params.userId !== userId) return res.sendStatus(403);
    const { action, durationSec } = req.body ?? {};
    if (action === "end") {
      await pool.query(
        `UPDATE sprints SET is_active=false, ended_at=current_timestamp, duration_sec=$1 WHERE id=$2 AND owner_user_id=$3`,
        [durationSec ?? null, req.params.sprintId, userId]
      );
    } else if (action === "pause") {
      await pool.query(
        `UPDATE sprints SET is_active=false WHERE id=$1 AND owner_user_id=$2`,
        [req.params.sprintId, userId]
      );
    }
    ok(res, { id: req.params.sprintId, action });
  } catch(e) { next(e); }
});

// Stash
app.get("/api/users/:userId/stash", pagination, async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  try {
    const userId = (req as any).user.userId;
    if (req.params.userId !== userId) return res.sendStatus(403);
    const { page, limit, offset } = (req as any).pagination;
    const result = await pool.query(
      "SELECT * FROM stash WHERE owner_user_id=$1 ORDER BY created_at DESC LIMIT $2 OFFSET $3",
      [userId, limit, offset]
    );
    const totalRes = await pool.query("SELECT COUNT(*) FROM stash WHERE owner_user_id=$1", [userId]);
    const total = parseInt(totalRes.rows[0].count, 10);
    ok(res, { items: result.rows, page, limit, total, hasNext: offset + limit < total });
  } catch(e) { next(e); }
});

app.post("/api/users/:userId/stash", async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  try {
    const userId = (req as any).user.userId;
    if (req.params.userId !== userId) return res.sendStatus(403);
    const { text, type } = req.body ?? {};
    const wordCount = (text ?? "").trim().split(/\s+/).filter(Boolean).length;
    const result = await pool.query(
      `INSERT INTO stash (owner_user_id, text, type, word_count) VALUES ($1, $2, $3, $4) RETURNING id`,
      [userId, text ?? "", type ?? "snippet", wordCount]
    );
    ok(res, { id: result.rows[0].id });
  } catch(e) { next(e); }
});

app.delete("/api/users/:userId/stash/:itemId", async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  try {
    const userId = (req as any).user.userId;
    if (req.params.userId !== userId) return res.sendStatus(403);
    await pool.query("DELETE FROM stash WHERE id=$1 AND owner_user_id=$2", [req.params.itemId, userId]);
    ok(res, true);
  } catch(e) { next(e); }
});

// Export PDF
app.post("/api/export/pdf", authenticateToken, async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    try {
        const { html, title = "screenplay" } = req.body ?? {};
        const userId = (req as any).user.userId;
        logger.info({ userId }, 'PDF export requested');

        if (!html) {
            return res.status(400).json({ ok: false, error: "HTML content is required" });
        }

        const job = await pdfExportQueue.add('export-pdf', {
            html,
            title,
            userId,
        });

        res.status(202).json({ ok: true, jobId: job.id });
    } catch (e: any) {
        logger.error(e, "PDF export job creation failed");
        next(e);
    }
});

// Serve frontend if not in test environment
if (process.env.NODE_ENV !== 'test') {
    const frontendDist = path.resolve(__dirname, '..', '..', 'frontend', 'dist');
    
    // Log the path to ensure it's correct
    logger.info(`Serving frontend from: ${frontendDist}`);

    // Check if the directory exists
    try {
        const fs = require('fs');
        if (fs.existsSync(frontendDist)) {
            logger.info('Frontend dist directory exists.');
        } else {
            logger.warn('Frontend dist directory does not exist. Frontend will not be served.');
        }
    } catch (e) {
        logger.error(e, 'Error checking for frontend dist directory');
    }

    app.use(express.static(frontendDist));

    app.get('*', (req: express.Request, res: express.Response, next: express.NextFunction) => {
        // If the request is for an API route, pass it to the next handler
        if (req.originalUrl.startsWith('/api/')) {
            return next();
        }
        // Otherwise, serve the index.html file
        res.sendFile(path.join(frontendDist, 'index.html'), (err: HttpError | null) => {
            if (err) {
                // If the file doesn't exist, it's a 404, but we let the client-side routing handle it.
                // If there's another error, we pass it to the error handler.
                if (err.status === 404) {
                    // This is expected if the path is a client-side route, so we don't log an error.
                    // The client-side router will handle the 404.
                    // We can't just next() here, as that would fall through to the error handler.
                    // We must send a response.
                    res.status(404).send('Resource not found');
                } else {
                    next(err);
                }
            }
        });
    });
}

// Global error handler - MUST be last
app.use(errorHandler);

const PORT = process.env.PORT ?? 4000;
let server: any;

async function startServer() {
  try {
    if (redisClient) {
      await redisClient.connect();
      logger.info('Connected to Redis');
    } else {
      logger.info('Redis disabled in test mode');
    }
    server = app.listen(PORT, () => {
      logger.info(`API on http://localhost:${PORT}`);
    });
  } catch (err) {
    logger.warn({ err }, 'Redis connection failed, starting server without Redis');
    server = app.listen(PORT, () => {
      logger.info(`API on http://localhost:${PORT} (without Redis)`);
    });
  }
}

if (process.env.NODE_ENV !== 'test') {
    startServer();
}

// Graceful shutdown
const gracefulShutdown = (signal: string) => {
    return (err?: Error | unknown) => {
        if (err) logger.fatal(err, `Unhandled error, shutting down due to ${signal}`);
        else logger.info(`Received ${signal}, shutting down gracefully...`);

        if (server) {
            server.close(() => {
                logger.info('HTTP server closed.');
                Promise.all([
                    pool.end(),
                    redisClient ? redisClient.quit() : Promise.resolve(),
                    pdfExportQueue.close(),
                ]).then(() => {
                    logger.info('Closed all connections.');
                    process.exit(err ? 1 : 0);
                }).catch(e => {
                    logger.error(e, 'Error during graceful shutdown');
                    process.exit(1);
                });
            });
        } else {
             Promise.all([
                pool.end(),
                redisClient ? redisClient.quit() : Promise.resolve(),
                pdfExportQueue.close(),
            ]).then(() => {
                logger.info('Closed all connections.');
                process.exit(err ? 1 : 0);
            }).catch(e => {
                logger.error(e, 'Error during graceful shutdown');
                process.exit(1);
            });
        }
    };
};

process.on('SIGTERM', gracefulShutdown('SIGTERM'));
process.on('SIGINT', gracefulShutdown('SIGINT'));
process.on('uncaughtException', gracefulShutdown('uncaughtException'));
process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
    logger.error({ promise, reason }, 'Unhandled Rejection at Promise');
    gracefulShutdown('unhandledRejection')(new Error(String(reason)));
});


export default app;