# Stripe Webhook Configuration

## 🎯 **Issue: Payment Stuck in "pending" Status**

Your payment went through, but the backend doesn't know because Stripe webhooks aren't reaching it.

**Your webhook is configured:**
- **URL:** `https://gpt-ugc-content-creator.onrender.com/webhook/stripe`
- **Secret:** `whsec_zOel3eHLaslgNx5S0QXVA2Irq7DVe2aW`

---

## ✅ **Backend Webhook Handler is Ready**

The code is correct and handles:
- ✅ `checkout.session.completed` - Marks payment as paid, adds credits
- ✅ `checkout.session.async_payment_succeeded` - Handles async payments
- ✅ `checkout.session.async_payment_failed` - Marks as failed
- ✅ Signature verification with `STRIPE_WEBHOOK_SECRET`

**Location:** `src/controllers/webhookController.ts`

---

## 🔍 **Debug: Check if Webhook is Receiving Events**

### Step 1: Check Stripe Dashboard

Go to: **https://dashboard.stripe.com/test/webhooks**

1. Find your webhook endpoint
2. Click on it
3. Check **"Events"** tab - look for recent events sent
4. For your session: `cs_test_a1QAKcVF3CFGd8DN0YMy2X2IRSA480AKIVotHJD9R8FMx5Sv5L0kGKOd86`

**What to look for:**
- ✅ Event `checkout.session.completed` was sent
- ❌ Event delivery failed (red X)
- ⏳ Event is pending/queued

### Step 2: Send Test Webhook

In Stripe Dashboard:

1. Go to your webhook endpoint
2. Click **"Send test webhook"**
3. Select event type: `checkout.session.completed`
4. Click **"Send test webhook"**

Check Render logs to see if webhook was received.

---

## 🔧 **Most Common Issues**

### Issue 1: Webhook URL Not Configured

**Verify in Stripe Dashboard:**
- Go to: https://dashboard.stripe.com/test/webhooks
- Check if endpoint exists: `https://gpt-ugc-content-creator.onrender.com/webhook/stripe`
- If not, click **"Add endpoint"**

**Add endpoint with:**
- URL: `https://gpt-ugc-content-creator.onrender.com/webhook/stripe`
- Description: "UGC Video Creator - Production"
- Events to send:
  - `checkout.session.completed`
  - `checkout.session.async_payment_succeeded`
  - `checkout.session.async_payment_failed`
  - `payment_intent.payment_failed`
- Click **"Add endpoint"**
- Copy the signing secret (should match: `whsec_zOel3eHLaslgNx5S0QXVA2Irq7DVe2aW`)

### Issue 2: Wrong Signing Secret

**Verify in Render:**
- Go to: https://dashboard.render.com → Your Service → Environment
- Check `STRIPE_WEBHOOK_SECRET` = `whsec_zOel3eHLaslgNx5S0QXVA2Irq7DVe2aW`
- Must match exactly (no spaces, no quotes)

### Issue 3: Webhook Events Not Selected

Make sure these events are enabled:
- ✅ `checkout.session.completed`
- ✅ `checkout.session.async_payment_succeeded`
- ✅ `checkout.session.async_payment_failed`

---

## 🚀 **Manual Fix for Current Session**

Since you already paid, you can manually trigger the webhook processing:

### Option A: Send Test Webhook from Stripe

1. Go to Stripe Dashboard → Webhooks
2. Click your endpoint
3. Click **"Send test webhook"**
4. Select: `checkout.session.completed`
5. Edit the JSON to use your actual session ID:
   ```json
   {
     "id": "cs_test_a1QAKcVF3CFGd8DN0YMy2X2IRSA480AKIVotHJD9R8FMx5Sv5L0kGKOd86",
     ...
   }
   ```
6. Send

This will trigger your backend to process the payment.

### Option B: Create Manual Credit Grant Endpoint (Temporary)

I can add a temporary admin endpoint to manually mark payments as paid. Let me know if you want this.

---

## 📊 **Verify Webhook is Working**

After configuring webhook in Stripe, test:

**1. Create new checkout:**
```bash
curl -X POST https://gpt-ugc-content-creator.onrender.com/api/billing/create-checkout \
  -H "x-gpt-backend-secret: 7C5dJXv0rPpPp9sV_3qkL2wzA1mZBabA" \
  -H "Content-Type: application/json" \
  -d '{
    "userExternalId": "chatgpt:test2",
    "projectId": "test-project-123",
    "plan": "single_video"
  }'
```

**2. Complete payment in Stripe checkout**

**3. Check Render logs:**
```
[INFO] Received Stripe webhook event: checkout.session.completed
[INFO] Checkout session completed
[INFO] Added 1 credit to user
```

**4. Check status:**
```bash
curl -X POST https://gpt-ugc-content-creator.onrender.com/api/billing/check-status \
  -H "x-gpt-backend-secret: 7C5dJXv0rPpPp9sV_3qkL2wzA1mZBabA" \
  -H "Content-Type: application/json" \
  -d '{"stripeSessionId":"NEW_SESSION_ID"}'
```

Should show: `"status": "paid"`, `"creditsRemaining": 1`

---

## 🔑 **Quick Checklist**

- [ ] Webhook endpoint exists in Stripe dashboard
- [ ] Webhook URL matches: `https://gpt-ugc-content-creator.onrender.com/webhook/stripe`
- [ ] Signing secret matches in both Stripe and Render env vars
- [ ] Events are enabled: `checkout.session.completed`
- [ ] Test webhook sent successfully
- [ ] Render logs show webhook received
- [ ] Payment status updates to "paid"
- [ ] Credits increase

---

## 💡 **For Your Current Paid Session**

The easiest way to fix your current stuck payment:

1. Go to Stripe Dashboard
2. Find the session: `cs_test_a1QAKcVF3CFGd8DN0YMy2X2IRSA480AKIVotHJD9R8FMx5Sv5L0kGKOd86`
3. Use "Send test webhook" with this session ID
4. Or I can create a manual credit grant endpoint for you

Let me know which approach you prefer!

---

**The webhook handler code is correct - just needs to receive events from Stripe!** 🎯
