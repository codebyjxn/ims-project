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
exports.OrganizerController = void 0;
const crypto_1 = require("crypto");
const postgres_1 = require("../lib/postgres");
const migration_status_1 = require("../services/migration-status");
class OrganizerController {
    // Get all concerts for an organizer
    getOrganizerConcerts(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { organizerId } = req.params;
                const currentDb = migration_status_1.migrationStatus.getDatabaseType();
                if (currentDb === 'mongodb') {
                    // MongoDB implementation
                    res.status(501).json({ error: 'MongoDB implementation pending' });
                    return;
                }
                else {
                    // PostgreSQL implementation
                    const pool = (0, postgres_1.getPool)();
                    const query = `
          SELECT 
            c.concert_id,
            c.description as title,
            c.concert_date as date,
            c.time,
            a.arena_name as arena_name,
            a.arena_location as arena_location,
            a.total_capacity as arena_capacity,
            COUNT(DISTINCT t.ticket_id) as tickets_sold,
            COALESCE(SUM(czp.price), 0) as total_revenue,
            CASE 
              WHEN c.concert_date > CURRENT_DATE THEN 'upcoming'
              WHEN c.concert_date = CURRENT_DATE THEN 'ongoing'
              ELSE 'completed'
            END as status
          FROM concerts c
          LEFT JOIN arenas a ON c.arena_id = a.arena_id
          LEFT JOIN tickets t ON c.concert_id = t.concert_id
          LEFT JOIN concert_zone_pricing czp ON t.concert_id = czp.concert_id 
            AND t.arena_id = czp.arena_id 
            AND t.zone_name = czp.zone_name
          WHERE c.organizer_id = $1
          GROUP BY c.concert_id, c.description, c.concert_date, c.time, 
                   a.arena_name, a.arena_location, a.total_capacity
          ORDER BY c.concert_date DESC
        `;
                    const result = yield pool.query(query, [organizerId]);
                    const concerts = result.rows;
                    // Get artists for each concert
                    for (const concert of concerts) {
                        const artistQuery = `
            SELECT ar.artist_name as name, ar.genre
            FROM concert_features_artists cfa
            JOIN artists ar ON cfa.artist_id = ar.artist_id
            WHERE cfa.concert_id = $1
          `;
                        const artistResult = yield pool.query(artistQuery, [concert.concert_id]);
                        concert.artists = artistResult.rows;
                        // Format the response
                        concert.arena = {
                            name: concert.arena_name,
                            location: concert.arena_location,
                            capacity: concert.arena_capacity
                        };
                        delete concert.arena_name;
                        delete concert.arena_location;
                        delete concert.arena_capacity;
                    }
                    res.json(concerts);
                }
            }
            catch (error) {
                console.error('Error fetching organizer concerts:', error);
                res.status(500).json({ error: 'Failed to fetch concerts' });
            }
        });
    }
    // Get organizer statistics
    getOrganizerStats(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { organizerId } = req.params;
                const currentDb = migration_status_1.migrationStatus.getDatabaseType();
                if (currentDb === 'mongodb') {
                    // MongoDB implementation
                    res.status(501).json({ error: 'MongoDB implementation pending' });
                    return;
                }
                else {
                    // PostgreSQL implementation
                    const pool = (0, postgres_1.getPool)();
                    // Get total concerts
                    const totalConcertsQuery = `
          SELECT COUNT(*) as total
          FROM concerts
          WHERE organizer_id = $1
        `;
                    const totalConcertsResult = yield pool.query(totalConcertsQuery, [organizerId]);
                    const totalConcerts = parseInt(totalConcertsResult.rows[0].total);
                    // Get upcoming concerts
                    const upcomingConcertsQuery = `
          SELECT COUNT(*) as total
          FROM concerts
          WHERE organizer_id = $1 AND concert_date > CURRENT_DATE
        `;
                    const upcomingConcertsResult = yield pool.query(upcomingConcertsQuery, [organizerId]);
                    const upcomingConcerts = parseInt(upcomingConcertsResult.rows[0].total);
                    // Get total tickets sold and revenue
                    const statsQuery = `
          SELECT 
            COUNT(t.ticket_id) as total_tickets_sold,
            COALESCE(SUM(czp.price), 0) as total_revenue,
            CASE 
              WHEN COUNT(DISTINCT c.concert_id) > 0 THEN 
                ROUND((COUNT(t.ticket_id)::decimal / COUNT(DISTINCT c.concert_id)), 2)
              ELSE 0
            END as average_attendance
          FROM concerts c
          LEFT JOIN tickets t ON c.concert_id = t.concert_id
          LEFT JOIN concert_zone_pricing czp ON t.concert_id = czp.concert_id 
            AND t.arena_id = czp.arena_id 
            AND t.zone_name = czp.zone_name
          WHERE c.organizer_id = $1
        `;
                    const statsResult = yield pool.query(statsQuery, [organizerId]);
                    const stats = statsResult.rows[0];
                    const response = {
                        totalConcerts,
                        upcomingConcerts,
                        totalTicketsSold: parseInt(stats.total_tickets_sold) || 0,
                        totalRevenue: parseFloat(stats.total_revenue) || 0,
                        averageAttendance: parseFloat(stats.average_attendance) || 0
                    };
                    res.json(response);
                }
            }
            catch (error) {
                console.error('Error fetching organizer stats:', error);
                res.status(500).json({ error: 'Failed to fetch statistics' });
            }
        });
    }
    // Get all arenas
    getArenas(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const currentDb = migration_status_1.migrationStatus.getDatabaseType();
                if (currentDb === 'mongodb') {
                    // MongoDB implementation
                    res.status(501).json({ error: 'MongoDB implementation pending' });
                    return;
                }
                else {
                    // PostgreSQL implementation
                    const pool = (0, postgres_1.getPool)();
                    const query = `
          SELECT 
            a.arena_id,
            a.arena_name,
            a.arena_location,
            a.total_capacity,
            json_agg(
              json_build_object(
                'zone_name', z.zone_name,
                'capacity_per_zone', z.capacity_per_zone
              )
            ) as zones
          FROM arenas a
          LEFT JOIN zones z ON a.arena_id = z.arena_id
          GROUP BY a.arena_id, a.arena_name, a.arena_location, a.total_capacity
          ORDER BY a.arena_name
        `;
                    const result = yield pool.query(query);
                    const arenas = result.rows.map(arena => ({
                        arena_id: arena.arena_id,
                        arena_name: arena.arena_name,
                        arena_location: arena.arena_location,
                        total_capacity: arena.total_capacity,
                        zones: arena.zones.filter((zone) => zone.zone_name !== null)
                    }));
                    res.json(arenas);
                }
            }
            catch (error) {
                console.error('Error fetching arenas:', error);
                res.status(500).json({ error: 'Failed to fetch arenas' });
            }
        });
    }
    // Get all artists
    getArtists(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const currentDb = migration_status_1.migrationStatus.getDatabaseType();
                if (currentDb === 'mongodb') {
                    // MongoDB implementation
                    res.status(501).json({ error: 'MongoDB implementation pending' });
                    return;
                }
                else {
                    // PostgreSQL implementation
                    const pool = (0, postgres_1.getPool)();
                    const query = `
          SELECT artist_id, artist_name, genre
          FROM artists
          ORDER BY artist_name
        `;
                    const result = yield pool.query(query);
                    res.json(result.rows);
                }
            }
            catch (error) {
                console.error('Error fetching artists:', error);
                res.status(500).json({ error: 'Failed to fetch artists' });
            }
        });
    }
    // Create a new concert
    createConcert(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { organizerId, title, description, date, time, arenaId, zones, artists, collaborations } = req.body;
                // Validate required fields
                if (!organizerId || !title || !date || !time || !arenaId || !zones || !artists) {
                    res.status(400).json({ error: 'Missing required fields' });
                    return;
                }
                const currentDb = migration_status_1.migrationStatus.getDatabaseType();
                if (currentDb === 'mongodb') {
                    // MongoDB implementation
                    res.status(501).json({ error: 'MongoDB implementation pending' });
                    return;
                }
                else {
                    // PostgreSQL implementation
                    const pool = (0, postgres_1.getPool)();
                    // Validate organizer exists
                    const organizerCheck = yield pool.query('SELECT user_id FROM organizers WHERE user_id = $1', [organizerId]);
                    if (organizerCheck.rows.length === 0) {
                        res.status(400).json({ error: 'Invalid organizer ID' });
                        return;
                    }
                    // Validate arena exists
                    const arenaCheck = yield pool.query('SELECT arena_id FROM arenas WHERE arena_id = $1', [arenaId]);
                    if (arenaCheck.rows.length === 0) {
                        res.status(400).json({ error: 'Invalid arena ID' });
                        return;
                    }
                    // Validate all artists exist
                    for (const artistId of artists) {
                        const artistCheck = yield pool.query('SELECT artist_id FROM artists WHERE artist_id = $1', [artistId]);
                        if (artistCheck.rows.length === 0) {
                            res.status(400).json({ error: `Invalid artist ID: ${artistId}` });
                            return;
                        }
                    }
                    // Validate all zones exist for the arena
                    for (const zone of zones) {
                        const zoneCheck = yield pool.query('SELECT zone_name FROM zones WHERE arena_id = $1 AND zone_name = $2', [arenaId, zone.zone_name]);
                        if (zoneCheck.rows.length === 0) {
                            res.status(400).json({ error: `Invalid zone '${zone.zone_name}' for arena` });
                            return;
                        }
                    }
                    // Start transaction
                    yield pool.query('BEGIN');
                    try {
                        const concertId = (0, crypto_1.randomUUID)();
                        // Insert concert
                        const concertQuery = `
            INSERT INTO concerts (concert_id, organizer_id, concert_date, time, description, arena_id)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING concert_id
          `;
                        yield pool.query(concertQuery, [concertId, organizerId, date, time, description, arenaId]);
                        // Insert zone pricing
                        for (const zone of zones) {
                            const zonePricingQuery = `
              INSERT INTO concert_zone_pricing (concert_id, arena_id, zone_name, price)
              VALUES ($1, $2, $3, $4)
            `;
                            yield pool.query(zonePricingQuery, [concertId, arenaId, zone.zone_name, zone.price]);
                        }
                        // Insert artists
                        for (const artistId of artists) {
                            const artistQuery = `
              INSERT INTO concert_features_artists (concert_id, artist_id)
              VALUES ($1, $2)
            `;
                            yield pool.query(artistQuery, [concertId, artistId]);
                        }
                        // Commit transaction
                        yield pool.query('COMMIT');
                        res.status(201).json({
                            message: 'Concert created successfully',
                            concertId
                        });
                    }
                    catch (error) {
                        // Rollback transaction
                        yield pool.query('ROLLBACK');
                        throw error;
                    }
                }
            }
            catch (error) {
                console.error('Error creating concert:', error);
                // Provide more specific error messages
                if (error instanceof Error) {
                    if (error.message.includes('foreign key constraint')) {
                        res.status(400).json({ error: 'Invalid reference to organizer, arena, or artist' });
                    }
                    else if (error.message.includes('Concert date must be in the future')) {
                        res.status(400).json({ error: 'Concert date must be in the future' });
                    }
                    else {
                        res.status(500).json({ error: 'Failed to create concert', details: error.message });
                    }
                }
                else {
                    res.status(500).json({ error: 'Failed to create concert' });
                }
            }
        });
    }
    // Get concert details
    getConcertDetails(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { concertId } = req.params;
                const currentDb = migration_status_1.migrationStatus.getDatabaseType();
                if (currentDb === 'mongodb') {
                    // MongoDB implementation
                    res.status(501).json({ error: 'MongoDB implementation pending' });
                    return;
                }
                else {
                    // PostgreSQL implementation
                    const pool = (0, postgres_1.getPool)();
                    const query = `
          SELECT 
            c.concert_id,
            c.description as title,
            c.concert_date as date,
            c.time,
            a.arena_name as arena_name,
            a.arena_location as arena_location,
            a.total_capacity as arena_capacity,
            COUNT(DISTINCT t.ticket_id) as tickets_sold,
            COALESCE(SUM(czp.price), 0) as total_revenue,
            CASE 
              WHEN c.concert_date > CURRENT_DATE THEN 'upcoming'
              WHEN c.concert_date = CURRENT_DATE THEN 'ongoing'
              ELSE 'completed'
            END as status
          FROM concerts c
          LEFT JOIN arenas a ON c.arena_id = a.arena_id
          LEFT JOIN tickets t ON c.concert_id = t.concert_id
          LEFT JOIN concert_zone_pricing czp ON t.concert_id = czp.concert_id 
            AND t.arena_id = czp.arena_id 
            AND t.zone_name = czp.zone_name
          WHERE c.concert_id = $1
          GROUP BY c.concert_id, c.description, c.concert_date, c.time, 
                   a.arena_name, a.arena_location, a.total_capacity
        `;
                    const result = yield pool.query(query, [concertId]);
                    if (result.rows.length === 0) {
                        res.status(404).json({ error: 'Concert not found' });
                        return;
                    }
                    const concert = result.rows[0];
                    // Get artists for the concert
                    const artistQuery = `
          SELECT ar.artist_name as name, ar.genre
          FROM concert_features_artists cfa
          JOIN artists ar ON cfa.artist_id = ar.artist_id
          WHERE cfa.concert_id = $1
        `;
                    const artistResult = yield pool.query(artistQuery, [concertId]);
                    concert.artists = artistResult.rows;
                    // Format the response
                    concert.arena = {
                        name: concert.arena_name,
                        location: concert.arena_location,
                        capacity: concert.arena_capacity
                    };
                    delete concert.arena_name;
                    delete concert.arena_location;
                    delete concert.arena_capacity;
                    res.json(concert);
                }
            }
            catch (error) {
                console.error('Error fetching concert details:', error);
                res.status(500).json({ error: 'Failed to fetch concert details' });
            }
        });
    }
    // Update concert
    updateConcert(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { concertId } = req.params;
                const updates = req.body;
                const currentDb = migration_status_1.migrationStatus.getDatabaseType();
                if (currentDb === 'mongodb') {
                    // MongoDB implementation
                    res.status(501).json({ error: 'MongoDB implementation pending' });
                    return;
                }
                else {
                    // PostgreSQL implementation
                    const pool = (0, postgres_1.getPool)();
                    // Build dynamic update query
                    const updateFields = [];
                    const values = [];
                    let paramIndex = 1;
                    if (updates.description) {
                        updateFields.push(`description = $${paramIndex++}`);
                        values.push(updates.description);
                    }
                    if (updates.date) {
                        updateFields.push(`concert_date = $${paramIndex++}`);
                        values.push(updates.date);
                    }
                    if (updates.time) {
                        updateFields.push(`time = $${paramIndex++}`);
                        values.push(updates.time);
                    }
                    if (updateFields.length === 0) {
                        res.status(400).json({ error: 'No valid fields to update' });
                        return;
                    }
                    values.push(concertId);
                    const query = `
          UPDATE concerts 
          SET ${updateFields.join(', ')} 
          WHERE concert_id = $${paramIndex}
          RETURNING concert_id
        `;
                    const result = yield pool.query(query, values);
                    if (result.rows.length === 0) {
                        res.status(404).json({ error: 'Concert not found' });
                        return;
                    }
                    res.json({ message: 'Concert updated successfully' });
                }
            }
            catch (error) {
                console.error('Error updating concert:', error);
                res.status(500).json({ error: 'Failed to update concert' });
            }
        });
    }
    // Delete concert
    deleteConcert(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { concertId } = req.params;
                const currentDb = migration_status_1.migrationStatus.getDatabaseType();
                if (currentDb === 'mongodb') {
                    // MongoDB implementation
                    res.status(501).json({ error: 'MongoDB implementation pending' });
                    return;
                }
                else {
                    // PostgreSQL implementation
                    const pool = (0, postgres_1.getPool)();
                    // Start transaction
                    yield pool.query('BEGIN');
                    try {
                        // Delete related records first (due to foreign key constraints)
                        yield pool.query('DELETE FROM tickets WHERE concert_id = $1', [concertId]);
                        yield pool.query('DELETE FROM concert_zone_pricing WHERE concert_id = $1', [concertId]);
                        yield pool.query('DELETE FROM concert_features_artists WHERE concert_id = $1', [concertId]);
                        // Delete the concert
                        const result = yield pool.query('DELETE FROM concerts WHERE concert_id = $1 RETURNING concert_id', [concertId]);
                        if (result.rows.length === 0) {
                            yield pool.query('ROLLBACK');
                            res.status(404).json({ error: 'Concert not found' });
                            return;
                        }
                        // Commit transaction
                        yield pool.query('COMMIT');
                        res.json({ message: 'Concert deleted successfully' });
                    }
                    catch (error) {
                        // Rollback transaction
                        yield pool.query('ROLLBACK');
                        throw error;
                    }
                }
            }
            catch (error) {
                console.error('Error deleting concert:', error);
                res.status(500).json({ error: 'Failed to delete concert' });
            }
        });
    }
    // Get concert analytics
    getConcertAnalytics(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { concertId } = req.params;
                const currentDb = migration_status_1.migrationStatus.getDatabaseType();
                if (currentDb === 'mongodb') {
                    // MongoDB implementation
                    res.status(501).json({ error: 'MongoDB implementation pending' });
                    return;
                }
                else {
                    // PostgreSQL implementation
                    const pool = (0, postgres_1.getPool)();
                    const query = `
          SELECT 
            z.zone_name,
            z.capacity_per_zone,
            COUNT(t.ticket_id) as tickets_sold,
            czp.price,
            COUNT(t.ticket_id) * czp.price as zone_revenue
          FROM zones z
          JOIN concert_zone_pricing czp ON z.arena_id = czp.arena_id AND z.zone_name = czp.zone_name
          LEFT JOIN tickets t ON czp.concert_id = t.concert_id AND czp.zone_name = t.zone_name
          WHERE czp.concert_id = $1
          GROUP BY z.zone_name, z.capacity_per_zone, czp.price
          ORDER BY z.zone_name
        `;
                    const result = yield pool.query(query, [concertId]);
                    const analytics = result.rows.map(row => ({
                        zoneName: row.zone_name,
                        capacity: row.capacity_per_zone,
                        ticketsSold: parseInt(row.tickets_sold),
                        price: parseFloat(row.price),
                        revenue: parseFloat(row.zone_revenue),
                        occupancyRate: (parseInt(row.tickets_sold) / row.capacity_per_zone * 100).toFixed(2)
                    }));
                    res.json(analytics);
                }
            }
            catch (error) {
                console.error('Error fetching concert analytics:', error);
                res.status(500).json({ error: 'Failed to fetch analytics' });
            }
        });
    }
}
exports.OrganizerController = OrganizerController;
