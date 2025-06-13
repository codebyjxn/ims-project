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
exports.migrateToMongoDB = void 0;
const pg_1 = require("pg");
const mongodb_schemas_1 = require("../models/mongodb-schemas");
const migration_status_1 = require("./migration-status");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const pool = new pg_1.Pool({
    user: process.env.POSTGRES_USER || 'postgres',
    host: process.env.POSTGRES_HOST || 'localhost',
    database: process.env.POSTGRES_DB || 'concert_booking',
    password: process.env.POSTGRES_PASSWORD || 'password',
    port: Number(process.env.POSTGRES_PORT) || 5432,
});
const ADMIN_EMAIL = 'admin@concert.com';
const ADMIN_PASSWORD = 'admin123';
const migrateToMongoDB = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log('Starting migration from PostgreSQL to MongoDB...');
        // Connect to MongoDB
        yield (0, mongodb_schemas_1.connectMongoDB)();
        // Clear existing MongoDB data using native operations
        console.log('Clearing existing MongoDB data...');
        yield Promise.all([
            (0, mongodb_schemas_1.getUsersCollection)().deleteMany({}),
            (0, mongodb_schemas_1.getArtistsCollection)().deleteMany({}),
            (0, mongodb_schemas_1.getArenasCollection)().deleteMany({}),
            (0, mongodb_schemas_1.getConcertsCollection)().deleteMany({}),
            (0, mongodb_schemas_1.getTicketsCollection)().deleteMany({})
        ]);
        // Create indexes
        yield (0, mongodb_schemas_1.createIndexes)();
        // Migrate data in order (respecting dependencies)
        const userCount = yield migrateUsers();
        const artistCount = yield migrateArtists();
        const arenaCount = yield migrateArenas();
        const concertCount = yield migrateConcerts();
        const ticketCount = yield migrateTickets();
        // Recreate admin user in MongoDB
        console.log('Recreating admin user in MongoDB...');
        const usersCollection = (0, mongodb_schemas_1.getUsersCollection)();
        // Check if admin user already exists
        const existingAdmin = yield usersCollection.findOne({ email: ADMIN_EMAIL });
        if (!existingAdmin) {
            // Hash the password
            const salt = yield bcryptjs_1.default.genSalt(10);
            const hashedPassword = yield bcryptjs_1.default.hash(ADMIN_PASSWORD, salt);
            // Create new admin user
            const adminUser = {
                _id: 'admin-' + Date.now(),
                email: ADMIN_EMAIL,
                user_password: hashedPassword,
                first_name: 'Admin',
                last_name: 'User',
                registration_date: new Date(),
                user_type: 'admin'
            };
            yield usersCollection.insertOne(adminUser);
            console.log('✅ Admin user recreated in MongoDB');
        }
        else {
            // If admin exists, ensure the user_type is 'admin'
            yield usersCollection.updateOne({ email: ADMIN_EMAIL }, { $set: { user_type: 'admin' } });
            console.log('Admin user already exists in MongoDB, user_type ensured.');
        }
        console.log('Migration completed successfully!');
        // Mark migration as completed
        migration_status_1.migrationStatus.markMigrated();
        console.log(`Database type switched to: ${migration_status_1.migrationStatus.getDatabaseType()}`);
        return {
            users: userCount,
            artists: artistCount,
            arenas: arenaCount,
            concerts: concertCount,
            tickets: ticketCount
        };
    }
    catch (error) {
        console.error('Error during migration:', error);
        throw error;
    }
});
exports.migrateToMongoDB = migrateToMongoDB;
const migrateUsers = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Check if required tables exist
        const tablesExist = yield pool.query(`
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
        const usersResult = yield pool.query('SELECT * FROM users ORDER BY user_id');
        const users = usersResult.rows;
        const usersCollection = (0, mongodb_schemas_1.getUsersCollection)();
        const mongoUsers = [];
        for (const user of users) {
            // Explicitly check for the admin user
            if (user.email === ADMIN_EMAIL) {
                const adminMongoUser = {
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
            const mongoUser = {
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
                const fanResult = yield pool.query('SELECT * FROM fans WHERE user_id = $1', [user.user_id]);
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
                const organizerResult = yield pool.query('SELECT * FROM organizers WHERE user_id = $1', [user.user_id]);
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
            yield usersCollection.insertMany(mongoUsers);
        }
        return mongoUsers.length;
    }
    catch (error) {
        console.error('Error migrating users:', error);
        throw error;
    }
});
const migrateArtists = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const tablesExist = yield pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'artists'
      ) as artists_exist
    `);
        if (!tablesExist.rows[0].artists_exist) {
            console.log('Artists table does not exist, skipping artist migration');
            return 0;
        }
        const result = yield pool.query('SELECT * FROM artists ORDER BY artist_id');
        const artists = result.rows;
        const artistsCollection = (0, mongodb_schemas_1.getArtistsCollection)();
        const mongoArtists = artists.map(artist => ({
            _id: artist.artist_id,
            artist_name: artist.artist_name,
            genre: artist.genre
        }));
        // Insert all artists using native MongoDB insertMany
        if (mongoArtists.length > 0) {
            yield artistsCollection.insertMany(mongoArtists);
        }
        return mongoArtists.length;
    }
    catch (error) {
        console.error('Error migrating artists:', error);
        throw error;
    }
});
const migrateArenas = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const tablesExist = yield pool.query(`
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
        const arenasResult = yield pool.query('SELECT * FROM arenas ORDER BY arena_id');
        const arenas = arenasResult.rows;
        const arenasCollection = (0, mongodb_schemas_1.getArenasCollection)();
        const mongoArenas = [];
        for (const arena of arenas) {
            const mongoArena = {
                _id: arena.arena_id,
                arena_name: arena.arena_name,
                arena_location: arena.arena_location,
                total_capacity: arena.total_capacity,
                zones: []
            };
            // Get zones for this arena if zones table exists
            if (tablesExist.rows[0].zones_exist) {
                const zonesResult = yield pool.query('SELECT * FROM zones WHERE arena_id = $1 ORDER BY zone_name', [arena.arena_id]);
                mongoArena.zones = zonesResult.rows.map(zone => ({
                    zone_name: zone.zone_name,
                    capacity_per_zone: zone.capacity_per_zone
                }));
            }
            mongoArenas.push(mongoArena);
        }
        // Insert all arenas using native MongoDB insertMany
        if (mongoArenas.length > 0) {
            yield arenasCollection.insertMany(mongoArenas);
        }
        return mongoArenas.length;
    }
    catch (error) {
        console.error('Error migrating arenas:', error);
        throw error;
    }
});
const migrateConcerts = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const tablesExist = yield pool.query(`
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
        const concertsResult = yield pool.query('SELECT * FROM concerts ORDER BY concert_id');
        const concerts = concertsResult.rows;
        const concertsCollection = (0, mongodb_schemas_1.getConcertsCollection)();
        const mongoConcerts = [];
        for (const concert of concerts) {
            const mongoConcert = {
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
                const artistsResult = yield pool.query(`
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
                const pricingResult = yield pool.query(`
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
            yield concertsCollection.insertMany(mongoConcerts);
        }
        return mongoConcerts.length;
    }
    catch (error) {
        console.error('Error migrating concerts:', error);
        throw error;
    }
});
const migrateTickets = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const tablesExist = yield pool.query(`
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
        const result = yield pool.query(query);
        const tickets = result.rows;
        const ticketsCollection = (0, mongodb_schemas_1.getTicketsCollection)();
        const mongoTickets = tickets.map(ticket => ({
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
            yield ticketsCollection.insertMany(mongoTickets);
        }
        return mongoTickets.length;
    }
    catch (error) {
        console.error('Error migrating tickets:', error);
        throw error;
    }
});
