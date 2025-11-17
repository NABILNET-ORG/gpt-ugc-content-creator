# UGC Video Backend API

A standalone Node.js + Express backend for UGC (User-Generated Content) video creation. This service provides a JSON REST API designed to be used by Custom GPTs via HTTP Actions.

## Tech Stack

- **Node.js** (LTS)
- **TypeScript**
- **Express** - Web framework
- **Supabase** - PostgreSQL database (server-side with service role)
- **Stripe** - Payment processing
- **Firecrawl** - Product scraping
- **fal.ai** - AI video generation (Veo 3.1)

## Project Structure

```
src/
├── index.ts                 # Main Express server
├── config/                  # Configuration modules
│   ├── env.ts              # Environment validation
│   ├── logger.ts           # Logging utility
│   ├── stripe.ts           # Stripe client
│   ├── supabase.ts         # Supabase client
│   ├── auth.ts             # Shared-secret auth middleware
│   ├── cors.ts             # CORS configuration
│   └── httpClient.ts       # Axios wrapper for external APIs
├── routes/                  # Express route definitions
│   ├── health.ts
│   ├── ugc.ts
│   ├── billing.ts
│   └── webhook.ts
├── controllers/             # Request handlers
│   ├── ugcController.ts
│   ├── billingController.ts
│   └── webhookController.ts
├── services/                # Business logic
│   ├── firecrawlService.ts # Product scraping
│   ├── avatarService.ts    # Avatar generation
│   ├── scriptService.ts    # Script generation
│   ├── videoService.ts     # Video generation
│   ├── billingService.ts   # Billing operations
│   ├── projectService.ts   # Project management
│   ├── userService.ts      # User management
│   └── paymentService.ts   # Payment operations
├── db/                      # Database layer
│   ├── schema.sql          # SQL schema
│   └── queries.ts          # Database queries
├── types/                   # TypeScript type definitions
│   └── index.ts
└── utils/                   # Utilities
    ├── error.ts            # Custom error classes
    ├── validation.ts       # Input validation
    ├── responses.ts        # Response formatters
    └── id.ts               # ID generators
```

## Environment Variables

Create a `.env` file in the root directory:

```env
# Server
PORT=4000
NODE_ENV=development

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# External APIs
FIRECRAWL_API_KEY=fc-...
FAL_API_KEY=...

# Supabase
SUPABASE_URL=https://....supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Authentication
GPT_BACKEND_SECRET=your-secret-here

# CORS (optional, comma-separated)
ALLOWED_ORIGINS=https://chatgpt.com,https://chat.openai.com
```

## Database Setup

Run the SQL schema in your Supabase SQL editor:

```bash
cat src/db/schema.sql
```

This creates the following tables:
- `users` - User accounts with external IDs
- `projects` - UGC video projects
- `videos` - Generated videos
- `payments` - Stripe payment records
- `credits` - User credit balances

## Installation

```bash
# Install dependencies
npm install

# Development mode
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## API Endpoints

### Public Endpoints

#### `GET /health`
Health check endpoint (no authentication required).

**Response:**
```json
{
  "success": true,
  "status": "healthy"
}
```

#### `GET /privacy`
Privacy policy page (no authentication required).

**Response:** HTML page with complete privacy policy.

### Protected Endpoints

All `/api/*` endpoints require the `x-gpt-backend-secret` header.

#### `POST /api/ugc/scrape-product`
Scrape product data from a URL using Firecrawl.

**Request:**
```json
{
  "productUrl": "https://example.com/product"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "productUrl": "https://example.com/product",
    "images": ["https://...", "https://..."],
    "metadata": {
      "title": "Product Name",
      "description": "Product description"
    }
  }
}
```

#### `POST /api/ugc/prepare-assets`
Generate avatar and script for a product.

**Request:**
```json
{
  "userExternalId": "chatgpt:nabil",
  "productUrl": "https://example.com/product",
  "selectedImageUrls": ["https://..."],
  "avatarSettings": {
    "gender": "female",
    "ethnicity": "mediterranean",
    "background": "modern studio",
    "vibe": "casual tiktok creator"
  },
  "tone": "enthusiastic",
  "targetAudience": "Gen Z on TikTok",
  "platform": "tiktok"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "projectId": "proj_abc123",
    "avatarImages": ["https://..."],
    "script": {
      "raw": "[HOOK]\nHey Gen Z...",
      "approxDurationSeconds": 30
    }
  }
}
```

#### `POST /api/billing/create-checkout`
Create a Stripe checkout session for purchasing video credits.

**Request:**
```json
{
  "userExternalId": "chatgpt:nabil",
  "projectId": "proj_abc123",
  "plan": "single_video"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "stripeSessionId": "cs_test_...",
    "checkoutUrl": "https://checkout.stripe.com/pay/cs_test_...",
    "currency": "usd",
    "amount": 1900
  }
}
```

#### `POST /api/billing/check-status`
Check payment status and user credits.

**Request:**
```json
{
  "stripeSessionId": "cs_test_..."
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "paid",
    "projectId": "proj_abc123",
    "userExternalId": "chatgpt:nabil",
    "creditsRemaining": 17
  }
}
```

#### `POST /api/ugc/generate-video`
Generate UGC video from project assets.

**Request:**
```json
{
  "projectId": "proj_abc123",
  "stripeSessionId": "cs_test_..."
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "projectId": "proj_abc123",
    "videoUrl": "https://storage.example.com/videos/video-123.mp4",
    "thumbnailUrl": "https://storage.example.com/videos/video-123-thumb.jpg",
    "durationSeconds": 8,
    "creditsRemaining": 16
  }
}
```

### Webhook Endpoints

#### `POST /webhook/stripe`
Stripe webhook handler (no authentication required).

Handles events:
- `checkout.session.completed`
- `checkout.session.async_payment_succeeded`
- `checkout.session.async_payment_failed`
- `payment_intent.payment_failed`

**Configure in Stripe Dashboard:**
- URL: `https://your-domain.com/webhook/stripe`
- Events to send: `checkout.session.completed`, `checkout.session.async_payment_succeeded`, etc.

## Authentication

All `/api/*` routes require the `x-gpt-backend-secret` header:

```bash
curl -X POST https://your-api.com/api/ugc/scrape-product \
  -H "x-gpt-backend-secret: your-secret-here" \
  -H "Content-Type: application/json" \
  -d '{"productUrl": "https://example.com/product"}'
```

Unauthorized requests return:
```json
{
  "success": false,
  "errorCode": "UNAUTHORIZED",
  "message": "Unauthorized"
}
```

## Error Handling

All endpoints return consistent JSON responses:

**Success:**
```json
{
  "success": true,
  "data": { ... }
}
```

**Error:**
```json
{
  "success": false,
  "errorCode": "ERROR_CODE",
  "message": "Human-readable error message",
  "details": { ... }
}
```

## Idempotency

Video generation is idempotent based on `(projectId, stripeSessionId)`. Multiple requests with the same pair will return the same video without regenerating.

## Deployment

### Requirements
- Node.js 18+ or 20+ LTS
- PostgreSQL database (Supabase)
- Environment variables configured

### Deploy to Railway/Render/VPS

1. **Build the project:**
   ```bash
   npm run build
   ```

2. **Set environment variables** in your hosting platform

3. **Start the server:**
   ```bash
   npm start
   ```

### Health Check
Configure your hosting platform to use `GET /health` for health checks.

## Development

```bash
# Install dependencies
npm install

# Run in development mode with auto-reload
npm run dev

# Type check without building
npm run typecheck

# Build TypeScript to JavaScript
npm run build
```

## Future Enhancements

The following services have stub implementations with clear TODO comments:

1. **Avatar Generation** (`avatarService.ts`)
   - Integrate Lovable Nano Banana or fal.ai image generation
   - Currently returns placeholder images

2. **Script Generation** (`scriptService.ts`)
   - Integrate LLM (GPT-4, Claude, etc.) for dynamic script generation
   - Currently returns mocked script templates

3. **Video Generation** (`videoService.ts`)
   - Integrate fal.ai Veo 3.1 for real video generation
   - Currently returns stub video URLs

## License

MIT
