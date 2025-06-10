import { Pool } from 'pg';
import { Collection, Db } from 'mongodb';
import { getPool } from './postgres';
import { 
  getDatabase, 
  getUsersCollection,
  getArtistsCollection,
  getArenasCollection,
  getConcertsCollection,
  getTicketsCollection,
  IUser,
  IArtist,
  IArena,
  IConcert,
  ITicket
} from '../models/mongodb-schemas';
import { migrationStatus } from '../services/migration-status';

export interface DatabaseResult<T = any> {
  rows?: T[];
  data?: T[];
  count?: number;
}

export interface DatabaseAdapter {
  // User operations
  getUsers(): Promise<DatabaseResult>;
  getUserById(id: string): Promise<DatabaseResult>;
  createUser(user: any): Promise<DatabaseResult>;
  updateUser(id: string, updates: any): Promise<DatabaseResult>;
  deleteUser(id: string): Promise<DatabaseResult>;

  // Artist operations
  getArtists(): Promise<DatabaseResult>;
  getArtistById(id: string): Promise<DatabaseResult>;
  createArtist(artist: any): Promise<DatabaseResult>;

  // Arena operations
  getArenas(): Promise<DatabaseResult>;
  getArenaById(id: string): Promise<DatabaseResult>;
  createArena(arena: any): Promise<DatabaseResult>;

  // Concert operations
  getConcerts(): Promise<DatabaseResult>;
  getConcertById(id: string): Promise<DatabaseResult>;
  createConcert(concert: any): Promise<DatabaseResult>;

  // Ticket operations
  getTickets(): Promise<DatabaseResult>;
  getTicketById(id: string): Promise<DatabaseResult>;
  createTicket(ticket: any): Promise<DatabaseResult>;
  getTicketsByUserId(userId: string): Promise<DatabaseResult>;

  // Statistics
  getStats(): Promise<any>;

  // Referral system operations
  getUserByReferralCode(referralCode: string): Promise<DatabaseResult>;
  updateUserReferralPoints(userId: string, pointsToAdd: number): Promise<DatabaseResult>;
  markReferralCodeUsed(fanId: string): Promise<DatabaseResult>;
  updateFanReferrer(fanId: string, referrerId: string): Promise<DatabaseResult>;

  // Advanced query operations
  query?(sql: string, params?: any[]): Promise<DatabaseResult>;
  getTicketsByConcertAndZone?(concertId: string, zoneName: string): Promise<DatabaseResult>;
  getConcertTicketSummary?(concertId: string): Promise<DatabaseResult>;
  getUsersReferredBy?(fanId: string): Promise<DatabaseResult>;
  getTicketsFromReferrals?(fanId: string): Promise<DatabaseResult>;
}

class PostgreSQLAdapter implements DatabaseAdapter {
  private pool: Pool;

  constructor() {
    this.pool = getPool();
  }

  async getUsers(): Promise<DatabaseResult> {
    const result = await this.pool.query(`
      SELECT u.*, 
             f.username, f.preferred_genre, f.phone_number, f.referral_code, f.referral_points,
             o.organization_name, o.contact_info
      FROM users u
      LEFT JOIN fans f ON u.user_id = f.user_id
      LEFT JOIN organizers o ON u.user_id = o.user_id
      ORDER BY u.registration_date DESC
    `);
    return { rows: result.rows };
  }

  async getUserById(id: string): Promise<DatabaseResult> {
    const result = await this.pool.query(`
      SELECT u.*, 
             f.username, f.preferred_genre, f.phone_number, f.referral_code, f.referral_points,
             o.organization_name, o.contact_info
      FROM users u
      LEFT JOIN fans f ON u.user_id = f.user_id
      LEFT JOIN organizers o ON u.user_id = o.user_id
      WHERE u.user_id = $1
    `, [id]);
    return { rows: result.rows };
  }

  async createUser(user: any): Promise<DatabaseResult> {
    const result = await this.pool.query(
      'INSERT INTO users (user_id, email, user_password, first_name, last_name, registration_date) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [user.user_id, user.email, user.user_password, user.first_name, user.last_name, user.registration_date]
    );
    return { rows: result.rows };
  }

  async updateUser(id: string, updates: any): Promise<DatabaseResult> {
    const setClause = Object.keys(updates).map((key, index) => `${key} = $${index + 2}`).join(', ');
    const values = [id, ...Object.values(updates)];
    
    const result = await this.pool.query(
      `UPDATE users SET ${setClause} WHERE user_id = $1 RETURNING *`,
      values
    );
    return { rows: result.rows };
  }

  async deleteUser(id: string): Promise<DatabaseResult> {
    const result = await this.pool.query('DELETE FROM users WHERE user_id = $1 RETURNING *', [id]);
    return { rows: result.rows };
  }

  async getArtists(): Promise<DatabaseResult> {
    const result = await this.pool.query('SELECT * FROM artists ORDER BY artist_name');
    return { rows: result.rows };
  }

  async getArtistById(id: string): Promise<DatabaseResult> {
    const result = await this.pool.query('SELECT * FROM artists WHERE artist_id = $1', [id]);
    return { rows: result.rows };
  }

  async createArtist(artist: any): Promise<DatabaseResult> {
    const result = await this.pool.query(
      'INSERT INTO artists (artist_id, artist_name, genre) VALUES ($1, $2, $3) RETURNING *',
      [artist.artist_id, artist.artist_name, artist.genre]
    );
    return { rows: result.rows };
  }

  async getArenas(): Promise<DatabaseResult> {
    const result = await this.pool.query(`
      SELECT a.*, 
             json_agg(json_build_object('zone_name', z.zone_name, 'capacity_per_zone', z.capacity_per_zone)) as zones
      FROM arenas a
      LEFT JOIN zones z ON a.arena_id = z.arena_id
      GROUP BY a.arena_id
      ORDER BY a.arena_name
    `);
    return { rows: result.rows };
  }

  async getArenaById(id: string): Promise<DatabaseResult> {
    const result = await this.pool.query(`
      SELECT a.*, 
             json_agg(json_build_object('zone_name', z.zone_name, 'capacity_per_zone', z.capacity_per_zone)) as zones
      FROM arenas a
      LEFT JOIN zones z ON a.arena_id = z.arena_id
      WHERE a.arena_id = $1
      GROUP BY a.arena_id
    `, [id]);
    return { rows: result.rows };
  }

  async createArena(arena: any): Promise<DatabaseResult> {
    const result = await this.pool.query(
      'INSERT INTO arenas (arena_id, arena_name, arena_location, total_capacity) VALUES ($1, $2, $3, $4) RETURNING *',
      [arena.arena_id, arena.arena_name, arena.arena_location, arena.total_capacity]
    );
    return { rows: result.rows };
  }

  async getConcerts(): Promise<DatabaseResult> {
    const result = await this.pool.query(`
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
  }

  async getConcertById(id: string): Promise<DatabaseResult> {
    const result = await this.pool.query(`
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
  }

  async createConcert(concert: any): Promise<DatabaseResult> {
    const result = await this.pool.query(
      'INSERT INTO concerts (concert_id, concert_date, time, description, organizer_id, arena_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [concert.concert_id, concert.concert_date, concert.time, concert.description, concert.organizer_id, concert.arena_id]
    );
    return { rows: result.rows };
  }

  async getTickets(): Promise<DatabaseResult> {
    const result = await this.pool.query(`
      SELECT t.*, f.username as fan_username, c.concert_date, czp.price
      FROM tickets t
      LEFT JOIN fans f ON t.fan_id = f.user_id
      LEFT JOIN concerts c ON t.concert_id = c.concert_id
      LEFT JOIN concert_zone_pricing czp ON t.concert_id = czp.concert_id AND t.zone_name = czp.zone_name
      ORDER BY t.purchase_date DESC
    `);
    return { rows: result.rows };
  }

  async getTicketById(id: string): Promise<DatabaseResult> {
    const result = await this.pool.query(`
      SELECT t.*, f.username as fan_username, c.concert_date, czp.price
      FROM tickets t
      LEFT JOIN fans f ON t.fan_id = f.user_id
      LEFT JOIN concerts c ON t.concert_id = c.concert_id
      LEFT JOIN concert_zone_pricing czp ON t.concert_id = czp.concert_id AND t.zone_name = czp.zone_name
      WHERE t.ticket_id = $1
    `, [id]);
    return { rows: result.rows };
  }

  async createTicket(ticket: any): Promise<DatabaseResult> {
    const result = await this.pool.query(
      'INSERT INTO tickets (ticket_id, fan_id, concert_id, arena_id, zone_name, purchase_date, referral_code_used) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [ticket.ticket_id, ticket.fan_id, ticket.concert_id, ticket.arena_id, ticket.zone_name, ticket.purchase_date, ticket.referral_code_used]
    );
    return { rows: result.rows };
  }

  async getTicketsByUserId(userId: string): Promise<DatabaseResult> {
    const result = await this.pool.query(`
      SELECT t.*, f.username as fan_username, c.concert_date, czp.price
      FROM tickets t
      LEFT JOIN fans f ON t.fan_id = f.user_id
      LEFT JOIN concerts c ON t.concert_id = c.concert_id
      LEFT JOIN concert_zone_pricing czp ON t.concert_id = czp.concert_id AND t.zone_name = czp.zone_name
      WHERE t.fan_id = $1
      ORDER BY t.purchase_date DESC
    `, [userId]);
    return { rows: result.rows };
  }

  async getStats(): Promise<any> {
    const [usersResult, artistsResult, arenasResult, concertsResult, ticketsResult] = await Promise.all([
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
  }

  // Referral system methods
  async getUserByReferralCode(referralCode: string): Promise<DatabaseResult> {
    const result = await this.pool.query(`
      SELECT u.*, f.username, f.preferred_genre, f.phone_number, f.referral_code, f.referral_points, f.referral_code_used, f.referred_by
      FROM users u
      JOIN fans f ON u.user_id = f.user_id
      WHERE f.referral_code = $1
    `, [referralCode]);
    return { rows: result.rows };
  }

  async updateUserReferralPoints(userId: string, pointsToAdd: number): Promise<DatabaseResult> {
    const result = await this.pool.query(`
      UPDATE fans 
      SET referral_points = referral_points + $2 
      WHERE user_id = $1 
      RETURNING *
    `, [userId, pointsToAdd]);
    return { rows: result.rows };
  }

  async markReferralCodeUsed(fanId: string): Promise<DatabaseResult> {
    const result = await this.pool.query(`
      UPDATE fans 
      SET referral_code_used = true 
      WHERE user_id = $1 
      RETURNING *
    `, [fanId]);
    return { rows: result.rows };
  }

  async updateFanReferrer(fanId: string, referrerId: string): Promise<DatabaseResult> {
    const result = await this.pool.query(`
      UPDATE fans 
      SET referred_by = $2 
      WHERE user_id = $1 
      RETURNING *
    `, [fanId, referrerId]);
    return { rows: result.rows };
  }

  // Advanced query methods
  async query(sql: string, params: any[] = []): Promise<DatabaseResult> {
    const result = await this.pool.query(sql, params);
    return { rows: result.rows };
  }

  async getTicketsByConcertAndZone(concertId: string, zoneName: string): Promise<DatabaseResult> {
    const result = await this.pool.query(`
      SELECT * FROM tickets 
      WHERE concert_id = $1 AND zone_name = $2
    `, [concertId, zoneName]);
    return { rows: result.rows };
  }

  async getConcertTicketSummary(concertId: string): Promise<DatabaseResult> {
    const result = await this.pool.query(`
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
  }

  async getUsersReferredBy(fanId: string): Promise<DatabaseResult> {
    const result = await this.pool.query(`
      SELECT u.*, f.username, f.referral_code_used
      FROM users u
      JOIN fans f ON u.user_id = f.user_id
      WHERE f.referred_by = $1
      ORDER BY u.registration_date DESC
    `, [fanId]);
    return { rows: result.rows };
  }

  async getTicketsFromReferrals(fanId: string): Promise<DatabaseResult> {
    const result = await this.pool.query(`
      SELECT t.*
      FROM tickets t
      JOIN fans f ON t.fan_id = f.user_id
      WHERE f.referred_by = $1 AND t.referral_code_used = true
    `, [fanId]);
    return { rows: result.rows };
  }
}

class MongoDBAdapter implements DatabaseAdapter {
  private db: Db;

  constructor() {
    this.db = getDatabase();
  }

  async getUsers(): Promise<DatabaseResult> {
    const data = await getUsersCollection().find({}).sort({ registration_date: -1 }).toArray();
    return { data };
  }

  async getUserById(id: string): Promise<DatabaseResult> {
    const data = await getUsersCollection().find({ _id: id }).toArray();
    return { data };
  }

  async createUser(user: any): Promise<DatabaseResult> {
    const result = await getUsersCollection().insertOne(user);
    const data = await getUsersCollection().find({ _id: result.insertedId }).toArray();
    return { data };
  }

  async updateUser(id: string, updates: any): Promise<DatabaseResult> {
    await getUsersCollection().updateOne({ _id: id }, { $set: updates });
    const data = await getUsersCollection().find({ _id: id }).toArray();
    return { data };
  }

  async deleteUser(id: string): Promise<DatabaseResult> {
    const data = await getUsersCollection().find({ _id: id }).toArray();
    await getUsersCollection().deleteOne({ _id: id });
    return { data };
  }

  async getArtists(): Promise<DatabaseResult> {
    const data = await getArtistsCollection().find({}).sort({ artist_name: 1 }).toArray();
    return { data };
  }

  async getArtistById(id: string): Promise<DatabaseResult> {
    const data = await getArtistsCollection().find({ _id: id }).toArray();
    return { data };
  }

  async createArtist(artist: any): Promise<DatabaseResult> {
    const result = await getArtistsCollection().insertOne(artist);
    const data = await getArtistsCollection().find({ _id: result.insertedId }).toArray();
    return { data };
  }

  async getArenas(): Promise<DatabaseResult> {
    const data = await getArenasCollection().find({}).sort({ arena_name: 1 }).toArray();
    return { data };
  }

  async getArenaById(id: string): Promise<DatabaseResult> {
    const data = await getArenasCollection().find({ _id: id }).toArray();
    return { data };
  }

  async createArena(arena: any): Promise<DatabaseResult> {
    const result = await getArenasCollection().insertOne(arena);
    const data = await getArenasCollection().find({ _id: result.insertedId }).toArray();
    return { data };
  }

  async getConcerts(): Promise<DatabaseResult> {
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
    
    const data = await getConcertsCollection().aggregate(pipeline).toArray();
    return { data };
  }

  async getConcertById(id: string): Promise<DatabaseResult> {
    const data = await getConcertsCollection().find({ _id: id }).toArray();
    return { data };
  }

  async createConcert(concert: any): Promise<DatabaseResult> {
    const result = await getConcertsCollection().insertOne(concert);
    const data = await getConcertsCollection().find({ _id: result.insertedId }).toArray();
    return { data };
  }

  async getTickets(): Promise<DatabaseResult> {
    const data = await getTicketsCollection().find({}).sort({ purchase_date: -1 }).toArray();
    return { data };
  }

  async getTicketById(id: string): Promise<DatabaseResult> {
    const data = await getTicketsCollection().find({ _id: id }).toArray();
    return { data };
  }

  async createTicket(ticket: any): Promise<DatabaseResult> {
    const result = await getTicketsCollection().insertOne(ticket);
    const data = await getTicketsCollection().find({ _id: result.insertedId }).toArray();
    return { data };
  }

  async getTicketsByUserId(userId: string): Promise<DatabaseResult> {
    const data = await getTicketsCollection().find({ fan_id: userId }).sort({ purchase_date: -1 }).toArray();
    return { data };
  }

  async getStats(): Promise<any> {
    const [users, artists, arenas, concerts, tickets] = await Promise.all([
      getUsersCollection().countDocuments(),
      getArtistsCollection().countDocuments(),
      getArenasCollection().countDocuments(),
      getConcertsCollection().countDocuments(),
      getTicketsCollection().countDocuments()
    ]);

    return { users, artists, arenas, concerts, tickets };
  }

  // Referral system methods
  async getUserByReferralCode(referralCode: string): Promise<DatabaseResult> {
    const data = await getUsersCollection().find({ 
      'fan_details.referral_code': referralCode 
    }).toArray();
    return { data };
  }

  async updateUserReferralPoints(userId: string, pointsToAdd: number): Promise<DatabaseResult> {
    await getUsersCollection().updateOne(
      { _id: userId },
      { $inc: { 'fan_details.referral_points': pointsToAdd } }
    );
    const data = await getUsersCollection().find({ _id: userId }).toArray();
    return { data };
  }

  async markReferralCodeUsed(fanId: string): Promise<DatabaseResult> {
    await getUsersCollection().updateOne(
      { _id: fanId },
      { $set: { 'fan_details.referral_code_used': true } }
    );
    const data = await getUsersCollection().find({ _id: fanId }).toArray();
    return { data };
  }

  async updateFanReferrer(fanId: string, referrerId: string): Promise<DatabaseResult> {
    await getUsersCollection().updateOne(
      { _id: fanId },
      { $set: { 'fan_details.referred_by': referrerId } }
    );
    const data = await getUsersCollection().find({ _id: fanId }).toArray();
    return { data };
  }

  // Advanced query methods
  async query(sql: string, params: any[] = []): Promise<DatabaseResult> {
    // MongoDB doesn't use SQL, so this is a placeholder
    throw new Error('SQL queries not supported in MongoDB adapter');
  }

  async getTicketsByConcertAndZone(concertId: string, zoneName: string): Promise<DatabaseResult> {
    const data = await getTicketsCollection().find({ 
      concert_id: concertId, 
      zone_name: zoneName 
    }).toArray();
    return { data };
  }

  async getConcertTicketSummary(concertId: string): Promise<DatabaseResult> {
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
    
    const data = await getTicketsCollection().aggregate(pipeline).toArray();
    return { data };
  }

  async getUsersReferredBy(fanId: string): Promise<DatabaseResult> {
    const data = await getUsersCollection().find({ 
      'fan_details.referred_by': fanId 
    }).sort({ registration_date: -1 }).toArray();
    return { data };
  }

  async getTicketsFromReferrals(fanId: string): Promise<DatabaseResult> {
    // First get all users referred by this fan
    const referredUsers = await getUsersCollection().find({ 
      'fan_details.referred_by': fanId 
    }).toArray();
    
    const referredUserIds = referredUsers.map((user: any) => user._id);
    
    // Then get tickets purchased by those users with referral code used
    const data = await getTicketsCollection().find({ 
      fan_id: { $in: referredUserIds },
      referral_code_used: true
    }).toArray();
    
    return { data };
  }
}

export class DatabaseFactory {
  private static postgresAdapter: PostgreSQLAdapter | null = null;
  private static mongoAdapter: MongoDBAdapter | null = null;

  /**
   * Get the appropriate database adapter based on migration status
   */
  public static getAdapter(): DatabaseAdapter {
    const dbType = migrationStatus.getDatabaseType();
    
    if (dbType === 'mongodb') {
      if (!this.mongoAdapter) {
        this.mongoAdapter = new MongoDBAdapter();
      }
      return this.mongoAdapter;
    } else {
      if (!this.postgresAdapter) {
        this.postgresAdapter = new PostgreSQLAdapter();
      }
      return this.postgresAdapter;
    }
  }

  /**
   * Get current database type
   */
  public static getCurrentDatabaseType(): 'postgresql' | 'mongodb' {
    return migrationStatus.getDatabaseType();
  }

  /**
   * Check if system is migrated
   */
  public static isMigrated(): boolean {
    return migrationStatus.isMigrated();
  }
} 