import logger from '../logger/enhanced-logger.js';

const requiredEnv = ['DATABASE_URL', 'JWT_SECRET', 'GEMINI_API_KEY', 'REDIS_URL'];

export default function validateEnv() {
  const missing = requiredEnv.filter(key => !process.env[key]);
  if (missing.length > 0) {
    logger.error({ missing }, 'Missing required environment variables');
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}
