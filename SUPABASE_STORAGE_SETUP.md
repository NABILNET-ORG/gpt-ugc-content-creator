# Supabase Storage Setup for Videos

## 🎯 **Required: Create Storage Bucket**

Your video service now uses **real FAL Veo 3.1 video generation** and stores videos in **Supabase Storage**.

Before it works, you need to create the storage bucket.

---

## ✅ **Quick Setup (2 minutes)**

### Step 1: Go to Supabase Storage

1. Open: **https://cflcjeupixrimucbyhit.supabase.co**
2. Click **"Storage"** in the left sidebar
3. Click **"Create a new bucket"**

### Step 2: Create Bucket

**Bucket settings:**
- **Name:** `ugc-videos`
- **Public bucket:** ✅ **Yes** (check this box)
- **File size limit:** 100 MB (or higher if needed)
- **Allowed MIME types:** Leave empty or add: `video/mp4`

Click **"Create bucket"**

### Step 3: Set Bucket Policies (Optional but Recommended)

Click on the `ugc-videos` bucket → **Policies** tab

**Add policy for public read access:**
```sql
-- Allow public read access to all videos
CREATE POLICY "Public read access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'ugc-videos');

-- Allow service role to upload
CREATE POLICY "Service role upload"
ON storage.objects FOR INSERT
TO service_role
WITH CHECK (bucket_id = 'ugc-videos');

-- Allow service role to delete
CREATE POLICY "Service role delete"
ON storage.objects FOR DELETE
TO service_role
USING (bucket_id = 'ugc-videos');
```

---

## 🔧 **Environment Variables**

These are already set in your `.env`:
- ✅ `SUPABASE_URL` = Your Supabase project URL
- ✅ `SUPABASE_SERVICE_ROLE_KEY` = Your service role key
- ✅ `SUPABASE_VIDEO_BUCKET` = `ugc-videos`
- ✅ `FAL_VEO_MODEL` = `fal-ai/google-veo-3.1`

**For Render deployment, add these 2 new variables:**
- `SUPABASE_VIDEO_BUCKET` = `ugc-videos`
- `FAL_VEO_MODEL` = `fal-ai/google-veo-3.1`

---

## 🎬 **How Video Generation Now Works**

**Complete Pipeline:**

1. **User calls** `/api/ugc/generate-video`
   ```json
   {
     "projectId": "abc-123",
     "stripeSessionId": "cs_test_..."
   }
   ```

2. **Backend verifies payment** is "paid"

3. **Backend calls FAL.ai Veo 3.1:**
   - Sends: avatar image + script
   - FAL generates: video (hosted on FAL's CDN temporarily)
   - Returns: temporary video URL

4. **Backend downloads video** from FAL URL

5. **Backend uploads to Supabase Storage:**
   - Bucket: `ugc-videos`
   - Path: `projects/{projectId}/{userId}/video-{timestamp}.mp4`
   - Gets public URL

6. **Backend saves to database:**
   - Updates `videos` table with final URL
   - Deducts user credits

7. **Returns response:**
   ```json
   {
     "success": true,
     "data": {
       "videoUrl": "https://cflcjeupixrimucbyhit.supabase.co/storage/v1/object/public/ugc-videos/projects/abc-123/user-456/video-1234567890.mp4",
       "projectId": "abc-123",
       "creditsRemaining": 0
     }
   }
   ```

---

## ✅ **Video Service Features**

**Real implementation includes:**
- ✅ FAL.ai Veo 3.1 API integration
- ✅ Supabase Storage upload
- ✅ Unique filenames with timestamps
- ✅ Public URL generation
- ✅ Comprehensive logging
- ✅ Error handling at each step
- ✅ No more fake `storage.example.com` URLs!

---

## 🧪 **Test After Setup**

After creating the bucket:

```bash
curl -X POST https://gpt-ugc-content-creator.onrender.com/api/ugc/generate-video \
  -H "x-gpt-backend-secret: 7C5dJXv0rPpPp9sV_3qkL2wzA1mZBabA" \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "YOUR_PROJECT_ID",
    "stripeSessionId": "YOUR_PAID_SESSION_ID"
  }'
```

**Expected logs:**
```
[FAL Veo] Generating video with Veo 3.1
[FAL Veo] Video generated successfully: https://fal.run/files/...
[Supabase Storage] Downloading video from: https://fal.run/files/...
[Supabase Storage] Downloaded 12345678 bytes
[Supabase Storage] Uploading to: projects/.../video-123.mp4
[Supabase Storage] Upload complete. Public URL: https://...supabase.co/storage/...
[Video Generation] Complete pipeline finished successfully
```

**Expected response:**
```json
{
  "success": true,
  "data": {
    "videoUrl": "https://cflcjeupixrimucbyhit.supabase.co/storage/v1/object/public/ugc-videos/projects/.../video-123.mp4",
    ...
  }
}
```

And the URL will actually work! 🎉

---

## 📋 **Checklist**

- [ ] Create `ugc-videos` bucket in Supabase Storage
- [ ] Set bucket to public
- [ ] Add bucket policies (optional)
- [ ] Add `SUPABASE_VIDEO_BUCKET` to Render env vars
- [ ] Add `FAL_VEO_MODEL` to Render env vars
- [ ] Test video generation
- [ ] Verify video URL is accessible

---

**Create the storage bucket and real video generation will work!** 🎬
