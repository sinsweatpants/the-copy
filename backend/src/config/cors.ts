import type { CorsOptions } from 'cors';

const allowedOrigins = process.env.CORS_ORIGIN?.split(',').map(o => o.trim());

const corsOptions: CorsOptions = process.env.NODE_ENV === 'production'
  ? {
      origin: (origin, callback) => {
        if (!origin || !allowedOrigins || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      },
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      exposedHeaders: ['Content-Length'],
      credentials: true,
      maxAge: 600,
      optionsSuccessStatus: 204,
    }
  : { origin: true, credentials: true };

export default corsOptions;
