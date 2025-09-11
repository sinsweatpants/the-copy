import pino from 'pino';
import pinoHttp from 'pino-http';
import { nanoid } from 'nanoid';

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  redact: ['req.headers.authorization', 'req.body.password', 'req.body.token'],
});

export const httpLogger = pinoHttp({
  logger,
  genReqId: function (req, res) {
    const existingId = req.id ?? req.headers["x-request-id"];
    if (existingId) return existingId;
    const id = nanoid();
    res.setHeader('X-Request-Id', id);
    return id;
  },
});

export default logger;
