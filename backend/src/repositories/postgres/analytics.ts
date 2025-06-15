import { Pool } from 'pg';
import { getPool } from '../../lib/postgres';

export interface UpcomingConcertPerformance {
  concert_id: string;
  concert_name: string;
  concert_date: string;
  description: string;
  arena_name: string;
  artists: string;
  tickets_sold: number;
  total_revenue: number;
}

export class PostgresAnalyticsRepository {
  private pool: Pool;

  constructor() {
    this.pool = getPool();
  }

  async getUpcomingConcertsPerformance(): Promise<UpcomingConcertPerformance[]> {
    const query = `
      SELECT
        c.concert_id,
        c.description AS concert_name,
        c.concert_date,
        c.description,
        ar.arena_name,
        COALESCE(artists_agg.artists, '') AS artists,
        COUNT(t.ticket_id) AS tickets_sold,
        COALESCE(SUM(czp.price), 0) AS total_revenue
      FROM concerts c
      JOIN arenas ar ON c.arena_id = ar.arena_id
      LEFT JOIN tickets t ON c.concert_id = t.concert_id
      LEFT JOIN concert_zone_pricing czp ON t.concert_id = czp.concert_id AND t.zone_name = czp.zone_name
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
    const result = await this.pool.query(query);
    return result.rows;
  }
} 