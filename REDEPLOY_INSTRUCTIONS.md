# 🚀 Manual Redeploy Instructions

## ⚡ **How to Redeploy on Render**

All code is already pushed to GitHub. To trigger a redeploy:

---

## **Method 1: Update Environment Variable (Triggers Auto-Deploy)**

**This is the REQUIRED step anyway:**

1. Go to: **https://dashboard.render.com**
2. Click your service: `gpt-ugc-content-creator`
3. Click **"Environment"** tab
4. **Update or Add:**
   - Key: `FAL_VEO_MODEL`
   - Value: `fal-ai/veo3/fast/image-to-video`
5. Click **"Save Changes"**

**This automatically triggers a redeploy!** ✅

---

## **Method 2: Manual Deploy Button**

1. Go to: **https://dashboard.render.com**
2. Click your service: `gpt-ugc-content-creator`
3. Click **"Manual Deploy"** dropdown (top right)
4. Select **"Deploy latest commit"**
5. Click **"Deploy"**

---

## **Method 3: Trigger via Empty Commit (From Command Line)**

```bash
git commit --allow-empty -m "Trigger redeploy" && git push
```

This pushes an empty commit that triggers auto-deploy.

---

## ⏱️ **Deployment Timeline**

After triggering:
- **0-1 min:** Build starts
- **1-2 min:** TypeScript compilation
- **2-3 min:** Server starts
- **3 min:** ✅ **LIVE**

---

## 🔑 **CRITICAL: Environment Variables**

**Before or during redeploy, ensure these are set in Render:**

**MUST UPDATE:**
- `FAL_VEO_MODEL` = `fal-ai/veo3/fast/image-to-video` ⚡ **CRITICAL**

**MUST HAVE:**
- `SCRAPERAPI_KEY` = `a43c81df2528c343ef6abe8005b0e38b`
- `GEMINI_API_KEY` = `AIzaSyCxa-uM2OaS99QbcmBmYGZfG6Yfk5l4JNk`
- `GEMINI_MODEL_ID` = `gemini-2.0-flash-exp`
- `FAL_FLUX_MODEL` = `fal-ai/flux-pro/v1.1`
- `SUPABASE_VIDEO_BUCKET` = `ugc-videos`
- `FAL_API_KEY` = (existing)
- `STRIPE_SECRET_KEY` = (existing)
- `STRIPE_WEBHOOK_SECRET` = (existing)
- `SUPABASE_URL` = (existing)
- `SUPABASE_SERVICE_ROLE_KEY` = (existing)
- `GPT_BACKEND_SECRET` = (existing)
- `ALLOWED_ORIGINS` = (existing)

**MUST REMOVE:**
- `FIRECRAWL_API_KEY` (no longer used)

---

## 🧪 **After Redeploy**

Watch logs for:
```
[INFO] [ScraperAPI] Configured with key: a43c81df...
[INFO] [Gemini] Configured with key: AIzaSyCx...
[INFO] [Gemini] Using model: gemini-2.0-flash-exp
🚀 Server is running on port 4000
==> Your service is live 🎉
```

Then **test video generation:**
- Same project ID
- Same stripe session (already paid)
- Should work this time with correct FAL endpoint!

---

## 🎯 **Recommended: Method 1**

**Update `FAL_VEO_MODEL` environment variable** - this is required anyway and automatically triggers redeploy.

**Do it now!** ⚡
