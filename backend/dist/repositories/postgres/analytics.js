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
exports.PostgresAnalyticsRepository = void 0;
const postgres_1 = require("../../lib/postgres");
class PostgresAnalyticsRepository {
    constructor() {
        this.pool = (0, postgres_1.getPool)();
    }
    getUpcomingConcertsPerformance() {
        return __awaiter(this, void 0, void 0, function* () {
            const query = `
      SELECT
        c.concert_id,
        c.description AS concert_name,
        c.concert_date,
        c.description,
        ar.arena_name,
        COALESCE(artists_agg.artists, '') AS artists,
        COUNT(t.ticket_id) AS tickets_sold
      FROM concerts c
      JOIN arenas ar ON c.arena_id = ar.arena_id
      LEFT JOIN tickets t ON c.concert_id = t.concert_id
      LEFT JOIN (
        SELECT
          ca.concert_id,
          STRING_AGG(a.artist_name, ', ') AS artists
        FROM concert_features_artists ca
        JOIN artists a ON ca.artist_id = a.artist_id
        GROUP BY ca.concert_id
      ) AS artists_agg ON c.concert_id = artists_agg.concert_id
      WHERE c.concert_date >= CURRENT_DATE
      GROUP BY c.concert_id, ar.arena_name, artists_agg.artists
      ORDER BY tickets_sold DESC;
    `;
            const result = yield this.pool.query(query);
            return result.rows;
        });
    }
}
exports.PostgresAnalyticsRepository = PostgresAnalyticsRepository;
