import { env } from './env';
import { logger } from './logger';

export const SCRAPERAPI_BASE_URL = 'https://api.scraperapi.com/';

// Validate ScraperAPI key on startup
if (!env.SCRAPERAPI_KEY) {
  logger.error('[ScraperAPI] API key is missing!');
  throw new Error('SCRAPERAPI_KEY environment variable is required');
}

// Log partial key for debugging (first 8 characters only)
logger.info(`[ScraperAPI] Configured with key: ${env.SCRAPERAPI_KEY.substring(0, 8)}...`);

export function getScraperApiKey(): string {
  return env.SCRAPERAPI_KEY;
}

export function buildScraperApiUrl(targetUrl: string, options?: {
  render?: boolean;
  country_code?: string;
}): string {
  const params = new URLSearchParams({
    api_key: env.SCRAPERAPI_KEY,
    url: targetUrl,
    render: options?.render !== false ? 'true' : 'false', // Enable JS rendering by default
  });

  if (options?.country_code) {
    params.set('country_code', options.country_code);
  }

  return `${SCRAPERAPI_BASE_URL}?${params.toString()}`;
}
