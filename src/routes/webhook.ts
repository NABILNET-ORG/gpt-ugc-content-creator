import { Router } from 'express';
import { stripeWebhookHandler } from '../controllers/webhookController';

const router = Router();

router.post('/stripe', stripeWebhookHandler);

export default router;
