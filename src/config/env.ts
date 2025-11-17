import dotenv from 'dotenv';

// Load .env file
dotenv.config();

interface EnvConfig {
  PORT: number;
  NODE_ENV: 'development' | 'production';
  STRIPE_SECRET_KEY: string;
  STRIPE_WEBHOOK_SECRET: string;
  FIRECRAWL_API_KEY: string;
  FAL_API_KEY: string;
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  GPT_BACKEND_SECRET: string;
  ALLOWED_ORIGINS?: string;
}

function validateEnv(): EnvConfig {
  const required = [
    'STRIPE_SECRET_KEY',
    'STRIPE_WEBHOOK_SECRET',
    'FIRECRAWL_API_KEY',
    'FAL_API_KEY',
    'SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
    'GPT_BACKEND_SECRET',
  ];

  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  const nodeEnv = process.env.NODE_ENV || 'development';
  if (nodeEnv !== 'development' && nodeEnv !== 'production') {
    throw new Error('NODE_ENV must be either "development" or "production"');
  }

  return {
    PORT: parseInt(process.env.PORT || '4000', 10),
    NODE_ENV: nodeEnv as 'development' | 'production',
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY!,
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET!,
    FIRECRAWL_API_KEY: process.env.FIRECRAWL_API_KEY!,
    FAL_API_KEY: process.env.FAL_API_KEY!,
    SUPABASE_URL: process.env.SUPABASE_URL!,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY!,
    GPT_BACKEND_SECRET: process.env.GPT_BACKEND_SECRET!,
    ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS,
  };
}

export const env = validateEnv();
