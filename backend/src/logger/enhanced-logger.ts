import pino from 'pino';
import pinoHttp from 'pino-http';
import { randomUUID } from 'node:crypto';
import type { Request, Response } from 'express';

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  redact: [
    'req.headers.authorization',
    'req.headers.cookie',
    'req.headers.x-api-key',
    'res.headers.set-cookie',
    'req.query.apiKey',
    'req.query.token',
    'req.body.password',
    'req.body.token',
    'req.body.secret',
  ],
});

export const httpLogger = pinoHttp({
  logger,
  genReqId: function (req: Request, res: Response) {
    const existingId = req.id ?? req.headers["x-request-id"];
    if (existingId) return existingId;
    const id = randomUUID();
    res.setHeader('X-Request-Id', id);
    return id;
  },
  customLogLevel: function (
    req: Request,
    res: Response,
    err: Error | undefined,
  ) {
    if (res.statusCode >= 400 && res.statusCode < 500) {
      return 'warn';
    } else if (res.statusCode >= 500 || err) {
      return 'error';
    } else if (res.statusCode >= 300 && res.statusCode < 400) {
      return 'info';
    }
    return 'info';
  },
  customSuccessMessage: function (req: Request, res: Response) {
    if (res.statusCode === 404) {
      return 'resource not found';
    }
    return `${req.method} ${req.url} completed`;
  },
  customErrorMessage: function (
    req: Request,
    res: Response,
    err: Error,
  ) {
    return `${req.method} ${req.url} errored with status ${res.statusCode}`;
  },
  serializers: {
    req: function (req: Request) {
      return {
        method: req.method,
        url: req.url,
        headers: {
          host: req.headers.host,
          'user-agent': req.headers['user-agent'],
          'content-type': req.headers['content-type'],
        },
        remoteAddress: req.socket.remoteAddress,
        remotePort: req.socket.remotePort,
      };
    },
    res: function (res: Response) {
      return {
        statusCode: res.statusCode,
        headers: {
          'content-type': res.getHeader ? res.getHeader('content-type') : undefined,
          'content-length': res.getHeader ? res.getHeader('content-length') : undefined,
        },
      };
    },
  },
});

export default logger;
