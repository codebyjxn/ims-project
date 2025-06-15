// src/repositories/postgres/index.ts
// ========== POSTGRESQL REPOSITORY IMPLEMENTATIONS ==========

import { Pool } from 'pg';
import { getPool } from '../../lib/postgres';
import { 
  IUserRepository, 
  IArtistRepository, 
  IArenaRepository, 
  IConcertRepository, 
  ITicketRepository,
  IRepositoryFactory 
} from '../interfaces';
import { PostgresOrganizerRepository } from './organizer';

export class PostgresUserRepository implements IUserRepository {
  private pool: Pool;

  constructor() {
    this.pool = getPool();
  }

  async findById(userId: string): Promise<any | null> {
    const userResult = await this.pool.query(
      'SELECT * FROM users WHERE user_id = $1',
      [userId]
    );
    
    if (userResult.rows.length === 0) return null;
    
    const user = userResult.rows[0];
    
    // Check if user is a fan
    const fanResult = await this.pool.query(
      'SELECT * FROM fans WHERE user_id = $1',
      [userId]
    );
    
    if (fanResult.rows.length > 0) {
      return { ...user, ...fanResult.rows[0], user_type: 'fan' };
    }
    
    // Check if user is an organizer
    const organizerResult = await this.pool.query(
      'SELECT * FROM organizers WHERE user_id = $1',
      [userId]
    );
    
    if (organizerResult.rows.length > 0) {
      return { ...user, ...organizerResult.rows[0], user_type: 'organizer' };
    }
    
    return { ...user, user_type: 'admin' };
  }

  async findByEmail(email: string): Promise<any | null> {
    const result = await this.pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    return result.rows.length > 0 ? result.rows[0] : null;
  }

  async findFanByUsername(username: string): Promise<any | null> {
    const result = await this.pool.query(`
      SELECT u.*, f.* 
      FROM users u 
      JOIN fans f ON u.user_id = f.user_id 
      WHERE f.username = $1
    `, [username]);
    
    return result.rows.length > 0 ? { ...result.rows[0], user_type: 'fan' } : null;
  }

  async findFanByReferralCode(referralCode: string): Promise<any | null> {
    const result = await this.pool.query(`
      SELECT u.*, f.* 
      FROM users u 
      JOIN fans f ON u.user_id = f.user_id 
      WHERE f.referral_code = $1
    `, [referralCode]);
    
    return result.rows.length > 0 ? { ...result.rows[0], user_type: 'fan' } : null;
  }

  async create(userData: any): Promise<any> {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Insert into users table
      const userResult = await client.query(`
        INSERT INTO users (user_id, email, user_password, first_name, last_name, registration_date)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `, [
        userData.user_id,
        userData.email,
        userData.user_password,
        userData.first_name,
        userData.last_name,
        userData.registration_date || new Date()
      ]);
      
      const user = userResult.rows[0];
      
      // Insert into specific table based on user type
      if (userData.user_type === 'fan') {
        const fanResult = await client.query(`
          INSERT INTO fans (user_id, username, preferred_genre, phone_number, referral_code, referred_by, referral_points, referral_code_used)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          RETURNING *
        `, [
          userData.user_id,
          userData.username,
          userData.preferred_genre,
          userData.phone_number,
          userData.referral_code,
          userData.referred_by || null,
          userData.referral_points || 0,
          userData.referral_code_used || false
        ]);
        
        await client.query('COMMIT');
        return { ...user, ...fanResult.rows[0], user_type: 'fan' };
      } else if (userData.user_type === 'organizer') {
        const organizerResult = await client.query(`
          INSERT INTO organizers (user_id, organization_name, contact_info)
          VALUES ($1, $2, $3)
          RETURNING *
        `, [
          userData.user_id,
          userData.organization_name,
          userData.contact_info
        ]);
        
        await client.query('COMMIT');
        return { ...user, ...organizerResult.rows[0], user_type: 'organizer' };
      }
      
      await client.query('COMMIT');
      return { ...user, user_type: 'admin' };
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async update(userId: string, updates: any): Promise<any | null> {
    const result = await this.pool.query(
      'UPDATE users SET first_name = $1, last_name = $2 WHERE user_id = $3 RETURNING *',
      [updates.first_name, updates.last_name, userId]
    );
    return result.rows.length > 0 ? result.rows[0] : null;
  }

  async delete(userId: string): Promise<boolean> {
    const result = await this.pool.query(
      'DELETE FROM users WHERE user_id = $1',
      [userId]
    );
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async updateReferralPoints(userId: string, points: number): Promise<void> {
    await this.pool.query(
      'UPDATE fans SET referral_points = referral_points + $1 WHERE user_id = $2',
      [points, userId]
    );
  }

  async markReferralCodeUsed(fanId: string): Promise<void> {
    await this.pool.query(
      'UPDATE fans SET referral_code_used = true WHERE user_id = $1',
      [fanId]
    );
  }

  async setReferrer(fanId: string, referrerId: string): Promise<void> {
    await this.pool.query(
      'UPDATE fans SET referred_by = $1 WHERE user_id = $2',
      [referrerId, fanId]
    );
  }
}

export class PostgresArtistRepository implements IArtistRepository {
  private pool: Pool;

  constructor() {
    this.pool = getPool();
  }

  async findById(artistId: string): Promise<any | null> {
    const result = await this.pool.query(
      'SELECT * FROM artists WHERE artist_id = $1',
      [artistId]
    );
    return result.rows.length > 0 ? result.rows[0] : null;
  }

  async findAll(): Promise<any[]> {
    const result = await this.pool.query('SELECT * FROM artists ORDER BY artist_name');
    return result.rows;
  }

  async findByGenre(genre: string): Promise<any[]> {
    const result = await this.pool.query(
      'SELECT * FROM artists WHERE genre = $1 ORDER BY artist_name',
      [genre]
    );
    return result.rows;
  }

  async create(artistData: any): Promise<any> {
    const result = await this.pool.query(
      'INSERT INTO artists (artist_id, artist_name, genre) VALUES ($1, $2, $3) RETURNING *',
      [artistData.artist_id, artistData.artist_name, artistData.genre]
    );
    return result.rows[0];
  }

  async update(artistId: string, updates: any): Promise<any | null> {
    const result = await this.pool.query(
      'UPDATE artists SET artist_name = $1, genre = $2 WHERE artist_id = $3 RETURNING *',
      [updates.artist_name, updates.genre, artistId]
    );
    return result.rows.length > 0 ? result.rows[0] : null;
  }

  async delete(artistId: string): Promise<boolean> {
    const result = await this.pool.query(
      'DELETE FROM artists WHERE artist_id = $1',
      [artistId]
    );
    return result.rowCount ? result.rowCount > 0 : false;
  }
}

export class PostgresArenaRepository implements IArenaRepository {
  private pool: Pool;

  constructor() {
    this.pool = getPool();
  }

  async findById(arenaId: string): Promise<any | null> {
    const arenaResult = await this.pool.query(
      'SELECT * FROM arenas WHERE arena_id = $1',
      [arenaId]
    );
    
    if (arenaResult.rows.length === 0) return null;
    
    const arena = arenaResult.rows[0];
    const zones = await this.findZones(arenaId);
    
    return { ...arena, zones };
  }

  async findAll(): Promise<any[]> {
    const result = await this.pool.query('SELECT * FROM arenas ORDER BY arena_name');
    
    // Load zones for each arena
    const arenasWithZones = await Promise.all(
      result.rows.map(async (arena) => {
        const zones = await this.findZones(arena.arena_id);
        return { ...arena, zones };
      })
    );
    
    return arenasWithZones;
  }

  async findByLocation(location: string): Promise<any[]> {
    const result = await this.pool.query(
      'SELECT * FROM arenas WHERE arena_location ILIKE $1 ORDER BY arena_name',
      [`%${location}%`]
    );
    return result.rows;
  }

  async findZones(arenaId: string): Promise<any[]> {
    const result = await this.pool.query(
      'SELECT * FROM zones WHERE arena_id = $1 ORDER BY zone_name',
      [arenaId]
    );
    return result.rows;
  }

  async create(arenaData: any): Promise<any> {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Insert arena
      const arenaResult = await client.query(
        'INSERT INTO arenas (arena_id, arena_name, arena_location, total_capacity) VALUES ($1, $2, $3, $4) RETURNING *',
        [arenaData.arena_id, arenaData.arena_name, arenaData.arena_location, arenaData.total_capacity]
      );
      
      const arena = arenaResult.rows[0];
      
      // Insert zones
      if (arenaData.zones && arenaData.zones.length > 0) {
        for (const zone of arenaData.zones) {
          await client.query(
            'INSERT INTO zones (arena_id, zone_name, capacity_per_zone) VALUES ($1, $2, $3)',
            [arena.arena_id, zone.zone_name, zone.capacity_per_zone]
          );
        }
      }
      
      await client.query('COMMIT');
      return { ...arena, zones: arenaData.zones || [] };
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async update(arenaId: string, updates: any): Promise<any | null> {
    const result = await this.pool.query(
      'UPDATE arenas SET arena_name = $1, arena_location = $2, total_capacity = $3 WHERE arena_id = $4 RETURNING *',
      [updates.arena_name, updates.arena_location, updates.total_capacity, arenaId]
    );
    return result.rows.length > 0 ? result.rows[0] : null;
  }

  async delete(arenaId: string): Promise<boolean> {
    const result = await this.pool.query(
      'DELETE FROM arenas WHERE arena_id = $1',
      [arenaId]
    );
    return result.rowCount ? result.rowCount > 0 : false;
  }
}

export class PostgresConcertRepository implements IConcertRepository {
  private pool: Pool;

  constructor() {
    this.pool = getPool();
  }

  async findById(concertId: string): Promise<any | null> {
    const concertResult = await this.pool.query(
      'SELECT * FROM concerts WHERE concert_id = $1',
      [concertId]
    );
    
    if (concertResult.rows.length === 0) return null;
    
    const concert = concertResult.rows[0];
    
    // Get artists
    const artistsResult = await this.pool.query(`
      SELECT a.artist_id, a.artist_name, a.genre 
      FROM artists a 
      JOIN concert_features_artists cfa ON a.artist_id = cfa.artist_id 
      WHERE cfa.concert_id = $1
    `, [concertId]);
    
    // Get zone pricing
    const pricingResult = await this.pool.query(
      'SELECT zone_name, price FROM concert_zone_pricing WHERE concert_id = $1',
      [concertId]
    );
    
    return {
      ...concert,
      artists: artistsResult.rows,
      zone_pricing: pricingResult.rows
    };
  }

  async findAll(): Promise<any[]> {
    const query = `
      SELECT
        c.concert_id,
        c.concert_date,
        c.time,
        c.description,
        c.arena_id,
        a.arena_name,
        a.arena_location,
        org.organization_name,
        json_agg(DISTINCT jsonb_build_object('artist_id', art.artist_id, 'artist_name', art.artist_name, 'genre', art.genre)) as artists,
        json_agg(DISTINCT jsonb_build_object('zone_name', czp.zone_name, 'price', czp.price)) as zone_pricing
      FROM concerts c
      LEFT JOIN arenas a ON c.arena_id = a.arena_id
      LEFT JOIN organizers org ON c.organizer_id = org.user_id
      LEFT JOIN concert_features_artists cfa ON c.concert_id = cfa.concert_id
      LEFT JOIN artists art ON cfa.artist_id = art.artist_id
      LEFT JOIN concert_zone_pricing czp ON c.concert_id = czp.concert_id
      GROUP BY c.concert_id, a.arena_id, org.user_id
      ORDER BY c.concert_date;
    `;
    const result = await this.pool.query(query);
    return result.rows;
  }

  async findByDate(date: Date): Promise<any[]> {
    const result = await this.pool.query(
      'SELECT * FROM concerts WHERE concert_date = $1 ORDER BY time',
      [date]
    );
    return result.rows;
  }

  async findByOrganizer(organizerId: string): Promise<any[]> {
    const result = await this.pool.query(
      'SELECT * FROM concerts WHERE organizer_id = $1 ORDER BY concert_date',
      [organizerId]
    );
    return result.rows;
  }

  async findByArtist(artistId: string): Promise<any[]> {
    const result = await this.pool.query(`
      SELECT c.* 
      FROM concerts c 
      JOIN concert_features_artists cfa ON c.concert_id = cfa.concert_id 
      WHERE cfa.artist_id = $1 
      ORDER BY c.concert_date
    `, [artistId]);
    return result.rows;
  }

  async create(concertData: any): Promise<any> {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Insert concert
      const concertResult = await client.query(`
        INSERT INTO concerts (concert_id, organizer_id, concert_date, time, description, arena_id)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `, [
        concertData.concert_id,
        concertData.organizer_id,
        concertData.concert_date,
        concertData.time,
        concertData.description,
        concertData.arena_id
      ]);
      
      const concert = concertResult.rows[0];
      
      // Insert artists
      if (concertData.artists && concertData.artists.length > 0) {
        for (const artist of concertData.artists) {
          await client.query(
            'INSERT INTO concert_features_artists (concert_id, artist_id) VALUES ($1, $2)',
            [concert.concert_id, artist.artist_id]
          );
        }
      }
      
      // Insert zone pricing
      if (concertData.zone_pricing && concertData.zone_pricing.length > 0) {
        for (const pricing of concertData.zone_pricing) {
          await client.query(
            'INSERT INTO concert_zone_pricing (concert_id, arena_id, zone_name, price) VALUES ($1, $2, $3, $4)',
            [concert.concert_id, concert.arena_id, pricing.zone_name, pricing.price]
          );
        }
      }
      
      await client.query('COMMIT');
      return {
        ...concert,
        artists: concertData.artists || [],
        zone_pricing: concertData.zone_pricing || []
      };
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async update(concertId: string, updates: any): Promise<any | null> {
    const result = await this.pool.query(
      'UPDATE concerts SET description = $1 WHERE concert_id = $2 RETURNING *',
      [updates.description, concertId]
    );
    return result.rows.length > 0 ? result.rows[0] : null;
  }

  async delete(concertId: string): Promise<boolean> {
    const result = await this.pool.query(
      'DELETE FROM concerts WHERE concert_id = $1',
      [concertId]
    );
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async findZonePricing(concertId: string, arenaId: string, zoneName: string): Promise<any | null> {
    const result = await this.pool.query(
      'SELECT * FROM concert_zone_pricing WHERE concert_id = $1 AND arena_id = $2 AND zone_name = $3',
      [concertId, arenaId, zoneName]
    );
    return result.rows.length > 0 ? result.rows[0] : null;
  }

  async findAvailableTickets(concertId: string, zoneName: string): Promise<number> {
    // Get zone capacity
    const capacityResult = await this.pool.query(`
      SELECT z.capacity_per_zone 
      FROM zones z 
      JOIN concerts c ON z.arena_id = c.arena_id 
      WHERE c.concert_id = $1 AND z.zone_name = $2
    `, [concertId, zoneName]);
    
    if (capacityResult.rows.length === 0) return 0;
    
    const capacity = capacityResult.rows[0].capacity_per_zone;
    
    // Get sold tickets count
    const soldResult = await this.pool.query(
      'SELECT COUNT(*) as sold FROM tickets WHERE concert_id = $1 AND zone_name = $2',
      [concertId, zoneName]
    );
    
    const sold = parseInt(soldResult.rows[0].sold);
    return capacity - sold;
  }

  async findUpcoming(): Promise<any[]> {
    const result = await this.pool.query(`
      SELECT
        c.concert_id,
        c.concert_date,
        c.time,
        c.description,
        c.arena_id,
        a.arena_name,
        a.arena_location,
        org.organization_name,
        json_agg(DISTINCT jsonb_build_object('artist_id', art.artist_id, 'artist_name', art.artist_name, 'genre', art.genre)) as artists,
        json_agg(DISTINCT jsonb_build_object('zone_name', czp.zone_name, 'price', czp.price)) as zone_pricing
      FROM concerts c
      LEFT JOIN arenas a ON c.arena_id = a.arena_id
      LEFT JOIN organizers org ON c.organizer_id = org.user_id
      LEFT JOIN concert_features_artists cfa ON c.concert_id = cfa.concert_id
      LEFT JOIN artists art ON cfa.artist_id = art.artist_id
      LEFT JOIN concert_zone_pricing czp ON c.concert_id = czp.concert_id
      WHERE c.concert_date > CURRENT_DATE
      GROUP BY c.concert_id, a.arena_id, org.user_id
      ORDER BY c.concert_date;
    `);
    return result.rows;
  }
}

export class PostgresTicketRepository implements ITicketRepository {
  private pool: Pool;

  constructor() {
    this.pool = getPool();
  }

  async findById(ticketId: string): Promise<any | null> {
    const result = await this.pool.query(`
      SELECT t.*, 
             c.concert_date,
             c.description as concert_name,
             c.time as concert_time,
             ar.arena_name,
             ar.arena_location,
             f.username as fan_username
      FROM tickets t
      JOIN concerts c ON t.concert_id = c.concert_id
      JOIN arenas ar ON t.arena_id = ar.arena_id
      JOIN fans f ON t.fan_id = f.user_id
      WHERE t.ticket_id = $1
    `, [ticketId]);
    
    return result.rows.length > 0 ? result.rows[0] : null;
  }

  async findByFan(fanId: string): Promise<any[]> {
    const result = await this.pool.query(`
      SELECT t.*, 
             c.concert_date,
             c.description as concert_name,
             c.time as concert_time,
             ar.arena_name,
             ar.arena_location,
             f.username as fan_username
      FROM tickets t
      JOIN concerts c ON t.concert_id = c.concert_id
      JOIN arenas ar ON t.arena_id = ar.arena_id
      JOIN fans f ON t.fan_id = f.user_id
      WHERE t.fan_id = $1
      ORDER BY c.concert_date
    `, [fanId]);
    
    return result.rows;
  }

  async findByConcert(concertId: string): Promise<any[]> {
    const result = await this.pool.query(`
      SELECT t.*, 
             c.concert_date,
             c.description as concert_name,
             c.time as concert_time,
             ar.arena_name,
             ar.arena_location,
             f.username as fan_username
      FROM tickets t
      JOIN concerts c ON t.concert_id = c.concert_id
      JOIN arenas ar ON t.arena_id = ar.arena_id
      JOIN fans f ON t.fan_id = f.user_id
      WHERE t.concert_id = $1
    `, [concertId]);
    
    return result.rows;
  }

  async findByConcertAndZone(concertId: string, zoneName: string): Promise<any[]> {
    const result = await this.pool.query(
      'SELECT * FROM tickets WHERE concert_id = $1 AND zone_name = $2',
      [concertId, zoneName]
    );
    return result.rows;
  }

  async create(ticketData: any): Promise<any> {
    const result = await this.pool.query(`
      INSERT INTO tickets (ticket_id, fan_id, concert_id, arena_id, zone_name, purchase_date, purchase_price)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [
      ticketData.ticket_id,
      ticketData.fan_id,
      ticketData.concert_id,
      ticketData.arena_id,
      ticketData.zone_name,
      ticketData.purchase_date || new Date(),
      ticketData.purchase_price
    ]);
    
    return result.rows[0];
  }

  async createMultiple(ticketsData: any[]): Promise<any[]> {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');
      
      const createdTickets = [];
      for (const ticketData of ticketsData) {
        const result = await client.query(`
          INSERT INTO tickets (ticket_id, fan_id, concert_id, arena_id, zone_name, purchase_date, purchase_price)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          RETURNING *
        `, [
          ticketData.ticket_id,
          ticketData.fan_id,
          ticketData.concert_id,
          ticketData.arena_id,
          ticketData.zone_name,
          ticketData.purchase_date || new Date(),
          ticketData.purchase_price
        ]);
        
        createdTickets.push(result.rows[0]);
      }
      
      await client.query('COMMIT');
      return createdTickets;
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async delete(ticketId: string): Promise<boolean> {
    const result = await this.pool.query(
      'DELETE FROM tickets WHERE ticket_id = $1',
      [ticketId]
    );
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async countByConcertAndZone(concertId: string, zoneName: string): Promise<number> {
    const result = await this.pool.query(
      'SELECT COUNT(*) as count FROM tickets WHERE concert_id = $1 AND zone_name = $2',
      [concertId, zoneName]
    );
    return parseInt(result.rows[0].count);
  }
}

export class PostgresRepositoryFactory implements IRepositoryFactory {
  private userRepository: PostgresUserRepository;
  private artistRepository: PostgresArtistRepository;
  private arenaRepository: PostgresArenaRepository;
  private concertRepository: PostgresConcertRepository;
  private ticketRepository: PostgresTicketRepository;
  private organizerRepository: PostgresOrganizerRepository;

  constructor() {
    this.userRepository = new PostgresUserRepository();
    this.artistRepository = new PostgresArtistRepository();
    this.arenaRepository = new PostgresArenaRepository();
    this.concertRepository = new PostgresConcertRepository();
    this.ticketRepository = new PostgresTicketRepository();
    this.organizerRepository = new PostgresOrganizerRepository();
  }

  getUserRepository(): IUserRepository {
    return this.userRepository;
  }

  getArtistRepository(): IArtistRepository {
    return this.artistRepository;
  }

  getArenaRepository(): IArenaRepository {
    return this.arenaRepository;
  }

  getConcertRepository(): IConcertRepository {
    return this.concertRepository;
  }

  getTicketRepository(): ITicketRepository {
    return this.ticketRepository;
  }

  getOrganizerRepository(): PostgresOrganizerRepository {
    return this.organizerRepository;
  }
} 