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
exports.DatabaseFactory = void 0;
const postgres_1 = require("./postgres");
const mongodb_schemas_1 = require("../models/mongodb-schemas");
const migration_status_1 = require("../services/migration-status");
class PostgreSQLAdapter {
    constructor() {
        this.pool = (0, postgres_1.getPool)();
    }
    getUsers() {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield this.pool.query(`
      SELECT u.*, 
             f.username, f.preferred_genre, f.phone_number, f.referral_code, f.referral_points,
             o.organization_name, o.contact_info
      FROM users u
      LEFT JOIN fans f ON u.user_id = f.user_id
      LEFT JOIN organizers o ON u.user_id = o.user_id
      ORDER BY u.registration_date DESC
    `);
            return { rows: result.rows };
        });
    }
    getUserById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield this.pool.query(`
      SELECT u.*, 
             f.username, f.preferred_genre, f.phone_number, f.referral_code, f.referral_points, f.referral_code_used, f.referred_by,
             o.organization_name, o.contact_info
      FROM users u
      LEFT JOIN fans f ON u.user_id = f.user_id
      LEFT JOIN organizers o ON u.user_id = o.user_id
      WHERE u.user_id = $1
    `, [id]);
            return { rows: result.rows };
        });
    }
    createUser(user) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield this.pool.query('INSERT INTO users (user_id, email, user_password, first_name, last_name, registration_date) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *', [user.user_id, user.email, user.user_password, user.first_name, user.last_name, user.registration_date]);
            return { rows: result.rows };
        });
    }
    updateUser(id, updates) {
        return __awaiter(this, void 0, void 0, function* () {
            const setClause = Object.keys(updates).map((key, index) => `${key} = $${index + 2}`).join(', ');
            const values = [id, ...Object.values(updates)];
            const result = yield this.pool.query(`UPDATE users SET ${setClause} WHERE user_id = $1 RETURNING *`, values);
            return { rows: result.rows };
        });
    }
    deleteUser(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield this.pool.query('DELETE FROM users WHERE user_id = $1 RETURNING *', [id]);
            return { rows: result.rows };
        });
    }
    getArtists() {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield this.pool.query('SELECT * FROM artists ORDER BY artist_name');
            return { rows: result.rows };
        });
    }
    getArtistById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield this.pool.query('SELECT * FROM artists WHERE artist_id = $1', [id]);
            return { rows: result.rows };
        });
    }
    createArtist(artist) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield this.pool.query('INSERT INTO artists (artist_id, artist_name, genre) VALUES ($1, $2, $3) RETURNING *', [artist.artist_id, artist.artist_name, artist.genre]);
            return { rows: result.rows };
        });
    }
    getArenas() {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield this.pool.query(`
      SELECT a.*, 
             json_agg(json_build_object('zone_name', z.zone_name, 'capacity_per_zone', z.capacity_per_zone)) as zones
      FROM arenas a
      LEFT JOIN zones z ON a.arena_id = z.arena_id
      GROUP BY a.arena_id
      ORDER BY a.arena_name
    `);
            return { rows: result.rows };
        });
    }
    getArenaById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield this.pool.query(`
      SELECT a.*, 
             json_agg(json_build_object('zone_name', z.zone_name, 'capacity_per_zone', z.capacity_per_zone)) as zones
      FROM arenas a
      LEFT JOIN zones z ON a.arena_id = z.arena_id
      WHERE a.arena_id = $1
      GROUP BY a.arena_id
    `, [id]);
            return { rows: result.rows };
        });
    }
    createArena(arena) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield this.pool.query('INSERT INTO arenas (arena_id, arena_name, arena_location, total_capacity) VALUES ($1, $2, $3, $4) RETURNING *', [arena.arena_id, arena.arena_name, arena.arena_location, arena.total_capacity]);
            return { rows: result.rows };
        });
    }
    getConcerts() {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield this.pool.query(`
      SELECT c.*,
             a.arena_name,
             a.arena_location,
             a.total_capacity as arena_capacity,
             json_build_object(
               'arena_id', a.arena_id,
               'arena_name', a.arena_name,
               'arena_location', a.arena_location,
               'capacity', a.total_capacity
             ) as arena,
             COALESCE(
               (SELECT json_agg(json_build_object('artist_id', ar.artist_id, 'artist_name', ar.artist_name, 'genre', ar.genre))
                FROM concert_features_artists cfa
                JOIN artists ar ON cfa.artist_id = ar.artist_id
                WHERE cfa.concert_id = c.concert_id), 
               '[]'::json
             ) as artists,
             COALESCE(
               (SELECT json_agg(json_build_object('zone_name', czp.zone_name, 'price', czp.price))
                FROM concert_zone_pricing czp
                WHERE czp.concert_id = c.concert_id), 
               '[]'::json
             ) as zone_pricing
      FROM concerts c
      LEFT JOIN arenas a ON c.arena_id = a.arena_id
      ORDER BY c.concert_date DESC
    `);
            return { rows: result.rows };
        });
    }
    getConcertById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield this.pool.query(`
      SELECT c.*,
             COALESCE(
               (SELECT json_agg(json_build_object('artist_id', a.artist_id, 'artist_name', a.artist_name, 'genre', a.genre))
                FROM concert_features_artists cfa
                JOIN artists a ON cfa.artist_id = a.artist_id
                WHERE cfa.concert_id = c.concert_id), 
               '[]'::json
             ) as artists,
             COALESCE(
               (SELECT json_agg(json_build_object('zone_name', czp.zone_name, 'price', czp.price))
                FROM concert_zone_pricing czp
                WHERE czp.concert_id = c.concert_id), 
               '[]'::json
             ) as zone_pricing
      FROM concerts c
      WHERE c.concert_id = $1
    `, [id]);
            return { rows: result.rows };
        });
    }
    createConcert(concert) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield this.pool.query('INSERT INTO concerts (concert_id, concert_date, time, description, organizer_id, arena_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *', [concert.concert_id, concert.concert_date, concert.time, concert.description, concert.organizer_id, concert.arena_id]);
            return { rows: result.rows };
        });
    }
    getTickets() {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield this.pool.query(`
      SELECT t.*, f.username as fan_username, c.concert_date, czp.price
      FROM tickets t
      LEFT JOIN fans f ON t.fan_id = f.user_id
      LEFT JOIN concerts c ON t.concert_id = c.concert_id
      LEFT JOIN concert_zone_pricing czp ON t.concert_id = czp.concert_id AND t.zone_name = czp.zone_name
      ORDER BY t.purchase_date DESC
    `);
            return { rows: result.rows };
        });
    }
    getTicketById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield this.pool.query(`
      SELECT t.*, f.username as fan_username, c.concert_date, czp.price
      FROM tickets t
      LEFT JOIN fans f ON t.fan_id = f.user_id
      LEFT JOIN concerts c ON t.concert_id = c.concert_id
      LEFT JOIN concert_zone_pricing czp ON t.concert_id = czp.concert_id AND t.zone_name = czp.zone_name
      WHERE t.ticket_id = $1
    `, [id]);
            return { rows: result.rows };
        });
    }
    createTicket(ticket) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield this.pool.query('INSERT INTO tickets (ticket_id, fan_id, concert_id, arena_id, zone_name, purchase_date, referral_code_used) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *', [ticket.ticket_id, ticket.fan_id, ticket.concert_id, ticket.arena_id, ticket.zone_name, ticket.purchase_date, ticket.referral_code_used]);
            return { rows: result.rows };
        });
    }
    getTicketsByUserId(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield this.pool.query(`
      SELECT t.*, f.username as fan_username, c.concert_date, czp.price
      FROM tickets t
      LEFT JOIN fans f ON t.fan_id = f.user_id
      LEFT JOIN concerts c ON t.concert_id = c.concert_id
      LEFT JOIN concert_zone_pricing czp ON t.concert_id = czp.concert_id AND t.zone_name = czp.zone_name
      WHERE t.fan_id = $1
      ORDER BY t.purchase_date DESC
    `, [userId]);
            return { rows: result.rows };
        });
    }
    getStats() {
        return __awaiter(this, void 0, void 0, function* () {
            const [usersResult, artistsResult, arenasResult, concertsResult, ticketsResult] = yield Promise.all([
                this.pool.query('SELECT COUNT(*) as count FROM users'),
                this.pool.query('SELECT COUNT(*) as count FROM artists'),
                this.pool.query('SELECT COUNT(*) as count FROM arenas'),
                this.pool.query('SELECT COUNT(*) as count FROM concerts'),
                this.pool.query('SELECT COUNT(*) as count FROM tickets')
            ]);
            return {
                users: parseInt(usersResult.rows[0].count),
                artists: parseInt(artistsResult.rows[0].count),
                arenas: parseInt(arenasResult.rows[0].count),
                concerts: parseInt(concertsResult.rows[0].count),
                tickets: parseInt(ticketsResult.rows[0].count)
            };
        });
    }
    // Referral system methods
    getUserByReferralCode(referralCode) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield this.pool.query(`
      SELECT u.*, f.username, f.preferred_genre, f.phone_number, f.referral_code, f.referral_points, f.referral_code_used, f.referred_by
      FROM users u
      JOIN fans f ON u.user_id = f.user_id
      WHERE f.referral_code = $1
    `, [referralCode]);
            return { rows: result.rows };
        });
    }
    updateUserReferralPoints(userId, pointsToAdd) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield this.pool.query(`
      UPDATE fans 
      SET referral_points = referral_points + $2 
      WHERE user_id = $1 
      RETURNING *
    `, [userId, pointsToAdd]);
            return { rows: result.rows };
        });
    }
    markReferralCodeUsed(fanId) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield this.pool.query(`
      UPDATE fans 
      SET referral_code_used = true 
      WHERE user_id = $1 
      RETURNING *
    `, [fanId]);
            return { rows: result.rows };
        });
    }
    updateFanReferrer(fanId, referrerId) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield this.pool.query(`
      UPDATE fans 
      SET referred_by = $2 
      WHERE user_id = $1 
      RETURNING *
    `, [fanId, referrerId]);
            return { rows: result.rows };
        });
    }
    // Advanced query methods
    query(sql_1) {
        return __awaiter(this, arguments, void 0, function* (sql, params = []) {
            const result = yield this.pool.query(sql, params);
            return { rows: result.rows };
        });
    }
    getTicketsByConcertAndZone(concertId, zoneName) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield this.pool.query(`
      SELECT * FROM tickets 
      WHERE concert_id = $1 AND zone_name = $2
    `, [concertId, zoneName]);
            return { rows: result.rows };
        });
    }
    getConcertTicketSummary(concertId) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield this.pool.query(`
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
            return { rows: result.rows };
        });
    }
    getUsersReferredBy(fanId) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield this.pool.query(`
      SELECT u.*, f.username, f.referral_code_used
      FROM users u
      JOIN fans f ON u.user_id = f.user_id
      WHERE f.referred_by = $1
      ORDER BY u.registration_date DESC
    `, [fanId]);
            return { rows: result.rows };
        });
    }
    getTicketsFromReferrals(fanId) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield this.pool.query(`
      SELECT t.*
      FROM tickets t
      JOIN fans f ON t.fan_id = f.user_id
      WHERE f.referred_by = $1 AND t.referral_code_used = true
    `, [fanId]);
            return { rows: result.rows };
        });
    }
}
class MongoDBAdapter {
    constructor() {
        this.db = (0, mongodb_schemas_1.getDatabase)();
    }
    getUsers() {
        return __awaiter(this, void 0, void 0, function* () {
            const data = yield (0, mongodb_schemas_1.getUsersCollection)().find({}).sort({ registration_date: -1 }).toArray();
            return { data };
        });
    }
    getUserById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const data = yield (0, mongodb_schemas_1.getUsersCollection)().find({ _id: id }).toArray();
            return { data };
        });
    }
    createUser(user) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield (0, mongodb_schemas_1.getUsersCollection)().insertOne(user);
            const data = yield (0, mongodb_schemas_1.getUsersCollection)().find({ _id: result.insertedId }).toArray();
            return { data };
        });
    }
    updateUser(id, updates) {
        return __awaiter(this, void 0, void 0, function* () {
            yield (0, mongodb_schemas_1.getUsersCollection)().updateOne({ _id: id }, { $set: updates });
            const data = yield (0, mongodb_schemas_1.getUsersCollection)().find({ _id: id }).toArray();
            return { data };
        });
    }
    deleteUser(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const data = yield (0, mongodb_schemas_1.getUsersCollection)().find({ _id: id }).toArray();
            yield (0, mongodb_schemas_1.getUsersCollection)().deleteOne({ _id: id });
            return { data };
        });
    }
    getArtists() {
        return __awaiter(this, void 0, void 0, function* () {
            const data = yield (0, mongodb_schemas_1.getArtistsCollection)().find({}).sort({ artist_name: 1 }).toArray();
            return { data };
        });
    }
    getArtistById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const data = yield (0, mongodb_schemas_1.getArtistsCollection)().find({ _id: id }).toArray();
            return { data };
        });
    }
    createArtist(artist) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield (0, mongodb_schemas_1.getArtistsCollection)().insertOne(artist);
            const data = yield (0, mongodb_schemas_1.getArtistsCollection)().find({ _id: result.insertedId }).toArray();
            return { data };
        });
    }
    getArenas() {
        return __awaiter(this, void 0, void 0, function* () {
            const data = yield (0, mongodb_schemas_1.getArenasCollection)().find({}).sort({ arena_name: 1 }).toArray();
            return { data };
        });
    }
    getArenaById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const data = yield (0, mongodb_schemas_1.getArenasCollection)().find({ _id: id }).toArray();
            return { data };
        });
    }
    createArena(arena) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield (0, mongodb_schemas_1.getArenasCollection)().insertOne(arena);
            const data = yield (0, mongodb_schemas_1.getArenasCollection)().find({ _id: result.insertedId }).toArray();
            return { data };
        });
    }
    getConcerts() {
        return __awaiter(this, void 0, void 0, function* () {
            const pipeline = [
                {
                    $lookup: {
                        from: 'arenas',
                        localField: 'arena_id',
                        foreignField: '_id',
                        as: 'arena_info'
                    }
                },
                {
                    $addFields: {
                        arena: {
                            $cond: {
                                if: { $eq: [{ $size: '$arena_info' }, 0] },
                                then: null,
                                else: {
                                    arena_id: { $arrayElemAt: ['$arena_info._id', 0] },
                                    arena_name: { $arrayElemAt: ['$arena_info.arena_name', 0] },
                                    arena_location: { $arrayElemAt: ['$arena_info.arena_location', 0] },
                                    capacity: { $arrayElemAt: ['$arena_info.total_capacity', 0] }
                                }
                            }
                        }
                    }
                },
                {
                    $project: {
                        arena_info: 0
                    }
                },
                {
                    $sort: { concert_date: -1 }
                }
            ];
            const data = yield (0, mongodb_schemas_1.getConcertsCollection)().aggregate(pipeline).toArray();
            return { data };
        });
    }
    getConcertById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const data = yield (0, mongodb_schemas_1.getConcertsCollection)().find({ _id: id }).toArray();
            return { data };
        });
    }
    createConcert(concert) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield (0, mongodb_schemas_1.getConcertsCollection)().insertOne(concert);
            const data = yield (0, mongodb_schemas_1.getConcertsCollection)().find({ _id: result.insertedId }).toArray();
            return { data };
        });
    }
    getTickets() {
        return __awaiter(this, void 0, void 0, function* () {
            const data = yield (0, mongodb_schemas_1.getTicketsCollection)().find({}).sort({ purchase_date: -1 }).toArray();
            return { data };
        });
    }
    getTicketById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const data = yield (0, mongodb_schemas_1.getTicketsCollection)().find({ _id: id }).toArray();
            return { data };
        });
    }
    createTicket(ticket) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield (0, mongodb_schemas_1.getTicketsCollection)().insertOne(ticket);
            const data = yield (0, mongodb_schemas_1.getTicketsCollection)().find({ _id: result.insertedId }).toArray();
            return { data };
        });
    }
    getTicketsByUserId(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const data = yield (0, mongodb_schemas_1.getTicketsCollection)().find({ fan_id: userId }).sort({ purchase_date: -1 }).toArray();
            return { data };
        });
    }
    getStats() {
        return __awaiter(this, void 0, void 0, function* () {
            const [users, artists, arenas, concerts, tickets] = yield Promise.all([
                (0, mongodb_schemas_1.getUsersCollection)().countDocuments(),
                (0, mongodb_schemas_1.getArtistsCollection)().countDocuments(),
                (0, mongodb_schemas_1.getArenasCollection)().countDocuments(),
                (0, mongodb_schemas_1.getConcertsCollection)().countDocuments(),
                (0, mongodb_schemas_1.getTicketsCollection)().countDocuments()
            ]);
            return { users, artists, arenas, concerts, tickets };
        });
    }
    // Referral system methods
    getUserByReferralCode(referralCode) {
        return __awaiter(this, void 0, void 0, function* () {
            const data = yield (0, mongodb_schemas_1.getUsersCollection)().find({
                'fan_details.referral_code': referralCode
            }).toArray();
            return { data };
        });
    }
    updateUserReferralPoints(userId, pointsToAdd) {
        return __awaiter(this, void 0, void 0, function* () {
            yield (0, mongodb_schemas_1.getUsersCollection)().updateOne({ _id: userId }, { $inc: { 'fan_details.referral_points': pointsToAdd } });
            const data = yield (0, mongodb_schemas_1.getUsersCollection)().find({ _id: userId }).toArray();
            return { data };
        });
    }
    markReferralCodeUsed(fanId) {
        return __awaiter(this, void 0, void 0, function* () {
            yield (0, mongodb_schemas_1.getUsersCollection)().updateOne({ _id: fanId }, { $set: { 'fan_details.referral_code_used': true } });
            const data = yield (0, mongodb_schemas_1.getUsersCollection)().find({ _id: fanId }).toArray();
            return { data };
        });
    }
    updateFanReferrer(fanId, referrerId) {
        return __awaiter(this, void 0, void 0, function* () {
            yield (0, mongodb_schemas_1.getUsersCollection)().updateOne({ _id: fanId }, { $set: { 'fan_details.referred_by': referrerId } });
            const data = yield (0, mongodb_schemas_1.getUsersCollection)().find({ _id: fanId }).toArray();
            return { data };
        });
    }
    // Advanced query methods
    query(sql_1) {
        return __awaiter(this, arguments, void 0, function* (sql, params = []) {
            // MongoDB doesn't use SQL, so this is a placeholder
            throw new Error('SQL queries not supported in MongoDB adapter');
        });
    }
    getTicketsByConcertAndZone(concertId, zoneName) {
        return __awaiter(this, void 0, void 0, function* () {
            const data = yield (0, mongodb_schemas_1.getTicketsCollection)().find({
                concert_id: concertId,
                zone_name: zoneName
            }).toArray();
            return { data };
        });
    }
    getConcertTicketSummary(concertId) {
        return __awaiter(this, void 0, void 0, function* () {
            const pipeline = [
                { $match: { concert_id: concertId } },
                {
                    $group: {
                        _id: '$zone_name',
                        tickets_sold: { $sum: 1 },
                        revenue: { $sum: '$price' },
                        referral_tickets: {
                            $sum: { $cond: ['$referral_code_used', 1, 0] }
                        }
                    }
                },
                { $sort: { _id: 1 } }
            ];
            const data = yield (0, mongodb_schemas_1.getTicketsCollection)().aggregate(pipeline).toArray();
            return { data };
        });
    }
    getUsersReferredBy(fanId) {
        return __awaiter(this, void 0, void 0, function* () {
            const data = yield (0, mongodb_schemas_1.getUsersCollection)().find({
                'fan_details.referred_by': fanId
            }).sort({ registration_date: -1 }).toArray();
            return { data };
        });
    }
    getTicketsFromReferrals(fanId) {
        return __awaiter(this, void 0, void 0, function* () {
            // First get all users referred by this fan
            const referredUsers = yield (0, mongodb_schemas_1.getUsersCollection)().find({
                'fan_details.referred_by': fanId
            }).toArray();
            const referredUserIds = referredUsers.map((user) => user._id);
            // Then get tickets purchased by those users with referral code used
            const data = yield (0, mongodb_schemas_1.getTicketsCollection)().find({
                fan_id: { $in: referredUserIds },
                referral_code_used: true
            }).toArray();
            return { data };
        });
    }
}
class DatabaseFactory {
    /**
     * Get the appropriate database adapter based on migration status
     */
    static getAdapter() {
        const dbType = migration_status_1.migrationStatus.getDatabaseType();
        if (dbType === 'mongodb') {
            if (!this.mongoAdapter) {
                this.mongoAdapter = new MongoDBAdapter();
            }
            return this.mongoAdapter;
        }
        else {
            if (!this.postgresAdapter) {
                this.postgresAdapter = new PostgreSQLAdapter();
            }
            return this.postgresAdapter;
        }
    }
    /**
     * Get current database type
     */
    static getCurrentDatabaseType() {
        return migration_status_1.migrationStatus.getDatabaseType();
    }
    /**
     * Check if system is migrated
     */
    static isMigrated() {
        return migration_status_1.migrationStatus.isMigrated();
    }
}
exports.DatabaseFactory = DatabaseFactory;
DatabaseFactory.postgresAdapter = null;
DatabaseFactory.mongoAdapter = null;
