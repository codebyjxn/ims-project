import { Request, Response } from 'express';
import { DataService } from '../services/data-service';
import { randomUUID } from 'crypto';

export class TicketController {
  
  /**
   * Purchase tickets for a concert with referral code support
   */
  async purchaseTicket(req: Request, res: Response): Promise<void> {
    try {
      const { 
        concertId, 
        zoneId, 
        quantity, 
        fanId, 
        referralCode,
        paymentMethod 
      } = req.body;

      // Validate required fields
      if (!concertId || !zoneId || !quantity || !fanId) {
        res.status(400).json({ 
          error: 'Missing required fields: concertId, zoneId, quantity, fanId' 
        });
        return;
      }

      if (quantity <= 0 || quantity > 10) {
        res.status(400).json({ 
          error: 'Quantity must be between 1 and 10 tickets' 
        });
        return;
      }

      // Get concert details to validate existence and get zone info
      const concert = await DataService.getConcertById(concertId);
      if (!concert) {
        res.status(404).json({ error: 'Concert not found' });
        return;
      }

      // Get fan details
      const fan = await DataService.getUserById(fanId);
      if (!fan || fan.user_type !== 'fan') {
        res.status(404).json({ error: 'Fan not found' });
        return;
      }

      // Validate zone exists and get pricing
      const zoneInfo = await this.getZoneInfo(concertId, zoneId);
      if (!zoneInfo) {
        res.status(404).json({ error: 'Zone not found for this concert' });
        return;
      }

      // Check zone capacity
      const availableTickets = await this.getAvailableTickets(concertId, zoneId);
      if (availableTickets < quantity) {
        res.status(400).json({ 
          error: `Only ${availableTickets} tickets available in ${zoneId}` 
        });
        return;
      }

      // Handle referral code logic
      let referralDiscount = 0;
      let referralCodeUsed = false;
      let referrerFan = null;

      if (referralCode) {
        const referralResult = await this.processReferralCode(referralCode, fanId);
        if (referralResult.isValid) {
          referralDiscount = referralResult.discount;
          referralCodeUsed = true;
          referrerFan = referralResult.referrer;
        } else {
          res.status(400).json({ error: referralResult.error });
          return;
        }
      }

      // Calculate total price with referral discount
      const basePrice = zoneInfo.price * quantity;
      const discountAmount = basePrice * (referralDiscount / 100);
      const totalPrice = basePrice - discountAmount;

      // Simulate payment processing
      const paymentResult = await this.processPayment({
        amount: totalPrice,
        method: paymentMethod,
        fanId
      });

      if (!paymentResult.success) {
        res.status(400).json({ error: 'Payment failed: ' + paymentResult.error });
        return;
      }

      // Create tickets
      const tickets = [];
      for (let i = 0; i < quantity; i++) {
        const ticketData = {
          ticket_id: randomUUID(),
          _id: randomUUID(), // For MongoDB
          fan_id: fanId,
          concert_id: concertId,
          arena_id: zoneInfo.arena_id,
          zone_name: zoneId,
          purchase_date: new Date(),
          referral_code_used: referralCodeUsed,
          // MongoDB specific fields
          concert_date: concert.concert_date,
          fan_username: fan.fan_details?.username || fan.username,
          price: zoneInfo.price
        };

        const createdTicket = await DataService.createTicket(ticketData);
        tickets.push(createdTicket);
      }

      // Update referral system if code was used
      if (referralCodeUsed && referrerFan) {
        await this.awardReferralPoints(referrerFan.user_id, quantity);
        await this.markReferralCodeUsed(fanId);
      }

      // Send confirmation email (placeholder)
      await this.sendTicketConfirmation(fanId, tickets, concert);

      res.status(201).json({
        success: true,
        message: 'Tickets purchased successfully',
        tickets,
        totalAmount: totalPrice,
        discountApplied: discountAmount,
        confirmationId: randomUUID(),
        database: DataService.getCurrentDatabaseType()
      });

    } catch (error) {
      console.error('Error purchasing tickets:', error);
      res.status(500).json({ 
        error: 'Failed to purchase tickets',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get tickets for a specific user
   */
  async getUserTickets(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      
      if (!userId) {
        res.status(400).json({ error: 'User ID is required' });
        return;
      }

      const tickets = await DataService.getTicketsByUserId(userId);
      
      res.json({
        success: true,
        count: tickets.length,
        tickets,
        database: DataService.getCurrentDatabaseType()
      });

    } catch (error) {
      console.error('Error fetching user tickets:', error);
      res.status(500).json({ 
        error: 'Failed to fetch tickets',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get concert ticket summary (sales statistics)
   */
  async getConcertTicketSummary(req: Request, res: Response): Promise<void> {
    try {
      const { concertId } = req.params;
      
      if (!concertId) {
        res.status(400).json({ error: 'Concert ID is required' });
        return;
      }

      const summary = await this.generateConcertSummary(concertId);
      
      res.json({
        success: true,
        concertId,
        summary,
        database: DataService.getCurrentDatabaseType()
      });

    } catch (error) {
      console.error('Error generating concert summary:', error);
      res.status(500).json({ 
        error: 'Failed to generate summary',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Validate purchase before payment
   */
  async validatePurchase(req: Request, res: Response): Promise<void> {
    try {
      const { concertId, zoneId, quantity, fanId, referralCode } = req.body;

      // Basic validation
      if (!concertId || !zoneId || !quantity || !fanId) {
        res.status(400).json({ 
          error: 'Missing required fields',
          valid: false 
        });
        return;
      }

      // Check concert exists
      const concert = await DataService.getConcertById(concertId);
      if (!concert) {
        res.status(404).json({ error: 'Concert not found', valid: false });
        return;
      }

      // Check zone availability
      const availableTickets = await this.getAvailableTickets(concertId, zoneId);
      const zoneInfo = await this.getZoneInfo(concertId, zoneId);
      
      if (availableTickets < quantity) {
        res.status(400).json({ 
          error: `Only ${availableTickets} tickets available`,
          valid: false,
          availableTickets
        });
        return;
      }

      // Check referral code if provided
      let referralInfo = null;
      if (referralCode) {
        const referralResult = await this.processReferralCode(referralCode, fanId);
        referralInfo = {
          isValid: referralResult.isValid,
          discount: referralResult.discount,
          error: referralResult.error
        };
      }

      const basePrice = zoneInfo.price * quantity;
      const discountAmount = referralInfo?.isValid ? 
        basePrice * ((referralInfo.discount || 0) / 100) : 0;
      const totalPrice = basePrice - discountAmount;

      res.json({
        valid: true,
        availableTickets,
        pricing: {
          basePrice,
          discountAmount,
          totalPrice,
          pricePerTicket: zoneInfo.price
        },
        referralInfo,
        database: DataService.getCurrentDatabaseType()
      });

    } catch (error) {
      console.error('Error validating purchase:', error);
      res.status(500).json({ 
        error: 'Validation failed',
        valid: false,
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Private helper methods

  private async getZoneInfo(concertId: string, zoneName: string): Promise<any> {
    const currentDb = DataService.getCurrentDatabaseType();
    
    if (currentDb === 'mongodb') {
      const concert = await DataService.getConcertById(concertId);
      if (!concert) return null;
      
      const zoneInfo = concert.zone_pricing?.find((z: any) => z.zone_name === zoneName);
      return zoneInfo ? {
        ...zoneInfo,
        arena_id: concert.arena_id
      } : null;
    } else {
      // PostgreSQL - get from concert_zone_pricing table
      const adapter = DataService.getAdapter();
      const result = await adapter.query(`
        SELECT czp.*, c.arena_id 
        FROM concert_zone_pricing czp
        JOIN concerts c ON czp.concert_id = c.concert_id
        WHERE czp.concert_id = $1 AND czp.zone_name = $2
      `, [concertId, zoneName]);
      
      return result.rows?.[0] || null;
    }
  }

  private async getAvailableTickets(concertId: string, zoneName: string): Promise<number> {
    const currentDb = DataService.getCurrentDatabaseType();
    
    // Get zone capacity
    let zoneCapacity = 0;
    if (currentDb === 'mongodb') {
      const concert = await DataService.getConcertById(concertId);
      if (!concert) return 0;
      
      // Need to get arena details to find zone capacity
      const arena = await DataService.getArenaById(concert.arena_id);
      const zone = arena?.zones?.find((z: any) => z.zone_name === zoneName);
      zoneCapacity = zone?.capacity_per_zone || 0;
    } else {
      const adapter = DataService.getAdapter();
      const result = await adapter.query(`
        SELECT z.capacity_per_zone
        FROM zones z
        JOIN concerts c ON z.arena_id = c.arena_id
        WHERE c.concert_id = $1 AND z.zone_name = $2
      `, [concertId, zoneName]);
      
      zoneCapacity = result.rows?.[0]?.capacity_per_zone || 0;
    }

    // Get sold tickets count
    let soldTickets = 0;
    if (currentDb === 'mongodb') {
      const adapter = DataService.getAdapter();
      const result = await adapter.getTicketsByConcertAndZone(concertId, zoneName);
      soldTickets = result.data?.length || 0;
    } else {
      const adapter = DataService.getAdapter();
      const result = await adapter.query(`
        SELECT COUNT(*) as sold_count
        FROM tickets
        WHERE concert_id = $1 AND zone_name = $2
      `, [concertId, zoneName]);
      
      soldTickets = parseInt(result.rows?.[0]?.sold_count || '0');
    }

    return Math.max(0, zoneCapacity - soldTickets);
  }

  private async processReferralCode(referralCode: string, fanId: string) {
    // Check if fan has already used a referral code
    const fan = await DataService.getUserById(fanId);
    const fanDetails = fan.fan_details || fan;
    
    if (fanDetails.referral_code_used) {
      return {
        isValid: false,
        error: 'You have already used a referral code'
      };
    }

    // Find the referrer by referral code
    const referrer = await DataService.getUserByReferralCode(referralCode);
    if (!referrer) {
      return {
        isValid: false,
        error: 'Invalid referral code'
      };
    }

    // Can't use your own referral code
    if (referrer.user_id === fanId || referrer._id === fanId) {
      return {
        isValid: false,
        error: 'You cannot use your own referral code'
      };
    }

    return {
      isValid: true,
      discount: 10, // 10% discount for using referral code
      referrer
    };
  }

  private async processPayment(paymentData: any) {
    // Mock payment processing
    // In a real implementation, this would integrate with payment gateways
    
    if (!paymentData.method) {
      return { success: false, error: 'Payment method required' };
    }

    if (paymentData.amount <= 0) {
      return { success: false, error: 'Invalid amount' };
    }

    // Simulate payment processing delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Mock success (90% success rate)
    const success = Math.random() > 0.1;
    
    if (success) {
      return {
        success: true,
        transactionId: randomUUID(),
        amount: paymentData.amount
      };
    } else {
      return {
        success: false,
        error: 'Payment declined'
      };
    }
  }

  private async awardReferralPoints(referrerId: string, ticketCount: number) {
    const pointsPerTicket = 5; // 5 points per ticket referred
    const pointsToAward = ticketCount * pointsPerTicket;
    
    try {
      await DataService.updateUserReferralPoints(referrerId, pointsToAward);
    } catch (error) {
      console.error('Error awarding referral points:', error);
    }
  }

  private async markReferralCodeUsed(fanId: string) {
    try {
      await DataService.markReferralCodeUsed(fanId);
    } catch (error) {
      console.error('Error marking referral code as used:', error);
    }
  }

  private async sendTicketConfirmation(fanId: string, tickets: any[], concert: any) {
    // Mock email sending
    console.log(`Sending ticket confirmation email to fan ${fanId}`);
    console.log(`Concert: ${concert.description}`);
    console.log(`Tickets: ${tickets.length}`);
    
    // In real implementation, integrate with email service
    return Promise.resolve();
  }

  private async generateConcertSummary(concertId: string) {
    const currentDb = DataService.getCurrentDatabaseType();
    
    if (currentDb === 'mongodb') {
      // MongoDB aggregation for summary
      const adapter = DataService.getAdapter();
      const result = await adapter.getConcertTicketSummary(concertId);
      return result.data || {};
    } else {
      // PostgreSQL query for summary
      const adapter = DataService.getAdapter();
      const result = await adapter.query(`
        SELECT 
          t.zone_name,
          COUNT(*) as tickets_sold,
          SUM(czp.price) as revenue,
          SUM(CASE WHEN t.referral_code_used THEN 1 ELSE 0 END) as referral_tickets
        FROM tickets t
        LEFT JOIN concert_zone_pricing czp ON t.concert_id = czp.concert_id AND t.zone_name = czp.zone_name
        WHERE t.concert_id = $1
        GROUP BY t.zone_name
        ORDER BY t.zone_name
      `, [concertId]);
      
      return {
        zones: result.rows || [],
        totalTickets: result.rows?.reduce((sum, row) => sum + parseInt(row.tickets_sold), 0) || 0,
        totalRevenue: result.rows?.reduce((sum, row) => sum + parseFloat(row.revenue || '0'), 0) || 0
      };
    }
  }
}

// Export controller functions for routes
const ticketController = new TicketController();

export const purchaseTicket = ticketController.purchaseTicket.bind(ticketController);
export const getUserTickets = ticketController.getUserTickets.bind(ticketController);
export const getConcertTicketSummary = ticketController.getConcertTicketSummary.bind(ticketController);
export const validatePurchase = ticketController.validatePurchase.bind(ticketController);