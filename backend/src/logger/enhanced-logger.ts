import pino from 'pino';
import { Request, Response, NextFunction } from 'express';

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  redact: ['req.headers.authorization', 'req.body.password', 'req.body.token'],
});

export function httpLogger(req: Request, res: Response, next: NextFunction) {
  const start = process.hrtime.bigint();
  res.on('finish', () => {
    const duration = Number(process.hrtime.bigint() - start) / 1e6;
    logger.info({ method: req.method, url: req.originalUrl, statusCode: res.statusCode, duration }, 'request completed');
  });
  next();
}

export default logger;
