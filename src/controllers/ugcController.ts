import { Request, Response } from 'express';
import { sendSuccess, sendError } from '../utils/responses';
import { validateRequired, validateUrl } from '../utils/validation';
import { AppError } from '../utils/error';
import { logger } from '../config/logger';

import { fetchPageWithScraperApi } from '../services/scraperApiService';
import { analyzeHtmlWithGemini } from '../services/geminiScraperService';
import { generateAvatar } from '../services/avatarService';
import { generateScript } from '../services/scriptService';
import { generateVideoWithVeoAndSupabase } from '../services/videoService';
import { getOrCreateUser } from '../services/userService';
import { createProject, getProject, updateProjectAssets, updateProjectStatus } from '../services/projectService';
import { getPaymentBySessionId } from '../services/paymentService';
import { getVideoByProjectAndSession, createVideo, decrementUserCredits, getUserCredits, findUserByExternalId } from '../db/queries';
import { AvatarSettings } from '../types';
import { supabase } from '../config/supabase';

// POST /api/ugc/scrape-product
export async function scrapeProductHandler(req: Request, res: Response): Promise<void> {
  try {
    const { productUrl } = req.body;

    // Validate input
    if (!productUrl || typeof productUrl !== 'string' || !productUrl.trim()) {
      sendError(res, 400, 'INVALID_REQUEST', "Missing or invalid 'productUrl'.");
      return;
    }

    validateUrl(productUrl, 'productUrl');

    logger.info(`[ScrapeProduct] Processing request for: ${productUrl}`);

    // Step 1: Fetch HTML with ScraperAPI
    const scraperResult = await fetchPageWithScraperApi(productUrl);

    // Check if HTML is empty or too short
    if (!scraperResult.html || scraperResult.html.length < 100) {
      logger.warn(`[ScrapeProduct] HTML is empty or too short (${scraperResult.html.length} chars)`);
      res.status(200).json({
        ok: true,
        product: {
          url: productUrl,
          title: null,
          description: null,
          images: [],
        },
        warning: 'EMPTY_HTML_FROM_SCRAPERAPI',
      });
      return;
    }

    // Step 2: Analyze HTML with Gemini
    const geminiProduct = await analyzeHtmlWithGemini(productUrl, scraperResult.html);

    // Build response
    const responseBody: any = {
      ok: true,
      product: {
        url: geminiProduct.url,
        title: geminiProduct.title,
        description: geminiProduct.description,
        images: geminiProduct.images,
      },
    };

    // Add warning if no images found
    if (geminiProduct.images.length === 0) {
      responseBody.warning = 'NO_IMAGES_FOUND';
    }

    logger.info(`[ScrapeProduct] Successfully scraped product. Images: ${geminiProduct.images.length}, Title: ${!!geminiProduct.title}`);

    res.status(200).json(responseBody);
  } catch (error: any) {
    logger.error('[ScrapeProduct] Error:', error.message);

    if (error instanceof AppError) {
      res.status(error.statusCode).json({
        ok: false,
        error: error.errorCode,
        details: error.message,
      });
      return;
    }

    res.status(500).json({
      ok: false,
      error: 'SCRAPE_PRODUCT_FAILED',
      details: 'An unexpected error occurred while scraping the product.',
    });
  }
}

// POST /api/ugc/prepare-assets
export async function prepareAssetsHandler(req: Request, res: Response): Promise<void> {
  try {
    const {
      userExternalId,
      productUrl,
      selectedImageUrls,
      avatarSettings,
      tone,
      targetAudience,
      platform,
    } = req.body;

    // Validate required fields
    validateRequired(userExternalId, 'userExternalId');
    validateRequired(productUrl, 'productUrl');
    validateUrl(productUrl, 'productUrl');

    // Get or create user
    const user = await getOrCreateUser(userExternalId);

    // Create project
    const project = await createProject(user.id, productUrl);

    // Generate script
    const metadata = {
      title: req.body.metadata?.title,
      description: req.body.metadata?.description,
    };
    const script = await generateScript(
      metadata,
      tone || 'enthusiastic',
      targetAudience || 'Gen Z',
      platform || 'tiktok'
    );

    // Generate avatar
    const avatarResult = await generateAvatar(
      selectedImageUrls || [],
      avatarSettings || {}
    );

    // Update project with assets
    await updateProjectAssets(project.id, avatarSettings || {}, script);

    // Calculate approx duration (rough estimate: 150 words per minute for speech)
    const wordCount = script.split(/\s+/).length;
    const approxDurationSeconds = Math.ceil((wordCount / 150) * 60);

    sendSuccess(res, {
      projectId: project.id,
      avatarImages: avatarResult.avatarImageUrls,
      script: {
        raw: script,
        approxDurationSeconds,
      },
    });
  } catch (error: any) {
    logger.error('Error in prepareAssets:', error);
    if (error instanceof AppError) {
      sendError(res, error.statusCode, error.errorCode, error.message, error.details);
    } else {
      sendError(res, 500, 'INTERNAL_ERROR', 'An error occurred while preparing assets');
    }
  }
}

// POST /api/ugc/generate-video
export async function generateVideoHandler(req: Request, res: Response): Promise<void> {
  try {
    const { projectId, stripeSessionId } = req.body;

    validateRequired(projectId, 'projectId');
    validateRequired(stripeSessionId, 'stripeSessionId');

    // Verify payment is paid
    const payment = await getPaymentBySessionId(stripeSessionId);
    if (payment.status !== 'paid') {
      sendError(res, 402, 'PAYMENT_REQUIRED', 'Payment not confirmed');
      return;
    }

    // Check for idempotency - existing video for this project + session
    const existingVideo = await getVideoByProjectAndSession(projectId, stripeSessionId);

    // Helper function to detect legacy stub URLs
    const isLegacyStubUrl = (url: string | null | undefined): boolean => {
      if (!url) return false;
      return url.includes('storage.example.com') || url.includes('example.com');
    };

    // Only return existing video if it's REAL (not a legacy stub)
    if (existingVideo && !isLegacyStubUrl(existingVideo.video_url)) {
      logger.info('[Generate Video] Returning existing real video (idempotent request)', {
        projectId,
        stripeSessionId,
        videoUrl: existingVideo.video_url
      });
      const creditsRemaining = await getUserCredits(payment.user_id);
      sendSuccess(res, {
        projectId,
        videoUrl: existingVideo.video_url,
        thumbnailUrl: existingVideo.thumbnail_url,
        durationSeconds: existingVideo.duration_seconds,
        creditsRemaining,
      });
      return;
    }

    // If existing video is legacy/fake, log it and regenerate
    if (existingVideo && isLegacyStubUrl(existingVideo.video_url)) {
      logger.warn('[Generate Video] Found legacy stub video, will regenerate with real Veo pipeline', {
        projectId,
        stripeSessionId,
        legacyUrl: existingVideo.video_url
      });
      // Continue to regeneration below...
    }

    // Get project
    const project = await getProject(projectId);

    if (!project.script_text || !project.avatar_settings) {
      throw new AppError(400, 'ASSETS_NOT_READY', 'Project assets are not ready. Call /prepare-assets first.');
    }

    // Get user
    const user = await findUserByExternalId(payment.user_id);
    if (!user) {
      throw new AppError(404, 'USER_NOT_FOUND', 'User not found');
    }

    // Use placeholder avatar image (will be replaced when avatar generation is implemented)
    const avatarImageUrl = 'https://via.placeholder.com/512x512.png?text=Avatar';

    logger.info(`[Generate Video] Starting real video generation for project ${projectId}`);

    // Generate video with REAL Veo 3.1 + Supabase pipeline
    const videoResult = await generateVideoWithVeoAndSupabase({
      projectId,
      userExternalId: user.external_id,
      avatarImageUrl,
      script: project.script_text,
      aspectRatio: '9:16',
      durationSeconds: 30,
    });

    logger.info(`[Generate Video] Video generated and uploaded: ${videoResult.publicUrl}`);

    // If there was a legacy video, we update it; otherwise create new
    if (existingVideo) {
      logger.info('[Generate Video] Updating legacy video record with real URL', {
        videoId: existingVideo.id,
        oldUrl: existingVideo.video_url,
        newUrl: videoResult.publicUrl
      });

      // Update existing video record with real URL
      const { error } = await supabase
        .from('videos')
        .update({
          video_url: videoResult.publicUrl,
          thumbnail_url: null,
          duration_seconds: 30,
        })
        .eq('id', existingVideo.id);

      if (error) {
        logger.error('[Generate Video] Failed to update video record', error);
        throw new AppError(500, 'DATABASE_ERROR', 'Failed to update video record');
      }
    } else {
      // Create new video record
      await createVideo({
        projectId,
        videoUrl: videoResult.publicUrl,
        thumbnailUrl: undefined,
        durationSeconds: 30,
        stripeSessionId,
      });
    }

    // Decrement user credits (only if this is a new generation, not an update)
    if (!existingVideo) {
      await decrementUserCredits(payment.user_id, 1);
    }

    // Update project status
    await updateProjectStatus(projectId, 'video_ready');

    const creditsRemaining = await getUserCredits(payment.user_id);

    sendSuccess(res, {
      projectId,
      videoUrl: videoResult.publicUrl,
      storagePath: videoResult.storagePath,
      durationSeconds: 30,
      creditsRemaining,
    });
  } catch (error: any) {
    logger.error('Error in generateVideo:', error);
    if (error instanceof AppError) {
      sendError(res, error.statusCode, error.errorCode, error.message, error.details);
    } else {
      sendError(res, 500, 'INTERNAL_ERROR', 'An error occurred while generating video');
    }
  }
}
