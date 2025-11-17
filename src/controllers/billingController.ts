import { Request, Response } from 'express';
import { sendSuccess, sendError } from '../utils/responses';
import { validateRequired } from '../utils/validation';
import { AppError } from '../utils/error';
import { logger } from '../config/logger';
import { createCheckoutForProject, getPaymentStatusBySessionId } from '../services/billingService';

// POST /api/billing/create-checkout
export async function createCheckoutHandler(req: Request, res: Response): Promise<void> {
  try {
    const { userExternalId, projectId, plan } = req.body;

    validateRequired(userExternalId, 'userExternalId');
    validateRequired(plan, 'plan');

    const result = await createCheckoutForProject(userExternalId, projectId || null, plan);

    sendSuccess(res, result);
  } catch (error: any) {
    logger.error('Error in createCheckout:', error);
    if (error instanceof AppError) {
      sendError(res, error.statusCode, error.errorCode, error.message, error.details);
    } else {
      sendError(res, 500, 'INTERNAL_ERROR', 'An error occurred while creating checkout session');
    }
  }
}

// POST /api/billing/check-status
export async function checkStatusHandler(req: Request, res: Response): Promise<void> {
  try {
    const { stripeSessionId } = req.body;

    validateRequired(stripeSessionId, 'stripeSessionId');

    const status = await getPaymentStatusBySessionId(stripeSessionId);

    sendSuccess(res, status);
  } catch (error: any) {
    logger.error('Error in checkStatus:', error);
    if (error instanceof AppError) {
      sendError(res, error.statusCode, error.errorCode, error.message, error.details);
    } else {
      sendError(res, 500, 'INTERNAL_ERROR', 'An error occurred while checking payment status');
    }
  }
}
