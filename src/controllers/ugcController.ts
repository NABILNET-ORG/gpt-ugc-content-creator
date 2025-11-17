import { Request, Response } from 'express';
import { sendSuccess, sendError } from '../utils/responses';
import { validateRequired, validateUrl } from '../utils/validation';
import { AppError } from '../utils/error';
import { logger } from '../config/logger';

import { scrapeProduct } from '../services/firecrawlService';
import { generateAvatar } from '../services/avatarService';
import { generateScript } from '../services/scriptService';
import { generateVideoFromAvatarAndScript } from '../services/videoService';
import { getOrCreateUser } from '../services/userService';
import { createProject, getProject, updateProjectAssets, updateProjectStatus } from '../services/projectService';
import { getPaymentBySessionId } from '../services/paymentService';
import { getVideoByProjectAndSession, createVideo, decrementUserCredits, getUserCredits } from '../db/queries';
import { AvatarSettings } from '../types';

// POST /api/ugc/scrape-product
export async function scrapeProductHandler(req: Request, res: Response): Promise<void> {
  try {
    const { productUrl } = req.body;

    validateRequired(productUrl, 'productUrl');
    validateUrl(productUrl, 'productUrl');

    const result = await scrapeProduct(productUrl);

    sendSuccess(res, {
      productUrl,
      images: result.images,
      metadata: result.metadata,
    });
  } catch (error: any) {
    logger.error('Error in scrapeProduct:', error);
    if (error instanceof AppError) {
      sendError(res, error.statusCode, error.errorCode, error.message, error.details);
    } else {
      sendError(res, 500, 'INTERNAL_ERROR', 'An error occurred while scraping the product');
    }
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
    if (existingVideo) {
      logger.info('Returning existing video (idempotent request)', { projectId, stripeSessionId });
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

    // Get project
    const project = await getProject(projectId);

    if (!project.script_text || !project.avatar_settings) {
      throw new AppError(400, 'ASSETS_NOT_READY', 'Project assets are not ready. Call /prepare-assets first.');
    }

    // Generate video
    const videoResult = await generateVideoFromAvatarAndScript({
      avatarImageUrls: [], // Avatar images would be stored in project or retrieved
      scriptText: project.script_text,
      durationSeconds: 8,
    });

    // Create video record
    await createVideo({
      projectId,
      videoUrl: videoResult.videoUrl,
      thumbnailUrl: videoResult.thumbnailUrl,
      durationSeconds: videoResult.durationSeconds,
      stripeSessionId,
    });

    // Decrement user credits (optional - depends on credit model)
    // await decrementUserCredits(payment.user_id, 1);

    // Update project status
    await updateProjectStatus(projectId, 'video_ready');

    const creditsRemaining = await getUserCredits(payment.user_id);

    sendSuccess(res, {
      projectId,
      videoUrl: videoResult.videoUrl,
      thumbnailUrl: videoResult.thumbnailUrl,
      durationSeconds: videoResult.durationSeconds,
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
