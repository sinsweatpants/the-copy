import type { CorsOptions } from 'cors';

const corsOptions: CorsOptions = process.env.NODE_ENV === 'production'
  ? {
      origin: process.env.CORS_ORIGIN,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      exposedHeaders: ['Content-Length'],
      credentials: true,
    }
  : {
      origin: true,
      credentials: true,
    };

export default corsOptions;
