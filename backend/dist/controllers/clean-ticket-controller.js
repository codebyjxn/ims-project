"use strict";
// src/controllers/clean-ticket-controller.ts
// ========== CLEAN TICKET CONTROLLER ==========
// Follows pattern: HTTP Request -> Controller -> Service -> Repository -> DB
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAdminOrOrganizerAuth = exports.requireFanAuth = exports.CleanTicketController = void 0;
const ticket_service_1 = require("../services/ticket-service");
class CleanTicketController {
    /**
     * Purchase tickets endpoint
     * POST /api/tickets/purchase
     */
    static purchaseTickets(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                // Extract fan ID from authenticated request (assuming auth middleware sets this)
                const fanId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
                if (!fanId) {
                    res.status(401).json({
                        success: false,
                        error: 'Authentication required. Please log in as a fan.'
                    });
                    return;
                }
                // Validate request body - handle both frontend format (concertId, zoneId) and backend format (concert_id, zone_name)
                const purchaseRequest = {
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
                const result = yield ticket_service_1.TicketService.purchaseTickets(fanId, purchaseRequest);
                res.status(201).json(result);
            }
            catch (error) {
                console.error('Error in purchaseTickets controller:', error);
                res.status(500).json({
                    success: false,
                    error: error instanceof Error ? error.message : 'Failed to purchase tickets'
                });
            }
        });
    }
    /**
     * Get user's tickets endpoint
     * GET /api/tickets/my-tickets
     */
    static getMyTickets(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const fanId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
                if (!fanId) {
                    res.status(401).json({
                        success: false,
                        error: 'Authentication required'
                    });
                    return;
                }
                const tickets = yield ticket_service_1.TicketService.getFanTickets(fanId);
                res.json({
                    success: true,
                    count: tickets.length,
                    tickets
                });
            }
            catch (error) {
                console.error('Error in getMyTickets controller:', error);
                res.status(500).json({
                    success: false,
                    error: error instanceof Error ? error.message : 'Failed to fetch tickets'
                });
            }
        });
    }
    /**
     * Get tickets for a specific user (admin/organizer use)
     * GET /api/tickets/user/:userId
     */
    static getUserTickets(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
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
                const tickets = yield ticket_service_1.TicketService.getFanTickets(userId);
                res.json({
                    success: true,
                    user_id: userId,
                    count: tickets.length,
                    tickets
                });
            }
            catch (error) {
                console.error('Error in getUserTickets controller:', error);
                res.status(500).json({
                    success: false,
                    error: error instanceof Error ? error.message : 'Failed to fetch user tickets'
                });
            }
        });
    }
    /**
     * Validate ticket purchase without purchasing
     * POST /api/tickets/validate-purchase
     */
    static validatePurchase(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const fanId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
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
            }
            catch (error) {
                console.error('Error in validatePurchase controller:', error);
                res.status(500).json({
                    success: false,
                    error: error instanceof Error ? error.message : 'Failed to validate purchase'
                });
            }
        });
    }
}
exports.CleanTicketController = CleanTicketController;
// ========== MIDDLEWARE ==========
/**
 * Middleware to ensure user is authenticated as a fan
 */
const requireFanAuth = (req, res, next) => {
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
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            error: 'Authentication check failed'
        });
    }
};
exports.requireFanAuth = requireFanAuth;
/**
 * Middleware to ensure user is authenticated as admin or organizer
 */
const requireAdminOrOrganizerAuth = (req, res, next) => {
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
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            error: 'Authentication check failed'
        });
    }
};
exports.requireAdminOrOrganizerAuth = requireAdminOrOrganizerAuth;
