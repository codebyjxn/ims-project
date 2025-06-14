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
exports.DataService = void 0;
const database_factory_1 = require("../lib/database-factory");
class DataService {
    /**
     * Get all users from the active database
     */
    static getAllUsers() {
        return __awaiter(this, void 0, void 0, function* () {
            const adapter = database_factory_1.DatabaseFactory.getAdapter();
            const result = yield adapter.getUsers();
            return result.rows || result.data || [];
        });
    }
    /**
     * Get user by ID from the active database
     */
    static getUserById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const adapter = database_factory_1.DatabaseFactory.getAdapter();
            const result = yield adapter.getUserById(id);
            const data = result.rows || result.data || [];
            return data.length > 0 ? data[0] : null;
        });
    }
    /**
     * Create a new user in the active database
     */
    static createUser(userData) {
        return __awaiter(this, void 0, void 0, function* () {
            const adapter = database_factory_1.DatabaseFactory.getAdapter();
            const result = yield adapter.createUser(userData);
            const data = result.rows || result.data || [];
            return data.length > 0 ? data[0] : null;
        });
    }
    /**
     * Update user in the active database
     */
    static updateUser(id, updates) {
        return __awaiter(this, void 0, void 0, function* () {
            const adapter = database_factory_1.DatabaseFactory.getAdapter();
            const result = yield adapter.updateUser(id, updates);
            const data = result.rows || result.data || [];
            return data.length > 0 ? data[0] : null;
        });
    }
    /**
     * Delete user from the active database
     */
    static deleteUser(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const adapter = database_factory_1.DatabaseFactory.getAdapter();
            const result = yield adapter.deleteUser(id);
            const data = result.rows || result.data || [];
            return data.length > 0;
        });
    }
    /**
     * Get all artists from the active database
     */
    static getAllArtists() {
        return __awaiter(this, void 0, void 0, function* () {
            const adapter = database_factory_1.DatabaseFactory.getAdapter();
            const result = yield adapter.getArtists();
            return result.rows || result.data || [];
        });
    }
    /**
     * Get artist by ID from the active database
     */
    static getArtistById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const adapter = database_factory_1.DatabaseFactory.getAdapter();
            const result = yield adapter.getArtistById(id);
            const data = result.rows || result.data || [];
            return data.length > 0 ? data[0] : null;
        });
    }
    /**
     * Create a new artist in the active database
     */
    static createArtist(artistData) {
        return __awaiter(this, void 0, void 0, function* () {
            const adapter = database_factory_1.DatabaseFactory.getAdapter();
            const result = yield adapter.createArtist(artistData);
            const data = result.rows || result.data || [];
            return data.length > 0 ? data[0] : null;
        });
    }
    /**
     * Get all arenas from the active database
     */
    static getAllArenas() {
        return __awaiter(this, void 0, void 0, function* () {
            const adapter = database_factory_1.DatabaseFactory.getAdapter();
            const result = yield adapter.getArenas();
            return result.rows || result.data || [];
        });
    }
    /**
     * Get arena by ID from the active database
     */
    static getArenaById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const adapter = database_factory_1.DatabaseFactory.getAdapter();
            const result = yield adapter.getArenaById(id);
            const data = result.rows || result.data || [];
            return data.length > 0 ? data[0] : null;
        });
    }
    /**
     * Create a new arena in the active database
     */
    static createArena(arenaData) {
        return __awaiter(this, void 0, void 0, function* () {
            const adapter = database_factory_1.DatabaseFactory.getAdapter();
            const result = yield adapter.createArena(arenaData);
            const data = result.rows || result.data || [];
            return data.length > 0 ? data[0] : null;
        });
    }
    /**
     * Get all concerts from the active database
     */
    static getAllConcerts() {
        return __awaiter(this, void 0, void 0, function* () {
            const adapter = database_factory_1.DatabaseFactory.getAdapter();
            const result = yield adapter.getConcerts();
            return result.rows || result.data || [];
        });
    }
    /**
     * Get concert by ID from the active database
     */
    static getConcertById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const adapter = database_factory_1.DatabaseFactory.getAdapter();
            const result = yield adapter.getConcertById(id);
            const data = result.rows || result.data || [];
            return data.length > 0 ? data[0] : null;
        });
    }
    /**
     * Create a new concert in the active database
     */
    static createConcert(concertData) {
        return __awaiter(this, void 0, void 0, function* () {
            const adapter = database_factory_1.DatabaseFactory.getAdapter();
            const result = yield adapter.createConcert(concertData);
            const data = result.rows || result.data || [];
            return data.length > 0 ? data[0] : null;
        });
    }
    /**
     * Get all tickets from the active database
     */
    static getAllTickets() {
        return __awaiter(this, void 0, void 0, function* () {
            const adapter = database_factory_1.DatabaseFactory.getAdapter();
            const result = yield adapter.getTickets();
            return result.rows || result.data || [];
        });
    }
    /**
     * Get ticket by ID from the active database
     */
    static getTicketById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const adapter = database_factory_1.DatabaseFactory.getAdapter();
            const result = yield adapter.getTicketById(id);
            const data = result.rows || result.data || [];
            return data.length > 0 ? data[0] : null;
        });
    }
    /**
     * Get tickets by user ID from the active database
     */
    static getTicketsByUserId(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const adapter = database_factory_1.DatabaseFactory.getAdapter();
            const result = yield adapter.getTicketsByUserId(userId);
            return result.rows || result.data || [];
        });
    }
    /**
     * Create a new ticket in the active database
     */
    static createTicket(ticketData) {
        return __awaiter(this, void 0, void 0, function* () {
            const adapter = database_factory_1.DatabaseFactory.getAdapter();
            const result = yield adapter.createTicket(ticketData);
            const data = result.rows || result.data || [];
            return data.length > 0 ? data[0] : null;
        });
    }
    /**
     * Get database statistics from the active database
     */
    static getStats() {
        return __awaiter(this, void 0, void 0, function* () {
            const adapter = database_factory_1.DatabaseFactory.getAdapter();
            return yield adapter.getStats();
        });
    }
    /**
     * Get current database type
     */
    static getCurrentDatabaseType() {
        return database_factory_1.DatabaseFactory.getCurrentDatabaseType();
    }
    /**
     * Check if system is migrated
     */
    static isMigrated() {
        return database_factory_1.DatabaseFactory.isMigrated();
    }
    /**
     * Get adapter directly (for advanced operations)
     */
    static getAdapter() {
        return database_factory_1.DatabaseFactory.getAdapter();
    }
    // ========== REFERRAL SYSTEM METHODS ==========
    /**
     * Get user by referral code
     */
    static getUserByReferralCode(referralCode) {
        return __awaiter(this, void 0, void 0, function* () {
            const adapter = database_factory_1.DatabaseFactory.getAdapter();
            const result = yield adapter.getUserByReferralCode(referralCode);
            const data = result.rows || result.data || [];
            return data.length > 0 ? data[0] : null;
        });
    }
    /**
     * Update user referral points
     */
    static updateUserReferralPoints(userId, pointsToAdd) {
        return __awaiter(this, void 0, void 0, function* () {
            const adapter = database_factory_1.DatabaseFactory.getAdapter();
            yield adapter.updateUserReferralPoints(userId, pointsToAdd);
        });
    }
    /**
     * Mark referral code as used for a fan
     */
    static markReferralCodeUsed(fanId) {
        return __awaiter(this, void 0, void 0, function* () {
            const adapter = database_factory_1.DatabaseFactory.getAdapter();
            yield adapter.markReferralCodeUsed(fanId);
        });
    }
    /**
     * Update fan's referrer
     */
    static updateFanReferrer(fanId, referrerId) {
        return __awaiter(this, void 0, void 0, function* () {
            const adapter = database_factory_1.DatabaseFactory.getAdapter();
            yield adapter.updateFanReferrer(fanId, referrerId);
        });
    }
}
exports.DataService = DataService;
