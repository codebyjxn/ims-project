"use strict";
// src/repositories/mongodb/index.ts
// ========== MONGODB REPOSITORY IMPLEMENTATIONS ==========
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
exports.MongoRepositoryFactory = exports.MongoConcertRepository = exports.MongoArenaRepository = exports.MongoArtistRepository = exports.MongoTicketRepository = exports.MongoUserRepository = void 0;
const mongodb_connection_1 = require("../../lib/mongodb-connection");
class MongoUserRepository {
    findById(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const collection = yield mongodb_connection_1.mongoManager.getCollection('users');
                const user = yield collection.findOne({ _id: userId });
                return user;
            }
            catch (error) {
                console.error('Error in MongoUserRepository.findById:', error);
                return null;
            }
        });
    }
    findByEmail(email) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const collection = yield mongodb_connection_1.mongoManager.getCollection('users');
                const user = yield collection.findOne({ email });
                return user || null;
            }
            catch (error) {
                console.error('Error in MongoUserRepository.findByEmail:', error);
                return null;
            }
        });
    }
    findFanByUsername(username) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const collection = yield mongodb_connection_1.mongoManager.getCollection('users');
                const user = yield collection.findOne({
                    user_type: 'fan',
                    'fan_details.username': username
                });
                return user || null;
            }
            catch (error) {
                console.error('Error in MongoUserRepository.findFanByUsername:', error);
                return null;
            }
        });
    }
    findFanByReferralCode(referralCode) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const collection = yield mongodb_connection_1.mongoManager.getCollection('users');
                const user = yield collection.findOne({
                    user_type: 'fan',
                    'fan_details.referral_code': referralCode
                });
                return user || null;
            }
            catch (error) {
                console.error('Error in MongoUserRepository.findFanByReferralCode:', error);
                return null;
            }
        });
    }
    create(userData) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const collection = yield mongodb_connection_1.mongoManager.getCollection('users');
                const result = yield collection.insertOne(userData);
                return yield collection.findOne({ _id: result.insertedId });
            }
            catch (error) {
                console.error('Error in MongoUserRepository.create:', error);
                throw error;
            }
        });
    }
    update(userId, updates) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const collection = yield mongodb_connection_1.mongoManager.getCollection('users');
                const result = yield collection.findOneAndUpdate({ _id: userId }, { $set: updates }, { returnDocument: 'after' });
                return result;
            }
            catch (error) {
                console.error('Error in MongoUserRepository.update:', error);
                return null;
            }
        });
    }
    delete(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const collection = yield mongodb_connection_1.mongoManager.getCollection('users');
                const result = yield collection.deleteOne({ _id: userId });
                return result.deletedCount > 0;
            }
            catch (error) {
                console.error('Error in MongoUserRepository.delete:', error);
                return false;
            }
        });
    }
    updateReferralPoints(userId, points) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const collection = yield mongodb_connection_1.mongoManager.getCollection('users');
                yield collection.updateOne({ _id: userId, user_type: 'fan' }, { $inc: { 'fan_details.referral_points': points } });
            }
            catch (error) {
                console.error('Error in MongoUserRepository.updateReferralPoints:', error);
                throw error;
            }
        });
    }
    markReferralCodeUsed(fanId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const collection = yield mongodb_connection_1.mongoManager.getCollection('users');
                yield collection.updateOne({ _id: fanId, user_type: 'fan' }, { $set: { 'fan_details.referral_code_used': true } });
            }
            catch (error) {
                console.error('Error in MongoUserRepository.markReferralCodeUsed:', error);
                throw error;
            }
        });
    }
    setReferrer(fanId, referrerId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const collection = yield mongodb_connection_1.mongoManager.getCollection('users');
                yield collection.updateOne({ _id: fanId, user_type: 'fan' }, { $set: { 'fan_details.referred_by': referrerId } });
            }
            catch (error) {
                console.error('Error in MongoUserRepository.setReferrer:', error);
                throw error;
            }
        });
    }
}
exports.MongoUserRepository = MongoUserRepository;
class MongoTicketRepository {
    findById(ticketId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const collection = yield mongodb_connection_1.mongoManager.getCollection('tickets');
                const ticket = yield collection.findOne({ _id: ticketId });
                return ticket;
            }
            catch (error) {
                console.error('Error in MongoTicketRepository.findById:', error);
                return null;
            }
        });
    }
    findByFan(fanId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const collection = yield mongodb_connection_1.mongoManager.getCollection('tickets');
                const tickets = yield collection.aggregate([
                    // Stage 1: Match tickets for the given fan
                    {
                        $match: { fan_id: fanId }
                    },
                    // Stage 2: Lookup concert details
                    {
                        $lookup: {
                            from: 'concerts',
                            localField: 'concert_id',
                            foreignField: '_id',
                            as: 'concert_details'
                        }
                    },
                    // Stage 3: Deconstruct the concert_details array
                    {
                        $unwind: {
                            path: '$concert_details',
                            preserveNullAndEmptyArrays: true // Keep ticket even if concert is not found
                        }
                    },
                    // Stage 4: Lookup arena details from the concert's arena_id
                    {
                        $lookup: {
                            from: 'arenas',
                            localField: 'concert_details.arena_id',
                            foreignField: '_id',
                            as: 'arena_details'
                        }
                    },
                    // Stage 5: Deconstruct the arena_details array
                    {
                        $unwind: {
                            path: '$arena_details',
                            preserveNullAndEmptyArrays: true // Keep ticket even if arena is not found
                        }
                    },
                    // Stage 6: Project to shape the final output
                    {
                        $project: {
                            _id: 1,
                            fan_id: 1,
                            concert_id: 1,
                            arena_id: '$concert_details.arena_id', // Use the one from concert
                            zone_name: 1,
                            purchase_date: 1,
                            purchase_price: 1,
                            concert_name: '$concert_details.description',
                            concert_date: '$concert_details.concert_date',
                            concert_time: '$concert_details.time',
                            arena_name: '$arena_details.arena_name',
                            arena_location: '$arena_details.arena_location'
                        }
                    },
                    // Stage 7: Sort by concert date
                    {
                        $sort: { concert_date: 1 }
                    }
                ]).toArray();
                return tickets;
            }
            catch (error) {
                console.error('Error in MongoTicketRepository.findByFan:', error);
                return [];
            }
        });
    }
    findByConcert(concertId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const collection = yield mongodb_connection_1.mongoManager.getCollection('tickets');
                const tickets = yield collection.find({ concert_id: concertId }).toArray();
                return tickets;
            }
            catch (error) {
                console.error('Error in MongoTicketRepository.findByConcert:', error);
                return [];
            }
        });
    }
    findByConcertAndZone(concertId, zoneName) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const collection = yield mongodb_connection_1.mongoManager.getCollection('tickets');
                const tickets = yield collection.find({ concert_id: concertId, zone_name: zoneName }).toArray();
                return tickets;
            }
            catch (error) {
                console.error('Error in MongoTicketRepository.findByConcertAndZone:', error);
                return [];
            }
        });
    }
    create(ticketData) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const collection = yield mongodb_connection_1.mongoManager.getCollection('tickets');
                const result = yield collection.insertOne(ticketData);
                return Object.assign(Object.assign({}, ticketData), { _id: result.insertedId });
            }
            catch (error) {
                console.error('Error in MongoTicketRepository.create:', error);
                throw error;
            }
        });
    }
    createMultiple(ticketsData) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const collection = yield mongodb_connection_1.mongoManager.getCollection('tickets');
                const result = yield collection.insertMany(ticketsData);
                // Combine inserted ids with original data
                return ticketsData.map((ticket, index) => (Object.assign(Object.assign({}, ticket), { _id: result.insertedIds[index] })));
            }
            catch (error) {
                console.error('Error in MongoTicketRepository.createMultiple:', error);
                throw error;
            }
        });
    }
    delete(ticketId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const collection = yield mongodb_connection_1.mongoManager.getCollection('tickets');
                const result = yield collection.deleteOne({ _id: ticketId });
                return result.deletedCount > 0;
            }
            catch (error) {
                console.error('Error in MongoTicketRepository.delete:', error);
                return false;
            }
        });
    }
    countByConcertAndZone(concertId, zoneName) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const collection = yield mongodb_connection_1.mongoManager.getCollection('tickets');
                const count = yield collection.countDocuments({ concert_id: concertId, zone_name: zoneName });
                return count;
            }
            catch (error) {
                console.error('Error in MongoTicketRepository.countByConcertAndZone:', error);
                return 0;
            }
        });
    }
}
exports.MongoTicketRepository = MongoTicketRepository;
class MongoArtistRepository {
    findById(artistId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const collection = yield mongodb_connection_1.mongoManager.getCollection('artists');
                const artist = yield collection.findOne({ _id: artistId });
                return artist;
            }
            catch (error) {
                console.error('Error in MongoArtistRepository.findById:', error);
                return null;
            }
        });
    }
    findAll() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const collection = yield mongodb_connection_1.mongoManager.getCollection('artists');
                const artists = yield collection.find({}).toArray();
                return artists;
            }
            catch (error) {
                console.error('Error in MongoArtistRepository.findAll:', error);
                return [];
            }
        });
    }
    findByGenre(genre) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const collection = yield mongodb_connection_1.mongoManager.getCollection('artists');
                const artists = yield collection
                    .find({ genre })
                    .sort({ artist_name: 1 })
                    .toArray();
                return artists;
            }
            catch (error) {
                console.error('Error in MongoArtistRepository.findByGenre:', error);
                return [];
            }
        });
    }
    create(artistData) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const collection = yield mongodb_connection_1.mongoManager.getCollection('artists');
                const result = yield collection.insertOne(artistData);
                return Object.assign(Object.assign({}, artistData), { _id: result.insertedId });
            }
            catch (error) {
                console.error('Error in MongoArtistRepository.create:', error);
                throw error;
            }
        });
    }
    update(artistId, updates) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const collection = yield mongodb_connection_1.mongoManager.getCollection('artists');
                const result = yield collection.findOneAndUpdate({ _id: artistId }, { $set: updates }, { returnDocument: 'after' });
                return result;
            }
            catch (error) {
                console.error('Error in MongoArtistRepository.update:', error);
                return null;
            }
        });
    }
    delete(artistId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const collection = yield mongodb_connection_1.mongoManager.getCollection('artists');
                const result = yield collection.deleteOne({ _id: artistId });
                return result.deletedCount > 0;
            }
            catch (error) {
                console.error('Error in MongoArtistRepository.delete:', error);
                return false;
            }
        });
    }
}
exports.MongoArtistRepository = MongoArtistRepository;
class MongoArenaRepository {
    findById(arenaId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const collection = yield mongodb_connection_1.mongoManager.getCollection('arenas');
                const arena = yield collection.findOne({ _id: arenaId });
                return arena;
            }
            catch (error) {
                console.error('Error in MongoArenaRepository.findById:', error);
                return null;
            }
        });
    }
    findAll() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const collection = yield mongodb_connection_1.mongoManager.getCollection('arenas');
                const arenas = yield collection.find({}).toArray();
                return arenas;
            }
            catch (error) {
                console.error('Error in MongoArenaRepository.findAll:', error);
                return [];
            }
        });
    }
    findByLocation(location) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const collection = yield mongodb_connection_1.mongoManager.getCollection('arenas');
                const arenas = yield collection
                    .find({ arena_location: { $regex: location, $options: 'i' } })
                    .sort({ arena_name: 1 })
                    .toArray();
                return arenas;
            }
            catch (error) {
                console.error('Error in MongoArenaRepository.findByLocation:', error);
                return [];
            }
        });
    }
    findZones(arenaId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const collection = yield mongodb_connection_1.mongoManager.getCollection('arenas');
                const arena = yield collection.findOne({ _id: arenaId });
                return (arena === null || arena === void 0 ? void 0 : arena.zones) || [];
            }
            catch (error) {
                console.error('Error in MongoArenaRepository.findZones:', error);
                return [];
            }
        });
    }
    create(arenaData) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const collection = yield mongodb_connection_1.mongoManager.getCollection('arenas');
                const result = yield collection.insertOne(arenaData);
                return Object.assign(Object.assign({}, arenaData), { _id: result.insertedId });
            }
            catch (error) {
                console.error('Error in MongoArenaRepository.create:', error);
                throw error;
            }
        });
    }
    update(arenaId, updates) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const collection = yield mongodb_connection_1.mongoManager.getCollection('arenas');
                const result = yield collection.findOneAndUpdate({ _id: arenaId }, { $set: updates }, { returnDocument: 'after' });
                return result;
            }
            catch (error) {
                console.error('Error in MongoArenaRepository.update:', error);
                return null;
            }
        });
    }
    delete(arenaId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const collection = yield mongodb_connection_1.mongoManager.getCollection('arenas');
                const result = yield collection.deleteOne({ _id: arenaId });
                return result.deletedCount > 0;
            }
            catch (error) {
                console.error('Error in MongoArenaRepository.delete:', error);
                return false;
            }
        });
    }
}
exports.MongoArenaRepository = MongoArenaRepository;
class MongoConcertRepository {
    findById(concertId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const collection = yield mongodb_connection_1.mongoManager.getCollection('concerts');
                const concert = yield collection.findOne({ _id: concertId });
                return concert;
            }
            catch (error) {
                console.error('Error in MongoConcertRepository.findById:', error);
                return null;
            }
        });
    }
    findAll() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const collection = yield mongodb_connection_1.mongoManager.getCollection('concerts');
                const concerts = yield collection.aggregate([
                    {
                        $lookup: {
                            from: 'arenas',
                            localField: 'arena_id',
                            foreignField: '_id',
                            as: 'arena'
                        }
                    },
                    {
                        $unwind: {
                            path: '$arena',
                            preserveNullAndEmptyArrays: true
                        }
                    },
                    {
                        $project: {
                            _id: 1,
                            concert_date: 1,
                            time: 1,
                            description: 1,
                            organizer_id: 1,
                            arena_id: 1,
                            artists: 1,
                            zone_pricing: 1,
                            arena_name: '$arena.arena_name',
                            arena_location: '$arena.arena_location'
                        }
                    }
                ]).toArray();
                return concerts;
            }
            catch (error) {
                console.error('Error in MongoConcertRepository.findAll:', error);
                // Return empty array if MongoDB is not connected
                return [];
            }
        });
    }
    findByDate(date) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const collection = yield mongodb_connection_1.mongoManager.getCollection('concerts');
                const startOfDay = new Date(date);
                startOfDay.setHours(0, 0, 0, 0);
                const endOfDay = new Date(date);
                endOfDay.setHours(23, 59, 59, 999);
                const concerts = yield collection
                    .find({
                    concert_date: {
                        $gte: startOfDay,
                        $lte: endOfDay
                    }
                })
                    .sort({ time: 1 })
                    .toArray();
                return concerts;
            }
            catch (error) {
                console.error('Error in MongoConcertRepository.findByDate:', error);
                return [];
            }
        });
    }
    findByOrganizer(organizerId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const collection = yield mongodb_connection_1.mongoManager.getCollection('concerts');
                const concerts = yield collection
                    .find({ organizer_id: organizerId })
                    .sort({ concert_date: 1 })
                    .toArray();
                return concerts;
            }
            catch (error) {
                console.error('Error in MongoConcertRepository.findByOrganizer:', error);
                return [];
            }
        });
    }
    findByArtist(artistId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const collection = yield mongodb_connection_1.mongoManager.getCollection('concerts');
                const concerts = yield collection
                    .find({ 'artists.artist_id': artistId })
                    .sort({ concert_date: 1 })
                    .toArray();
                return concerts;
            }
            catch (error) {
                console.error('Error in MongoConcertRepository.findByArtist:', error);
                return [];
            }
        });
    }
    create(concertData) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const collection = yield mongodb_connection_1.mongoManager.getCollection('concerts');
                const result = yield collection.insertOne(concertData);
                return Object.assign(Object.assign({}, concertData), { _id: result.insertedId });
            }
            catch (error) {
                console.error('Error in MongoConcertRepository.create:', error);
                throw error;
            }
        });
    }
    update(concertId, updates) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const collection = yield mongodb_connection_1.mongoManager.getCollection('concerts');
                const result = yield collection.findOneAndUpdate({ _id: concertId }, { $set: updates }, { returnDocument: 'after' });
                return result;
            }
            catch (error) {
                console.error('Error in MongoConcertRepository.update:', error);
                return null;
            }
        });
    }
    delete(concertId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const collection = yield mongodb_connection_1.mongoManager.getCollection('concerts');
                const result = yield collection.deleteOne({ _id: concertId });
                return result.deletedCount > 0;
            }
            catch (error) {
                console.error('Error in MongoConcertRepository.delete:', error);
                return false;
            }
        });
    }
    findZonePricing(concertId, arenaId, zoneName) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const collection = yield mongodb_connection_1.mongoManager.getCollection('concerts');
                const concert = yield collection.findOne({ _id: concertId });
                if (!concert || !concert.zone_pricing)
                    return null;
                const zonePrice = concert.zone_pricing.find((pricing) => pricing.zone_name === zoneName);
                return zonePrice ? Object.assign(Object.assign({}, zonePrice), { arena_id: arenaId }) : null;
            }
            catch (error) {
                console.error('Error in MongoConcertRepository.findZonePricing:', error);
                return null;
            }
        });
    }
    findAvailableTickets(concertId, zoneName) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Get concert to find arena and zone capacity
                const concertsCollection = yield mongodb_connection_1.mongoManager.getCollection('concerts');
                const concert = yield concertsCollection.findOne({ _id: concertId });
                if (!concert)
                    return 0;
                // Get arena to find zone capacity
                const arenasCollection = yield mongodb_connection_1.mongoManager.getCollection('arenas');
                const arena = yield arenasCollection.findOne({ _id: concert.arena_id });
                if (!arena || !arena.zones)
                    return 0;
                const zone = arena.zones.find((z) => z.zone_name === zoneName);
                if (!zone)
                    return 0;
                const capacity = zone.capacity_per_zone;
                // Count sold tickets
                const ticketsCollection = yield mongodb_connection_1.mongoManager.getCollection('tickets');
                const soldCount = yield ticketsCollection.countDocuments({
                    concert_id: concertId,
                    zone_name: zoneName
                });
                return capacity - soldCount;
            }
            catch (error) {
                console.error('Error in MongoConcertRepository.findAvailableTickets:', error);
                return 0;
            }
        });
    }
}
exports.MongoConcertRepository = MongoConcertRepository;
class MongoRepositoryFactory {
    constructor() {
        this.userRepository = new MongoUserRepository();
        this.artistRepository = new MongoArtistRepository();
        this.arenaRepository = new MongoArenaRepository();
        this.concertRepository = new MongoConcertRepository();
        this.ticketRepository = new MongoTicketRepository();
    }
    getUserRepository() {
        return this.userRepository;
    }
    getArtistRepository() {
        return this.artistRepository;
    }
    getArenaRepository() {
        return this.arenaRepository;
    }
    getConcertRepository() {
        return this.concertRepository;
    }
    getTicketRepository() {
        return this.ticketRepository;
    }
}
exports.MongoRepositoryFactory = MongoRepositoryFactory;
