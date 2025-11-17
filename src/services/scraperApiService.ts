import { buildScraperApiUrl } from '../config/scraperapi';
import { logger } from '../config/logger';
import { AppError } from '../utils/error';

export interface ScraperApiResult {
  url: string;
  status: number;
  html: string;
}

/**
 * Fetch a web page using ScraperAPI with JavaScript rendering enabled.
 *
 * @param url - The target URL to scrape
 * @returns Object containing the original URL, HTTP status, and HTML content
 * @throws AppError if the request fails completely
 */
export async function fetchPageWithScraperApi(url: string): Promise<ScraperApiResult> {
  try {
    // Validate URL
    try {
      new URL(url);
    } catch {
      throw new AppError(400, 'INVALID_URL', 'Invalid URL format');
    }

    logger.info(`[ScraperAPI] Fetching URL: ${url}`);

    // Build ScraperAPI URL with rendering enabled
    const scraperUrl = buildScraperApiUrl(url, { render: true });
    logger.info(`[ScraperAPI] Request URL constructed (JS rendering enabled)`);

    // Fetch with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout

    const response = await fetch(scraperUrl, {
      method: 'GET',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const status = response.status;
    logger.info(`[ScraperAPI] Response status: ${status}`);

    // Read response body as text
    const html = await response.text();
    const htmlLength = html.length;
    logger.info(`[ScraperAPI] HTML length: ${htmlLength.toLocaleString()} characters`);

    // Even if status is not 200, we still got HTML - log it
    if (status !== 200) {
      logger.warn(`[ScraperAPI] Non-200 status (${status}), but received HTML (${htmlLength} chars)`);
    }

    // Check if HTML is suspiciously short (might be an error page)
    if (htmlLength < 500) {
      logger.warn(`[ScraperAPI] HTML is very short (${htmlLength} chars). Preview:`, html.substring(0, 200));
    }

    return {
      url, // Original URL
      status,
      html,
    };
  } catch (error: any) {
    // Handle different error types
    if (error.name === 'AbortError') {
      logger.error(`[ScraperAPI] Request timeout after 60 seconds for URL: ${url}`);
      throw new AppError(504, 'SCRAPERAPI_TIMEOUT', 'ScraperAPI request timed out');
    }

    if (error instanceof AppError) {
      throw error;
    }

    logger.error(`[ScraperAPI] Request failed:`, error.message);
    throw new AppError(
      500,
      'SCRAPERAPI_ERROR',
      `Failed to fetch page with ScraperAPI: ${error.message}`
    );
  }
}
