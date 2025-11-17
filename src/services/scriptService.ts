import { getGeminiModel } from '../config/gemini';
import { logger } from '../config/logger';
import { AppError } from '../utils/error';

const SCRIPT_GENERATION_PROMPT = `You are a professional UGC (User-Generated Content) script writer for social media platforms like TikTok, Instagram, and YouTube Shorts.

Your task is to write engaging, authentic UGC scripts that drive conversions.

You will receive:
- Product title
- Product description
- Target audience
- Platform
- Tone/style

You MUST generate a script with these 3 sections:

[HOOK] - 3-5 seconds, grab attention immediately
[MAIN CONTENT] - 15-20 seconds, showcase product value and features
[CTA] - 3-5 seconds, clear call to action

Rules:
- Write in first person ("I", "my")
- Sound natural and conversational, not scripted
- Use platform-specific language and trends
- Keep it concise (total 25-35 seconds when spoken)
- Focus on benefits, not just features
- Create urgency and FOMO
- End with a strong, clear CTA

Output ONLY the script text, formatted with the 3 section headers as shown above.
Do not include any explanations, metadata, or markdown except the section headers.`;

/**
 * Generate UGC script using Google Gemini AI
 *
 * Creates platform-specific, engaging scripts based on product info and target audience
 */
export async function generateScript(
  metadata: { title?: string; description?: string },
  tone: string,
  targetAudience: string,
  platform: string
): Promise<string> {
  try {
    logger.info('[Script Generation] Starting script generation');
    logger.info('[Script Generation] Product:', metadata.title || 'Unknown');
    logger.info('[Script Generation] Platform:', platform);
    logger.info('[Script Generation] Target:', targetAudience);
    logger.info('[Script Generation] Tone:', tone);

    // Build context for Gemini
    const productName = metadata.title || 'this amazing product';
    const productDesc = metadata.description || 'incredible features and quality';

    const userPrompt = `Generate a UGC script for:

Product: ${productName}
Description: ${productDesc}
Platform: ${platform}
Target Audience: ${targetAudience}
Tone: ${tone}

Generate an engaging, authentic UGC script following the format: [HOOK], [MAIN CONTENT], [CTA].`;

    // Get Gemini model
    const model = getGeminiModel();

    logger.info('[Script Generation] Calling Gemini AI...');

    // Generate script
    const result = await model.generateContent([
      { text: SCRIPT_GENERATION_PROMPT },
      { text: userPrompt },
    ]);

    const response = result.response;
    const script = response.text().trim();

    logger.info(`[Script Generation] Script generated (${script.length} characters)`);
    logger.info(`[Script Generation] Preview: ${script.substring(0, 100)}...`);

    // Validate script has required sections
    if (!script.includes('[HOOK]') || !script.includes('[MAIN CONTENT]') || !script.includes('[CTA]')) {
      logger.warn('[Script Generation] Script missing required sections, reformatting...');

      // Try to extract or reformat
      const formattedScript = reformatScript(script, productName, targetAudience, platform);
      return formattedScript;
    }

    return script;
  } catch (error: any) {
    logger.error('[Script Generation] Error:', error.message);

    // Graceful fallback - return template
    logger.warn('[Script Generation] Falling back to template script');
    return generateFallbackScript(
      metadata.title || 'this product',
      metadata.description || 'amazing features',
      targetAudience,
      platform
    );
  }
}

/**
 * Reformat script to ensure it has required sections
 */
function reformatScript(rawScript: string, productName: string, targetAudience: string, platform: string): string {
  // If script is missing sections, try to split it logically
  const lines = rawScript.split('\n').filter(line => line.trim());

  if (lines.length < 3) {
    return generateFallbackScript(productName, 'great features', targetAudience, platform);
  }

  // Simple heuristic: first 2 lines = hook, middle = content, last 2 = CTA
  const hook = lines.slice(0, 2).join('\n');
  const content = lines.slice(2, -2).join('\n');
  const cta = lines.slice(-2).join('\n');

  return `[HOOK]\n${hook}\n\n[MAIN CONTENT]\n${content}\n\n[CTA]\n${cta}`;
}

/**
 * Generate fallback template script when AI generation fails
 */
function generateFallbackScript(
  productName: string,
  productDesc: string,
  targetAudience: string,
  platform: string
): string {
  return `[HOOK]
Hey ${targetAudience}! You NEED to see this - ${productName} just changed the game!

[MAIN CONTENT]
Okay so I've been using ${productName} for the past week and I'm honestly obsessed. ${productDesc}. The quality is incredible, the price is perfect, and it's exactly what I've been looking for. I can't believe I waited this long to try it!

[CTA]
Link is in my bio - seriously, you're going to love this. Trust me on this one! #${platform} #ugc #productreview #musthave`;
}
