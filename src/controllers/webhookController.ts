import { Request, Response } from 'express';
import { stripe } from '../config/stripe';
import { env } from '../config/env';
import { logger } from '../config/logger';
import { markPaymentAsPaid, markPaymentAsFailed, addCreditsToUser } from '../services/paymentService';
import { getPaymentBySessionId } from '../services/paymentService';

// POST /webhook/stripe
export async function stripeWebhookHandler(req: Request, res: Response): Promise<void> {
  const signature = req.headers['stripe-signature'];

  if (!signature) {
    res.status(400).json({
      success: false,
      errorCode: 'MISSING_SIGNATURE',
      message: 'Missing stripe-signature header',
    });
    return;
  }

  try {
    // Verify webhook signature
    const event = stripe.webhooks.constructEvent(
      req.body, // raw buffer
      signature,
      env.STRIPE_WEBHOOK_SECRET
    );

    logger.info(`Received Stripe webhook event: ${event.type}`, { eventId: event.id });

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        logger.info('Checkout session completed', { sessionId: session.id });

        // Mark payment as paid
        await markPaymentAsPaid(session.id);

        // Optionally add credits to user
        const payment = await getPaymentBySessionId(session.id);
        if (payment.plan === 'single_video') {
          await addCreditsToUser(payment.user_id, 1);
          logger.info('Added 1 credit to user', { userId: payment.user_id });
        }

        break;
      }

      case 'checkout.session.async_payment_succeeded': {
        const session = event.data.object;
        logger.info('Async payment succeeded', { sessionId: session.id });

        await markPaymentAsPaid(session.id);

        const payment = await getPaymentBySessionId(session.id);
        if (payment.plan === 'single_video') {
          await addCreditsToUser(payment.user_id, 1);
        }

        break;
      }

      case 'checkout.session.async_payment_failed': {
        const session = event.data.object;
        logger.warn('Async payment failed', { sessionId: session.id });

        await markPaymentAsFailed(session.id);
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object;
        logger.warn('Payment intent failed', { paymentIntentId: paymentIntent.id });
        // Handle payment failure if needed
        break;
      }

      default:
        logger.debug(`Unhandled webhook event type: ${event.type}`);
    }

    // Always respond with 200
    res.json({ received: true });
  } catch (error: any) {
    logger.error('Stripe webhook error:', error.message);
    res.status(400).json({
      success: false,
      errorCode: 'WEBHOOK_ERROR',
      message: error.message,
    });
  }
}
