# Deployment Guide

## Quick Start

Your backend is ready to deploy! Follow these steps to get it running in production.

## 1. Database Setup (Supabase)

1. Go to your Supabase project: https://cflcjeupixrimucbyhit.supabase.co
2. Navigate to **SQL Editor**
3. Copy and paste the contents of `src/db/schema.sql`
4. Click **Run** to create all tables and indexes

This will create:
- `users` table
- `projects` table
- `videos` table
- `payments` table
- `credits` table
- All necessary indexes

## 2. Stripe Webhook Configuration

Your webhook endpoint is: `https://gpt-ugc-content-creator.vercel.app/webhook/stripe`

**Configure in Stripe Dashboard:**

1. Go to https://dashboard.stripe.com/webhooks
2. Click **Add endpoint**
3. Enter: `https://gpt-ugc-content-creator.vercel.app/webhook/stripe`
4. Select events to listen for:
   - `checkout.session.completed`
   - `checkout.session.async_payment_succeeded`
   - `checkout.session.async_payment_failed`
   - `payment_intent.payment_failed`
5. Click **Add endpoint**
6. Copy the **Signing secret** (it should match your `STRIPE_WEBHOOK_SECRET`)

## 3. Environment Variables

Your environment variables are already configured in `.env`:

```env
PORT=4000
NODE_ENV=production

STRIPE_SECRET_KEY=sk_test_51SUNc...
STRIPE_WEBHOOK_SECRET=whsec_zOe...

FIRECRAWL_API_KEY=fc-c3e2d...
FAL_API_KEY=cd9d16df...

SUPABASE_URL=https://cflcjeupixrimucbyhit.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbG...

GPT_BACKEND_SECRET=7C5dJXv0rPpPp9sV_3qkL2wzA1mZBabA

ALLOWED_ORIGINS=https://chatgpt.com,https://chat.openai.com
```

## 4. Deployment Options

### Option A: Vercel (Recommended)

Since your Stripe webhook is already pointing to Vercel:

1. **Install Vercel CLI:**
   ```bash
   npm i -g vercel
   ```

2. **Create `vercel.json`:**
   The project already has the necessary configuration.

3. **Deploy:**
   ```bash
   vercel --prod
   ```

4. **Set Environment Variables in Vercel:**
   ```bash
   vercel env add PORT
   vercel env add NODE_ENV
   vercel env add STRIPE_SECRET_KEY
   vercel env add STRIPE_WEBHOOK_SECRET
   vercel env add FIRECRAWL_API_KEY
   vercel env add FAL_API_KEY
   vercel env add SUPABASE_URL
   vercel env add SUPABASE_SERVICE_ROLE_KEY
   vercel env add GPT_BACKEND_SECRET
   vercel env add ALLOWED_ORIGINS
   ```

   Or set them in the Vercel dashboard: https://vercel.com/dashboard/settings/environment-variables

### Option B: Railway

1. **Install Railway CLI:**
   ```bash
   npm i -g @railway/cli
   ```

2. **Login and Initialize:**
   ```bash
   railway login
   railway init
   ```

3. **Set Environment Variables:**
   ```bash
   railway variables set PORT=4000
   railway variables set NODE_ENV=production
   # ... (set all other variables)
   ```

4. **Deploy:**
   ```bash
   railway up
   ```

### Option C: Render

1. Create new **Web Service** on Render
2. Connect your GitHub repository
3. Configure:
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`
   - **Environment:** Add all environment variables
4. Deploy

### Option D: VPS (Ubuntu/Debian)

1. **SSH into your server:**
   ```bash
   ssh user@your-server.com
   ```

2. **Install Node.js:**
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```

3. **Clone repository:**
   ```bash
   git clone https://github.com/NABILNET-ORG/gpt-ugc-content-creator.git
   cd gpt-ugc-content-creator
   ```

4. **Install dependencies:**
   ```bash
   npm install
   ```

5. **Create .env file:**
   ```bash
   nano .env
   # Paste your environment variables
   ```

6. **Build:**
   ```bash
   npm run build
   ```

7. **Install PM2:**
   ```bash
   sudo npm install -g pm2
   ```

8. **Start with PM2:**
   ```bash
   pm2 start npm --name "ugc-backend" -- start
   pm2 save
   pm2 startup
   ```

9. **Setup Nginx reverse proxy:**
   ```bash
   sudo nano /etc/nginx/sites-available/ugc-backend
   ```

   Add:
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;

       location / {
           proxy_pass http://localhost:4000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

   Enable and restart:
   ```bash
   sudo ln -s /etc/nginx/sites-available/ugc-backend /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

## 5. Verify Deployment

After deployment, test these endpoints:

### Health Check
```bash
curl https://your-domain.com/health
```

Expected response:
```json
{
  "success": true,
  "status": "healthy"
}
```

### Test Authentication
```bash
curl -X POST https://your-domain.com/api/ugc/scrape-product \
  -H "x-gpt-backend-secret: 7C5dJXv0rPpPp9sV_3qkL2wzA1mZBabA" \
  -H "Content-Type: application/json" \
  -d '{"productUrl": "https://amazon.com/some-product"}'
```

### Test Stripe Webhook
In Stripe Dashboard:
1. Go to Webhooks
2. Click your webhook endpoint
3. Click **Send test webhook**
4. Select `checkout.session.completed`
5. Click **Send test webhook**
6. Check logs for successful processing

## 6. Custom GPT Configuration

Configure your Custom GPT to use these endpoints:

**Base URL:** `https://your-domain.com`

**Authentication:**
- Type: API Key
- Header: `x-gpt-backend-secret`
- Value: `7C5dJXv0rPpPp9sV_3qkL2wzA1mZBabA`

**Actions:**
1. `POST /api/ugc/scrape-product`
2. `POST /api/ugc/prepare-assets`
3. `POST /api/billing/create-checkout`
4. `POST /api/billing/check-status`
5. `POST /api/ugc/generate-video`

## 7. Monitoring

### Logs
```bash
# PM2 (VPS)
pm2 logs ugc-backend

# Railway
railway logs

# Vercel
vercel logs
```

### Health Monitoring
Set up uptime monitoring for `GET /health` using:
- UptimeRobot
- Pingdom
- Better Uptime

## 8. Next Steps

1. ✅ Deploy to your chosen platform
2. ✅ Run database schema in Supabase
3. ✅ Verify Stripe webhook is receiving events
4. ✅ Test all API endpoints
5. ✅ Configure Custom GPT
6. 🔧 Integrate real avatar generation (replace stub)
7. 🔧 Integrate real script generation with LLM (replace stub)
8. 🔧 Integrate real video generation with fal.ai Veo 3.1 (replace stub)

## Troubleshooting

### Server won't start
- Check all environment variables are set
- Verify Node.js version (18+ required)
- Check logs for errors

### Stripe webhook failing
- Verify webhook URL matches deployment URL
- Check `STRIPE_WEBHOOK_SECRET` matches Stripe dashboard
- Ensure `/webhook/stripe` route is accessible (no auth required)

### Database errors
- Verify database schema has been run in Supabase
- Check `SUPABASE_SERVICE_ROLE_KEY` is correct
- Ensure network access is allowed

### CORS errors
- Verify `ALLOWED_ORIGINS` includes your Custom GPT domain
- Check CORS headers in response

## Support

For issues or questions:
- Check README.md for API documentation
- Review logs for error messages
- Verify all environment variables are correctly set
