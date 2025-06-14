import { Router } from 'express';
import { 
  validateReferralCode, 
  applyReferralCode
} from '../controllers/referral-controller';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Apply authentication to all referral routes
router.use(authenticateToken);

// Validate a referral code
router.post('/validate', validateReferralCode);

// Apply referral code during signup/purchase
router.post('/apply', applyReferralCode);

export default router;