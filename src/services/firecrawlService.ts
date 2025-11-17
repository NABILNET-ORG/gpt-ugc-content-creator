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

interface FirecrawlV2Response {
  success?: boolean;
  data?: any;
  error?: string;
  [key: string]: any;
}

async function firecrawlRequest(
  path: string,
  body: any
): Promise<FirecrawlV2Response> {
  const url = `https://api.firecrawl.dev${path}`;

  logger.info(`[Firecrawl] Making request to: ${url}`);
  logger.info(`[Firecrawl] Request body:`, JSON.stringify(body, null, 2));

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${env.FIRECRAWL_API_KEY}`,
    },
    body: JSON.stringify(body),
  });

  const text = await response.text();
  logger.info(`[Firecrawl] Response status: ${response.status}`);
  logger.info(`[Firecrawl] Response text (first 1000 chars):`, text.substring(0, 1000));

  let json: any;
  try {
    json = text ? JSON.parse(text) : {};
  } catch (err) {
    logger.error('[Firecrawl] Failed to parse JSON response:', text);
    throw new Error('FIRECRAWL_INVALID_JSON');
  }

  if (!response.ok) {
    logger.error(`[Firecrawl] Non-OK status: ${response.status}`, json);
    throw new Error(json?.error || `FIRECRAWL_HTTP_${response.status}`);
  }

  logger.info('[Firecrawl] Full JSON response:', JSON.stringify(json, null, 2).substring(0, 4000));

  return json as FirecrawlV2Response;
}

/**
 * Extract images from various possible Firecrawl V2 response structures
 */
function extractImagesFromFirecrawl(data: any): string[] {
  if (!data) {
    logger.warn('[Firecrawl] No data provided to extractImages');
    return [];
  }

  const imagesSet = new Set<string>();

  logger.info('[Firecrawl] Extracting images. Data keys:', Object.keys(data));

  // Case 1: data.images is an array
  if (Array.isArray(data.images)) {
    logger.info(`[Firecrawl] Found data.images array with ${data.images.length} items`);
    for (const img of data.images) {
      if (typeof img === 'string' && img.trim().startsWith('http')) {
        imagesSet.add(img.trim());
      } else if (img && typeof img.url === 'string') {
        imagesSet.add(img.url.trim());
      }
    }
  }

  // Case 2: data.metadata?.images
  if (data.metadata && Array.isArray(data.metadata.images)) {
    logger.info(`[Firecrawl] Found data.metadata.images array with ${data.metadata.images.length} items`);
    for (const img of data.metadata.images) {
      if (typeof img === 'string' && img.trim().startsWith('http')) {
        imagesSet.add(img.trim());
      } else if (img && typeof img.url === 'string') {
        imagesSet.add(img.url.trim());
      }
    }
  }

  // Case 3: data.metadata.ogImage (single Open Graph image)
  if (data.metadata?.ogImage && typeof data.metadata.ogImage === 'string') {
    logger.info('[Firecrawl] Found og:image:', data.metadata.ogImage);
    imagesSet.add(data.metadata.ogImage.trim());
  }

  // Case 4: data.documents array (some V2 responses)
  if (Array.isArray(data.documents)) {
    logger.info(`[Firecrawl] Found data.documents array with ${data.documents.length} items`);
    for (const doc of data.documents) {
      if (Array.isArray(doc.images)) {
        for (const img of doc.images) {
          if (typeof img === 'string' && img.trim().startsWith('http')) {
            imagesSet.add(img.trim());
          } else if (img && typeof img.url === 'string') {
            imagesSet.add(img.url.trim());
          }
        }
      }
      if (doc.metadata?.ogImage) {
        imagesSet.add(doc.metadata.ogImage.trim());
      }
    }
  }

  const result = Array.from(imagesSet);
  logger.info(`[Firecrawl] Total unique images extracted: ${result.length}`);
  if (result.length > 0) {
    logger.info(`[Firecrawl] First image: ${result[0]}`);
  }

  return result;
}

/**
 * Extract title and description from Firecrawl response
 */
function extractTitleAndDescription(data: any): {
  title: string | null;
  description: string | null;
} {
  let title: string | null = null;
  let description: string | null = null;

  if (!data) return { title, description };

  // Try metadata first
  if (data.metadata) {
    if (typeof data.metadata.title === 'string' && data.metadata.title.trim()) {
      title = data.metadata.title.trim();
    }
    if (typeof data.metadata.description === 'string' && data.metadata.description.trim()) {
      description = data.metadata.description.trim();
    }
    if (typeof data.metadata.ogTitle === 'string' && !title) {
      title = data.metadata.ogTitle.trim();
    }
    if (typeof data.metadata.ogDescription === 'string' && !description) {
      description = data.metadata.ogDescription.trim();
    }
  }

  // Try top-level fields
  if (!title && typeof data.title === 'string') {
    title = data.title.trim();
  }
  if (!description && typeof data.description === 'string') {
    description = data.description.trim();
  }

  // Try first document
  if (Array.isArray(data.documents) && data.documents.length > 0) {
    const firstDoc = data.documents[0];
    if (!title && typeof firstDoc?.metadata?.title === 'string') {
      title = firstDoc.metadata.title.trim();
    }
    if (!description && typeof firstDoc?.metadata?.description === 'string') {
      description = firstDoc.metadata.description.trim();
    }
    // Fallback: use snippet of content
    if (!description && typeof firstDoc?.text === 'string') {
      const text = firstDoc.text.trim().replace(/\s+/g, ' ');
      description = text.substring(0, 280);
    }
  }

  logger.info(`[Firecrawl] Extracted title: ${title ? `"${title.substring(0, 50)}..."` : 'NULL'}`);
  logger.info(`[Firecrawl] Extracted description: ${description ? `"${description.substring(0, 80)}..."` : 'NULL'}`);

  return { title, description };
}

/**
 * Scrape product page using Firecrawl V2 API
 */
export async function scrapeProduct(productUrl: string): Promise<FirecrawlScrapeResult> {
  try {
    logger.info(`[Firecrawl] Starting scrape for: ${productUrl}`);
    logger.info(`[Firecrawl] API key (first 10 chars): ${env.FIRECRAWL_API_KEY.substring(0, 10)}...`);

    // Call Firecrawl V2 API
    const json = await firecrawlRequest('/v2/scrape', {
      url: productUrl,
      formats: ['markdown', 'html'],
      // V2 options - adjust based on your plan
      onlyMainContent: false,
    });

    logger.info('[Firecrawl] API call successful');
    logger.info('[Firecrawl] Response top-level keys:', Object.keys(json || {}));

    // Check if Firecrawl returned success flag
    if (json.success === false) {
      logger.warn('[Firecrawl] API returned success=false');
      logger.warn('[Firecrawl] Error:', json.error);
      throw new Error(json.error || 'FIRECRAWL_FAILED');
    }

    // Extract data (could be in json.data or json itself)
    const data = json.data ?? json;

    // Extract images and metadata
    const images = extractImagesFromFirecrawl(data);
    const { title, description } = extractTitleAndDescription(data);

    logger.info(`[Firecrawl] Scraping complete. Images: ${images.length}, Title: ${!!title}, Description: ${!!description}`);

    return {
      success: true,
      images,
      metadata: {
        title: title || undefined,
        description: description || undefined,
      },
    };
  } catch (error: any) {
    logger.error('[Firecrawl] Scraping error:', error.message);

    if (error.response) {
      logger.error('[Firecrawl] Error response status:', error.response.status);
      logger.error('[Firecrawl] Error response data:', JSON.stringify(error.response.data, null, 2));
    }

    throw new AppError(
      500,
      'SCRAPING_ERROR',
      `Failed to scrape product: ${error.message}`
    );
  }
}
