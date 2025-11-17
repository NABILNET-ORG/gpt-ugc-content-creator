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
    logger.info(`Scraping product from URL: ${productUrl}`);

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
      }
    );

    const data = response.data;

    // Extract images
    const images: string[] = [];
    if (data.images && Array.isArray(data.images)) {
      images.push(...data.images);
    }

    // Extract metadata
    const metadata = {
      title: data.metadata?.title || data.title || undefined,
      description: data.metadata?.description || data.description || undefined,
    };

    logger.info(`Successfully scraped product. Found ${images.length} images`);

    return {
      success: true,
      images,
      metadata,
    };
  } catch (error: any) {
    logger.error('Firecrawl scraping error:', error.message);
    throw new AppError(
      500,
      'SCRAPING_ERROR',
      `Failed to scrape product: ${error.message}`
    );
  }
}
