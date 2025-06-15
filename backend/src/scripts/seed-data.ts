import { getPool } from '../lib/postgres';
import { faker } from '@faker-js/faker';
import bcrypt from 'bcryptjs';

interface User {
  user_id: string;
  email: string;
  user_password: string;
  first_name: string;
  last_name: string;
  registration_date: Date;
  last_login: Date | null;
}

interface Fan {
  user_id: string;
  username: string;
  preferred_genre: string;
  phone_number: string;
  referral_code: string;
  referred_by: string | null;
  referral_points: number;
  referral_code_used: boolean;
}

interface Organizer {
  user_id: string;
  organization_name: string;
  contact_info: string;
}

interface Artist {
  artist_id: string;
  artist_name: string;
  genre: string;
}

interface Arena {
  arena_id: string;
  arena_name: string;
  arena_location: string;
  total_capacity: number;
}

interface Zone {
  arena_id: string;
  zone_name: string;
  capacity_per_zone: number;
}

interface Concert {
  concert_id: string;
  organizer_id: string;
  concert_date: Date;
  time: string;
  description: string;
  arena_id: string;
}

interface ConcertZonePricing {
  concert_id: string;
  arena_id: string;
  zone_name: string;
  price: number;
}

interface ConcertArtist {
  concert_id: string;
  artist_id: string;
}

interface Ticket {
  ticket_id: string;
  fan_id: string;
  concert_id: string;
  arena_id: string;
  zone_name: string;
  purchase_date: Date;
  purchase_price: number;
}

interface FanReferral {
  referral_id: string;
  referrer_id: string;
  referred_id: string;
  referral_date: Date;
  points_awarded: number;
}

export const seedDatabase = async (): Promise<void> => {
  try {
    console.log('Starting database seeding...');

    // Clear existing data
    await clearDatabase();

    // Note: Admin user should be created separately using create-admin script
    console.log('Skipping admin user creation - use npm run create-admin if needed');

    // Seed data
    const users = await seedUsers();
    console.log(`Seeded ${users.length} users`);

    // Split users into fans and organizers
    const fanUsers = users.slice(1, 41); // First 40 users after admin are fans
    const organizerUsers = users.slice(41); // Last 10 users are organizers

    const fans = await seedFans(fanUsers);
    console.log(`Seeded ${fans.length} fans`);

    const organizers = await seedOrganizers(organizerUsers);
    console.log(`Seeded ${organizers.length} organizers`);

    const artists = await seedArtists();
    console.log(`Seeded ${artists.length} artists`);

    const arenas = await seedArenas();
    console.log(`Seeded ${arenas.length} arenas`);

    const zones = await seedZones(arenas);
    console.log(`Seeded ${zones.length} zones`);

    const concerts = await seedConcerts(organizers, arenas);
    console.log(`Seeded ${concerts.length} concerts`);

    const concertZonePricing = await seedConcertZonePricing(concerts, zones);
    console.log(`Seeded ${concertZonePricing.length} concert zone prices`);

    const concertArtists = await seedConcertArtists(concerts, artists);
    console.log(`Seeded ${concertArtists.length} concert-artist relationships`);

    const tickets = await seedTickets(fans, concerts, concertZonePricing);
    console.log(`Seeded ${tickets.length} tickets`);

    console.log('Database seeding completed successfully!');

  } catch (error) {
    console.error('Error seeding database:', error);
    throw error;
  }
};

const clearDatabase = async (): Promise<void> => {
  console.log('Clearing existing data...');
  
  // Order matters due to foreign key constraints
  const tables = [
    'tickets',
    'concert_zone_pricing',
    'concert_features_artists',
    'concerts',
    'zones',
    'arenas',
    'artists',
    'organizers',
    'fans'
    // 'users' table is handled separately to preserve the admin user
  ];
  
  const pool = getPool();
  
  // Disable foreign key checks temporarily
  await pool.query('SET session_replication_role = replica;');
  
  for (const table of tables) {
    try {
      await pool.query(`TRUNCATE TABLE ${table} RESTART IDENTITY CASCADE`);
    } catch (error) {
      console.log(`Table ${table} might not exist yet, continuing...`);
    }
  }
  
  // Delete all users except the admin
  try {
    await pool.query("DELETE FROM users WHERE email != 'admin@concert.com'");
  } catch (error) {
    console.log(`Could not clear non-admin users, continuing...`);
  }
  
  // Re-enable foreign key checks
  await pool.query('SET session_replication_role = DEFAULT;');
  
  console.log('Database cleared.');
};

const seedUsers = async (): Promise<User[]> => {
  const users: User[] = [];
  const now = new Date();
  
  // Create regular users (fans and organizers) - admin is created separately
  for (let i = 0; i < 50; i++) {
    // Generate a properly hashed password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('password123', salt);
    
    const user = {
      user_id: faker.string.uuid(),
      email: faker.internet.email(),
      user_password: hashedPassword,
      first_name: faker.person.firstName(),
      last_name: faker.person.lastName(),
      registration_date: now,
      last_login: null
    };
    
    await getPool().query(
      'INSERT INTO users (user_id, email, user_password, first_name, last_name, registration_date, last_login) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [user.user_id, user.email, user.user_password, user.first_name, user.last_name, user.registration_date, user.last_login]
    );
    
    users.push(user);
  }

  return users;
};

const seedFans = async (users: User[]): Promise<Fan[]> => {
  const fans: Fan[] = [];
  const genres = ['Rock', 'Pop', 'Jazz', 'Classical', 'Hip Hop', 'Electronic', 'Country', 'R&B'];
  const usedReferralCodes = new Set<string>();

  for (const user of users) {
    // Generate a unique referral code
    let referralCode: string;
    do {
      referralCode = faker.string.alphanumeric(8).toUpperCase();
    } while (usedReferralCodes.has(referralCode));
    usedReferralCodes.add(referralCode);

    const fan = {
      user_id: user.user_id,
      username: faker.internet.userName(),
      preferred_genre: faker.helpers.arrayElement(genres),
      phone_number: faker.phone.number(),
      referral_code: referralCode,
      referred_by: null, // This will be set in the next step for some fans
      referral_points: 0,
      referral_code_used: false // Initially false for all new fans
    };
    
    await getPool().query(
      'INSERT INTO fans (user_id, username, preferred_genre, phone_number, referral_code, referred_by, referral_points, referral_code_used) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
      [fan.user_id, fan.username, fan.preferred_genre, fan.phone_number, fan.referral_code, fan.referred_by, fan.referral_points, fan.referral_code_used]
    );
    
    fans.push(fan);
  }

  // Now, create some consistent referral relationships
  for (let i = 0; i < fans.length; i++) {
    // Let's have about 30% of fans be referred by someone
    if (i > 0 && Math.random() < 0.3) {
      const referrerIndex = faker.number.int({ min: 0, max: i - 1 });
      const referrer = fans[referrerIndex];
      const referred = fans[i];
      
      // Update the referred fan to link them to the referrer.
      // The referral_code_used flag remains false until they make a purchase.
      await getPool().query(
        'UPDATE fans SET referred_by = $1 WHERE user_id = $2',
        [referrer.user_id, referred.user_id]
      );
      
      // Give the referrer some points for a successful referral
      await getPool().query(
        'UPDATE fans SET referral_points = referral_points + 10 WHERE user_id = $1',
        [referrer.user_id]
      );

      // Update local object for consistency in the ticket seeding step
      referred.referred_by = referrer.user_id;
    }
  }

  return fans;
};

const seedOrganizers = async (users: User[]): Promise<Organizer[]> => {
  const organizers: Organizer[] = [];

  for (const user of users) {
    const organizer = {
      user_id: user.user_id,
      organization_name: faker.company.name(),
      contact_info: faker.phone.number()
    };
    
    await getPool().query(
      'INSERT INTO organizers (user_id, organization_name, contact_info) VALUES ($1, $2, $3)',
      [organizer.user_id, organizer.organization_name, organizer.contact_info]
    );
    
    organizers.push(organizer);
  }

  return organizers;
};

const seedArtists = async (): Promise<Artist[]> => {
  const artists: Artist[] = [];
  const genres = ['Rock', 'Pop', 'Jazz', 'Classical', 'Hip Hop', 'Electronic', 'Country', 'R&B'];

  for (let i = 0; i < 20; i++) {
    const artist = {
      artist_id: faker.string.uuid(),
      artist_name: faker.person.fullName(),
      genre: faker.helpers.arrayElement(genres)
    };
    
    await getPool().query(
      'INSERT INTO artists (artist_id, artist_name, genre) VALUES ($1, $2, $3)',
      [artist.artist_id, artist.artist_name, artist.genre]
    );
    
    artists.push(artist);
  }

  return artists;
};

const seedArenas = async (): Promise<Arena[]> => {
  const arenas: Arena[] = [];

  for (let i = 0; i < 10; i++) {
    const arena = {
      arena_id: faker.string.uuid(),
      arena_name: faker.company.name() + ' Arena',
      arena_location: faker.location.streetAddress(),
      total_capacity: faker.number.int({ min: 1000, max: 50000 })
    };
    
    await getPool().query(
      'INSERT INTO arenas (arena_id, arena_name, arena_location, total_capacity) VALUES ($1, $2, $3, $4)',
      [arena.arena_id, arena.arena_name, arena.arena_location, arena.total_capacity]
    );
    
    arenas.push(arena);
  }

  return arenas;
};

const seedZones = async (arenas: Arena[]): Promise<Zone[]> => {
  const zones: Zone[] = [];
  const zoneNames = ['VIP', 'Premium', 'Standard', 'Balcony', 'Floor'];

  for (const arena of arenas) {
    const numZones = faker.number.int({ min: 2, max: 5 });
    const selectedZones = faker.helpers.arrayElements(zoneNames, numZones);
    
    for (const zoneName of selectedZones) {
      const zone = {
        arena_id: arena.arena_id,
        zone_name: zoneName,
        capacity_per_zone: Math.floor(arena.total_capacity / numZones)
      };
      
      await getPool().query(
        'INSERT INTO zones (arena_id, zone_name, capacity_per_zone) VALUES ($1, $2, $3)',
        [zone.arena_id, zone.zone_name, zone.capacity_per_zone]
      );
      
      zones.push(zone);
    }
  }

  return zones;
};

const seedConcerts = async (organizers: Organizer[], arenas: Arena[]): Promise<Concert[]> => {
  const concerts: Concert[] = [];

  for (let i = 0; i < 30; i++) {
    const organizer = faker.helpers.arrayElement(organizers);
    const arena = faker.helpers.arrayElement(arenas);
    
    // About half past, half future
    const today = new Date();
    let concertDate;
    if (i < 15) {
      // Past: from 1 year ago to yesterday
      const lastYear = new Date(today);
      lastYear.setFullYear(today.getFullYear() - 1);
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);
      concertDate = faker.date.between({ from: lastYear, to: yesterday });
    } else {
      // Future: from tomorrow to 1 year from now
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);
      const nextYear = new Date(today);
      nextYear.setFullYear(today.getFullYear() + 1);
      concertDate = faker.date.between({ from: tomorrow, to: nextYear });
    }

    const concert = {
      concert_id: faker.string.uuid(),
      organizer_id: organizer.user_id,
      concert_date: concertDate,
      time: concertDate.toTimeString().split(' ')[0],
      description: faker.lorem.paragraph(),
      arena_id: arena.arena_id
    };
    
    await getPool().query(
      'INSERT INTO concerts (concert_id, organizer_id, concert_date, time, description, arena_id) VALUES ($1, $2, $3, $4, $5, $6)',
      [concert.concert_id, concert.organizer_id, concert.concert_date, concert.time, concert.description, concert.arena_id]
    );
    
    concerts.push(concert);
  }

  return concerts;
};

const seedConcertZonePricing = async (concerts: Concert[], zones: Zone[]): Promise<ConcertZonePricing[]> => {
  const concertZonePricing: ConcertZonePricing[] = [];
  const zonePriceMultipliers: { [key: string]: number } = {
    'VIP': 2.0,
    'Premium': 1.5,
    'Standard': 1.0,
    'Balcony': 0.8,
    'Floor': 0.7
  };

  for (const concert of concerts) {
    const concertZones = zones.filter(z => z.arena_id === concert.arena_id);
    const basePrice = faker.number.float({ min: 50, max: 200, fractionDigits: 2 });

    for (const zone of concertZones) {
      const multiplier = zonePriceMultipliers[zone.zone_name] || 1.0;
      const price = basePrice * multiplier;
      
      const pricing = {
        concert_id: concert.concert_id,
        arena_id: concert.arena_id,
        zone_name: zone.zone_name,
        price: Number(price.toFixed(2))
      };
      
      await getPool().query(
        'INSERT INTO concert_zone_pricing (concert_id, arena_id, zone_name, price) VALUES ($1, $2, $3, $4)',
        [pricing.concert_id, pricing.arena_id, pricing.zone_name, pricing.price]
      );
      
      concertZonePricing.push(pricing);
    }
  }

  return concertZonePricing;
};

const seedConcertArtists = async (concerts: Concert[], artists: Artist[]): Promise<ConcertArtist[]> => {
  const concertArtists: ConcertArtist[] = [];

  for (const concert of concerts) {
    const numArtists = faker.number.int({ min: 1, max: 3 });
    const selectedArtists = faker.helpers.arrayElements(artists, numArtists);
    
    for (const artist of selectedArtists) {
      const concertArtist = {
        concert_id: concert.concert_id,
        artist_id: artist.artist_id
      };
      
      await getPool().query(
        'INSERT INTO concert_features_artists (concert_id, artist_id) VALUES ($1, $2)',
        [concertArtist.concert_id, concertArtist.artist_id]
      );
      
      concertArtists.push(concertArtist);
    }
  }

  return concertArtists;
};

const seedTickets = async (fans: Fan[], concerts: Concert[], concertPricings: ConcertZonePricing[]): Promise<Ticket[]> => {
  const tickets: Ticket[] = [];

  for (let i = 0; i < 100; i++) {
    const fan = faker.helpers.arrayElement(fans);
    const concert = faker.helpers.arrayElement(concerts);
    
    // Find a valid pricing entry for the selected concert
    const validPricings = concertPricings.filter(p => p.concert_id === concert.concert_id);
    if (validPricings.length === 0) continue; // Skip if no pricing is defined for this concert
    
    const pricing = faker.helpers.arrayElement(validPricings);
    
    let purchasePrice = pricing.price;

    // If fan was referred and hasn't used their discount, apply it now
    if (fan.referred_by && !fan.referral_code_used) {
      purchasePrice = purchasePrice * 0.90; // Apply 10% discount

      // Mark the fan's referral as used in the database
      await getPool().query(
        'UPDATE fans SET referral_code_used = true WHERE user_id = $1',
        [fan.user_id]
      );
      
      // Also update the local object to prevent re-use in this script run
      fan.referral_code_used = true;
    }
    
    const ticket = {
      ticket_id: faker.string.uuid(),
      fan_id: fan.user_id,
      concert_id: concert.concert_id,
      arena_id: pricing.arena_id,
      zone_name: pricing.zone_name,
      purchase_date: new Date(),
      purchase_price: purchasePrice
    };
    
    await getPool().query(
      'INSERT INTO tickets (ticket_id, fan_id, concert_id, arena_id, zone_name, purchase_date, purchase_price) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [ticket.ticket_id, ticket.fan_id, ticket.concert_id, ticket.arena_id, ticket.zone_name, ticket.purchase_date, ticket.purchase_price]
    );
    
    tickets.push(ticket);
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