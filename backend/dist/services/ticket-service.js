"use strict";
// src/services/ticket-service.ts
// ========== TICKET SERVICE ==========
// Contains business logic for ticket operations including purchase with referral system
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
exports.TicketService = void 0;
// UUID generation will be handled by database or passed in
const factory_1 = require("../repositories/factory");
class TicketService {
    /**
     * Purchase tickets with referral code support
     */
    static purchaseTickets(fanId, purchaseRequest) {
        return __awaiter(this, void 0, void 0, function* () {
            const factory = factory_1.RepositoryFactory.getFactory();
            const userRepo = factory.getUserRepository();
            const ticketRepo = factory.getTicketRepository();
            try {
                // Validate fan exists
                const fan = yield userRepo.findById(fanId);
                if (!fan || fan.user_type !== 'fan') {
                    throw new Error('Fan not found');
                }
                // Validate quantity
                if (purchaseRequest.quantity <= 0 || purchaseRequest.quantity > 10) {
                    throw new Error('Quantity must be between 1 and 10 tickets');
                }
                // Get concert and zone information (for now using existing data service)
                const concert = yield this.getConcertDetails(purchaseRequest.concert_id);
                if (!concert) {
                    throw new Error('Concert not found');
                }
                // Validate zone exists and get pricing
                const zoneInfo = yield this.getZoneInfo(purchaseRequest.concert_id, concert.arena_id, purchaseRequest.zone_name);
                if (!zoneInfo) {
                    throw new Error('Zone not found for this concert');
                }
                // Check availability
                const availableTickets = yield this.getAvailableTickets(purchaseRequest.concert_id, purchaseRequest.zone_name);
                if (availableTickets < purchaseRequest.quantity) {
                    throw new Error(`Only ${availableTickets} tickets available in ${purchaseRequest.zone_name}`);
                }
                // Process referral code
                const referralResult = yield this.validateReferralCode(purchaseRequest.referral_code, fanId);
                // Calculate pricing
                const pricePerTicket = zoneInfo.price;
                const discountPercentage = referralResult.is_valid ? referralResult.discount_percentage : 0;
                const finalPricePerTicket = pricePerTicket * (1 - discountPercentage / 100);
                const totalPrice = finalPricePerTicket * purchaseRequest.quantity;
                const discountAmount = (pricePerTicket * purchaseRequest.quantity) - totalPrice;
                // Create tickets
                const tickets = [];
                const ticketData = {
                    fan_id: fanId,
                    concert_id: purchaseRequest.concert_id,
                    arena_id: concert.arena_id,
                    zone_name: purchaseRequest.zone_name,
                    purchase_date: new Date(),
                    purchase_price: finalPricePerTicket,
                    // Denormalized fields for MongoDB
                    concert_date: new Date(concert.concert_date),
                    fan_username: this.extractFanUsername(fan)
                };
                // Create multiple tickets
                const ticketsToCreate = Array.from({ length: purchaseRequest.quantity }, (_, index) => (Object.assign(Object.assign({}, ticketData), { ticket_id: `ticket-${Date.now()}-${index}`, _id: `ticket-${Date.now()}-${index}` // For MongoDB compatibility
                 })));
                const createdTickets = yield ticketRepo.createMultiple(ticketsToCreate);
                // Update referral system if code was used
                if (referralResult.is_valid && referralResult.referrer) {
                    yield this.processReferralRewards(referralResult.referrer.user_id, fanId, purchaseRequest.quantity);
                }
                // Convert to DTOs
                const ticketDTOs = createdTickets.map(ticket => {
                    var _a;
                    return ({
                        ticket_id: ticket.ticket_id || ticket._id,
                        fan_id: ticket.fan_id,
                        concert_id: ticket.concert_id,
                        arena_id: ticket.arena_id,
                        zone_name: ticket.zone_name,
                        purchase_date: ticket.purchase_date.toISOString(),
                        purchase_price: ticket.purchase_price,
                        fan_username: ticket.fan_username,
                        concert_date: ((_a = ticket.concert_date) === null || _a === void 0 ? void 0 : _a.toISOString()) || concert.concert_date
                    });
                });
                return {
                    success: true,
                    tickets: ticketDTOs,
                    total_amount: totalPrice,
                    discount_applied: discountAmount,
                    discount_percentage: referralResult.discount_percentage,
                    confirmation_id: `conf-${Date.now()}`,
                    database_type: factory_1.RepositoryFactory.getCurrentDatabaseType(),
                    message: `Successfully purchased ${purchaseRequest.quantity} ticket(s) for ${concert.description || 'concert'}`
                };
            }
            catch (error) {
                throw new Error(`Failed to purchase tickets: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        });
    }
    /**
     * Get tickets for a fan
     */
    static getFanTickets(fanId) {
        return __awaiter(this, void 0, void 0, function* () {
            const factory = factory_1.RepositoryFactory.getFactory();
            const ticketRepo = factory.getTicketRepository();
            const tickets = yield ticketRepo.findByFan(fanId);
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
        });
    }
    /**
     * Validate referral code and determine discount
     */
    static validateReferralCode(referralCode, fanId) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!referralCode) {
                return { is_valid: false, discount_percentage: 0 };
            }
            const factory = factory_1.RepositoryFactory.getFactory();
            const userRepo = factory.getUserRepository();
            // Check if fan has already used a referral code
            const fan = yield userRepo.findById(fanId);
            const hasUsedReferral = this.checkIfFanUsedReferral(fan);
            if (hasUsedReferral) {
                return {
                    is_valid: false,
                    discount_percentage: 0,
                    error: 'You have already used a referral code'
                };
            }
            // Find the referrer by referral code
            const referrer = yield userRepo.findFanByReferralCode(referralCode);
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
        });
    }
    /**
     * Process referral rewards - give points to referrer and mark referral as used
     */
    static processReferralRewards(referrerId, fanId, ticketCount) {
        return __awaiter(this, void 0, void 0, function* () {
            const factory = factory_1.RepositoryFactory.getFactory();
            const userRepo = factory.getUserRepository();
            // Award points to referrer (e.g., 5 points per ticket)
            const pointsToAward = ticketCount * 5;
            yield userRepo.updateReferralPoints(referrerId, pointsToAward);
            // Mark that this fan has used a referral code
            yield userRepo.markReferralCodeUsed(fanId);
            // Set the referrer relationship
            yield userRepo.setReferrer(fanId, referrerId);
        });
    }
    /**
     * Check if fan has already used a referral code
     */
    static checkIfFanUsedReferral(fan) {
        var _a;
        if (fan.referral_code_used !== undefined) {
            return fan.referral_code_used; // PostgreSQL
        }
        if (((_a = fan.fan_details) === null || _a === void 0 ? void 0 : _a.referral_code_used) !== undefined) {
            return fan.fan_details.referral_code_used; // MongoDB
        }
        return false;
    }
    /**
     * Extract fan username from user object
     */
    static extractFanUsername(fan) {
        var _a;
        if (fan.username)
            return fan.username; // PostgreSQL
        if ((_a = fan.fan_details) === null || _a === void 0 ? void 0 : _a.username)
            return fan.fan_details.username; // MongoDB
        return 'unknown';
    }
    /**
     * Convert database fan object to FanDTO
     */
    static convertToFanDTO(fan) {
        var _a, _b;
        // Handle both PostgreSQL and MongoDB structures
        const baseUser = {
            user_id: fan.user_id || fan._id,
            email: fan.email,
            first_name: fan.first_name,
            last_name: fan.last_name,
            registration_date: ((_a = fan.registration_date) === null || _a === void 0 ? void 0 : _a.toISOString()) || new Date().toISOString(),
            last_login: (_b = fan.last_login) === null || _b === void 0 ? void 0 : _b.toISOString(),
            user_type: 'fan'
        };
        if (fan.username) {
            // PostgreSQL structure
            return Object.assign(Object.assign({}, baseUser), { username: fan.username, preferred_genre: fan.preferred_genre, phone_number: fan.phone_number, referral_code: fan.referral_code, referred_by: fan.referred_by, referral_points: fan.referral_points || 0, referral_code_used: fan.referral_code_used || false });
        }
        else {
            // MongoDB structure
            const fanDetails = fan.fan_details || {};
            return Object.assign(Object.assign({}, baseUser), { username: fanDetails.username, preferred_genre: fanDetails.preferred_genre, phone_number: fanDetails.phone_number, referral_code: fanDetails.referral_code, referred_by: fanDetails.referred_by, referral_points: fanDetails.referral_points || 0, referral_code_used: fanDetails.referral_code_used || false });
        }
    }
    // ========== REAL DATA METHODS ==========
    // These use the actual concert/arena repositories
    static getConcertDetails(concertId) {
        return __awaiter(this, void 0, void 0, function* () {
            const factory = factory_1.RepositoryFactory.getFactory();
            const concertRepo = factory.getConcertRepository();
            const concert = yield concertRepo.findById(concertId);
            return concert;
        });
    }
    static getZoneInfo(concertId, arenaId, zoneName) {
        return __awaiter(this, void 0, void 0, function* () {
            const factory = factory_1.RepositoryFactory.getFactory();
            const concertRepo = factory.getConcertRepository();
            const zoneInfo = yield concertRepo.findZonePricing(concertId, arenaId, zoneName);
            return zoneInfo;
        });
    }
    static getAvailableTickets(concertId, zoneName) {
        return __awaiter(this, void 0, void 0, function* () {
            const factory = factory_1.RepositoryFactory.getFactory();
            const concertRepo = factory.getConcertRepository();
            const availableTickets = yield concertRepo.findAvailableTickets(concertId, zoneName);
            return availableTickets;
        });
    }
}
exports.TicketService = TicketService;
