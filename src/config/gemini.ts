import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from './env';
import { logger } from './logger';

// Use environment variable for model ID, with production-ready default
// gemini-2.0-flash-exp is the latest and fastest model
const GEMINI_MODEL_ID = process.env.GEMINI_MODEL_ID?.trim() || 'gemini-2.0-flash-exp';

// Validate Gemini API key on startup
if (!env.GEMINI_API_KEY) {
  logger.error('[Gemini] API key is missing!');
  throw new Error('GEMINI_API_KEY environment variable is required');
}

// Initialize Google Generative AI client
let genAI: GoogleGenerativeAI | null = null;

try {
  genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
  logger.info(`[Gemini] Configured with key: ${env.GEMINI_API_KEY.substring(0, 8)}...`);
  logger.info(`[Gemini] Using model: ${GEMINI_MODEL_ID}`);
} catch (error: any) {
  logger.error('[Gemini] Failed to initialize Gemini client:', error.message);
  genAI = null;
}

export function getGeminiModel() {
  if (!genAI) {
    throw new Error('Gemini client is not initialized');
  }

  return genAI.getGenerativeModel({
    model: GEMINI_MODEL_ID,
  });
}

export { genAI };
