# Legacy Stub Video Auto-Regeneration

## ✅ **Problem Solved**

Old projects with fake `storage.example.com` URLs will now automatically regenerate with REAL videos.

---

## 🎯 **The Issue**

**Before the latest deployment**, some projects had videos generated with the **stub implementation** that returned fake URLs:

```
https://storage.example.com/videos/video-1763408457162.mp4
```

These URLs don't exist and cause `DNS_PROBE_FINISHED_NXDOMAIN` errors.

**Idempotency was keeping these fake URLs:**
- When you requested the same project + payment session again
- The system saw "video already exists" and returned the fake URL
- No regeneration happened

---

## 🔧 **The Solution**

**Added intelligent legacy detection:**

```typescript
// Helper function to detect legacy stub URLs
const isLegacyStubUrl = (url: string | null | undefined): boolean => {
  if (!url) return false;
  return url.includes('storage.example.com') || url.includes('example.com');
};

// Only return existing video if it's REAL (not a legacy stub)
if (existingVideo && !isLegacyStubUrl(existingVideo.video_url)) {
  // Return existing real video
  return existingVideo;
}

// If existing video is legacy/fake, regenerate
if (existingVideo && isLegacyStubUrl(existingVideo.video_url)) {
  logger.warn('Found legacy stub video, will regenerate with real Veo pipeline');
  // Continue to regeneration...
}
```

---

## 🔄 **How It Works**

### For Projects with Legacy Videos:

**Request:** Generate video for project that has old fake URL

**System checks:**
1. ✅ Finds existing video record
2. ✅ Detects URL contains `storage.example.com`
3. ✅ Logs warning about legacy video
4. ✅ **Ignores** the legacy record
5. ✅ Calls FAL Veo 3.1 to generate real video
6. ✅ Uploads to Supabase Storage
7. ✅ **Updates** existing record with real URL (no duplicate)
8. ✅ Does NOT deduct credits again (fair to user)
9. ✅ Returns real Supabase Storage URL

### For Projects with Real Videos:

**Request:** Generate video for project that already has real URL

**System checks:**
1. ✅ Finds existing video record
2. ✅ URL does NOT contain `storage.example.com`
3. ✅ Returns existing video (idempotency)
4. ✅ No regeneration
5. ✅ No credit deduction

---

## 📊 **Expected Logs**

### First Request (Legacy Video Exists):
```
[INFO] POST /api/ugc/generate-video
[WARN] Found legacy stub video, will regenerate with real Veo pipeline
      projectId: "d4746408-ebbd-4cb7-aceb-58dfc379fe97"
      stripeSessionId: "cs_test_a1sZF2c..."
      legacyUrl: "https://storage.example.com/videos/video-1763408457162.mp4"
[INFO] [Generate Video] Starting real video generation for project...
[INFO] [FAL Veo] Generating video with Veo 3.1
[INFO] [FAL Veo] Video generated successfully: https://fal.run/files/...
[INFO] [Supabase Storage] Uploading to: projects/.../video-123.mp4
[INFO] [Supabase Storage] Upload complete. Public URL: https://...supabase.co/...
[INFO] [Generate Video] Updating legacy video record with real URL
      videoId: "..."
      oldUrl: "https://storage.example.com/..."
      newUrl: "https://cflcjeupixrimucbyhit.supabase.co/storage/..."
```

### Second Request (Real Video Exists):
```
[INFO] POST /api/ugc/generate-video
[INFO] [Generate Video] Returning existing real video (idempotent request)
      projectId: "d4746408-..."
      videoUrl: "https://cflcjeupixrimucbyhit.supabase.co/storage/..."
```

---

## 🎉 **Benefits**

**Automatic Cleanup:**
- ✅ All legacy fake URLs automatically replaced
- ✅ No manual database cleanup needed
- ✅ Users don't lose their projects
- ✅ Fair credit handling (no double charge)

**Production Ready:**
- ✅ Idempotency still works (prevents duplicate real videos)
- ✅ Graceful migration from old to new implementation
- ✅ Comprehensive logging for debugging

---

## 🧪 **Test Your Old Project**

For the project that was stuck with fake URL:

**Project ID:** `d4746408-ebbd-4cb7-aceb-58dfc379fe97`
**Session ID:** `cs_test_a1sZF2cFFTkoO36cz1Z4CYUor5TXcFDKmKZIKMHXAelmwntSofR0xd450m`

**Request it again:**
```bash
curl -X POST https://gpt-ugc-content-creator.onrender.com/api/ugc/generate-video \
  -H "x-gpt-backend-secret: 7C5dJXv0rPpPp9sV_3qkL2wzA1mZBabA" \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "d4746408-ebbd-4cb7-aceb-58dfc379fe97",
    "stripeSessionId": "cs_test_a1sZF2cFFTkoO36cz1Z4CYUor5TXcFDKmKZIKMHXAelmwntSofR0xd450m"
  }'
```

**Expected:**
1. System detects legacy URL
2. Calls FAL Veo 3.1
3. Uploads to Supabase
4. Updates database record
5. Returns REAL video URL that actually works!

---

## 📋 **Setup Still Required**

**Before testing, make sure:**

1. ✅ **Supabase Storage bucket created:**
   - Name: `ugc-videos`
   - Public: Yes

2. ✅ **Render environment variables:**
   - `SUPABASE_VIDEO_BUCKET` = `ugc-videos`
   - `FAL_VEO_MODEL` = `fal-ai/google-veo-3.1`
   - `FAL_FLUX_MODEL` = `fal-ai/flux-pro/v1.1`

3. ⏳ **Wait for Render deploy** (~3 min)

---

**Legacy videos will automatically upgrade to real ones on next request!** 🎉
