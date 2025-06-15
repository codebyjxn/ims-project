// src/routes/clean-ticket-routes.ts
// ========== CLEAN TICKET ROUTES ==========
// Routes for the clean ticket API following the new architecture

import { Router } from 'express';
import { TicketController, requireFanAuth, requireAdminOrOrganizerAuth } from '../controllers/ticket-controller';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Apply JWT authentication to all routes
router.use(authenticateToken);

// ========== FAN ENDPOINTS ==========

/**
 * Purchase tickets (fan only)
 * POST /api/tickets/purchase
 * Body: { concert_id, zone_name, quantity, referral_code? }
 */
router.post('/purchase', requireFanAuth, TicketController.purchaseTickets);

/**
 * Get my tickets (fan only)
 * GET /api/tickets/my-tickets
 */
router.get('/my-tickets', requireFanAuth, TicketController.getMyTickets);

/**
 * Validate purchase without purchasing (fan only)
 * POST /api/tickets/validate-purchase
 * Body: { concert_id, zone_name, quantity, referral_code? }
 */
router.post('/validate-purchase', requireFanAuth, TicketController.validatePurchase);

// ========== ADMIN/ORGANIZER ENDPOINTS ==========

export default router; 