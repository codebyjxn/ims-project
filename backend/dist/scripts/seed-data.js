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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedDatabase = void 0;
const postgres_1 = require("../lib/postgres");
const faker_1 = require("@faker-js/faker");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const seedDatabase = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log('Starting database seeding...');
        // Clear existing data
        yield clearDatabase();
        // Note: Admin user should be created separately using create-admin script
        console.log('Skipping admin user creation - use npm run create-admin if needed');
        // Seed data
        const users = yield seedUsers();
        console.log(`Seeded ${users.length} users`);
        // Split users into fans and organizers
        const fanUsers = users.slice(1, 41); // First 40 users after admin are fans
        const organizerUsers = users.slice(41); // Last 10 users are organizers
        const fans = yield seedFans(fanUsers);
        console.log(`Seeded ${fans.length} fans`);
        const organizers = yield seedOrganizers(organizerUsers);
        console.log(`Seeded ${organizers.length} organizers`);
        const artists = yield seedArtists();
        console.log(`Seeded ${artists.length} artists`);
        const arenas = yield seedArenas();
        console.log(`Seeded ${arenas.length} arenas`);
        const zones = yield seedZones(arenas);
        console.log(`Seeded ${zones.length} zones`);
        const concerts = yield seedConcerts(organizers, arenas);
        console.log(`Seeded ${concerts.length} concerts`);
        const concertZonePricing = yield seedConcertZonePricing(concerts, zones);
        console.log(`Seeded ${concertZonePricing.length} concert zone prices`);
        const concertArtists = yield seedConcertArtists(concerts, artists);
        console.log(`Seeded ${concertArtists.length} concert-artist relationships`);
        const tickets = yield seedTickets(fans, concerts, concertZonePricing);
        console.log(`Seeded ${tickets.length} tickets`);
        console.log('Database seeding completed successfully!');
    }
    catch (error) {
        console.error('Error seeding database:', error);
        throw error;
    }
});
exports.seedDatabase = seedDatabase;
const clearDatabase = () => __awaiter(void 0, void 0, void 0, function* () {
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
    const pool = (0, postgres_1.getPool)();
    // Disable foreign key checks temporarily
    yield pool.query('SET session_replication_role = replica;');
    for (const table of tables) {
        try {
            yield pool.query(`TRUNCATE TABLE ${table} RESTART IDENTITY CASCADE`);
        }
        catch (error) {
            console.log(`Table ${table} might not exist yet, continuing...`);
        }
    }
    // Delete all users except the admin
    try {
        yield pool.query("DELETE FROM users WHERE email != 'admin@concert.com'");
    }
    catch (error) {
        console.log(`Could not clear non-admin users, continuing...`);
    }
    // Re-enable foreign key checks
    yield pool.query('SET session_replication_role = DEFAULT;');
    console.log('Database cleared.');
});
const seedUsers = () => __awaiter(void 0, void 0, void 0, function* () {
    const users = [];
    const now = new Date();
    // Create regular users (fans and organizers) - admin is created separately
    for (let i = 0; i < 50; i++) {
        // Generate a properly hashed password
        const salt = yield bcryptjs_1.default.genSalt(10);
        const hashedPassword = yield bcryptjs_1.default.hash('password123', salt);
        const user = {
            user_id: faker_1.faker.string.uuid(),
            email: faker_1.faker.internet.email(),
            user_password: hashedPassword,
            first_name: faker_1.faker.person.firstName(),
            last_name: faker_1.faker.person.lastName(),
            registration_date: now,
            last_login: null
        };
        yield (0, postgres_1.getPool)().query('INSERT INTO users (user_id, email, user_password, first_name, last_name, registration_date, last_login) VALUES ($1, $2, $3, $4, $5, $6, $7)', [user.user_id, user.email, user.user_password, user.first_name, user.last_name, user.registration_date, user.last_login]);
        users.push(user);
    }
    return users;
});
const seedFans = (users) => __awaiter(void 0, void 0, void 0, function* () {
    const fans = [];
    const genres = ['Rock', 'Pop', 'Jazz', 'Classical', 'Hip Hop', 'Electronic', 'Country', 'R&B'];
    const usedReferralCodes = new Set();
    for (const user of users) {
        // Generate a unique referral code
        let referralCode;
        do {
            referralCode = faker_1.faker.string.alphanumeric(8).toUpperCase();
        } while (usedReferralCodes.has(referralCode));
        usedReferralCodes.add(referralCode);
        const fan = {
            user_id: user.user_id,
            username: faker_1.faker.internet.userName(),
            preferred_genre: faker_1.faker.helpers.arrayElement(genres),
            phone_number: faker_1.faker.phone.number(),
            referral_code: referralCode,
            referred_by: null, // This will be set in the next step for some fans
            referral_points: 0,
            referral_code_used: false // Initially false for all new fans
        };
        yield (0, postgres_1.getPool)().query('INSERT INTO fans (user_id, username, preferred_genre, phone_number, referral_code, referred_by, referral_points, referral_code_used) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)', [fan.user_id, fan.username, fan.preferred_genre, fan.phone_number, fan.referral_code, fan.referred_by, fan.referral_points, fan.referral_code_used]);
        fans.push(fan);
    }
    // Now, create some consistent referral relationships
    for (let i = 0; i < fans.length; i++) {
        // Let's have about 30% of fans be referred by someone
        if (i > 0 && Math.random() < 0.3) {
            const referrerIndex = faker_1.faker.number.int({ min: 0, max: i - 1 });
            const referrer = fans[referrerIndex];
            const referred = fans[i];
            // Update the referred fan to link them to the referrer.
            // The referral_code_used flag remains false until they make a purchase.
            yield (0, postgres_1.getPool)().query('UPDATE fans SET referred_by = $1 WHERE user_id = $2', [referrer.user_id, referred.user_id]);
            // Give the referrer some points for a successful referral
            yield (0, postgres_1.getPool)().query('UPDATE fans SET referral_points = referral_points + 10 WHERE user_id = $1', [referrer.user_id]);
            // Update local object for consistency in the ticket seeding step
            referred.referred_by = referrer.user_id;
        }
    }
    return fans;
});
const seedOrganizers = (users) => __awaiter(void 0, void 0, void 0, function* () {
    const organizers = [];
    for (const user of users) {
        const organizer = {
            user_id: user.user_id,
            organization_name: faker_1.faker.company.name(),
            contact_info: faker_1.faker.phone.number()
        };
        yield (0, postgres_1.getPool)().query('INSERT INTO organizers (user_id, organization_name, contact_info) VALUES ($1, $2, $3)', [organizer.user_id, organizer.organization_name, organizer.contact_info]);
        organizers.push(organizer);
    }
    return organizers;
});
const seedArtists = () => __awaiter(void 0, void 0, void 0, function* () {
    const artists = [];
    const genres = ['Rock', 'Pop', 'Jazz', 'Classical', 'Hip Hop', 'Electronic', 'Country', 'R&B'];
    for (let i = 0; i < 20; i++) {
        const artist = {
            artist_id: faker_1.faker.string.uuid(),
            artist_name: faker_1.faker.person.fullName(),
            genre: faker_1.faker.helpers.arrayElement(genres)
        };
        yield (0, postgres_1.getPool)().query('INSERT INTO artists (artist_id, artist_name, genre) VALUES ($1, $2, $3)', [artist.artist_id, artist.artist_name, artist.genre]);
        artists.push(artist);
    }
    return artists;
});
const seedArenas = () => __awaiter(void 0, void 0, void 0, function* () {
    const arenas = [];
    for (let i = 0; i < 10; i++) {
        const arena = {
            arena_id: faker_1.faker.string.uuid(),
            arena_name: faker_1.faker.company.name() + ' Arena',
            arena_location: faker_1.faker.location.streetAddress(),
            total_capacity: faker_1.faker.number.int({ min: 1000, max: 50000 })
        };
        yield (0, postgres_1.getPool)().query('INSERT INTO arenas (arena_id, arena_name, arena_location, total_capacity) VALUES ($1, $2, $3, $4)', [arena.arena_id, arena.arena_name, arena.arena_location, arena.total_capacity]);
        arenas.push(arena);
    }
    return arenas;
});
const seedZones = (arenas) => __awaiter(void 0, void 0, void 0, function* () {
    const zones = [];
    const zoneNames = ['VIP', 'Premium', 'Standard', 'Balcony', 'Floor'];
    for (const arena of arenas) {
        const numZones = faker_1.faker.number.int({ min: 2, max: 5 });
        const selectedZones = faker_1.faker.helpers.arrayElements(zoneNames, numZones);
        for (const zoneName of selectedZones) {
            const zone = {
                arena_id: arena.arena_id,
                zone_name: zoneName,
                capacity_per_zone: Math.floor(arena.total_capacity / numZones)
            };
            yield (0, postgres_1.getPool)().query('INSERT INTO zones (arena_id, zone_name, capacity_per_zone) VALUES ($1, $2, $3)', [zone.arena_id, zone.zone_name, zone.capacity_per_zone]);
            zones.push(zone);
        }
    }
    return zones;
});
const seedConcerts = (organizers, arenas) => __awaiter(void 0, void 0, void 0, function* () {
    const concerts = [];
    for (let i = 0; i < 30; i++) {
        const organizer = faker_1.faker.helpers.arrayElement(organizers);
        const arena = faker_1.faker.helpers.arrayElement(arenas);
        // FIX: Ensure concert date is always at least one day in the future.
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1); // Set the date to tomorrow
        const nextYear = new Date();
        nextYear.setFullYear(today.getFullYear() + 1); // Set to one year from today
        const concertDate = faker_1.faker.date.between({ from: tomorrow, to: nextYear });
        const concert = {
            concert_id: faker_1.faker.string.uuid(),
            organizer_id: organizer.user_id,
            concert_date: concertDate,
            time: concertDate.toTimeString().split(' ')[0],
            description: faker_1.faker.lorem.paragraph(),
            arena_id: arena.arena_id
        };
        yield (0, postgres_1.getPool)().query('INSERT INTO concerts (concert_id, organizer_id, concert_date, time, description, arena_id) VALUES ($1, $2, $3, $4, $5, $6)', [concert.concert_id, concert.organizer_id, concert.concert_date, concert.time, concert.description, concert.arena_id]);
        concerts.push(concert);
    }
    return concerts;
});
const seedConcertZonePricing = (concerts, zones) => __awaiter(void 0, void 0, void 0, function* () {
    const concertZonePricing = [];
    const zonePriceMultipliers = {
        'VIP': 2.0,
        'Premium': 1.5,
        'Standard': 1.0,
        'Balcony': 0.8,
        'Floor': 0.7
    };
    for (const concert of concerts) {
        const concertZones = zones.filter(z => z.arena_id === concert.arena_id);
        const basePrice = faker_1.faker.number.float({ min: 50, max: 200, fractionDigits: 2 });
        for (const zone of concertZones) {
            const multiplier = zonePriceMultipliers[zone.zone_name] || 1.0;
            const price = basePrice * multiplier;
            const pricing = {
                concert_id: concert.concert_id,
                arena_id: concert.arena_id,
                zone_name: zone.zone_name,
                price: Number(price.toFixed(2))
            };
            yield (0, postgres_1.getPool)().query('INSERT INTO concert_zone_pricing (concert_id, arena_id, zone_name, price) VALUES ($1, $2, $3, $4)', [pricing.concert_id, pricing.arena_id, pricing.zone_name, pricing.price]);
            concertZonePricing.push(pricing);
        }
    }
    return concertZonePricing;
});
const seedConcertArtists = (concerts, artists) => __awaiter(void 0, void 0, void 0, function* () {
    const concertArtists = [];
    for (const concert of concerts) {
        const numArtists = faker_1.faker.number.int({ min: 1, max: 3 });
        const selectedArtists = faker_1.faker.helpers.arrayElements(artists, numArtists);
        for (const artist of selectedArtists) {
            const concertArtist = {
                concert_id: concert.concert_id,
                artist_id: artist.artist_id
            };
            yield (0, postgres_1.getPool)().query('INSERT INTO concert_features_artists (concert_id, artist_id) VALUES ($1, $2)', [concertArtist.concert_id, concertArtist.artist_id]);
            concertArtists.push(concertArtist);
        }
    }
    return concertArtists;
});
const seedTickets = (fans, concerts, concertPricings) => __awaiter(void 0, void 0, void 0, function* () {
    const tickets = [];
    for (let i = 0; i < 100; i++) {
        const fan = faker_1.faker.helpers.arrayElement(fans);
        const concert = faker_1.faker.helpers.arrayElement(concerts);
        // Find a valid pricing entry for the selected concert
        const validPricings = concertPricings.filter(p => p.concert_id === concert.concert_id);
        if (validPricings.length === 0)
            continue; // Skip if no pricing is defined for this concert
        const pricing = faker_1.faker.helpers.arrayElement(validPricings);
        let purchasePrice = pricing.price;
        // If fan was referred and hasn't used their discount, apply it now
        if (fan.referred_by && !fan.referral_code_used) {
            purchasePrice = purchasePrice * 0.90; // Apply 10% discount
            // Mark the fan's referral as used in the database
            yield (0, postgres_1.getPool)().query('UPDATE fans SET referral_code_used = true WHERE user_id = $1', [fan.user_id]);
            // Also update the local object to prevent re-use in this script run
            fan.referral_code_used = true;
        }
        const ticket = {
            ticket_id: faker_1.faker.string.uuid(),
            fan_id: fan.user_id,
            concert_id: concert.concert_id,
            arena_id: pricing.arena_id,
            zone_name: pricing.zone_name,
            purchase_date: new Date(),
            purchase_price: purchasePrice
        };
        yield (0, postgres_1.getPool)().query('INSERT INTO tickets (ticket_id, fan_id, concert_id, arena_id, zone_name, purchase_date, purchase_price) VALUES ($1, $2, $3, $4, $5, $6, $7)', [ticket.ticket_id, ticket.fan_id, ticket.concert_id, ticket.arena_id, ticket.zone_name, ticket.purchase_date, ticket.purchase_price]);
        tickets.push(ticket);
    }
    return tickets;
});
// Run if called directly
if (require.main === module) {
    (0, exports.seedDatabase)()
        .then(() => {
        console.log('Seeding process completed');
        process.exit(0);
    })
        .catch((error) => {
        console.error('Seeding process failed:', error);
        process.exit(1);
    });
}
