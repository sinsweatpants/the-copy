import rateLimit from "express-rate-limit";
import { createClient } from "redis";
// @ts-ignore - package ships without types
import { RedisStore } from "rate-limit-redis";

import logger from "../logger/enhanced-logger.js";
import { env } from "../config/validator.js";

const windowMs = 15 * 60 * 1000;
const max = Number(process.env.RATE_LIMIT_MAX ?? 300);

export default async function makeLimiter() {
  if (env.REDIS_URL && !env.DISABLE_REDIS) {
    const client = createClient({ url: env.REDIS_URL });
    client.on("error", (error) => {
      logger.error({ err: error }, "Redis rate limiter client error");
    });

    try {
      await client.connect();
      logger.info({ store: "redis" }, "Rate limiter using Redis store");
      return rateLimit({
        windowMs,
        max,
        standardHeaders: true,
        legacyHeaders: false,
        store: new RedisStore({
          sendCommand: (...args: string[]) => (client as any).sendCommand(args),
        }),
      });
    } catch (error) {
      logger.warn({ err: error }, "Falling back to in-memory rate limiter");
    }
  }

  logger.info({ store: "memory" }, "Rate limiter using in-memory store");
  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
  });
}
