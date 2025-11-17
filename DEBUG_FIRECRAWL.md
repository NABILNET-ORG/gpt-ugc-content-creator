# Debugging Firecrawl Integration

## 🔍 Current Situation

The API is working, but Firecrawl is returning empty results:
```json
{
  "images": [],
  "metadata": {}
}
```

## ✅ Enhanced Logging Added

I've added detailed logging to `src/services/firecrawlService.ts` that will show:

- API key being used (first 10 characters)
- Full Firecrawl API response
- Response status code
- Number of images found
- Whether title/description were extracted
- Detailed error information if it fails

## 📊 How to Check Render Logs

### Step 1: View Live Logs

1. Go to: https://dashboard.render.com
2. Click on your service: `gpt-ugc-content-creator`
3. Click **"Logs"** tab
4. Logs will show in real-time

### Step 2: Trigger a Request

After the new deployment finishes:

```bash
curl -X POST https://gpt-ugc-content-creator.onrender.com/api/ugc/scrape-product \
  -H "x-gpt-backend-secret: 7C5dJXv0rPpPp9sV_3qkL2wzA1mZBabA" \
  -H "Content-Type: application/json" \
  -d '{"productUrl":"https://example.com"}'
```

### Step 3: Check Logs for Firecrawl Response

You should see logs like:

```
[INFO] [Firecrawl] Scraping product from URL: https://example.com
[INFO] [Firecrawl] Using API key: fc-c3e2deb...
[INFO] [Firecrawl] Response status: 200
[INFO] [Firecrawl] Response data: {
  "success": true,
  "data": {
    "metadata": {
      "title": "...",
      "description": "...",
      ...
    },
    "images": [...],
    ...
  }
}
[INFO] [Firecrawl] Successfully scraped. Images: X, Title: Yes/No, Description: Yes/No
```

## 🔍 What to Look For

### Scenario 1: Firecrawl Returns Error

If you see:
```
[ERROR] [Firecrawl] Response status: 401
[ERROR] [Firecrawl] Response data: { "error": "Invalid API key" }
```

**Solution:** Check `FIRECRAWL_API_KEY` environment variable in Render

### Scenario 2: Firecrawl Returns Data But Wrong Structure

If you see response data but still get empty results, the response structure is different than expected.

**Look for where the actual data is:**
- Is it in `data.data.images`?
- Is it in `data.images`?
- Is it in `data.data.content`?

Then update the extraction logic in `firecrawlService.ts` accordingly.

### Scenario 3: API Key Issue

Check in logs:
```
[INFO] [Firecrawl] Using API key: fc-c3e2deb...
```

Verify:
- API key starts with `fc-`
- Matches your Firecrawl dashboard
- Is set correctly in Render environment variables

## 🧪 Test URLs

Try these URLs to debug:

### 1. Simple Website (Should Work)
```bash
curl -X POST https://gpt-ugc-content-creator.onrender.com/api/ugc/scrape-product \
  -H "x-gpt-backend-secret: 7C5dJXv0rPpPp9sV_3qkL2wzA1mZBabA" \
  -H "Content-Type: application/json" \
  -d '{"productUrl":"https://example.com"}'
```

Expected: Should at least get a title

### 2. E-commerce Site
```bash
curl -X POST https://gpt-ugc-content-creator.onrender.com/api/ugc/scrape-product \
  -H "x-gpt-backend-secret: 7C5dJXv0rPpPp9sV_3qkL2wzA1mZBabA" \
  -H "Content-Type: application/json" \
  -d '{"productUrl":"https://www.amazon.com/dp/B0CX57B2V6"}'
```

Expected: Should get product title, description, images

### 3. Check Firecrawl Directly

You can also test Firecrawl API directly:

```bash
curl -X POST https://api.firecrawl.dev/v2/scrape \
  -H "Authorization: Bearer YOUR_FIRECRAWL_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://example.com",
    "formats": ["markdown", "html", "images"]
  }'
```

This will show you exactly what Firecrawl returns.

## 🔧 Possible Issues & Solutions

### Issue 1: API Key Invalid

**Symptoms:**
- Logs show 401 error
- Response: `{"error": "Invalid API key"}`

**Solution:**
1. Check your Firecrawl dashboard: https://firecrawl.dev/dashboard
2. Verify API key is correct
3. Update `FIRECRAWL_API_KEY` in Render environment variables
4. Redeploy

### Issue 2: Firecrawl V2 API Changes

**Symptoms:**
- Logs show 200 response
- But data structure is different than expected

**Solution:**
Check Firecrawl V2 docs and update extraction logic in `firecrawlService.ts`

### Issue 3: Rate Limiting

**Symptoms:**
- Logs show 429 error
- Response: `{"error": "Rate limit exceeded"}`

**Solution:**
- Wait a few minutes
- Check your Firecrawl plan limits
- Consider upgrading plan if needed

### Issue 4: Timeout

**Symptoms:**
- Request takes > 30 seconds
- Timeout error

**Solution:**
- Increase timeout in `firecrawlService.ts`
- Or reduce complexity of request (fewer formats)

## 📝 Update Firecrawl Service Based on Logs

Once you check the Render logs and see the actual Firecrawl response structure, update this part of `firecrawlService.ts`:

```typescript
// Extract images - UPDATE based on actual response structure
const images: string[] = [];

if (data.data?.images && Array.isArray(data.data.images)) {
  images.push(...data.data.images);
} else if (data.images && Array.isArray(data.images)) {
  images.push(...data.images);
}
// Add more cases based on what you see in logs

// Extract metadata - UPDATE based on actual response structure
const metadata = {
  title: data.data?.metadata?.title || data.data?.title || ...,
  description: data.data?.metadata?.description || ...,
};
```

## 🎯 Action Items

1. ✅ Enhanced logging added and pushed to GitHub
2. ⏳ Wait for Render auto-deploy (~2-3 minutes)
3. ⏳ Test endpoint again
4. ⏳ Check Render logs to see Firecrawl response
5. ⏳ Update extraction logic based on actual response structure
6. ⏳ Test again with real product URLs

---

## 🔗 Quick Links

- **Render Logs:** https://dashboard.render.com → Your Service → Logs
- **Firecrawl Dashboard:** https://firecrawl.dev/dashboard
- **Firecrawl V2 Docs:** https://docs.firecrawl.dev/
- **Your API:** https://gpt-ugc-content-creator.onrender.com

---

**After Render redeploys, test again and check the logs to see exactly what Firecrawl is returning!**
