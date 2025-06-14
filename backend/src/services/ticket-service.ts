// src/services/ticket-service.ts
// ========== TICKET SERVICE ==========
// Contains business logic for ticket operations including purchase with referral system

// UUID generation will be handled by database or passed in
import { RepositoryFactory } from '../repositories/factory';
import { EmailService } from './email-service';
import { 
  TicketDTO,
  TicketPurchaseRequestDTO,
  TicketPurchaseResponseDTO,
  FanDTO,
  ReferralValidationResult
} from '../dto';

export class TicketService {

  /**
   * Purchase tickets with referral code support
   */
  static async purchaseTickets(
    fanId: string, 
    purchaseRequest: TicketPurchaseRequestDTO
  ): Promise<TicketPurchaseResponseDTO> {
    
    const factory = RepositoryFactory.getFactory();
    const userRepo = factory.getUserRepository();
    const ticketRepo = factory.getTicketRepository();
    
    try {
      // Validate fan exists
      const fan = await userRepo.findById(fanId);
      if (!fan || fan.user_type !== 'fan') {
        throw new Error('Fan not found');
      }

      // Validate quantity
      if (purchaseRequest.quantity <= 0 || purchaseRequest.quantity > 10) {
        throw new Error('Quantity must be between 1 and 10 tickets');
      }

      // Get concert and zone information (for now using existing data service)
      const concert = await this.getConcertDetails(purchaseRequest.concert_id);
      if (!concert) {
        throw new Error('Concert not found');
      }

      // Validate zone exists and get pricing
      const zoneInfo = await this.getZoneInfo(
        purchaseRequest.concert_id, 
        concert.arena_id, 
        purchaseRequest.zone_name
      );
      if (!zoneInfo) {
        throw new Error('Zone not found for this concert');
      }
      


      // Check availability
      const availableTickets = await this.getAvailableTickets(
        purchaseRequest.concert_id, 
        purchaseRequest.zone_name
      );
      if (availableTickets < purchaseRequest.quantity) {
        throw new Error(`Only ${availableTickets} tickets available in ${purchaseRequest.zone_name}`);
      }

      // Process referral code
      const referralResult = await this.validateReferralCode(
        purchaseRequest.referral_code, 
        fanId
      );

      // Calculate pricing
      const pricePerTicket = zoneInfo.price;
      let discountPercentage = referralResult.is_valid ? referralResult.discount_percentage : 0;
      let pointsDiscount = 0;
      let pointsUsed = 0;
      if (purchaseRequest.points_to_redeem && purchaseRequest.points_to_redeem > 0) {
        // Only allow up to 50 points per purchase, and up to the user's balance
        const fanPoints = fan.referral_points || (fan.fan_details?.referral_points ?? 0) || 0;
        pointsUsed = Math.min(50, purchaseRequest.points_to_redeem, fanPoints);
        if (pointsUsed > 0) {
          pointsDiscount = pointsUsed; // 1 point = 1% discount
        }
      }
      // Only the higher of referral or points discount applies
      if (pointsDiscount > discountPercentage) {
        discountPercentage = pointsDiscount;
      }
      // Deduct points if used
      if (pointsUsed > 0 && pointsDiscount >= discountPercentage) {
        await userRepo.updateReferralPoints(fanId, -pointsUsed);
      }
      const finalPricePerTicket = pricePerTicket * (1 - discountPercentage / 100);
      const totalPrice = finalPricePerTicket * purchaseRequest.quantity;
      const discountAmount = (pricePerTicket * purchaseRequest.quantity) - totalPrice;

      // Create tickets
      const tickets = [];
      // Fetch arena details for denormalization
      const arenaRepo = factory.getArenaRepository();
      const arena = await arenaRepo.findById(concert.arena_id);
      // Denormalized fields
      const arena_name = arena?.arena_name || '';
      const arena_location = arena?.arena_location || '';
      const concert_name = concert.description || '';
      const ticketData = {
        fan_id: fanId,
        concert_id: purchaseRequest.concert_id,
        arena_id: concert.arena_id,
        zone_name: purchaseRequest.zone_name,
        purchase_date: new Date(),
        purchase_price: finalPricePerTicket,
        // Denormalized fields for MongoDB
        concert_date: new Date(concert.concert_date),
        fan_username: this.extractFanUsername(fan),
        arena_name,
        arena_location,
        concert_name
      };

      // Create multiple tickets
      const ticketsToCreate = Array.from({ length: purchaseRequest.quantity }, (_, index) => ({
        ...ticketData,
        ticket_id: `ticket-${Date.now()}-${index}`,
        _id: `ticket-${Date.now()}-${index}` // For MongoDB compatibility
      }));

      const createdTickets = await ticketRepo.createMultiple(ticketsToCreate);

      // Update referral system if code was used
      if (referralResult.is_valid && referralResult.referrer) {
        await this.processReferralRewards(
          referralResult.referrer.user_id, 
          fanId, 
          purchaseRequest.quantity
        );
      }

      // Convert to DTOs
      const ticketDTOs: TicketDTO[] = createdTickets.map(ticket => ({
        ticket_id: ticket.ticket_id || ticket._id,
        fan_id: ticket.fan_id,
        concert_id: ticket.concert_id,
        arena_id: ticket.arena_id,
        zone_name: ticket.zone_name,
        purchase_date: ticket.purchase_date.toISOString(),
        purchase_price: ticket.purchase_price,
        fan_username: ticket.fan_username,
        concert_date: ticket.concert_date?.toISOString() || concert.concert_date
      }));

      const confirmationId = `conf-${Date.now()}`;
      
      const purchaseResponse = {
        success: true,
        tickets: ticketDTOs,
        total_amount: totalPrice,
        discount_applied: discountAmount,
        discount_percentage: discountPercentage,
        confirmation_id: confirmationId,
        database_type: RepositoryFactory.getCurrentDatabaseType(),
        message: `Successfully purchased ${purchaseRequest.quantity} ticket(s) for ${concert.description || 'concert'}`
      };

      // Send purchase confirmation email
      try {
        // Fetch actual arena information
        let arenaName = 'Concert Arena';
        try {
          const factory = RepositoryFactory.getFactory();
          const arenaRepo = factory.getArenaRepository();
          const arena = await arenaRepo.findById(concert.arena_id);
          arenaName = arena?.arena_name || arena?.name || zoneInfo?.arena_name || concert.arena_name || 'Concert Arena';
        } catch (arenaError) {
          console.log('Could not fetch arena details:', arenaError);
          arenaName = zoneInfo?.arena_name || concert.arena_name || concert.venue_name || concert.name || 'Concert Arena';
        }
        
        const emailData = {
          customerEmail: fan.email,
          customerName: `${fan.first_name} ${fan.last_name}`,
          confirmationId: confirmationId,
          tickets: ticketDTOs,
          totalAmount: totalPrice,
          discountApplied: discountAmount,
          concertName: concert.description || concert.concert_name || 'Concert',
          concertDate: concert.concert_date,
          venue: arenaName
        };
        
        // Send email asynchronously to not block the response
        EmailService.sendTicketPurchaseConfirmation(emailData);
      } catch (emailError) {
        console.error('Failed to send purchase confirmation email:', emailError);
        // Don't fail the purchase if email fails
      }

      return purchaseResponse;

    } catch (error) {
      throw new Error(`Failed to purchase tickets: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get tickets for a fan
   */
  static async getFanTickets(fanId: string): Promise<TicketDTO[]> {
    const factory = RepositoryFactory.getFactory();
    const ticketRepo = factory.getTicketRepository();
    
    const tickets = await ticketRepo.findByFan(fanId);
    
    return tickets.map(ticket => ({
      ticket_id: ticket.ticket_id || ticket._id,
      fan_id: ticket.fan_id,
      concert_id: ticket.concert_id,
      arena_id: ticket.arena_id,
      zone_name: ticket.zone_name,
      purchase_date: new Date(ticket.purchase_date).toISOString(),
      purchase_price: parseFloat(ticket.purchase_price) || 0,
      // Denormalized fields from the aggregation/join
      fan_username: ticket.fan_username,
      concert_date: ticket.concert_date ? new Date(ticket.concert_date).toISOString() : undefined,
      concert_name: ticket.concert_name,
      concert_time: ticket.concert_time,
      arena_name: ticket.arena_name,
      arena_location: ticket.arena_location,
    }));
  }

  /**
   * Validate referral code and determine discount
   */
  private static async validateReferralCode(
    referralCode: string | undefined, 
    fanId: string
  ): Promise<ReferralValidationResult> {
    
    if (!referralCode) {
      return { is_valid: false, discount_percentage: 0 };
    }

    const factory = RepositoryFactory.getFactory();
    const userRepo = factory.getUserRepository();

    // Check if fan has already used a referral code
    const fan = await userRepo.findById(fanId);
    const hasUsedReferral = this.checkIfFanUsedReferral(fan);
    
    if (hasUsedReferral) {
      return { 
        is_valid: false, 
        discount_percentage: 0, 
        error: 'You have already used a referral code' 
      };
    }

    // Find the referrer by referral code
    const referrer = await userRepo.findFanByReferralCode(referralCode);
    if (!referrer) {
      return { 
        is_valid: false, 
        discount_percentage: 0, 
        error: 'Invalid referral code' 
      };
    }

    // Can't use your own referral code
    if (referrer.user_id === fanId || referrer._id === fanId) {
      return { 
        is_valid: false, 
        discount_percentage: 0, 
        error: 'Cannot use your own referral code' 
      };
    }

    return {
      is_valid: true,
      discount_percentage: 10, // 10% discount
      referrer: this.convertToFanDTO(referrer)
    };
  }

  /**
   * Process referral rewards - give points to referrer and mark referral as used
   */
  private static async processReferralRewards(
    referrerId: string, 
    fanId: string, 
    ticketCount: number
  ): Promise<void> {
    const factory = RepositoryFactory.getFactory();
    const userRepo = factory.getUserRepository();

    // Award points to referrer (e.g., 5 points per ticket)
    const pointsToAward = ticketCount * 5;
    await userRepo.updateReferralPoints(referrerId, pointsToAward);

    // Mark that this fan has used a referral code
    await userRepo.markReferralCodeUsed(fanId);

    // Set the referrer relationship
    await userRepo.setReferrer(fanId, referrerId);
  }

  /**
   * Check if fan has already used a referral code
   */
  private static checkIfFanUsedReferral(fan: any): boolean {
    if (fan.referral_code_used !== undefined) {
      return fan.referral_code_used; // PostgreSQL
    }
    if (fan.fan_details?.referral_code_used !== undefined) {
      return fan.fan_details.referral_code_used; // MongoDB
    }
    return false;
  }

  /**
   * Extract fan username from user object
   */
  private static extractFanUsername(fan: any): string {
    if (fan.username) return fan.username; // PostgreSQL
    if (fan.fan_details?.username) return fan.fan_details.username; // MongoDB
    return 'unknown';
  }

  /**
   * Convert database fan object to FanDTO
   */
  private static convertToFanDTO(fan: any): FanDTO {
    // Handle both PostgreSQL and MongoDB structures
    const baseUser = {
      user_id: fan.user_id || fan._id,
      email: fan.email,
      first_name: fan.first_name,
      last_name: fan.last_name,
      registration_date: fan.registration_date?.toISOString() || new Date().toISOString(),
      last_login: fan.last_login?.toISOString(),
      user_type: 'fan' as const
    };

    if (fan.username) {
      // PostgreSQL structure
      return {
        ...baseUser,
        username: fan.username,
        preferred_genre: fan.preferred_genre,
        phone_number: fan.phone_number,
        referral_code: fan.referral_code,
        referred_by: fan.referred_by,
        referral_points: fan.referral_points || 0,
        referral_code_used: fan.referral_code_used || false
      };
    } else {
      // MongoDB structure
      const fanDetails = fan.fan_details || {};
      return {
        ...baseUser,
        username: fanDetails.username,
        preferred_genre: fanDetails.preferred_genre,
        phone_number: fanDetails.phone_number,
        referral_code: fanDetails.referral_code,
        referred_by: fanDetails.referred_by,
        referral_points: fanDetails.referral_points || 0,
        referral_code_used: fanDetails.referral_code_used || false
      };
    }
  }

  // ========== REAL DATA METHODS ==========
  // These use the actual concert/arena repositories

  private static async getConcertDetails(concertId: string): Promise<any> {
    const factory = RepositoryFactory.getFactory();
    const concertRepo = factory.getConcertRepository();
    
    const concert = await concertRepo.findById(concertId);
    return concert;
  }

  private static async getZoneInfo(concertId: string, arenaId: string, zoneName: string): Promise<any> {
    const factory = RepositoryFactory.getFactory();
    const concertRepo = factory.getConcertRepository();
    
    const zoneInfo = await concertRepo.findZonePricing(concertId, arenaId, zoneName);
    return zoneInfo;
  }

  private static async getAvailableTickets(concertId: string, zoneName: string): Promise<number> {
    const factory = RepositoryFactory.getFactory();
    const concertRepo = factory.getConcertRepository();
    
    const availableTickets = await concertRepo.findAvailableTickets(concertId, zoneName);
    return availableTickets;
  }


} 