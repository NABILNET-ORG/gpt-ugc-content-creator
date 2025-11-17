import { createCheckoutSession } from '../config/stripe';
import { findOrCreateUser, getUserCredits } from '../db/queries';
import { createPayment } from './paymentService';
import { logger } from '../config/logger';
import { AppError } from '../utils/error';

// Pricing plans
const PLANS = {
  single_video: {
    name: 'Single Video',
    amount: 1900, // $19.00 in cents
    currency: 'usd',
    credits: 1,
  },
};

export interface CheckoutResult {
  stripeSessionId: string;
  checkoutUrl: string;
  amount: number;
  currency: string;
}

export async function createCheckoutForProject(
  userExternalId: string,
  projectId: string | null,
  plan: string
): Promise<CheckoutResult> {
  logger.info('Creating checkout session', { userExternalId, projectId, plan });

  // Validate plan
  const planConfig = PLANS[plan as keyof typeof PLANS];
  if (!planConfig) {
    throw new AppError(400, 'INVALID_PLAN', `Invalid plan: ${plan}`);
  }

  // Find or create user
  const user = await findOrCreateUser(userExternalId);

  // Create Stripe checkout session
  const session = await createCheckoutSession({
    lineItems: [
      {
        price_data: {
          currency: planConfig.currency,
          product_data: {
            name: planConfig.name,
            description: `Purchase ${planConfig.credits} video generation credit(s)`,
          },
          unit_amount: planConfig.amount,
        },
        quantity: 1,
      },
    ],
    successUrl: `https://example.com/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancelUrl: `https://example.com/checkout/cancel`,
    metadata: {
      user_id: user.id,
      user_external_id: userExternalId,
      project_id: projectId || '',
      plan,
    },
  });

  // Create payment record
  await createPayment({
    userId: user.id,
    projectId: projectId,
    stripeSessionId: session.id,
    status: 'pending',
    plan,
    amount: planConfig.amount,
    currency: planConfig.currency,
  });

  logger.info('Checkout session created', { sessionId: session.id });

  return {
    stripeSessionId: session.id,
    checkoutUrl: session.url!,
    amount: planConfig.amount,
    currency: planConfig.currency,
  };
}

export async function getPaymentStatusBySessionId(stripeSessionId: string): Promise<{
  status: string;
  projectId: string | null;
  userExternalId: string;
  creditsRemaining: number;
}> {
  const paymentService = await import('./paymentService');
  const payment = await paymentService.getPaymentBySessionId(stripeSessionId);

  const user = await findOrCreateUser(payment.user_id);
  const creditsRemaining = await getUserCredits(user.id);

  return {
    status: payment.status,
    projectId: payment.project_id || null,
    userExternalId: user.external_id,
    creditsRemaining,
  };
}
