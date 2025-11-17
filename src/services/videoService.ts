import { createClient } from '@supabase/supabase-js';
import { env } from '../config/env';
import { logger } from '../config/logger';
import { AppError } from '../utils/error';

const supabaseUrl = env.SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseBucket = process.env.SUPABASE_VIDEO_BUCKET || 'ugc-videos';

const falApiKey = env.FAL_API_KEY;
const falModel = process.env.FAL_VEO_MODEL || 'fal-ai/google-veo-3.1';

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase env vars');
}

if (!falApiKey) {
  throw new Error('Missing FAL_API_KEY');
}

const supabase = createClient(supabaseUrl, supabaseKey);

export interface VideoGenerationInput {
  avatarImageUrls: string[];
  scriptText: string;
  durationSeconds?: number;
}

export interface VideoGenerationResult {
  videoUrl: string;
  thumbnailUrl?: string;
  durationSeconds: number;
}

export interface GenerateVideoInput {
  projectId: string;
  userExternalId: string;
  avatarImageUrl: string;
  script: string;
  aspectRatio?: string;
  durationSeconds?: number;
}

/**
 * Call FAL.ai Veo 3.1 API to generate video from image + script
 */
async function callFalVeo({
  avatarImageUrl,
  script,
  aspectRatio,
  durationSeconds,
}: Pick<GenerateVideoInput, 'avatarImageUrl' | 'script' | 'aspectRatio' | 'durationSeconds'>): Promise<string> {
  try {
    logger.info('[FAL Veo] Generating video with Veo 3.1');
    logger.info(`[FAL Veo] Avatar image: ${avatarImageUrl}`);
    logger.info(`[FAL Veo] Script length: ${script.length} characters`);
    logger.info(`[FAL Veo] Duration: ${durationSeconds || 30} seconds`);

    const body = {
      input: {
        prompt: script,
        image_url: avatarImageUrl,
        aspect_ratio: aspectRatio || '9:16',
        duration: durationSeconds || 30,
      },
    };

    logger.info(`[FAL Veo] Calling FAL API: ${falModel}`);

    const res = await fetch(`https://fal.run/${falModel}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Key ${falApiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      logger.error(`[FAL Veo] Request failed: ${res.status} ${res.statusText}`, text);
      throw new Error(`FAL Veo request failed: ${res.status} ${res.statusText}`);
    }

    const json: any = await res.json();
    logger.info('[FAL Veo] Response received:', JSON.stringify(json, null, 2).substring(0, 500));

    // Extract video URL from response (try multiple possible locations)
    const videoUrl =
      json.video?.url ||
      json.output?.video?.url ||
      json.output?.video_url ||
      json.output?.[0]?.url ||
      json.data?.video_url;

    if (!videoUrl || typeof videoUrl !== 'string') {
      logger.error('[FAL Veo] Response missing video URL. Full response:', json);
      throw new Error('FAL Veo response missing video URL');
    }

    logger.info(`[FAL Veo] Video generated successfully: ${videoUrl}`);
    return videoUrl;
  } catch (error: any) {
    logger.error('[FAL Veo] Error:', error.message);
    throw new AppError(500, 'VIDEO_GENERATION_ERROR', `Failed to generate video: ${error.message}`);
  }
}

/**
 * Upload video from remote URL to Supabase Storage
 */
async function uploadVideoToSupabase(
  projectId: string,
  userExternalId: string,
  remoteVideoUrl: string,
): Promise<{ storagePath: string; publicUrl: string }> {
  try {
    logger.info(`[Supabase Storage] Downloading video from: ${remoteVideoUrl}`);

    // Download video from FAL
    const response = await fetch(remoteVideoUrl);
    if (!response.ok) {
      const text = await response.text().catch(() => '');
      throw new Error(`Failed to download video: ${response.status} ${text}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    logger.info(`[Supabase Storage] Downloaded ${buffer.length} bytes`);

    // Generate unique filename
    const fileName = `video-${Date.now()}-${Math.random().toString(36).slice(2)}.mp4`;
    const filePath = `projects/${projectId}/${userExternalId}/${fileName}`;

    logger.info(`[Supabase Storage] Uploading to: ${filePath}`);

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from(supabaseBucket)
      .upload(filePath, buffer, {
        contentType: 'video/mp4',
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      logger.error('[Supabase Storage] Upload failed:', uploadError);
      throw new Error(`Supabase upload failed: ${uploadError.message}`);
    }

    // Get public URL
    const { data } = supabase.storage
      .from(supabaseBucket)
      .getPublicUrl(filePath);

    if (!data?.publicUrl) {
      throw new Error('Failed to get public URL from Supabase');
    }

    logger.info(`[Supabase Storage] Upload complete. Public URL: ${data.publicUrl}`);

    return {
      storagePath: filePath,
      publicUrl: data.publicUrl,
    };
  } catch (error: any) {
    logger.error('[Supabase Storage] Error:', error.message);
    throw new AppError(500, 'STORAGE_ERROR', `Failed to upload video: ${error.message}`);
  }
}

/**
 * Generate video using FAL Veo 3.1 and upload to Supabase Storage
 */
export async function generateVideoWithVeoAndSupabase(
  input: GenerateVideoInput,
): Promise<{ publicUrl: string; storagePath: string }> {
  logger.info('[Video Generation] Starting video generation pipeline');
  logger.info(`[Video Generation] Project: ${input.projectId}, User: ${input.userExternalId}`);

  // Step 1: Generate video with FAL Veo
  const videoUrl = await callFalVeo({
    avatarImageUrl: input.avatarImageUrl,
    script: input.script,
    aspectRatio: input.aspectRatio,
    durationSeconds: input.durationSeconds,
  });

  // Step 2: Upload to Supabase Storage
  const uploaded = await uploadVideoToSupabase(
    input.projectId,
    input.userExternalId,
    videoUrl,
  );

  logger.info('[Video Generation] Complete pipeline finished successfully');

  return uploaded;
}

/**
 * Legacy function for backward compatibility
 * @deprecated Use generateVideoWithVeoAndSupabase instead
 */
export async function generateVideoFromAvatarAndScript(
  input: VideoGenerationInput,
): Promise<VideoGenerationResult> {
  // This is a stub for backward compatibility
  // Real implementation should use generateVideoWithVeoAndSupabase
  logger.warn('[Video Service] Using legacy stub function - should migrate to generateVideoWithVeoAndSupabase');

  return {
    videoUrl: `https://storage.example.com/videos/video-${Date.now()}.mp4`,
    thumbnailUrl: `https://storage.example.com/videos/video-${Date.now()}-thumb.jpg`,
    durationSeconds: input.durationSeconds || 8,
  };
}
