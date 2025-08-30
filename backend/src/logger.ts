import pino from 'pino';
import path from 'path';

const isProduction = process.env.NODE_ENV === 'production';
const logLevel = process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug');

const transport = isProduction
  ? pino.transport({
      targets: [
        {
          target: 'pino/file',
          options: { destination: path.join('logs', 'app.log'), mkdir: true },
          level: logLevel,
        },
      ],
    })
  : undefined;

const logger = pino({ level: logLevel }, transport);

export default logger;
