import { Router } from 'express';
import {
  scrapeProductHandler,
  prepareAssetsHandler,
  generateVideoHandler,
} from '../controllers/ugcController';

const router = Router();

router.post('/scrape-product', scrapeProductHandler);
router.post('/prepare-assets', prepareAssetsHandler);
router.post('/generate-video', generateVideoHandler);

export default router;
