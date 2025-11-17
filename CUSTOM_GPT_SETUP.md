# Custom GPT Setup Guide

## Quick Reference

**Backend URL:** `https://gpt-ugc-content-creator.vercel.app`
**Auth Header:** `x-gpt-backend-secret`
**Auth Secret:** `<your-gpt-backend-secret>` (from your `.env` file)

## OpenAPI Schema for Custom GPT

Copy this OpenAPI schema into your Custom GPT Actions configuration:

```yaml
openapi: 3.1.0
info:
  title: UGC Video Creator API
  description: Backend API for UGC video generation with product scraping, asset preparation, billing, and video generation
  version: 1.0.0
servers:
  - url: https://gpt-ugc-content-creator.vercel.app
    description: Production server

components:
  securitySchemes:
    ApiKeyAuth:
      type: apiKey
      in: header
      name: x-gpt-backend-secret

security:
  - ApiKeyAuth: []

paths:
  /health:
    get:
      operationId: healthCheck
      summary: Check API health status
      security: []
      responses:
        '200':
          description: Service is healthy
          content:
            application/json:
              schema:
                type: object
                properties:
                  success:
                    type: boolean
                  status:
                    type: string

  /api/ugc/scrape-product:
    post:
      operationId: scrapeProduct
      summary: Scrape product data from URL
      description: Extracts images and metadata from a product page using Firecrawl
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required:
                - productUrl
              properties:
                productUrl:
                  type: string
                  format: uri
                  description: The URL of the product page to scrape
      responses:
        '200':
          description: Product data scraped successfully
          content:
            application/json:
              schema:
                type: object
                properties:
                  success:
                    type: boolean
                  data:
                    type: object
                    properties:
                      productUrl:
                        type: string
                      images:
                        type: array
                        items:
                          type: string
                      metadata:
                        type: object
                        properties:
                          title:
                            type: string
                          description:
                            type: string

  /api/ugc/prepare-assets:
    post:
      operationId: prepareAssets
      summary: Prepare avatar and script for video
      description: Generate avatar images and UGC script based on product data and user preferences
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required:
                - userExternalId
                - productUrl
              properties:
                userExternalId:
                  type: string
                  description: External user identifier (e.g., "chatgpt:username")
                productUrl:
                  type: string
                  format: uri
                selectedImageUrls:
                  type: array
                  items:
                    type: string
                avatarSettings:
                  type: object
                  properties:
                    gender:
                      type: string
                    ethnicity:
                      type: string
                    background:
                      type: string
                    vibe:
                      type: string
                tone:
                  type: string
                  description: Script tone (e.g., "enthusiastic", "professional")
                targetAudience:
                  type: string
                  description: Target audience (e.g., "Gen Z on TikTok")
                platform:
                  type: string
                  description: Platform (e.g., "tiktok", "instagram", "youtube")
      responses:
        '200':
          description: Assets prepared successfully
          content:
            application/json:
              schema:
                type: object
                properties:
                  success:
                    type: boolean
                  data:
                    type: object
                    properties:
                      projectId:
                        type: string
                      avatarImages:
                        type: array
                        items:
                          type: string
                      script:
                        type: object
                        properties:
                          raw:
                            type: string
                          approxDurationSeconds:
                            type: integer

  /api/billing/create-checkout:
    post:
      operationId: createCheckout
      summary: Create Stripe checkout session
      description: Generate a Stripe checkout URL for purchasing video credits
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required:
                - userExternalId
                - plan
              properties:
                userExternalId:
                  type: string
                  description: External user identifier
                projectId:
                  type: string
                  description: Project ID to associate with this payment
                plan:
                  type: string
                  enum:
                    - single_video
                  description: Pricing plan
      responses:
        '200':
          description: Checkout session created
          content:
            application/json:
              schema:
                type: object
                properties:
                  success:
                    type: boolean
                  data:
                    type: object
                    properties:
                      stripeSessionId:
                        type: string
                      checkoutUrl:
                        type: string
                      amount:
                        type: integer
                      currency:
                        type: string

  /api/billing/check-status:
    post:
      operationId: checkPaymentStatus
      summary: Check payment status
      description: Verify payment status and get user credit balance
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required:
                - stripeSessionId
              properties:
                stripeSessionId:
                  type: string
                  description: Stripe checkout session ID
      responses:
        '200':
          description: Payment status retrieved
          content:
            application/json:
              schema:
                type: object
                properties:
                  success:
                    type: boolean
                  data:
                    type: object
                    properties:
                      status:
                        type: string
                        enum:
                          - unpaid
                          - paid
                          - pending
                          - failed
                      projectId:
                        type: string
                      userExternalId:
                        type: string
                      creditsRemaining:
                        type: integer

  /api/ugc/generate-video:
    post:
      operationId: generateVideo
      summary: Generate UGC video
      description: Create video from project assets (requires paid session)
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required:
                - projectId
                - stripeSessionId
              properties:
                projectId:
                  type: string
                  description: Project ID with prepared assets
                stripeSessionId:
                  type: string
                  description: Paid Stripe session ID
      responses:
        '200':
          description: Video generated successfully
          content:
            application/json:
              schema:
                type: object
                properties:
                  success:
                    type: boolean
                  data:
                    type: object
                    properties:
                      projectId:
                        type: string
                      videoUrl:
                        type: string
                      thumbnailUrl:
                        type: string
                      durationSeconds:
                        type: integer
                      creditsRemaining:
                        type: integer
        '402':
          description: Payment required
          content:
            application/json:
              schema:
                type: object
                properties:
                  success:
                    type: boolean
                  errorCode:
                    type: string
                  message:
                    type: string
```

## Custom GPT Instructions (Example)

Add these instructions to your Custom GPT:

```
You are a UGC Video Creator assistant. You help users create professional UGC videos from product URLs.

Your workflow:

1. **Scrape Product**: When user provides a product URL, use scrapeProduct to extract images and metadata.

2. **Prepare Assets**: Ask user about:
   - Avatar preferences (gender, ethnicity, background, vibe)
   - Script tone (enthusiastic, professional, casual)
   - Target audience (Gen Z, Millennials, etc.)
   - Platform (TikTok, Instagram, YouTube)

   Then use prepareAssets with their external ID (format: "chatgpt:username").

3. **Payment**: Use createCheckout with plan "single_video" ($19.00). Show user the checkout URL.

4. **Check Status**: After user completes payment, use checkPaymentStatus to verify.

5. **Generate Video**: Once paid, use generateVideo to create the final video.

Always be friendly and guide users through each step. Explain what's happening at each stage.
```

## Testing the Integration

### 1. Test Health Check (No Auth)
```bash
curl https://gpt-ugc-content-creator.vercel.app/health
```

### 2. Test with Auth
```bash
curl -X POST https://gpt-ugc-content-creator.vercel.app/api/ugc/scrape-product \
  -H "x-gpt-backend-secret: <your-secret>" \
  -H "Content-Type: application/json" \
  -d '{"productUrl": "https://www.amazon.com/dp/B0EXAMPLE"}'
```

### 3. Test Full Workflow

**Step 1: Scrape Product**
```bash
curl -X POST https://gpt-ugc-content-creator.vercel.app/api/ugc/scrape-product \
  -H "x-gpt-backend-secret: <your-secret>" \
  -H "Content-Type: application/json" \
  -d '{
    "productUrl": "https://www.amazon.com/dp/B0EXAMPLE"
  }'
```

**Step 2: Prepare Assets**
```bash
curl -X POST https://gpt-ugc-content-creator.vercel.app/api/ugc/prepare-assets \
  -H "x-gpt-backend-secret: <your-secret>" \
  -H "Content-Type: application/json" \
  -d '{
    "userExternalId": "chatgpt:nabil",
    "productUrl": "https://www.amazon.com/dp/B0EXAMPLE",
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
  }'
```

**Step 3: Create Checkout**
```bash
curl -X POST https://gpt-ugc-content-creator.vercel.app/api/billing/create-checkout \
  -H "x-gpt-backend-secret: <your-secret>" \
  -H "Content-Type: application/json" \
  -d '{
    "userExternalId": "chatgpt:nabil",
    "projectId": "PROJECT_ID_FROM_STEP_2",
    "plan": "single_video"
  }'
```

**Step 4: Check Status** (after payment)
```bash
curl -X POST https://gpt-ugc-content-creator.vercel.app/api/billing/check-status \
  -H "x-gpt-backend-secret: <your-secret>" \
  -H "Content-Type: application/json" \
  -d '{
    "stripeSessionId": "SESSION_ID_FROM_STEP_3"
  }'
```

**Step 5: Generate Video** (once payment is confirmed)
```bash
curl -X POST https://gpt-ugc-content-creator.vercel.app/api/ugc/generate-video \
  -H "x-gpt-backend-secret: <your-secret>" \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "PROJECT_ID_FROM_STEP_2",
    "stripeSessionId": "SESSION_ID_FROM_STEP_3"
  }'
```

## Common Issues

### "Unauthorized" Error
- Verify you're using the correct header: `x-gpt-backend-secret`
- Check the secret value matches your `GPT_BACKEND_SECRET` from `.env`

### CORS Error
- Ensure `ALLOWED_ORIGINS` includes `https://chatgpt.com`
- Check environment variables are set correctly

### Payment Not Confirmed
- Wait a few seconds after payment completion
- Check Stripe webhook is receiving events
- Verify webhook secret matches in both Stripe and your env

## Ready to Deploy?

See `DEPLOYMENT.md` for detailed deployment instructions.
