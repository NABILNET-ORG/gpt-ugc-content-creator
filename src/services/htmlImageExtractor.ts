import { logger } from '../config/logger';

/**
 * Extract product images directly from HTML using regex patterns
 * More reliable than relying on LLM for image extraction
 */

/**
 * Check if URL is from Amazon
 */
function isAmazonUrl(url: string): boolean {
  return /amazon\./i.test(url);
}

/**
 * Check if URL is from Alibaba
 */
function isAlibabaUrl(url: string): boolean {
  return /alibaba\./i.test(url);
}

/**
 * Extract Amazon large images from HTML
 * Looks for "large": "https://m.media-amazon.com/images/..." pattern
 */
export function extractAmazonLargeImages(html: string): string[] {
  const images = new Set<string>();

  // Pattern: "large": "https://m.media-amazon.com/images/I/xxxxx.jpg"
  const regex = /"large"\s*:\s*"(https:\/\/m\.media-amazon\.com\/images\/[^"]+?\.jpg)"/gi;

  let match: RegExpExecArray | null;
  while ((match = regex.exec(html)) !== null) {
    const url = match[1];
    if (url) {
      images.add(url);
    }
  }

  logger.info(`[Amazon Extractor] Found ${images.size} large images`);
  return [...images];
}

/**
 * Extract Alibaba product images from HTML
 * Looks for image URLs in their product data structure
 */
export function extractAlibabaImages(html: string): string[] {
  const images = new Set<string>();

  // Pattern: https://sc04.alicdn.com/kf/Hxxxxx.jpg or .png
  const regex = /(https:\/\/sc\d+\.alicdn\.com\/kf\/[A-Za-z0-9]+\.(jpg|png|webp))/gi;

  let match: RegExpExecArray | null;
  while ((match = regex.exec(html)) !== null) {
    const url = match[1];
    if (url && !url.includes('_50x50') && !url.includes('_80x80')) {
      // Skip tiny thumbnails
      images.add(url);
    }
  }

  logger.info(`[Alibaba Extractor] Found ${images.size} product images`);
  return [...images];
}

/**
 * Generic image extractor for other e-commerce sites
 * Extracts from common img tags and data attributes
 */
export function extractGenericProductImages(html: string): string[] {
  const images = new Set<string>();

  // Look for img tags with product-related patterns
  const imgRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
  const dataRegex = /data-[a-z-]*image[a-z-]*=["']([^"']+)["']/gi;

  let match: RegExpExecArray | null;

  // Extract from img src
  while ((match = imgRegex.exec(html)) !== null) {
    const url = match[1];
    if (isLikelyProductImage(url)) {
      images.add(url);
    }
  }

  // Extract from data attributes
  while ((match = dataRegex.exec(html)) !== null) {
    const url = match[1];
    if (isLikelyProductImage(url)) {
      images.add(url);
    }
  }

  logger.info(`[Generic Extractor] Found ${images.size} candidate images`);
  return [...images].slice(0, 15); // Limit to 15 to avoid noise
}

/**
 * Check if URL is likely a product image (not icon/logo/sprite)
 */
function isLikelyProductImage(url: string): boolean {
  // Must be absolute URL
  if (!url.startsWith('http')) {
    return false;
  }

  // Skip known non-product patterns
  const skipPatterns = [
    /logo/i,
    /icon/i,
    /sprite/i,
    /favicon/i,
    /placeholder/i,
    /loading/i,
    /spinner/i,
    /badge/i,
    /star/i,
    /rating/i,
    /blank/i,
    /pixel/i,
    /tracking/i,
    /_50x50/i,
    /_80x80/i,
    /_100x100/i,
  ];

  for (const pattern of skipPatterns) {
    if (pattern.test(url)) {
      return false;
    }
  }

  // Must be image file
  const imageExtensions = /\.(jpg|jpeg|png|webp|avif)(\?|$)/i;
  return imageExtensions.test(url);
}

/**
 * Main function: Extract product images from HTML based on URL domain
 */
export function extractProductImages(html: string, url: string): string[] {
  logger.info('[Image Extractor] Extracting images for:', url);

  let images: string[] = [];

  // Amazon-specific extraction
  if (isAmazonUrl(url)) {
    logger.info('[Image Extractor] Detected Amazon URL, using Amazon extractor');
    images = extractAmazonLargeImages(html);

    if (images.length === 0) {
      logger.warn('[Image Extractor] No Amazon large images found, trying generic extractor');
      images = extractGenericProductImages(html);
    }
  }
  // Alibaba-specific extraction
  else if (isAlibabaUrl(url)) {
    logger.info('[Image Extractor] Detected Alibaba URL, using Alibaba extractor');
    images = extractAlibabaImages(html);

    if (images.length === 0) {
      logger.warn('[Image Extractor] No Alibaba images found, trying generic extractor');
      images = extractGenericProductImages(html);
    }
  }
  // Generic extraction for other sites
  else {
    logger.info('[Image Extractor] Using generic image extractor');
    images = extractGenericProductImages(html);
  }

  logger.info(`[Image Extractor] Final image count: ${images.length}`);
  if (images.length > 0) {
    logger.info(`[Image Extractor] First image: ${images[0]}`);
  }

  return images;
}
