// src/routes/clean-ticket-routes.ts
// ========== CLEAN TICKET ROUTES ==========
// Routes for the clean ticket API following the new architecture

import { Router } from 'express';
import { CleanTicketController, requireFanAuth, requireAdminOrOrganizerAuth } from '../controllers/clean-ticket-controller';
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
router.post('/purchase', requireFanAuth, CleanTicketController.purchaseTickets);

/**
 * Get my tickets (fan only)
 * GET /api/tickets/my-tickets
 */
router.get('/my-tickets', requireFanAuth, CleanTicketController.getMyTickets);

/**
 * Validate purchase without purchasing (fan only)
 * POST /api/tickets/validate-purchase
 * Body: { concert_id, zone_name, quantity, referral_code? }
 */
router.post('/validate-purchase', requireFanAuth, CleanTicketController.validatePurchase);

// ========== ADMIN/ORGANIZER ENDPOINTS ==========

/**
 * Get tickets for any user (admin/organizer only)
 * GET /api/tickets/user/:userId
 */
router.get('/user/:userId', requireAdminOrOrganizerAuth, CleanTicketController.getUserTickets);

export default router; 