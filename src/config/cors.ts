import { CorsOptions } from 'cors';
import { env } from './env';

export const corsOptions: CorsOptions = (() => {
  // Development: allow all origins
  if (env.NODE_ENV === 'development') {
    return {
      origin: true,
      credentials: true,
    };
  }

  // Production: use ALLOWED_ORIGINS if set
  if (env.ALLOWED_ORIGINS) {
    const allowedOrigins = env.ALLOWED_ORIGINS.split(',').map((origin) => origin.trim());
    return {
      origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      },
      credentials: true,
    };
  }

  // Default: restrictive
  return {
    origin: false,
  };
})();
