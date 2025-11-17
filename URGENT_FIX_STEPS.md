# ⚡ URGENT: Fix 404 Error - 2 Steps Required

## 🚨 **Why You're Still Getting 404**

The fix is already in the code (pushed to GitHub), but you need to:

1. ✅ **Update Render environment variable** - Most important!
2. ⏳ **Wait for Render to deploy** the latest code

---

## 🔧 **STEP 1: Update Environment Variable in Render (2 minutes)**

**This is CRITICAL - do this NOW:**

1. Go to: **https://dashboard.render.com**
2. Click your service: `gpt-ugc-content-creator`
3. Click **"Environment"** tab
4. Find `FAL_VEO_MODEL`

**If it exists:**
- Click **Edit**
- Change value from: `fal-ai/google-veo-3.1` ❌
- To: `fal-ai/veo3/fast/image-to-video` ✅
- Click **Save**

**If it doesn't exist:**
- Click **"Add Environment Variable"**
- Key: `FAL_VEO_MODEL`
- Value: `fal-ai/veo3/fast/image-to-video`
- Click **Add**

**This will trigger auto-deploy automatically!**

---

## ⏳ **STEP 2: Wait for Deployment (3 minutes)**

After saving the environment variable:

1. Render will automatically redeploy
2. Go to **"Events"** or **"Logs"** tab
3. Watch for:
   ```
   ==> Build succeeded ✓
   ==> Starting service...
   ==> Live
   ```

**Timeline:**
- 0-2 min: Building
- 2-3 min: Deploying
- 3+ min: **Live and ready**

---

## 🧪 **STEP 3: Test Again (After Deploy)**

Once you see **"Live"** status:

**Option 1: Retry with your existing project (recommended)**

Just click "Generate Video" again in your Custom GPT.

**Same project ID:**
```
d53f28d5-e5e2-4af9-9cb3-cde3fec8f401
```

**Same payment session:**
```
cs_test_a1LXjtFoWtdeQuuwbGaOv0Hl6pHiaX66V4hSF1rua6JzTBiZpxTdZ5p3f5
```

**Expected this time:**
- ✅ No 404 error
- ✅ FAL Veo returns video
- ✅ Video uploads to Supabase
- ✅ **Real URL returned!**

**No need to:**
- ❌ Pay again (already paid)
- ❌ Re-prepare assets (already prepared)
- ❌ Create new project

**Just retry the same generate-video request!**

---

## 📊 **What Will Happen**

### Before (Current - Old Code):
```
[ERROR] FAL Veo request failed: 404 Not Found
Endpoint: https://fal.run/fal-ai/google-veo-3.1  ❌ Wrong
```

### After (New Code - After Deploy):
```
[INFO] [FAL Veo] Calling FAL API: fal-ai/veo3/fast/image-to-video
[INFO] [FAL Veo] Request body: {"prompt":"...","image_url":"...","video_length":5}
[INFO] [FAL Veo] Response status: 200  ✅
[INFO] [FAL Veo] Video generated successfully: https://storage.googleapis.com/...
[INFO] [Supabase Storage] Upload complete. Public URL: https://...supabase.co/...
```

---

## ⏱️ **Timeline**

**Right now:**
1. Update `FAL_VEO_MODEL` in Render (2 min)

**After 3 minutes:**
2. Render finishes deploying

**After 5 minutes:**
3. Test generate-video again
4. Get REAL video URL! 🎬

---

## 🎯 **Quick Action**

**Do this RIGHT NOW:**

1. Open: https://dashboard.render.com
2. Your service → Environment
3. Update/Add: `FAL_VEO_MODEL` = `fal-ai/veo3/fast/image-to-video`
4. Save
5. Wait 3 minutes
6. Retry video generation

**That's it! The 404 will be gone!** ✅

---

**Update the environment variable NOW and wait for deployment!** 🚀
