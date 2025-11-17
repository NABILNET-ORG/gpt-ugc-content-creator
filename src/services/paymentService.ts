import {
  createPayment as dbCreatePayment,
  getPaymentBySessionId as dbGetPaymentBySessionId,
  updatePaymentStatus as dbUpdatePaymentStatus,
  getUserCredits,
  incrementUserCredits,
} from '../db/queries';
import { Payment, PaymentStatus } from '../types';
import { AppError } from '../utils/error';

export async function createPayment(params: {
  userId: string;
  projectId?: string | null;
  stripeSessionId: string;
  status: PaymentStatus;
  plan?: string;
  amount?: number;
  currency?: string;
}): Promise<Payment> {
  return await dbCreatePayment(params);
}

export async function getPaymentBySessionId(stripeSessionId: string): Promise<Payment> {
  const payment = await dbGetPaymentBySessionId(stripeSessionId);
  if (!payment) {
    throw new AppError(404, 'PAYMENT_NOT_FOUND', 'Payment not found');
  }
  return payment;
}

export async function markPaymentAsPaid(stripeSessionId: string): Promise<void> {
  await dbUpdatePaymentStatus(stripeSessionId, 'paid');
}

export async function markPaymentAsFailed(stripeSessionId: string): Promise<void> {
  await dbUpdatePaymentStatus(stripeSessionId, 'failed');
}

export async function getPaymentStatus(stripeSessionId: string): Promise<{
  status: PaymentStatus;
  projectId: string | null;
  userId: string;
  creditsRemaining: number;
}> {
  const payment = await getPaymentBySessionId(stripeSessionId);
  const creditsRemaining = await getUserCredits(payment.user_id);

  return {
    status: payment.status,
    projectId: payment.project_id || null,
    userId: payment.user_id,
    creditsRemaining,
  };
}

export async function addCreditsToUser(userId: string, credits: number): Promise<void> {
  await incrementUserCredits(userId, credits);
}
