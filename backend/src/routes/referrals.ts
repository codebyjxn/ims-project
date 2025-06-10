import { Router } from 'express';
import { 
  validateReferralCode, 
  applyReferralCode, 
  getReferralStats, 
  getMyReferrals,
  awardReferralPoints,
  convertPointsToDiscount 
} from '../controllers/referral-controller';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Apply authentication to all referral routes
router.use(authenticateToken);

// Validate a referral code
router.post('/validate', validateReferralCode);

// Apply referral code during signup/purchase
router.post('/apply', applyReferralCode);

// Get referral statistics for a fan
router.get('/stats/:fanId', getReferralStats);

// Get list of fans referred by this fan
router.get('/my-referrals/:fanId', getMyReferrals);

// Award referral points (admin function)
router.post('/award-points', awardReferralPoints);

// Convert referral points to discount
router.post('/convert-points', convertPointsToDiscount);

export default router; 