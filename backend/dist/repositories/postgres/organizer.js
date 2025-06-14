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
exports.PostgresOrganizerRepository = void 0;
const postgres_1 = require("../../lib/postgres");
const crypto_1 = require("crypto");
class PostgresOrganizerRepository {
    constructor() {
        this.pool = (0, postgres_1.getPool)();
    }
    findConcertsByOrganizer(organizerId) {
        return __awaiter(this, void 0, void 0, function* () {
            // Query from original controller
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
            const result = yield this.pool.query(query, [organizerId]);
            const concerts = result.rows;
            // Get artists for each concert
            for (const concert of concerts) {
                const artistQuery = `
        SELECT ar.artist_name as name, ar.genre
        FROM concert_features_artists cfa
        JOIN artists ar ON cfa.artist_id = ar.artist_id
        WHERE cfa.concert_id = $1
      `;
                const artistResult = yield this.pool.query(artistQuery, [concert.concert_id]);
                concert.artists = artistResult.rows;
            }
            return concerts;
        });
    }
    getStats(organizerId) {
        return __awaiter(this, void 0, void 0, function* () {
            // Queries from original controller
            const totalConcertsQuery = `
      SELECT COUNT(*) as total
      FROM concerts
      WHERE organizer_id = $1
    `;
            const totalConcertsResult = yield this.pool.query(totalConcertsQuery, [organizerId]);
            const totalConcerts = parseInt(totalConcertsResult.rows[0].total);
            const upcomingConcertsQuery = `
      SELECT COUNT(*) as total
      FROM concerts
      WHERE organizer_id = $1 AND concert_date > CURRENT_DATE
    `;
            const upcomingConcertsResult = yield this.pool.query(upcomingConcertsQuery, [organizerId]);
            const upcomingConcerts = parseInt(upcomingConcertsResult.rows[0].total);
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
            const statsResult = yield this.pool.query(statsQuery, [organizerId]);
            const stats = statsResult.rows[0];
            return {
                totalConcerts,
                upcomingConcerts,
                totalTicketsSold: parseInt(stats.total_tickets_sold) || 0,
                totalRevenue: parseFloat(stats.total_revenue) || 0,
                averageAttendance: parseFloat(stats.average_attendance) || 0
            };
        });
    }
    getArenas() {
        return __awaiter(this, void 0, void 0, function* () {
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
            const result = yield this.pool.query(query);
            return result.rows.map(arena => ({
                arena_id: arena.arena_id,
                arena_name: arena.arena_name,
                arena_location: arena.arena_location,
                total_capacity: arena.total_capacity,
                zones: arena.zones.filter((zone) => zone.zone_name !== null)
            }));
        });
    }
    getArtists() {
        return __awaiter(this, void 0, void 0, function* () {
            const query = `
      SELECT artist_id, artist_name, genre
      FROM artists
      ORDER BY artist_name
    `;
            const result = yield this.pool.query(query);
            return result.rows;
        });
    }
    createConcert(concertData) {
        return __awaiter(this, void 0, void 0, function* () {
            const pool = this.pool;
            const concertId = (0, crypto_1.randomUUID)();
            yield pool.query('BEGIN');
            try {
                // Insert concert
                const concertQuery = `
        INSERT INTO concerts (concert_id, organizer_id, concert_date, time, description, arena_id)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING concert_id
      `;
                yield pool.query(concertQuery, [
                    concertId,
                    concertData.organizerId,
                    concertData.date,
                    concertData.time,
                    concertData.description,
                    concertData.arenaId
                ]);
                // Insert zone pricing
                for (const zone of concertData.zones || []) {
                    const zonePricingQuery = `
          INSERT INTO concert_zone_pricing (concert_id, arena_id, zone_name, price)
          VALUES ($1, $2, $3, $4)
        `;
                    yield pool.query(zonePricingQuery, [
                        concertId,
                        concertData.arenaId,
                        zone.zone_name,
                        zone.price
                    ]);
                }
                // Insert artists
                for (const artistId of concertData.artists || []) {
                    const artistQuery = `
          INSERT INTO concert_features_artists (concert_id, artist_id)
          VALUES ($1, $2)
        `;
                    yield pool.query(artistQuery, [concertId, artistId]);
                }
                yield pool.query('COMMIT');
                return { concertId };
            }
            catch (error) {
                yield pool.query('ROLLBACK');
                throw error;
            }
        });
    }
    getArenasAnalytics(organizerId) {
        return __awaiter(this, void 0, void 0, function* () {
            // Get all arenas where the organizer has concerts
            const arenasQuery = `
      SELECT DISTINCT a.arena_id, a.arena_name, a.arena_location, a.total_capacity
      FROM arenas a
      JOIN concerts c ON a.arena_id = c.arena_id
      WHERE c.organizer_id = $1
    `;
            const arenasResult = yield this.pool.query(arenasQuery, [organizerId]);
            const arenas = arenasResult.rows;
            const analytics = [];
            for (const arena of arenas) {
                // Get zones for this arena
                const zonesQuery = `
        SELECT zone_name, capacity_per_zone FROM zones WHERE arena_id = $1
      `;
                const zonesResult = yield this.pool.query(zonesQuery, [arena.arena_id]);
                const zones = zonesResult.rows;
                // For each zone, get tickets sold and revenue for this organizer
                for (const zone of zones) {
                    const ticketsQuery = `
          SELECT COUNT(t.ticket_id) as tickets_sold, COALESCE(SUM(czp.price), 0) as revenue
          FROM concerts c
          JOIN tickets t ON c.concert_id = t.concert_id AND t.zone_name = $2
          JOIN concert_zone_pricing czp ON t.concert_id = czp.concert_id AND t.zone_name = czp.zone_name
          WHERE c.organizer_id = $1 AND c.arena_id = $3 AND t.zone_name = $2
        `;
                    const ticketsResult = yield this.pool.query(ticketsQuery, [organizerId, zone.zone_name, arena.arena_id]);
                    zone.tickets_sold = parseInt(ticketsResult.rows[0].tickets_sold) || 0;
                    zone.revenue = parseFloat(ticketsResult.rows[0].revenue) || 0;
                }
                analytics.push({
                    arena_id: arena.arena_id,
                    arena_name: arena.arena_name,
                    arena_location: arena.arena_location,
                    total_capacity: arena.total_capacity,
                    zones
                });
            }
            return analytics;
        });
    }
}
exports.PostgresOrganizerRepository = PostgresOrganizerRepository;
