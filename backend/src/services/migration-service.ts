import { Pool } from 'pg';
import {
  getUsersCollection,
  getArtistsCollection,
  getArenasCollection,
  getConcertsCollection,
  getTicketsCollection,
  createIndexes,
  IUser,
  IArtist,
  IArena,
  IConcert,
  ITicket
} from '../models/mongodb-schemas';
import { mongoManager } from '../lib/mongodb-connection';
import { migrationStatus } from './migration-status';
import bcrypt from 'bcryptjs';

const pool = new Pool({
  user: process.env.POSTGRES_USER || 'postgres',
  host: process.env.POSTGRES_HOST || 'localhost',
  database: process.env.POSTGRES_DB || 'concert_booking',
  password: process.env.POSTGRES_PASSWORD || 'password',
  port: Number(process.env.POSTGRES_PORT) || 5432,
});

const ADMIN_EMAIL = 'admin@concert.com';
const ADMIN_PASSWORD = 'admin123';

export const migrateToMongoDB = async (): Promise<{
  users: number;
  artists: number;
  arenas: number;
  concerts: number;
  tickets: number;
}> => {
  try {
    console.log('Starting migration from PostgreSQL to MongoDB...');

    // Connect to MongoDB
    await mongoManager.connect();

    // Clear existing MongoDB data using native operations
    console.log('Clearing existing MongoDB data...');
    await Promise.all([
      (await getUsersCollection()).deleteMany({}),
      (await getArtistsCollection()).deleteMany({}),
      (await getArenasCollection()).deleteMany({}),
      (await getConcertsCollection()).deleteMany({}),
      (await getTicketsCollection()).deleteMany({})
    ]);

    // Create indexes
    await createIndexes();

    // Migrate data in order (respecting dependencies)
    const userCount = await migrateUsers();
    const artistCount = await migrateArtists();
    const arenaCount = await migrateArenas();
    const concertCount = await migrateConcerts();
    const ticketCount = await migrateTickets();

    // Recreate admin user in MongoDB
    console.log('Recreating admin user in MongoDB...');
    const usersCollection = await getUsersCollection();
    
    // Check if admin user already exists
    const existingAdmin = await usersCollection.findOne({ email: ADMIN_EMAIL });
    
    if (!existingAdmin) {
      // Hash the password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, salt);
      
      // Create new admin user
      const adminUser: IUser = {
        _id: 'admin-' + Date.now(),
        email: ADMIN_EMAIL,
        user_password: hashedPassword,
        first_name: 'Admin',
        last_name: 'User',
        registration_date: new Date(),
        user_type: 'admin'
      };
      
      await usersCollection.insertOne(adminUser);
      console.log('✅ Admin user recreated in MongoDB');
    } else {
      // If admin exists, ensure the user_type is 'admin'
      await usersCollection.updateOne(
        { email: ADMIN_EMAIL },
        { $set: { user_type: 'admin' } }
      );
      console.log('Admin user already exists in MongoDB, user_type ensured.');
    }

    console.log('Migration completed successfully!');
    
    // Mark migration as completed
    migrationStatus.markMigrated();
    console.log(`Database type switched to: ${migrationStatus.getDatabaseType()}`);
    
    return {
      users: userCount,
      artists: artistCount,
      arenas: arenaCount,
      concerts: concertCount,
      tickets: ticketCount
    };
  } catch (error) {
    console.error('Error during migration:', error);
    throw error;
  }
};

const migrateUsers = async (): Promise<number> => {
  try {
    // Check if required tables exist
    const tablesExist = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'users'
      ) as users_exist,
      EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'fans'
      ) as fans_exist,
      EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'organizers'
      ) as organizers_exist
    `);

    if (!tablesExist.rows[0].users_exist) {
      console.log('Users table does not exist, skipping user migration');
      return 0;
    }

    // Get all users
    const usersResult = await pool.query('SELECT * FROM users ORDER BY user_id');
    const users = usersResult.rows;

    const usersCollection = await getUsersCollection();
    const mongoUsers: IUser[] = [];

    for (const user of users) {
      // Explicitly check for the admin user
      if (user.email === ADMIN_EMAIL) {
        const adminMongoUser: IUser = {
          _id: user.user_id,
          email: user.email,
          user_password: user.user_password,
          first_name: user.first_name,
          last_name: user.last_name,
          registration_date: user.registration_date,
          last_login: user.last_login,
          user_type: 'admin' // Correctly assign admin type
        };
        mongoUsers.push(adminMongoUser);
        continue; // Skip to the next user
      }

      const mongoUser: IUser = {
        _id: user.user_id,
        email: user.email,
        user_password: user.user_password,
        first_name: user.first_name,
        last_name: user.last_name,
        registration_date: user.registration_date,
        last_login: user.last_login,
        user_type: 'fan' // default
      };

      // Check if user is a fan
      if (tablesExist.rows[0].fans_exist) {
        const fanResult = await pool.query(
          'SELECT * FROM fans WHERE user_id = $1', 
          [user.user_id]
        );
        
        if (fanResult.rows.length > 0) {
          const fan = fanResult.rows[0];
          mongoUser.user_type = 'fan';
          mongoUser.fan_details = {
            username: fan.username,
            preferred_genre: fan.preferred_genre,
            phone_number: fan.phone_number,
            referral_code: fan.referral_code,
            referred_by: fan.referred_by,
            referral_points: fan.referral_points,
            referral_code_used: fan.referral_code_used
          };
        }
      }

      // Check if user is an organizer
      if (tablesExist.rows[0].organizers_exist) { // Simpler check
        const organizerResult = await pool.query(
          'SELECT * FROM organizers WHERE user_id = $1', 
          [user.user_id]
        );
        
        if (organizerResult.rows.length > 0) {
          const organizer = organizerResult.rows[0];
          mongoUser.user_type = 'organizer';
          mongoUser.organizer_details = {
            organization_name: organizer.organization_name,
            contact_info: organizer.contact_info
          };
          // Remove fan_details when user is organizer
          delete mongoUser.fan_details;
        }
      }

      mongoUsers.push(mongoUser);
    }

    // Insert all users using native MongoDB insertMany
    if (mongoUsers.length > 0) {
      await usersCollection.insertMany(mongoUsers);
    }

    return mongoUsers.length;
  } catch (error) {
    console.error('Error migrating users:', error);
    throw error;
  }
};

const migrateArtists = async (): Promise<number> => {
  try {
    const tablesExist = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'artists'
      ) as artists_exist
    `);

    if (!tablesExist.rows[0].artists_exist) {
      console.log('Artists table does not exist, skipping artist migration');
      return 0;
    }

    const result = await pool.query('SELECT * FROM artists ORDER BY artist_id');
    const artists = result.rows;

    const artistsCollection = await getArtistsCollection();
    const mongoArtists: IArtist[] = artists.map(artist => ({
      _id: artist.artist_id,
      artist_name: artist.artist_name,
      genre: artist.genre
    }));

    // Insert all artists using native MongoDB insertMany
    if (mongoArtists.length > 0) {
      await artistsCollection.insertMany(mongoArtists);
    }

    return mongoArtists.length;
  } catch (error) {
    console.error('Error migrating artists:', error);
    throw error;
  }
};

const migrateArenas = async (): Promise<number> => {
  try {
    const tablesExist = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'arenas'
      ) as arenas_exist,
      EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'zones'  
      ) as zones_exist
    `);

    if (!tablesExist.rows[0].arenas_exist) {
      console.log('Arenas table does not exist, skipping arena migration');
      return 0;
    }

    const arenasResult = await pool.query('SELECT * FROM arenas ORDER BY arena_id');
    const arenas = arenasResult.rows;

    const arenasCollection = await getArenasCollection();
    const mongoArenas: IArena[] = [];

    for (const arena of arenas) {
      const mongoArena: IArena = {
        _id: arena.arena_id,
        arena_name: arena.arena_name,
        arena_location: arena.arena_location,
        total_capacity: arena.total_capacity,
        zones: []
      };

      // Get zones for this arena if zones table exists
      if (tablesExist.rows[0].zones_exist) {
        const zonesResult = await pool.query(
          'SELECT * FROM zones WHERE arena_id = $1 ORDER BY zone_name',
          [arena.arena_id]
        );

        mongoArena.zones = zonesResult.rows.map(zone => ({
          zone_name: zone.zone_name,
          capacity_per_zone: zone.capacity_per_zone
        }));
      }

      mongoArenas.push(mongoArena);
    }

    // Insert all arenas using native MongoDB insertMany
    if (mongoArenas.length > 0) {
      await arenasCollection.insertMany(mongoArenas);
    }

    return mongoArenas.length;
  } catch (error) {
    console.error('Error migrating arenas:', error);
    throw error;
  }
};

const migrateConcerts = async (): Promise<number> => {
  try {
    const tablesExist = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'concerts'
      ) as concerts_exist,
      EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'concert_features_artists'
      ) as concert_artists_exist,
      EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'concert_zone_pricing'
      ) as pricing_exist,
      EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'artists'
      ) as artists_exist
    `);

    if (!tablesExist.rows[0].concerts_exist) {
      console.log('Concerts table does not exist, skipping concert migration');
      return 0;
    }

    const concertsResult = await pool.query('SELECT * FROM concerts ORDER BY concert_id');
    const concerts = concertsResult.rows;

    const concertsCollection = await getConcertsCollection();
    const mongoConcerts: IConcert[] = [];

    for (const concert of concerts) {
      const mongoConcert: IConcert = {
        _id: concert.concert_id,
        concert_date: concert.concert_date,
        time: concert.time,
        description: concert.description,
        organizer_id: concert.organizer_id,
        arena_id: concert.arena_id,
        artists: [],
        zone_pricing: []
      };

      // Get artists for this concert
      if (tablesExist.rows[0].concert_artists_exist && tablesExist.rows[0].artists_exist) {
        const artistsResult = await pool.query(`
          SELECT a.artist_id, a.artist_name, a.genre
          FROM artists a
          JOIN concert_features_artists cfa ON a.artist_id = cfa.artist_id
          WHERE cfa.concert_id = $1
          ORDER BY a.artist_name
        `, [concert.concert_id]);

        mongoConcert.artists = artistsResult.rows.map(artist => ({
          artist_id: artist.artist_id,
          artist_name: artist.artist_name,
          genre: artist.genre
        }));
      }

      // Get zone pricing for this concert
      if (tablesExist.rows[0].pricing_exist) {
        const pricingResult = await pool.query(`
          SELECT zone_name, price
          FROM concert_zone_pricing
          WHERE concert_id = $1
          ORDER BY zone_name
        `, [concert.concert_id]);

        mongoConcert.zone_pricing = pricingResult.rows.map(pricing => ({
          zone_name: pricing.zone_name,
          price: pricing.price
        }));
      }

      mongoConcerts.push(mongoConcert);
    }

    // Insert all concerts using native MongoDB insertMany
    if (mongoConcerts.length > 0) {
      await concertsCollection.insertMany(mongoConcerts);
    }

    return mongoConcerts.length;
  } catch (error) {
    console.error('Error migrating concerts:', error);
    throw error;
  }
};

const migrateTickets = async (): Promise<number> => {
  try {
    const tablesExist = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'tickets'
      ) as tickets_exist,
      EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'fans'
      ) as fans_exist,
      EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'concerts'
      ) as concerts_exist,
      EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'concert_zone_pricing'
      ) as pricing_exist
    `);

    if (!tablesExist.rows[0].tickets_exist) {
      console.log('Tickets table does not exist, skipping ticket migration');
      return 0;
    }

    // Build query to get ticket data with related information
    let query = 'SELECT t.*';
    const joins = ['FROM tickets t'];

    if (tablesExist.rows[0].fans_exist) {
      query += ', f.username as fan_username';
      joins.push('LEFT JOIN fans f ON t.fan_id = f.user_id');
    }

    if (tablesExist.rows[0].concerts_exist) {
      query += ', c.concert_date';
      joins.push('LEFT JOIN concerts c ON t.concert_id = c.concert_id');
    }

    if (tablesExist.rows[0].pricing_exist) {
      query += ', czp.price';
      joins.push('LEFT JOIN concert_zone_pricing czp ON t.concert_id = czp.concert_id AND t.zone_name = czp.zone_name');
    }

    query += ' ' + joins.join(' ') + ' ORDER BY t.ticket_id';

    const result = await pool.query(query);
    const tickets = result.rows;

    const ticketsCollection = await getTicketsCollection();
    const mongoTickets: ITicket[] = tickets.map(ticket => ({
      _id: ticket.ticket_id,
      fan_id: ticket.fan_id,
      concert_id: ticket.concert_id,
      arena_id: ticket.arena_id,
      zone_name: ticket.zone_name,
      purchase_date: ticket.purchase_date,
      purchase_price: ticket.price,
      referral_code_used: ticket.referral_code_used === 'true',
      concert_date: ticket.concert_date || new Date(),
      fan_username: ticket.fan_username || 'Unknown',
      price: ticket.price || 0
    }));

    // Insert all tickets using native MongoDB insertMany
    if (mongoTickets.length > 0) {
      await ticketsCollection.insertMany(mongoTickets);
    }

    return mongoTickets.length;
  } catch (error) {
    console.error('Error migrating tickets:', error);
    throw error;
  }
}; 