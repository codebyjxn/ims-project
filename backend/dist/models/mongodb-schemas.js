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
exports.createIndexes = exports.getTicketsCollection = exports.getConcertsCollection = exports.getArenasCollection = exports.getArtistsCollection = exports.getUsersCollection = exports.closeMongoDB = exports.getDatabase = exports.connectMongoDB = void 0;
const mongodb_connection_1 = require("../lib/mongodb-connection"); // Use the robust singleton connection manager
// ========== NATIVE MONGODB CONNECTION ==========
let client;
let db;
const connectMongoDB = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Ensure the singleton client is connected
        yield mongodb_connection_1.mongoManager.connect();
        // Cache for sync getters
        db = yield mongodb_connection_1.mongoManager.getDatabase();
        // mongoManager exposes its client internally; cast to any to grab it for legacy code
        // Note: direct client usage should be avoided going forward.
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore - accessing private prop in rare case we still need it
        client = mongodb_connection_1.mongoManager.client;
        console.log('Connected to MongoDB successfully (via mongoManager)');
    }
    catch (error) {
        console.error('Error connecting to MongoDB:', error);
        throw error;
    }
});
exports.connectMongoDB = connectMongoDB;
const getDatabase = () => {
    if (!db) {
        throw new Error('Database not connected. Call connectMongoDB() first.');
    }
    return db;
};
exports.getDatabase = getDatabase;
const closeMongoDB = () => __awaiter(void 0, void 0, void 0, function* () {
    yield mongodb_connection_1.mongoManager.close();
    db = undefined;
    client = undefined;
});
exports.closeMongoDB = closeMongoDB;
// ========== COLLECTION GETTERS ==========
const getUsersCollection = () => {
    const database = (0, exports.getDatabase)();
    return database.collection('users');
};
exports.getUsersCollection = getUsersCollection;
const getArtistsCollection = () => {
    const database = (0, exports.getDatabase)();
    return database.collection('artists');
};
exports.getArtistsCollection = getArtistsCollection;
const getArenasCollection = () => {
    const database = (0, exports.getDatabase)();
    return database.collection('arenas');
};
exports.getArenasCollection = getArenasCollection;
const getConcertsCollection = () => {
    const database = (0, exports.getDatabase)();
    return database.collection('concerts');
};
exports.getConcertsCollection = getConcertsCollection;
const getTicketsCollection = () => {
    const database = (0, exports.getDatabase)();
    return database.collection('tickets');
};
exports.getTicketsCollection = getTicketsCollection;
// ========== INDEX CREATION ==========
const createIndexes = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const usersCol = (0, exports.getUsersCollection)();
        const artistsCol = (0, exports.getArtistsCollection)();
        const arenasCol = (0, exports.getArenasCollection)();
        const concertsCol = (0, exports.getConcertsCollection)();
        const ticketsCol = (0, exports.getTicketsCollection)();
        // User indexes - optimized for authentication and fan lookups
        yield usersCol.createIndex({ email: 1 }, { unique: true });
        yield usersCol.createIndex({ user_type: 1 });
        yield usersCol.createIndex({ 'fan_details.username': 1 }, { sparse: true, unique: true });
        yield usersCol.createIndex({ 'fan_details.preferred_genre': 1 });
        yield usersCol.createIndex({ 'fan_details.referral_code': 1 }, { sparse: true, unique: true });
        // Artist indexes - optimized for genre searches
        yield artistsCol.createIndex({ genre: 1 });
        yield artistsCol.createIndex({ artist_name: 1 });
        // Arena indexes - optimized for location searches
        yield arenasCol.createIndex({ arena_location: 1 });
        // Concert indexes - optimized for date and location searches
        yield concertsCol.createIndex({ concert_date: 1 });
        yield concertsCol.createIndex({ organizer_id: 1 });
        yield concertsCol.createIndex({ arena_id: 1 });
        yield concertsCol.createIndex({ 'artists.genre': 1 });
        // Compound index for common search pattern
        yield concertsCol.createIndex({ concert_date: 1, arena_id: 1 });
        // Ticket indexes - optimized for fan queries and analytics
        yield ticketsCol.createIndex({ fan_id: 1 });
        yield ticketsCol.createIndex({ concert_id: 1 });
        yield ticketsCol.createIndex({ purchase_date: 1 });
        yield ticketsCol.createIndex({ concert_date: 1 });
        // Compound indexes for common query patterns
        yield ticketsCol.createIndex({ fan_id: 1, concert_date: 1 });
        yield ticketsCol.createIndex({ concert_id: 1, zone_name: 1 });
        console.log('MongoDB indexes created successfully');
    }
    catch (error) {
        console.error('Error creating MongoDB indexes:', error);
        throw error;
    }
});
exports.createIndexes = createIndexes;
