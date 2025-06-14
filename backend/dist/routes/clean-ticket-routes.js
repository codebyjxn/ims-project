"use strict";
// src/routes/clean-ticket-routes.ts
// ========== CLEAN TICKET ROUTES ==========
// Routes for the clean ticket API following the new architecture
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const clean_ticket_controller_1 = require("../controllers/clean-ticket-controller");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Apply JWT authentication to all routes
router.use(auth_1.authenticateToken);
// ========== FAN ENDPOINTS ==========
/**
 * Purchase tickets (fan only)
 * POST /api/tickets/purchase
 * Body: { concert_id, zone_name, quantity, referral_code? }
 */
router.post('/purchase', clean_ticket_controller_1.requireFanAuth, clean_ticket_controller_1.CleanTicketController.purchaseTickets);
/**
 * Get my tickets (fan only)
 * GET /api/tickets/my-tickets
 */
router.get('/my-tickets', clean_ticket_controller_1.requireFanAuth, clean_ticket_controller_1.CleanTicketController.getMyTickets);
/**
 * Validate purchase without purchasing (fan only)
 * POST /api/tickets/validate-purchase
 * Body: { concert_id, zone_name, quantity, referral_code? }
 */
router.post('/validate-purchase', clean_ticket_controller_1.requireFanAuth, clean_ticket_controller_1.CleanTicketController.validatePurchase);
// ========== ADMIN/ORGANIZER ENDPOINTS ==========
exports.default = router;
