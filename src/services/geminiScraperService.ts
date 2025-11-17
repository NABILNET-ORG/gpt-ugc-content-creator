import { getGeminiModel } from '../config/gemini';
import { logger } from '../config/logger';
import { env } from '../config/env';
import { AppError } from '../utils/error';

export interface GeminiScrapedProduct {
  url: string;
  title: string | null;
  description: string | null;
  images: string[];
  raw?: any;
}

const MAX_HTML_LENGTH = 250000; // ~250k characters for better coverage of large product pages

const SYSTEM_PROMPT = `You are an intelligent HTML analyzer for e-commerce product pages.

I will provide you with:
- The original page URL.
- The full HTML source (possibly truncated) of a web page.

Your job is to analyze the HTML and extract the most important product information.

You MUST respond with a single JSON object, and nothing else, in the following exact shape:

{
  "title": string | null,
  "description": string | null,
  "images": string[]
}

Rules:
- "title": the main product name if you can infer it. If you are not confident, use null.
- "description": a short 1–3 sentence summary of the product (NOT the whole page). If you cannot infer it, use null.
- "images": an array of absolute URLs of ALL distinct product images.
  - Extract between 3 and 10 product image URLs if available.
  - Include the main/hero image AND gallery images that show the product.
  - Do NOT include: logos, brand icons, sprites, rating stars, badges, UI elements, favicons, placeholder images, tracking pixels.
  - Do NOT include: very small images (thumbnails < 80px), social media icons, payment method logos.
  - Prefer large, high-quality product photos that clearly show the product itself.
  - Always return absolute URLs. If you see relative URLs, resolve them against the given page URL.
  - Remove duplicate URLs.
- Do not include any markdown, HTML, comments, or explanation. Only output the JSON object.`;

/**
 * Analyze HTML content using Google Gemini to extract product information.
 *
 * @param url - The original product page URL
 * @param html - The HTML content to analyze
 * @returns Structured product data extracted from HTML
 */
export async function analyzeHtmlWithGemini(
  url: string,
  html: string
): Promise<GeminiScrapedProduct> {
  try {
    logger.info(`[Gemini] Analyzing HTML for URL: ${url}`);

    // Truncate HTML if too large
    const originalLength = html.length;
    const truncatedHtml = html.length > MAX_HTML_LENGTH
      ? html.substring(0, MAX_HTML_LENGTH)
      : html;

    logger.info(`[Gemini] HTML length: original=${originalLength.toLocaleString()}, truncated=${truncatedHtml.length.toLocaleString()}`);

    if (originalLength > MAX_HTML_LENGTH) {
      logger.warn(`[Gemini] HTML truncated from ${originalLength} to ${MAX_HTML_LENGTH} characters`);
    }

    // Prepare the prompt
    const userPrompt = `URL: ${url}\n\nHTML Content:\n${truncatedHtml}`;

    // Get Gemini model (uses gemini-1.5-pro by default)
    const model = getGeminiModel();

    logger.info(`[Gemini] Sending request to Gemini model...`);

    // Generate content
    const result = await model.generateContent([
      { text: SYSTEM_PROMPT },
      { text: userPrompt },
    ]);

    const response = result.response;
    const text = response.text();

    logger.info(`[Gemini] Model response length: ${text.length} characters`);
    logger.info(`[Gemini] Model response (first 500 chars):`, text.substring(0, 500));

    // Parse JSON response
    let parsed: any;
    try {
      // Remove markdown code blocks if present
      let jsonText = text.trim();
      if (jsonText.startsWith('```json')) {
        jsonText = jsonText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (jsonText.startsWith('```')) {
        jsonText = jsonText.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }

      parsed = JSON.parse(jsonText);
    } catch (parseError) {
      logger.error(`[Gemini] Failed to parse JSON response:`, text);
      throw new AppError(500, 'GEMINI_PARSE_ERROR', 'Failed to parse Gemini response as JSON');
    }

    // Validate structure
    if (typeof parsed !== 'object' || parsed === null) {
      throw new AppError(500, 'GEMINI_INVALID_RESPONSE', 'Gemini response is not a valid object');
    }

    // Extract and normalize data
    const title = parsed.title && typeof parsed.title === 'string' && parsed.title.trim()
      ? parsed.title.trim()
      : null;

    const description = parsed.description && typeof parsed.description === 'string' && parsed.description.trim()
      ? parsed.description.trim()
      : null;

    // Normalize images array
    const rawImages = Array.isArray(parsed.images) ? parsed.images : [];
    const images = rawImages
      .filter((img: any) => typeof img === 'string' && img.trim())
      .map((img: string) => img.trim())
      .filter((img: string) => img.startsWith('http')) // Only absolute URLs
      .filter((img: string, index: number, self: string[]) => self.indexOf(img) === index); // Remove duplicates

    logger.info(`[Gemini] Extraction complete:`);
    logger.info(`[Gemini]   - Images: ${images.length}`);
    logger.info(`[Gemini]   - Title: ${title ? `"${title.substring(0, 50)}..."` : 'NULL'}`);
    logger.info(`[Gemini]   - Description: ${description ? `"${description.substring(0, 80)}..."` : 'NULL'}`);

    if (images.length > 0) {
      logger.info(`[Gemini]   - First image: ${images[0]}`);
    }

    return {
      url,
      title,
      description,
      images,
      raw: env.NODE_ENV === 'development' ? parsed : undefined,
    };
  } catch (error: any) {
    if (error instanceof AppError) {
      throw error;
    }

    logger.error(`[Gemini] Analysis error:`, error.message);
    throw new AppError(
      500,
      'GEMINI_ERROR',
      `Failed to analyze HTML with Gemini: ${error.message}`
    );
  }
}
