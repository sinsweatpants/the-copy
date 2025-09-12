import pino from 'pino';
import pinoHttp from 'pino-http';
import { randomUUID } from 'node:crypto';

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  redact: ['req.headers.authorization', 'req.body.password', 'req.body.token'],
});

export const httpLogger = pinoHttp({
  logger,
  genReqId: function (req, res) {
    const existingId = req.id ?? req.headers["x-request-id"];
    if (existingId) return existingId;
    const id = randomUUID();
    res.setHeader('X-Request-Id', id);
    return id;
  },
  customLogLevel: function (req, res, err) {
    if (res.statusCode >= 400 && res.statusCode < 500) {
      return 'warn';
    } else if (res.statusCode >= 500 || err) {
      return 'error';
    } else if (res.statusCode >= 300 && res.statusCode < 400) {
      return 'info';
    }
    return 'info';
  },
  customSuccessMessage: function (req, res) {
    if (res.statusCode === 404) {
      return 'resource not found';
    }
    return `${req.method} ${req.url} completed`;
  },
  customErrorMessage: function (req, res, err) {
    return `${req.method} ${req.url} errored with status ${res.statusCode}`;
  },
  serializers: {
    req: function (req) {
      return {
        method: req.method,
        url: req.url,
        headers: {
          host: req.headers.host,
          'user-agent': req.headers['user-agent'],
          'content-type': req.headers['content-type'],
        },
        remoteAddress: req.remoteAddress,
        remotePort: req.remotePort,
      };
    },
    res: function (res) {
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
