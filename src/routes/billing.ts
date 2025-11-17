import { Router } from 'express';
import { createCheckoutHandler, checkStatusHandler } from '../controllers/billingController';

const router = Router();

router.post('/create-checkout', createCheckoutHandler);
router.post('/check-status', checkStatusHandler);

export default router;
