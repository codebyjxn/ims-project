import pool from '../lib/postgres';
import mongoose from 'mongoose';
import {
  UserModel, ConcertModel, TicketModel, ArtistModel, ArenaModel
} from '../models/mongodb-schemas';

export const migrateToMongoDB = async () => {
  try {
    console.log('Starting migration from PostgreSQL to MongoDB...');

    // Migrate users
    const users = await migrateUsers();
    console.log(`Migrated ${users} users`);

    // Migrate artists
    const artists = await migrateArtists();
    console.log(`Migrated ${artists} artists`);

    // Migrate venues (as arenas in MongoDB)
    const venues = await migrateVenues();
    console.log(`Migrated ${venues} venues/arenas`);

    // Migrate concerts
    const concerts = await migrateConcerts();
    console.log(`Migrated ${concerts} concerts`);

    // Migrate tickets
    const tickets = await migrateTickets();
    console.log(`Migrated ${tickets} tickets`);

    console.log('Migration completed successfully!');
    
    return {
      migrated: {
        users,
        artists,
        venues,
        concerts,
        tickets
      }
    };

  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
};

const migrateUsers = async (): Promise<number> => {
  try {
    const result = await pool.query('SELECT * FROM users ORDER BY id');
    const users = result.rows;

    for (const user of users) {
      // Properly split username for first_name and last_name
      const nameParts = user.username.split('_');
      const firstName = nameParts[0] || user.username;
      const lastName = nameParts.length > 1 ? nameParts.slice(1).join('_') : 'User';

      const mongoUserData = {
        _id: new mongoose.Types.ObjectId().toString(),
        email: user.email,
        user_password: user.password_hash, // Map password_hash to user_password
        first_name: firstName,
        last_name: lastName,
        user_type: user.role === 'admin' ? 'organizer' : 'fan',
        fan_details: user.role === 'user' ? {
          username: user.username,
          preferred_genre: 'Rock', // Default genre
          phone_number: '+1234567890', // Default phone
          referral_points: user.referral_points || 0,
          referrals: []
        } : undefined,
        organizer_details: user.role === 'admin' ? {
          organization_name: `${user.username} Organization`,
          contact_info: 'admin@concert.com'
        } : undefined
      };

      const mongoUser = new UserModel(mongoUserData);
      await mongoUser.save();
    }

    return users.length;
  } catch (error) {
    console.error('Error migrating users:', error);
    throw error;
  }
};

const migrateArtists = async (): Promise<number> => {
  try {
    const result = await pool.query('SELECT * FROM artists ORDER BY id');
    const artists = result.rows;

    for (const artist of artists) {
      const mongoArtist = new ArtistModel({
        _id: new mongoose.Types.ObjectId().toString(),
        artist_name: artist.name,
        genre: 'Rock', // Default genre since it's not in PostgreSQL schema
        total_concerts: 0,
        total_tickets_sold: 0,
        average_ticket_price: 0,
        recent_concerts: []
      });

      await mongoArtist.save();
    }

    return artists.length;
  } catch (error) {
    console.error('Error migrating artists:', error);
    throw error;
  }
};

const migrateVenues = async (): Promise<number> => {
  try {
    const result = await pool.query('SELECT * FROM venues ORDER BY id');
    const venues = result.rows;

    for (const venue of venues) {
      const mongoArena = new ArenaModel({
        _id: new mongoose.Types.ObjectId().toString(),
        arena_name: venue.name,
        arena_location: venue.address,
        total_capacity: venue.capacity,
        zones: [
          {
            zone_name: 'General Admission',
            capacity_per_zone: Math.floor(venue.capacity * 0.6)
          },
          {
            zone_name: 'VIP',
            capacity_per_zone: Math.floor(venue.capacity * 0.3)
          },
          {
            zone_name: 'Premium',
            capacity_per_zone: Math.floor(venue.capacity * 0.1)
          }
        ],
        total_concerts: 0,
        total_tickets_sold: 0,
        utilization_rate: 0
      });

      await mongoArena.save();
    }

    return venues.length;
  } catch (error) {
    console.error('Error migrating venues:', error);
    throw error;
  }
};

const migrateConcerts = async (): Promise<number> => {
  try {
    const result = await pool.query(`
      SELECT 
        c.*,
        v.name as venue_name,
        v.address as venue_address,
        v.capacity as venue_capacity,
        a.name as artist_name
      FROM concerts c
      JOIN venues v ON c.venue_id = v.id
      JOIN artists a ON c.artist_id = a.id
      ORDER BY c.id
    `);
    const concerts = result.rows;

    for (const concert of concerts) {
      const mongoConcert = new ConcertModel({
        _id: new mongoose.Types.ObjectId(),
        concert_id: concert.id.toString(),
        concert_date: concert.date,
        concert_time: concert.date.toISOString().split('T')[1].substring(0, 5), // Extract time
        description: concert.description || `Concert by ${concert.artist_name}`,
        ticket_price: concert.ticket_price,
        tickets_sold: 0, // Default
        revenue: 0, // Default
        organizer: {
          organizer_id: '1', // Default organizer
          organization_name: 'Default Organization',
          contact_email: 'admin@concert.com'
        },
        arena: {
          arena_id: concert.venue_id.toString(),
          arena_name: concert.venue_name,
          arena_location: concert.venue_address,
          capacity: concert.venue_capacity,
          zones: [
            {
              zone_name: 'General Admission',
              capacity_per_zone: Math.floor(concert.venue_capacity * 0.6),
              available_tickets: concert.available_tickets || Math.floor(concert.venue_capacity * 0.6)
            },
            {
              zone_name: 'VIP',
              capacity_per_zone: Math.floor(concert.venue_capacity * 0.3),
              available_tickets: Math.floor(concert.venue_capacity * 0.3)
            },
            {
              zone_name: 'Premium',
              capacity_per_zone: Math.floor(concert.venue_capacity * 0.1),
              available_tickets: Math.floor(concert.venue_capacity * 0.1)
            }
          ]
        },
        artists: [{
          artist_id: concert.artist_id.toString(),
          artist_name: concert.artist_name,
          genre: 'Rock' // Default
        }]
      });

      await mongoConcert.save();
    }

    return concerts.length;
  } catch (error) {
    console.error('Error migrating concerts:', error);
    throw error;
  }
};

const migrateTickets = async (): Promise<number> => {
  try {
    const result = await pool.query(`
      SELECT 
        t.*,
        c.title as concert_title,
        c.date as concert_date,
        u.username,
        u.email,
        v.name as venue_name,
        v.address as venue_address,
        a.name as artist_name
      FROM tickets t
      JOIN concerts c ON t.concert_id = c.id
      JOIN users u ON t.user_id = u.id
      JOIN venues v ON c.venue_id = v.id
      JOIN artists a ON c.artist_id = a.id
      ORDER BY t.id
    `);
    const tickets = result.rows;

    for (const ticket of tickets) {
      const mongoTicket = new TicketModel({
        _id: new mongoose.Types.ObjectId(),
        ticket_id: ticket.id.toString(),
        purchase_date: ticket.purchase_date || ticket.created_at,
        purchase_price: ticket.price_paid,
        fan: {
          fan_id: ticket.user_id.toString(),
          username: ticket.username,
          email: ticket.email,
          preferred_genre: 'Rock' // Default
        },
        concert: {
          concert_id: ticket.concert_id.toString(),
          concert_date: ticket.concert_date,
          concert_time: ticket.concert_date.toISOString().split('T')[1].substring(0, 5),
          description: ticket.concert_title || `Concert by ${ticket.artist_name}`,
          organizer_name: 'Default Organization',
          arena_name: ticket.venue_name,
          arena_location: ticket.venue_address,
          artists: [{
            artist_name: ticket.artist_name,
            genre: 'Rock'
          }]
        },
        zone: {
          zone_name: 'General Admission', // Default zone
          capacity_per_zone: 1000 // Default capacity
        }
      });

      await mongoTicket.save();
    }

    return tickets.length;
  } catch (error) {
    console.error('Error migrating tickets:', error);
    throw error;
  }
}; 