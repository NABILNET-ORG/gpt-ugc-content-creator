# Render Deployment Guide

## 🎯 Deployment Target

**Service URL:** https://gpt-ugc-content-creator.onrender.com

## ✅ Current Status

- ✅ Code pushed to GitHub with fixed `/health` endpoint
- ✅ Build configuration ready
- ✅ TypeScript compilation tested
- ⏳ Needs environment variables configuration
- ⏳ Waiting for deployment

## 🚀 Deployment Methods

### Method 1: Auto-Deploy (Recommended)

If your Render service is connected to GitHub, it will automatically deploy when you push changes.

**Check Auto-Deploy Status:**
1. Go to: https://dashboard.render.com
2. Find your service: `gpt-ugc-content-creator`
3. Check if "Auto-Deploy" is enabled

If auto-deploy is enabled, Render is already deploying your latest changes!

### Method 2: Manual Deploy

If auto-deploy is not enabled:

1. Go to: https://dashboard.render.com
2. Click on `gpt-ugc-content-creator` service
3. Click **"Manual Deploy"** button
4. Select **"Deploy latest commit"**
5. Wait for deployment to complete

## 📋 Required Configuration

### Build Settings

Ensure these settings are configured in Render dashboard:

| Setting | Value |
|---------|-------|
| **Build Command** | `npm install && npm run build` |
| **Start Command** | `node dist/index.js` |
| **Node Version** | 18.x or 20.x (LTS) |

### Environment Variables

You **MUST** set these 10 environment variables in Render:

1. Go to: https://dashboard.render.com → Your Service → Environment
2. Add each variable:

| Key | Value | Notes |
|-----|-------|-------|
| `PORT` | `4000` | Server port |
| `NODE_ENV` | `production` | Environment |
| `STRIPE_SECRET_KEY` | `sk_test_51SUNc...` | From your `.env` file |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` | From your `.env` file |
| `FIRECRAWL_API_KEY` | `fc-...` | From your `.env` file |
| `FAL_API_KEY` | `cd9d16df-...` | From your `.env` file |
| `SUPABASE_URL` | `https://cflcjeupixrimucbyhit...` | From your `.env` file |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGci...` | From your `.env` file |
| `GPT_BACKEND_SECRET` | `7C5dJXv0r...` | From your `.env` file |
| `ALLOWED_ORIGINS` | `https://chatgpt.com,https://chat.openai.com` | CORS origins |

**Important:** Copy the actual values from your local `.env` file.

After adding environment variables, Render will automatically redeploy.

## 🏥 Health Check Configuration

Render uses health checks to determine if your service is running properly.

**Configure in Render Dashboard:**

1. Go to: https://dashboard.render.com → Your Service → Settings
2. Scroll to **"Health Check Path"**
3. Set to: `/health`
4. Save changes

**Health Check Response:**
```json
{
  "success": true,
  "status": "healthy",
  "uptime": 123.456,
  "timestamp": "2025-11-17T14:50:59.995Z"
}
```

## ✅ Verify Deployment

### Step 1: Check Deployment Status

1. Go to Render dashboard
2. Watch the deployment logs in real-time
3. Wait for **"Live"** status

### Step 2: Test Health Endpoint

```bash
curl https://gpt-ugc-content-creator.onrender.com/health
```

**Expected Response:**
```json
{
  "success": true,
  "status": "healthy",
  "uptime": 123.456,
  "timestamp": "2025-11-17T..."
}
```

### Step 3: Test Privacy Page

```bash
curl https://gpt-ugc-content-creator.onrender.com/privacy
```

**Expected:** HTML page with privacy policy

### Step 4: Test API Endpoint

```bash
curl -X POST https://gpt-ugc-content-creator.onrender.com/api/ugc/scrape-product \
  -H "x-gpt-backend-secret: YOUR_SECRET_HERE" \
  -H "Content-Type: application/json" \
  -d '{"productUrl": "https://www.amazon.com/dp/B0EXAMPLE"}'
```

**Expected:** JSON response with product data or error

## 🔧 Troubleshooting

### Issue 1: "Application failed to respond"

**Cause:** Environment variables not set

**Solution:**
1. Check all 10 environment variables are set in Render
2. Redeploy after adding variables

### Issue 2: Health check failing

**Cause:** Health check path not configured or returning errors

**Solution:**
1. Verify health check path is set to `/health`
2. Test the endpoint manually
3. Check logs for errors

### Issue 3: "Build failed"

**Cause:** TypeScript compilation errors or missing dependencies

**Solution:**
1. Check deployment logs in Render dashboard
2. Verify `package.json` has all dependencies
3. Test build locally: `npm run build`

### Issue 4: "Service keeps restarting"

**Cause:** Crash on startup, usually environment variables

**Solution:**
1. Check Render logs for error messages
2. Verify all environment variables are correct
3. Test locally with same environment variables

## 📊 Monitor Your Service

### View Logs

1. Go to Render dashboard
2. Click on your service
3. Click **"Logs"** tab
4. Watch real-time logs

### Check Metrics

1. Go to **"Metrics"** tab
2. Monitor:
   - CPU usage
   - Memory usage
   - Request count
   - Response times

### Set Up Alerts

1. Go to **"Settings"** tab
2. Scroll to **"Notifications"**
3. Configure email alerts for:
   - Deployment failures
   - Service crashes
   - Health check failures

## 🔄 Continuous Deployment

### Enable Auto-Deploy

1. Go to your service settings
2. Under **"Build & Deploy"**
3. Enable **"Auto-Deploy"**
4. Select branch: `main`

Now every push to `main` branch will automatically deploy!

## 🌐 Custom Domain (Optional)

To use a custom domain instead of `.onrender.com`:

1. Go to **"Settings"** tab
2. Scroll to **"Custom Domains"**
3. Click **"Add Custom Domain"**
4. Follow DNS configuration instructions

## 🔗 Update Stripe Webhook

Once your Render service is live, update your Stripe webhook:

1. Go to: https://dashboard.stripe.com/webhooks
2. Find your webhook or create a new one
3. Update **Endpoint URL** to:
   ```
   https://gpt-ugc-content-creator.onrender.com/webhook/stripe
   ```
4. Select events to listen for:
   - `checkout.session.completed`
   - `checkout.session.async_payment_succeeded`
   - `checkout.session.async_payment_failed`
   - `payment_intent.payment_failed`
5. Copy the **Signing Secret**
6. Update `STRIPE_WEBHOOK_SECRET` in Render environment variables

## 📱 Connect to Custom GPT

Once deployed and tested:

1. Update your Custom GPT configuration
2. Set base URL to: `https://gpt-ugc-content-creator.onrender.com`
3. Configure authentication:
   - Type: API Key
   - Header: `x-gpt-backend-secret`
   - Value: Your `GPT_BACKEND_SECRET`
4. Test all actions

## 📋 Deployment Checklist

- [ ] Environment variables set (all 10)
- [ ] Health check path configured (`/health`)
- [ ] Build command: `npm install && npm run build`
- [ ] Start command: `node dist/index.js`
- [ ] Auto-deploy enabled (optional)
- [ ] Health endpoint tested and working
- [ ] API endpoints tested with authentication
- [ ] Stripe webhook URL updated
- [ ] Custom GPT configuration updated
- [ ] Monitoring and alerts configured

## 🎉 Next Steps

After successful deployment:

1. ✅ Test all API endpoints
2. ✅ Configure Custom GPT
3. ✅ Test end-to-end workflow
4. ✅ Monitor logs for any errors
5. ✅ Set up alerts for failures

---

## 🔗 Quick Links

- **Service Dashboard:** https://dashboard.render.com
- **Service URL:** https://gpt-ugc-content-creator.onrender.com
- **Health Endpoint:** https://gpt-ugc-content-creator.onrender.com/health
- **Privacy Policy:** https://gpt-ugc-content-creator.onrender.com/privacy
- **GitHub Repo:** https://github.com/NABILNET-ORG/gpt-ugc-content-creator
- **Stripe Dashboard:** https://dashboard.stripe.com

---

**Your UGC Video Creator API is ready for production on Render! 🚀**
