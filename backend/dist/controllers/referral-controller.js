"use strict";
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
exports.convertPointsToDiscount = exports.awardReferralPoints = exports.getMyReferrals = exports.getReferralStats = exports.applyReferralCode = exports.validateReferralCode = exports.ReferralController = void 0;
const data_service_1 = require("../services/data-service");
class ReferralController {
    /**
     * Validate a referral code
     */
    validateReferralCode(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c;
            try {
                const { referralCode } = req.body;
                const fanId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
                if (!referralCode) {
                    res.status(400).json({ error: 'Referral code is required' });
                    return;
                }
                if (!fanId) {
                    res.status(401).json({ error: 'Unauthorized: User not found in session' });
                    return;
                }
                if (((_b = req.user) === null || _b === void 0 ? void 0 : _b.userType) !== 'fan') {
                    res.status(403).json({ error: 'Forbidden: Only fans can use referral codes' });
                    return;
                }
                // Check if fan has already used a referral code
                const fan = yield data_service_1.DataService.getUserById(fanId);
                if (!fan) {
                    res.status(404).json({ error: 'Fan not found' });
                    return;
                }
                const fanDetails = fan.fan_details || fan;
                if (fanDetails.referral_code_used) {
                    res.status(200).json({
                        message: 'You have already used a referral code',
                        valid: false
                    });
                    return;
                }
                // Find the referrer by referral code
                const referrer = yield data_service_1.DataService.getUserByReferralCode(referralCode);
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
                        username: ((_c = referrer.fan_details) === null || _c === void 0 ? void 0 : _c.username) || referrer.username,
                        name: `${referrer.first_name} ${referrer.last_name}`
                    },
                    discount: 10, // 10% discount
                    database: data_service_1.DataService.getCurrentDatabaseType()
                });
            }
            catch (error) {
                console.error('Error validating referral code:', error);
                res.status(500).json({
                    error: 'Failed to validate referral code',
                    valid: false,
                    details: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        });
    }
    /**
     * Apply referral code during signup
     */
    applyReferralCode(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { referralCode, fanId } = req.body;
                if (!referralCode || !fanId) {
                    res.status(400).json({ error: 'Referral code and fan ID are required' });
                    return;
                }
                // Validate referral code first
                const validation = yield this.validateReferralCodeInternal(referralCode, fanId);
                if (!validation.valid || !validation.referrer) {
                    res.status(400).json({ error: validation.error || 'Invalid referral' });
                    return;
                }
                // Update fan's referred_by field
                yield data_service_1.DataService.updateFanReferrer(fanId, validation.referrer.id);
                res.json({
                    success: true,
                    message: 'Referral code applied successfully',
                    referrer: validation.referrer,
                    discount: validation.discount,
                    database: data_service_1.DataService.getCurrentDatabaseType()
                });
            }
            catch (error) {
                console.error('Error applying referral code:', error);
                res.status(500).json({
                    error: 'Failed to apply referral code',
                    details: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        });
    }
    /**
     * Get referral statistics for a fan
     */
    getReferralStats(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { fanId } = req.params;
                if (!fanId) {
                    res.status(400).json({ error: 'Fan ID is required' });
                    return;
                }
                const fan = yield data_service_1.DataService.getUserById(fanId);
                if (!fan || fan.user_type !== 'fan') {
                    res.status(404).json({ error: 'Fan not found' });
                    return;
                }
                const fanDetails = fan.fan_details || fan;
                // Get referral statistics
                const stats = yield this.calculateReferralStats(fanId);
                res.json({
                    success: true,
                    fanId,
                    myReferralCode: fanDetails.referral_code,
                    referralPoints: fanDetails.referral_points || 0,
                    referralCodeUsed: fanDetails.referral_code_used || false,
                    referredBy: fanDetails.referred_by || null,
                    stats,
                    database: data_service_1.DataService.getCurrentDatabaseType()
                });
            }
            catch (error) {
                console.error('Error fetching referral stats:', error);
                res.status(500).json({
                    error: 'Failed to fetch referral statistics',
                    details: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        });
    }
    /**
     * Get list of fans referred by this fan
     */
    getMyReferrals(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { fanId } = req.params;
                const { limit = 10, offset = 0 } = req.query;
                if (!fanId) {
                    res.status(400).json({ error: 'Fan ID is required' });
                    return;
                }
                const referrals = yield this.getFanReferrals(fanId);
                // Apply pagination
                const startIndex = parseInt(offset);
                const endIndex = startIndex + parseInt(limit);
                const paginatedReferrals = referrals.slice(startIndex, endIndex);
                res.json({
                    success: true,
                    count: paginatedReferrals.length,
                    total: referrals.length,
                    referrals: paginatedReferrals,
                    pagination: {
                        limit: parseInt(limit),
                        offset: parseInt(offset),
                        hasMore: endIndex < referrals.length
                    },
                    database: data_service_1.DataService.getCurrentDatabaseType()
                });
            }
            catch (error) {
                console.error('Error fetching referrals:', error);
                res.status(500).json({
                    error: 'Failed to fetch referrals',
                    details: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        });
    }
    /**
     * Award referral points to a fan
     */
    awardReferralPoints(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
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
                const fan = yield data_service_1.DataService.getUserById(fanId);
                if (!fan || fan.user_type !== 'fan') {
                    res.status(404).json({ error: 'Fan not found' });
                    return;
                }
                yield data_service_1.DataService.updateUserReferralPoints(fanId, points);
                // Get updated fan details
                const updatedFan = yield data_service_1.DataService.getUserById(fanId);
                const updatedDetails = updatedFan.fan_details || updatedFan;
                res.json({
                    success: true,
                    message: `Awarded ${points} referral points`,
                    fanId,
                    pointsAwarded: points,
                    totalPoints: updatedDetails.referral_points || 0,
                    reason: reason || 'Manual award',
                    database: data_service_1.DataService.getCurrentDatabaseType()
                });
            }
            catch (error) {
                console.error('Error awarding referral points:', error);
                res.status(500).json({
                    error: 'Failed to award referral points',
                    details: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        });
    }
    /**
     * Convert referral points to discount
     */
    convertPointsToDiscount(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
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
                const fan = yield data_service_1.DataService.getUserById(fanId);
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
                yield data_service_1.DataService.updateUserReferralPoints(fanId, -pointsToConvert);
                res.json({
                    success: true,
                    message: `Converted ${pointsToConvert} points to ${discountPercentage}% discount`,
                    fanId,
                    pointsConverted: pointsToConvert,
                    discountPercentage,
                    remainingPoints: currentPoints - pointsToConvert,
                    database: data_service_1.DataService.getCurrentDatabaseType()
                });
            }
            catch (error) {
                console.error('Error converting points to discount:', error);
                res.status(500).json({
                    error: 'Failed to convert points to discount',
                    details: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        });
    }
    // Private helper methods
    validateReferralCodeInternal(referralCode, fanId) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            // Check if fan has already used a referral code
            const fan = yield data_service_1.DataService.getUserById(fanId);
            const fanDetails = fan.fan_details || fan;
            if (fanDetails.referral_code_used) {
                return {
                    valid: false,
                    error: 'You have already used a referral code'
                };
            }
            // Find the referrer by referral code
            const referrer = yield data_service_1.DataService.getUserByReferralCode(referralCode);
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
                    username: ((_a = referrer.fan_details) === null || _a === void 0 ? void 0 : _a.username) || referrer.username,
                    name: `${referrer.first_name} ${referrer.last_name}`
                },
                discount: 10 // 10% discount for using referral code
            };
        });
    }
    calculateReferralStats(fanId) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d, _e, _f;
            const currentDb = data_service_1.DataService.getCurrentDatabaseType();
            if (currentDb === 'mongodb') {
                // MongoDB aggregation for stats
                const adapter = data_service_1.DataService.getAdapter();
                // Count referrals made by this fan
                const referralsResult = yield adapter.getUsersReferredBy(fanId);
                const totalReferrals = ((_a = referralsResult.data) === null || _a === void 0 ? void 0 : _a.length) || 0;
                // Count tickets purchased by referred fans
                const referredTicketsResult = yield adapter.getTicketsFromReferrals(fanId);
                const ticketsFromReferrals = ((_b = referredTicketsResult.data) === null || _b === void 0 ? void 0 : _b.length) || 0;
                return {
                    totalReferrals,
                    ticketsFromReferrals,
                    pointsEarned: ticketsFromReferrals * 5, // 5 points per ticket from referrals
                    conversionRate: totalReferrals > 0 ? (ticketsFromReferrals / totalReferrals * 100).toFixed(1) : '0'
                };
            }
            else {
                // PostgreSQL queries for stats
                const adapter = data_service_1.DataService.getAdapter();
                // Count direct referrals
                const referralsResult = yield adapter.query(`
        SELECT COUNT(*) as total_referrals
        FROM fans
        WHERE referred_by = $1
      `, [fanId]);
                // Count tickets from referrals
                const ticketsResult = yield adapter.query(`
        SELECT COUNT(t.*) as tickets_from_referrals
        FROM tickets t
        JOIN fans f ON t.fan_id = f.user_id
        WHERE f.referred_by = $1 AND t.referral_code_used = true
      `, [fanId]);
                const totalReferrals = parseInt(((_d = (_c = referralsResult.rows) === null || _c === void 0 ? void 0 : _c[0]) === null || _d === void 0 ? void 0 : _d.total_referrals) || '0');
                const ticketsFromReferrals = parseInt(((_f = (_e = ticketsResult.rows) === null || _e === void 0 ? void 0 : _e[0]) === null || _f === void 0 ? void 0 : _f.tickets_from_referrals) || '0');
                return {
                    totalReferrals,
                    ticketsFromReferrals,
                    pointsEarned: ticketsFromReferrals * 5,
                    conversionRate: totalReferrals > 0 ? (ticketsFromReferrals / totalReferrals * 100).toFixed(1) : '0'
                };
            }
        });
    }
    getFanReferrals(fanId) {
        return __awaiter(this, void 0, void 0, function* () {
            const currentDb = data_service_1.DataService.getCurrentDatabaseType();
            if (currentDb === 'mongodb') {
                const adapter = data_service_1.DataService.getAdapter();
                const result = yield adapter.getUsersReferredBy(fanId);
                return (result.data || []).map((user) => {
                    var _a, _b;
                    return ({
                        id: user._id,
                        username: (_a = user.fan_details) === null || _a === void 0 ? void 0 : _a.username,
                        name: `${user.first_name} ${user.last_name}`,
                        registrationDate: user.registration_date,
                        referralCodeUsed: ((_b = user.fan_details) === null || _b === void 0 ? void 0 : _b.referral_code_used) || false
                    });
                });
            }
            else {
                const adapter = data_service_1.DataService.getAdapter();
                const result = yield adapter.query(`
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
                return (result.rows || []).map((row) => ({
                    id: row.user_id,
                    username: row.username,
                    name: `${row.first_name} ${row.last_name}`,
                    registrationDate: row.registration_date,
                    referralCodeUsed: row.referral_code_used
                }));
            }
        });
    }
}
exports.ReferralController = ReferralController;
// Export controller functions for routes
const referralController = new ReferralController();
exports.validateReferralCode = referralController.validateReferralCode.bind(referralController);
exports.applyReferralCode = referralController.applyReferralCode.bind(referralController);
exports.getReferralStats = referralController.getReferralStats.bind(referralController);
exports.getMyReferrals = referralController.getMyReferrals.bind(referralController);
exports.awardReferralPoints = referralController.awardReferralPoints.bind(referralController);
exports.convertPointsToDiscount = referralController.convertPointsToDiscount.bind(referralController);
