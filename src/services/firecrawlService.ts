import { httpClient } from '../config/httpClient';
import { env } from '../config/env';
import { logger } from '../config/logger';
import { AppError } from '../utils/error';

export interface FirecrawlScrapeResult {
  success: true;
  images: string[];
  metadata: {
    title?: string;
    description?: string;
  };
}

export async function scrapeProduct(productUrl: string): Promise<FirecrawlScrapeResult> {
  try {
    logger.info(`[Firecrawl] Scraping product from URL: ${productUrl}`);
    logger.info(`[Firecrawl] Using API key: ${env.FIRECRAWL_API_KEY.substring(0, 10)}...`);

    const response = await httpClient.post(
      'https://api.firecrawl.dev/v2/scrape',
      {
        url: productUrl,
        formats: ['markdown', 'html', 'images'],
        onlyMainContent: false,
        maxAge: 172800000, // 48 hours in milliseconds
      },
      {
        headers: {
          Authorization: `Bearer ${env.FIRECRAWL_API_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: 30000, // 30 second timeout
      }
    );

    logger.info(`[Firecrawl] Response status: ${response.status}`);
    logger.info(`[Firecrawl] Response data:`, JSON.stringify(response.data, null, 2));

    const data = response.data;

    // Check if Firecrawl returned success
    if (!data.success) {
      logger.warn(`[Firecrawl] API returned success=false for ${productUrl}`);
      logger.warn(`[Firecrawl] Full response:`, JSON.stringify(data, null, 2));
    }

    // Extract images - try multiple possible locations
    const images: string[] = [];

    // V2 API might return images in different formats
    if (data.data?.images && Array.isArray(data.data.images)) {
      images.push(...data.data.images);
    } else if (data.images && Array.isArray(data.images)) {
      images.push(...data.images);
    } else if (data.data?.metadata?.ogImage) {
      images.push(data.data.metadata.ogImage);
    }

    // Extract metadata - try multiple possible locations
    const metadata = {
      title: data.data?.metadata?.title || data.data?.title || data.metadata?.title || data.title || undefined,
      description: data.data?.metadata?.description || data.data?.description || data.metadata?.description || data.description || undefined,
    };

    logger.info(`[Firecrawl] Successfully scraped. Images: ${images.length}, Title: ${metadata.title ? 'Yes' : 'No'}, Description: ${metadata.description ? 'Yes' : 'No'}`);

    return {
      success: true,
      images,
      metadata,
    };
  } catch (error: any) {
    logger.error('[Firecrawl] Scraping error:', error.message);

    if (error.response) {
      logger.error('[Firecrawl] Response status:', error.response.status);
      logger.error('[Firecrawl] Response data:', JSON.stringify(error.response.data, null, 2));
    } else if (error.request) {
      logger.error('[Firecrawl] No response received from Firecrawl API');
    }

    throw new AppError(
      500,
      'SCRAPING_ERROR',
      `Failed to scrape product: ${error.message}`
    );
  }
}
