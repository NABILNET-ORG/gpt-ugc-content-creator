import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from './env';
import { logger } from './logger';

// Validate Gemini API key on startup
if (!env.GEMINI_API_KEY) {
  logger.error('[Gemini] API key is missing!');
  throw new Error('GEMINI_API_KEY environment variable is required');
}

// Log partial key for debugging (first 8 characters only)
logger.info(`[Gemini] Configured with key: ${env.GEMINI_API_KEY.substring(0, 8)}...`);

// Initialize Google Generative AI client
const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);

export function getGeminiModel(modelName: string = 'gemini-1.5-flash') {
  return genAI.getGenerativeModel({ model: modelName });
}

export { genAI };
