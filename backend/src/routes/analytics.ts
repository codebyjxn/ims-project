import { Router } from 'express';
import * as analyticsController from '../controllers/analytics';
import { authenticateToken, isAdmin } from '../middleware/auth';

const router = Router();

router.get(
  '/upcoming-performance',
  authenticateToken,
  isAdmin,
  analyticsController.getUpcomingConcertsPerformance
);

export default router; 