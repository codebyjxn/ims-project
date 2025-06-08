import pool from '../lib/postgres';

interface User {
  username: string;
  email: string;
  password_hash: string;
  role: string;
  referral_points: number;
}

interface Venue {
  name: string;
  address: string;
  capacity: number;
}

interface Artist {
  name: string;
  bio: string;
}

interface Concert {
  title: string;
  description: string;
  venue_id: number;
  artist_id: number;
  date: Date;
  ticket_price: number;
  available_tickets: number;
}

// Simple data generators
const generateUsername = (index: number) => {
  const prefixes = ['music', 'rock', 'fan', 'user', 'concert', 'lover'];
  return prefixes[index % prefixes.length] + '_user_' + index;
};

const generateEmail = (username: string) => {
  const domains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'test.com'];
  return `${username}@${domains[Math.floor(Math.random() * domains.length)]}`;
};

const generateArtistName = () => {
  const first = ['The', 'Red', 'Blue', 'Electric', 'Cosmic', 'Wild', 'Neon', 'Silent'];
  const second = ['Dragons', 'Eagles', 'Wolves', 'Storms', 'Flames', 'Stars', 'Beats', 'Echoes'];
  return first[Math.floor(Math.random() * first.length)] + ' ' + 
         second[Math.floor(Math.random() * second.length)];
};

const generateVenueName = () => {
  const prefixes = ['Grand', 'Royal', 'Central', 'Metro', 'City', 'Arena'];
  const suffixes = ['Arena', 'Hall', 'Center', 'Pavilion', 'Stadium', 'Theater'];
  return prefixes[Math.floor(Math.random() * prefixes.length)] + ' ' + 
         suffixes[Math.floor(Math.random() * suffixes.length)];
};

const generateAddress = () => {
  const streets = ['Main St', 'Broadway', 'Oak Ave', 'Park Blvd', 'First St', 'Concert Way'];
  const cities = ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia'];
  const number = Math.floor(Math.random() * 9999) + 1;
  return `${number} ${streets[Math.floor(Math.random() * streets.length)]}, ${cities[Math.floor(Math.random() * cities.length)]}`;
};

const generateConcertTitle = (artistName: string) => {
  const events = ['World Tour', 'Live Concert', 'Special Performance', 'Greatest Hits', 'Farewell Tour', 'Acoustic Night'];
  return `${artistName} - ${events[Math.floor(Math.random() * events.length)]}`;
};

const generateFutureDate = () => {
  const now = new Date();
  const futureDate = new Date(now.getTime() + Math.random() * (365 * 24 * 60 * 60 * 1000)); // Random date within a year
  return futureDate;
};

export const seedDatabase = async (): Promise<void> => {
  try {
    console.log('Starting database seeding...');

    // Clear existing data
    await clearDatabase();

    // Seed data
    const users = await seedUsers();
    console.log(`Seeded ${users.length} users`);

    const venues = await seedVenues();
    console.log(`Seeded ${venues.length} venues`);

    const artists = await seedArtists();
    console.log(`Seeded ${artists.length} artists`);

    const concerts = await seedConcerts(venues, artists);
    console.log(`Seeded ${concerts.length} concerts`);

    const tickets = await seedTickets(users, concerts);
    console.log(`Seeded ${tickets.length} tickets`);

    console.log('Database seeding completed successfully!');

  } catch (error) {
    console.error('Error seeding database:', error);
    throw error;
  }
};

const clearDatabase = async (): Promise<void> => {
  console.log('Clearing existing data...');
  
  const tables = ['tickets', 'concerts', 'artists', 'venues', 'users'];
  
  for (const table of tables) {
    await pool.query(`TRUNCATE TABLE ${table} RESTART IDENTITY CASCADE`);
  }
  
  console.log('Database cleared.');
};

const seedUsers = async (): Promise<User[]> => {
  const users: User[] = [];
  
  // Create admin user first
  await pool.query(
    'INSERT INTO users (username, email, password_hash, role, referral_points) VALUES ($1, $2, $3, $4, $5)',
    ['admin', 'admin@concert.com', 'hashed_password', 'admin', 0]
  );
  
  users.push({
    username: 'admin',
    email: 'admin@concert.com',
    password_hash: 'hashed_password',
    role: 'admin',
    referral_points: 0
  });

  // Create regular users
  for (let i = 0; i < 50; i++) {
    const username = generateUsername(i);
    const email = generateEmail(username);
    
    try {
      await pool.query(
        'INSERT INTO users (username, email, password_hash, role, referral_points) VALUES ($1, $2, $3, $4, $5)',
        [username, email, 'hashed_password', 'user', Math.floor(Math.random() * 100)]
      );
      
      users.push({
        username,
        email,
        password_hash: 'hashed_password',
        role: 'user',
        referral_points: Math.floor(Math.random() * 100)
      });
    } catch (error) {
      console.error(`Error inserting user ${username}:`, error);
      throw error;
    }
  }

  return users;
};

const seedVenues = async (): Promise<Venue[]> => {
  const venues: Venue[] = [];

  for (let i = 0; i < 10; i++) {
    venues.push({
      name: generateVenueName(),
      address: generateAddress(),
      capacity: Math.floor(Math.random() * 50000) + 1000
    });
  }

  // Insert venues
  for (const venue of venues) {
    await pool.query(
      'INSERT INTO venues (name, address, capacity) VALUES ($1, $2, $3)',
      [venue.name, venue.address, venue.capacity]
    );
  }

  return venues;
};

const seedArtists = async (): Promise<Artist[]> => {
  const artists: Artist[] = [];

  for (let i = 0; i < 20; i++) {
    const artistName = generateArtistName();
    artists.push({
      name: artistName,
      bio: `${artistName} is a talented musician known for their unique style and captivating performances.`
    });
  }

  // Insert artists
  for (const artist of artists) {
    await pool.query(
      'INSERT INTO artists (name, bio) VALUES ($1, $2)',
      [artist.name, artist.bio]
    );
  }

  return artists;
};

const seedConcerts = async (venues: Venue[], artists: Artist[]): Promise<Concert[]> => {
  const concerts: Concert[] = [];

  // Get actual venue and artist IDs from database
  const venueResult = await pool.query('SELECT id FROM venues ORDER BY id');
  const artistResult = await pool.query('SELECT id, name FROM artists ORDER BY id');
  
  const venueIds = venueResult.rows.map(row => row.id);
  const artistData = artistResult.rows;

  for (let i = 0; i < 30; i++) {
    const venueId = venueIds[Math.floor(Math.random() * venueIds.length)];
    const artist = artistData[Math.floor(Math.random() * artistData.length)];
    
    // Get venue capacity for available tickets
    const venueCapacityResult = await pool.query('SELECT capacity FROM venues WHERE id = $1', [venueId]);
    const venueCapacity = venueCapacityResult.rows[0].capacity;
    
    concerts.push({
      title: generateConcertTitle(artist.name),
      description: 'An amazing live performance you won\'t want to miss!',
      venue_id: venueId,
      artist_id: artist.id,
      date: generateFutureDate(),
      ticket_price: Math.floor(Math.random() * 200) + 50,
      available_tickets: Math.floor(venueCapacity * 0.8) // 80% of venue capacity
    });
  }

  // Insert concerts
  for (const concert of concerts) {
    await pool.query(
      'INSERT INTO concerts (title, description, venue_id, artist_id, date, ticket_price, available_tickets) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [concert.title, concert.description, concert.venue_id, concert.artist_id, concert.date, concert.ticket_price, concert.available_tickets]
    );
  }

  return concerts;
};

const seedTickets = async (users: User[], concerts: Concert[]): Promise<any[]> => {
  const tickets: any[] = [];

  // Get actual user and concert IDs from database
  const userResult = await pool.query('SELECT id FROM users WHERE role = $1', ['user']);
  const concertResult = await pool.query('SELECT id, ticket_price FROM concerts ORDER BY id');
  
  const userIds = userResult.rows.map(row => row.id);
  const concertData = concertResult.rows;

  // Create random ticket purchases
  for (let i = 0; i < 100; i++) {
    const userId = userIds[Math.floor(Math.random() * userIds.length)];
    const concert = concertData[Math.floor(Math.random() * concertData.length)];
    const referralUsed = Math.random() < 0.3; // 30% chance of using referral
    
    let pricePaid = concert.ticket_price;
    if (referralUsed) {
      pricePaid = concert.ticket_price * 0.9; // 10% discount
    }

    tickets.push({
      concert_id: concert.id,
      user_id: userId,
      price_paid: pricePaid,
      referral_used: referralUsed,
      status: 'active'
    });
  }

  // Insert tickets
  for (const ticket of tickets) {
    await pool.query(
      'INSERT INTO tickets (concert_id, user_id, price_paid, referral_used, status) VALUES ($1, $2, $3, $4, $5)',
      [ticket.concert_id, ticket.user_id, ticket.price_paid, ticket.referral_used, ticket.status]
    );
  }

  return tickets;
};

// Run if called directly
if (require.main === module) {
  seedDatabase()
    .then(() => {
      console.log('Seeding process completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Seeding process failed:', error);
      process.exit(1);
    });
} 