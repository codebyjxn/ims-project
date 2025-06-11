// src/controllers/clean-ticket-controller.ts
// ========== CLEAN TICKET CONTROLLER ==========
// Follows pattern: HTTP Request -> Controller -> Service -> Repository -> DB

import { Request, Response } from 'express';
import { TicketService } from '../services/ticket-service';
import { 
  TicketPurchaseRequestDTO,
  DTOValidators
} from '../dto';

export class CleanTicketController {

  /**
   * Purchase tickets endpoint
   * POST /api/tickets/purchase
   */
  static async purchaseTickets(req: Request, res: Response): Promise<void> {
    try {
      // Extract fan ID from authenticated request (assuming auth middleware sets this)
      const fanId = req.user?.userId;
      if (!fanId) {
        res.status(401).json({ 
          success: false,
          error: 'Authentication required. Please log in as a fan.' 
        });
        return;
      }

      // Validate request body - handle both frontend format (concertId, zoneId) and backend format (concert_id, zone_name)
      const purchaseRequest: TicketPurchaseRequestDTO = {
        concert_id: req.body.concert_id || req.body.concertId,
        zone_name: req.body.zone_name || req.body.zoneId,
        quantity: req.body.quantity,
        referral_code: req.body.referral_code || req.body.referralCode
      };

      // Basic validation
      if (!purchaseRequest.concert_id || !purchaseRequest.zone_name || !purchaseRequest.quantity) {
        res.status(400).json({
          success: false,
          error: 'Missing required fields: concert_id/concertId, zone_name/zoneId, quantity'
        });
        return;
      }

      if (typeof purchaseRequest.quantity !== 'number' || purchaseRequest.quantity <= 0 || purchaseRequest.quantity > 10) {
        res.status(400).json({
          success: false,
          error: 'Quantity must be a number between 1 and 10'
        });
        return;
      }

      // Delegate to service layer
      const result = await TicketService.purchaseTickets(fanId, purchaseRequest);

      res.status(201).json(result);

    } catch (error) {
      console.error('Error in purchaseTickets controller:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to purchase tickets'
      });
    }
  }

  /**
   * Get user's tickets endpoint
   * GET /api/tickets/my-tickets
   */
  static async getMyTickets(req: Request, res: Response): Promise<void> {
    try {
      const fanId = req.user?.userId;
      if (!fanId) {
        res.status(401).json({ 
          success: false,
          error: 'Authentication required' 
        });
        return;
      }

      const tickets = await TicketService.getFanTickets(fanId);

      res.json({
        success: true,
        count: tickets.length,
        tickets
      });

    } catch (error) {
      console.error('Error in getMyTickets controller:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch tickets'
      });
    }
  }

  /**
   * Get tickets for a specific user (admin/organizer use)
   * GET /api/tickets/user/:userId
   */
  static async getUserTickets(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      
      if (!userId) {
        res.status(400).json({ 
          success: false,
          error: 'User ID is required' 
        });
        return;
      }

      // TODO: Add authorization check (admin/organizer only)

      const tickets = await TicketService.getFanTickets(userId);

      res.json({
        success: true,
        user_id: userId,
        count: tickets.length,
        tickets
      });

    } catch (error) {
      console.error('Error in getUserTickets controller:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch user tickets'
      });
    }
  }

  /**
   * Validate ticket purchase without purchasing
   * POST /api/tickets/validate-purchase
   */
  static async validatePurchase(req: Request, res: Response): Promise<void> {
        try {
      const fanId = req.user?.userId;
      if (!fanId) {
        res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
        return;
      }

      const { concert_id, zone_name, quantity, referral_code } = req.body;

      // Basic validation
      if (!concert_id || !zone_name || !quantity) {
        res.status(400).json({
          success: false,
          error: 'Missing required fields: concert_id, zone_name, quantity'
        });
        return;
      }

      // This would be implemented in the service layer
      // For now, return a simple validation response
      res.json({
        success: true,
        valid: true,
        message: 'Purchase request is valid',
        estimated_total: quantity * 50.00, // Mock price
        referral_code_valid: !!referral_code
      });

    } catch (error) {
      console.error('Error in validatePurchase controller:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to validate purchase'
      });
    }
  }
}

// ========== MIDDLEWARE ==========

/**
 * Middleware to ensure user is authenticated as a fan
 */
export const requireFanAuth = (req: Request, res: Response, next: any) => {
  try {
    const user = req.user;
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    if (user.userType !== 'fan') {
      return res.status(403).json({
        success: false,
        error: 'Fan access required'
      });
    }

    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Authentication check failed'
    });
  }
};

/**
 * Middleware to ensure user is authenticated as admin or organizer
 */
export const requireAdminOrOrganizerAuth = (req: Request, res: Response, next: any) => {
  try {
    const user = req.user;
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    if (user.userType !== 'admin' && user.userType !== 'organizer') {
      return res.status(403).json({
        success: false,
        error: 'Admin or organizer access required'
      });
    }

    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Authentication check failed'
    });
  }
}; 