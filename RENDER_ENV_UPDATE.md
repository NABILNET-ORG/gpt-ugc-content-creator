# Render Environment Variables Update

## 🚨 IMPORTANT: Update Environment Variables in Render

Your code has been pushed to GitHub. Render will auto-deploy, but you **MUST** update environment variables first.

---

## ⚡ Quick Action Required

Go to: **https://dashboard.render.com** → Your Service → **Environment** tab

### ❌ REMOVE This Variable:
- `FIRECRAWL_API_KEY` (no longer used)

### ✅ ADD These Variables:

| Variable Name | Value |
|---------------|-------|
| `SCRAPERAPI_KEY` | `a43c81df2528c343ef6abe8005b0e38b` |
| `GEMINI_API_KEY` | `AIzaSyBmbBQkXF-EkHru1Nt-kgAeuHc0WWLS8us` |

---

## 📋 Complete Environment Variables List

After the update, you should have these 11 variables:

1. ✅ `PORT` = `4000`
2. ✅ `NODE_ENV` = `production`
3. ✅ `STRIPE_SECRET_KEY` = (existing)
4. ✅ `STRIPE_WEBHOOK_SECRET` = (existing)
5. ✅ **NEW** `SCRAPERAPI_KEY` = `a43c81df2528c343ef6abe8005b0e38b`
6. ✅ **NEW** `GEMINI_API_KEY` = `AIzaSyBmbBQkXF-EkHru1Nt-kgAeuHc0WWLS8us`
7. ✅ `FAL_API_KEY` = (existing)
8. ✅ `SUPABASE_URL` = (existing)
9. ✅ `SUPABASE_SERVICE_ROLE_KEY` = (existing)
10. ✅ `GPT_BACKEND_SECRET` = (existing)
11. ✅ `ALLOWED_ORIGINS` = (existing)

---

## 🔄 After Adding Variables

Render will **automatically redeploy** when you save the environment variables.

Watch the deployment logs to see:
- ✅ Build succeeds
- ✅ Server starts with new API keys logged
- ✅ Service becomes "Live"

---

## 🧪 Test After Deployment

Once deployment completes (~2-3 minutes):

```bash
curl -X POST https://gpt-ugc-content-creator.onrender.com/api/ugc/scrape-product \
  -H "x-gpt-backend-secret: 7C5dJXv0rPpPp9sV_3qkL2wzA1mZBabA" \
  -H "Content-Type: application/json" \
  -d '{"productUrl":"https://www.amazon.com/dp/B0CX57B2V6"}'
```

**Expected:** You should now see real product data with images!

```json
{
  "ok": true,
  "product": {
    "url": "https://www.amazon.com/dp/B0CX57B2V6",
    "title": "Actual Product Title from Gemini",
    "description": "Product description extracted...",
    "images": [
      "https://m.media-amazon.com/images/I/71...jpg",
      "https://m.media-amazon.com/images/I/81...jpg"
    ]
  }
}
```

---

## 📊 Check Logs

After testing, check Render logs to see:

- `[ScraperAPI]` logs showing HTML fetch
- `[Gemini]` logs showing AI analysis
- Extracted images count
- Full response data

This will help verify everything is working correctly.

---

## ⏱️ Timeline

1. **Now:** Update environment variables in Render
2. **~2 min:** Render auto-deploys from GitHub
3. **~3 min:** Service is live with new implementation
4. **Test:** Run curl command above
5. **Verify:** Check logs for detailed execution flow

---

**Don't forget to update the environment variables in Render!** 🚀
