import { env } from '../config/env';
import { logger } from '../config/logger';
import { AppError } from '../utils/error';
import { AvatarSettings } from '../types';

export interface AvatarGenerationResult {
  avatarImageUrls: string[];
}

const FAL_FLUX_MODEL = process.env.FAL_FLUX_MODEL || 'fal-ai/flux-pro/v1.1';

/**
 * Generate avatar image using FAL.ai Flux Pro
 * Creates a realistic human avatar based on settings and product images
 */
export async function generateAvatar(
  productImages: string[],
  avatarSettings: AvatarSettings
): Promise<AvatarGenerationResult> {
  try {
    logger.info('[Avatar Generation] Starting avatar generation');
    logger.info('[Avatar Generation] Settings:', avatarSettings);

    // Build prompt based on avatar settings
    const prompt = buildAvatarPrompt(avatarSettings, productImages);

    logger.info(`[Avatar Generation] Generated prompt: ${prompt}`);

    // Call FAL.ai Flux Pro for avatar generation
    const response = await fetch(`https://fal.run/${FAL_FLUX_MODEL}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Key ${env.FAL_API_KEY}`,
      },
      body: JSON.stringify({
        prompt,
        image_size: 'portrait_4_3',
        num_images: 1,
        enable_safety_checker: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      logger.error(`[Avatar Generation] FAL request failed: ${response.status}`, errorText);

      // Fallback to product image if generation fails
      logger.warn('[Avatar Generation] Falling back to product image');
      return {
        avatarImageUrls: productImages.length > 0
          ? [productImages[0]]
          : ['https://via.placeholder.com/512x512.png?text=Avatar'],
      };
    }

    const data: any = await response.json();
    logger.info('[Avatar Generation] FAL response received');

    // Extract image URLs from response
    const avatarImageUrls: string[] = [];

    if (data.images && Array.isArray(data.images)) {
      for (const img of data.images) {
        if (img.url) {
          avatarImageUrls.push(img.url);
        }
      }
    } else if (data.image && data.image.url) {
      avatarImageUrls.push(data.image.url);
    } else if (data.url) {
      avatarImageUrls.push(data.url);
    }

    if (avatarImageUrls.length === 0) {
      logger.warn('[Avatar Generation] No images in FAL response, using product image');
      return {
        avatarImageUrls: productImages.length > 0
          ? [productImages[0]]
          : ['https://via.placeholder.com/512x512.png?text=Avatar'],
      };
    }

    logger.info(`[Avatar Generation] Successfully generated ${avatarImageUrls.length} avatar images`);
    logger.info(`[Avatar Generation] First avatar URL: ${avatarImageUrls[0]}`);

    return {
      avatarImageUrls,
    };
  } catch (error: any) {
    logger.error('[Avatar Generation] Error:', error.message);

    // Graceful fallback - use product image
    logger.warn('[Avatar Generation] Falling back to product image due to error');
    return {
      avatarImageUrls: productImages.length > 0
        ? [productImages[0]]
        : ['https://via.placeholder.com/512x512.png?text=Avatar'],
    };
  }
}

/**
 * Build avatar generation prompt based on settings
 */
function buildAvatarPrompt(settings: AvatarSettings, productImages: string[]): string {
  const parts: string[] = [];

  // Start with base
  parts.push('Professional UGC content creator portrait photo');

  // Gender
  if (settings.gender) {
    parts.push(`${settings.gender} person`);
  } else {
    parts.push('person');
  }

  // Ethnicity/appearance
  if (settings.ethnicity) {
    parts.push(`${settings.ethnicity} appearance`);
  }

  // Vibe/style
  if (settings.vibe) {
    parts.push(`${settings.vibe} style`);
  } else {
    parts.push('casual friendly style');
  }

  // Background
  if (settings.background) {
    parts.push(`${settings.background} background`);
  } else {
    parts.push('modern clean background');
  }

  // Quality modifiers
  parts.push('high quality, professional lighting, sharp focus, realistic');
  parts.push('looking at camera, friendly expression, approachable');

  const prompt = parts.join(', ');

  return prompt;
}
