import { Request, Response } from 'express';
import { DataService } from '../services/data-service';

export class ReferralController {

  /**
   * Validate a referral code
   */
  async validateReferralCode(req: Request, res: Response): Promise<void> {
    try {
      const { referralCode, fanId } = req.body;
      
      if (!referralCode) {
        res.status(400).json({ error: 'Referral code is required' });
        return;
      }

      if (!fanId) {
        res.status(400).json({ error: 'Fan ID is required' });
        return;
      }

      // Check if fan has already used a referral code
      const fan = await DataService.getUserById(fanId);
      if (!fan) {
        res.status(404).json({ error: 'Fan not found' });
        return;
      }

      const fanDetails = fan.fan_details || fan;
      if (fanDetails.referral_code_used) {
        res.status(400).json({ 
          error: 'You have already used a referral code',
          valid: false 
        });
        return;
      }

      // Find the referrer by referral code
      const referrer = await DataService.getUserByReferralCode(referralCode);
      if (!referrer) {
        res.status(404).json({ 
          error: 'Invalid referral code',
          valid: false 
        });
        return;
      }

      // Can't use your own referral code
      if (referrer.user_id === fanId || referrer._id === fanId) {
        res.status(400).json({ 
          error: 'You cannot use your own referral code',
          valid: false 
        });
        return;
      }

      res.json({
        valid: true,
        referralCode,
        referrer: {
          id: referrer.user_id || referrer._id,
          username: referrer.fan_details?.username || referrer.username,
          name: `${referrer.first_name} ${referrer.last_name}`
        },
        discount: 10, // 10% discount
        database: DataService.getCurrentDatabaseType()
      });

    } catch (error) {
      console.error('Error validating referral code:', error);
      res.status(500).json({ 
        error: 'Failed to validate referral code',
        valid: false,
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Apply referral code during signup
   */
  async applyReferralCode(req: Request, res: Response): Promise<void> {
    try {
      const { referralCode, fanId } = req.body;
      
      if (!referralCode || !fanId) {
        res.status(400).json({ error: 'Referral code and fan ID are required' });
        return;
      }

      // Validate referral code first
      const validation = await this.validateReferralCodeInternal(referralCode, fanId);
      if (!validation.valid) {
        res.status(400).json({ error: validation.error });
        return;
      }

      // Update fan's referred_by field
      await DataService.updateFanReferrer(fanId, validation.referrer.id);

      res.json({
        success: true,
        message: 'Referral code applied successfully',
        referrer: validation.referrer,
        discount: validation.discount,
        database: DataService.getCurrentDatabaseType()
      });

    } catch (error) {
      console.error('Error applying referral code:', error);
      res.status(500).json({ 
        error: 'Failed to apply referral code',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get referral statistics for a fan
   */
  async getReferralStats(req: Request, res: Response): Promise<void> {
    try {
      const { fanId } = req.params;
      
      if (!fanId) {
        res.status(400).json({ error: 'Fan ID is required' });
        return;
      }

      const fan = await DataService.getUserById(fanId);
      if (!fan || fan.user_type !== 'fan') {
        res.status(404).json({ error: 'Fan not found' });
        return;
      }

      const fanDetails = fan.fan_details || fan;
      
      // Get referral statistics
      const stats = await this.calculateReferralStats(fanId);

      res.json({
        success: true,
        fanId,
        myReferralCode: fanDetails.referral_code,
        referralPoints: fanDetails.referral_points || 0,
        referralCodeUsed: fanDetails.referral_code_used || false,
        referredBy: fanDetails.referred_by || null,
        stats,
        database: DataService.getCurrentDatabaseType()
      });

    } catch (error) {
      console.error('Error fetching referral stats:', error);
      res.status(500).json({ 
        error: 'Failed to fetch referral statistics',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get list of fans referred by this fan
   */
  async getMyReferrals(req: Request, res: Response): Promise<void> {
    try {
      const { fanId } = req.params;
      const { limit = 10, offset = 0 } = req.query;
      
      if (!fanId) {
        res.status(400).json({ error: 'Fan ID is required' });
        return;
      }

      const referrals = await this.getFanReferrals(fanId);
      
      // Apply pagination
      const startIndex = parseInt(offset as string);
      const endIndex = startIndex + parseInt(limit as string);
      const paginatedReferrals = referrals.slice(startIndex, endIndex);

      res.json({
        success: true,
        count: paginatedReferrals.length,
        total: referrals.length,
        referrals: paginatedReferrals,
        pagination: {
          limit: parseInt(limit as string),
          offset: parseInt(offset as string),
          hasMore: endIndex < referrals.length
        },
        database: DataService.getCurrentDatabaseType()
      });

    } catch (error) {
      console.error('Error fetching referrals:', error);
      res.status(500).json({ 
        error: 'Failed to fetch referrals',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Award referral points to a fan
   */
  async awardReferralPoints(req: Request, res: Response): Promise<void> {
    try {
      const { fanId, points, reason } = req.body;
      
      if (!fanId || !points) {
        res.status(400).json({ error: 'Fan ID and points are required' });
        return;
      }

      if (points <= 0) {
        res.status(400).json({ error: 'Points must be positive' });
        return;
      }

      const fan = await DataService.getUserById(fanId);
      if (!fan || fan.user_type !== 'fan') {
        res.status(404).json({ error: 'Fan not found' });
        return;
      }

      await DataService.updateUserReferralPoints(fanId, points);

      // Get updated fan details
      const updatedFan = await DataService.getUserById(fanId);
      const updatedDetails = updatedFan.fan_details || updatedFan;

      res.json({
        success: true,
        message: `Awarded ${points} referral points`,
        fanId,
        pointsAwarded: points,
        totalPoints: updatedDetails.referral_points || 0,
        reason: reason || 'Manual award',
        database: DataService.getCurrentDatabaseType()
      });

    } catch (error) {
      console.error('Error awarding referral points:', error);
      res.status(500).json({ 
        error: 'Failed to award referral points',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Convert referral points to discount
   */
  async convertPointsToDiscount(req: Request, res: Response): Promise<void> {
    try {
      const { fanId, pointsToConvert } = req.body;
      
      if (!fanId || !pointsToConvert) {
        res.status(400).json({ error: 'Fan ID and points to convert are required' });
        return;
      }

      if (pointsToConvert <= 0) {
        res.status(400).json({ error: 'Points to convert must be positive' });
        return;
      }

      const fan = await DataService.getUserById(fanId);
      if (!fan || fan.user_type !== 'fan') {
        res.status(404).json({ error: 'Fan not found' });
        return;
      }

      const fanDetails = fan.fan_details || fan;
      const currentPoints = fanDetails.referral_points || 0;

      if (currentPoints < pointsToConvert) {
        res.status(400).json({ 
          error: `Insufficient points. You have ${currentPoints} points but tried to convert ${pointsToConvert}` 
        });
        return;
      }

      // Convert points to discount (1 point = 1% discount, max 50%)
      const discountPercentage = Math.min(pointsToConvert, 50);
      
      // Deduct points
      await DataService.updateUserReferralPoints(fanId, -pointsToConvert);

      res.json({
        success: true,
        message: `Converted ${pointsToConvert} points to ${discountPercentage}% discount`,
        fanId,
        pointsConverted: pointsToConvert,
        discountPercentage,
        remainingPoints: currentPoints - pointsToConvert,
        database: DataService.getCurrentDatabaseType()
      });

    } catch (error) {
      console.error('Error converting points to discount:', error);
      res.status(500).json({ 
        error: 'Failed to convert points to discount',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Private helper methods

  private async validateReferralCodeInternal(referralCode: string, fanId: string) {
    // Check if fan has already used a referral code
    const fan = await DataService.getUserById(fanId);
    const fanDetails = fan.fan_details || fan;
    
    if (fanDetails.referral_code_used) {
      return {
        valid: false,
        error: 'You have already used a referral code'
      };
    }

    // Find the referrer by referral code
    const referrer = await DataService.getUserByReferralCode(referralCode);
    if (!referrer) {
      return {
        valid: false,
        error: 'Invalid referral code'
      };
    }

    // Can't use your own referral code
    if (referrer.user_id === fanId || referrer._id === fanId) {
      return {
        valid: false,
        error: 'You cannot use your own referral code'
      };
    }

    return {
      valid: true,
      referrer: {
        id: referrer.user_id || referrer._id,
        username: referrer.fan_details?.username || referrer.username,
        name: `${referrer.first_name} ${referrer.last_name}`
      },
      discount: 10 // 10% discount for using referral code
    };
  }

  private async calculateReferralStats(fanId: string) {
    const currentDb = DataService.getCurrentDatabaseType();
    
    if (currentDb === 'mongodb') {
      // MongoDB aggregation for stats
      const adapter = DataService.getAdapter();
      
      // Count referrals made by this fan
      const referralsResult = await adapter.getUsersReferredBy(fanId);
      const totalReferrals = referralsResult.data?.length || 0;
      
      // Count tickets purchased by referred fans
      const referredTicketsResult = await adapter.getTicketsFromReferrals(fanId);
      const ticketsFromReferrals = referredTicketsResult.data?.length || 0;
      
      return {
        totalReferrals,
        ticketsFromReferrals,
        pointsEarned: ticketsFromReferrals * 5, // 5 points per ticket from referrals
        conversionRate: totalReferrals > 0 ? (ticketsFromReferrals / totalReferrals * 100).toFixed(1) : '0'
      };
    } else {
      // PostgreSQL queries for stats
      const adapter = DataService.getAdapter();
      
      // Count direct referrals
      const referralsResult = await adapter.query(`
        SELECT COUNT(*) as total_referrals
        FROM fans
        WHERE referred_by = $1
      `, [fanId]);
      
      // Count tickets from referrals
      const ticketsResult = await adapter.query(`
        SELECT COUNT(t.*) as tickets_from_referrals
        FROM tickets t
        JOIN fans f ON t.fan_id = f.user_id
        WHERE f.referred_by = $1 AND t.referral_code_used = true
      `, [fanId]);
      
      const totalReferrals = parseInt(referralsResult.rows?.[0]?.total_referrals || '0');
      const ticketsFromReferrals = parseInt(ticketsResult.rows?.[0]?.tickets_from_referrals || '0');
      
      return {
        totalReferrals,
        ticketsFromReferrals,
        pointsEarned: ticketsFromReferrals * 5,
        conversionRate: totalReferrals > 0 ? (ticketsFromReferrals / totalReferrals * 100).toFixed(1) : '0'
      };
    }
  }

  private async getFanReferrals(fanId: string) {
    const currentDb = DataService.getCurrentDatabaseType();
    
    if (currentDb === 'mongodb') {
      const adapter = DataService.getAdapter();
      const result = await adapter.getUsersReferredBy(fanId);
      
      return (result.data || []).map((user: any) => ({
        id: user._id,
        username: user.fan_details?.username,
        name: `${user.first_name} ${user.last_name}`,
        registrationDate: user.registration_date,
        referralCodeUsed: user.fan_details?.referral_code_used || false
      }));
    } else {
      const adapter = DataService.getAdapter();
      const result = await adapter.query(`
        SELECT 
          u.user_id,
          u.first_name,
          u.last_name,
          u.registration_date,
          f.username,
          f.referral_code_used
        FROM users u
        JOIN fans f ON u.user_id = f.user_id
        WHERE f.referred_by = $1
        ORDER BY u.registration_date DESC
      `, [fanId]);
      
      return (result.rows || []).map((row: any) => ({
        id: row.user_id,
        username: row.username,
        name: `${row.first_name} ${row.last_name}`,
        registrationDate: row.registration_date,
        referralCodeUsed: row.referral_code_used
      }));
    }
  }
}

// Export controller functions for routes
const referralController = new ReferralController();

export const validateReferralCode = referralController.validateReferralCode.bind(referralController);
export const applyReferralCode = referralController.applyReferralCode.bind(referralController);
export const getReferralStats = referralController.getReferralStats.bind(referralController);
export const getMyReferrals = referralController.getMyReferrals.bind(referralController);
export const awardReferralPoints = referralController.awardReferralPoints.bind(referralController);
export const convertPointsToDiscount = referralController.convertPointsToDiscount.bind(referralController);