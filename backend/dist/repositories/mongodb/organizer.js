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
exports.MongoOrganizerRepository = void 0;
const mongodb_connection_1 = require("../../lib/mongodb-connection");
const uuid_1 = require("uuid");
class MongoOrganizerRepository {
    findConcertsByOrganizer(organizerId) {
        return __awaiter(this, void 0, void 0, function* () {
            const concertsCollection = yield mongodb_connection_1.mongoManager.getCollection('concerts');
            const arenasCollection = yield mongodb_connection_1.mongoManager.getCollection('arenas');
            const artistsCollection = yield mongodb_connection_1.mongoManager.getCollection('artists');
            const ticketsCollection = yield mongodb_connection_1.mongoManager.getCollection('tickets');
            // Find concerts for this organizer
            const concerts = yield concertsCollection.find({ organizer_id: organizerId }).toArray();
            for (const concert of concerts) {
                // Arena details
                const arena = yield arenasCollection.findOne({ _id: concert.arena_id });
                concert.arena_name = (arena === null || arena === void 0 ? void 0 : arena.arena_name) || '';
                concert.arena_location = (arena === null || arena === void 0 ? void 0 : arena.arena_location) || '';
                concert.arena_capacity = (arena === null || arena === void 0 ? void 0 : arena.total_capacity) || 0;
                // Tickets sold and revenue
                const tickets = yield ticketsCollection.find({ concert_id: concert._id }).toArray();
                concert.tickets_sold = tickets.length;
                concert.total_revenue = (concert.zone_pricing || []).reduce((sum, zp) => sum + (zp.price * tickets.filter((t) => t.zone_name === zp.zone_name).length), 0);
                // Status
                const now = new Date();
                const concertDate = new Date(concert.concert_date);
                concert.status = concertDate > now ? 'upcoming' : (concertDate.toDateString() === now.toDateString() ? 'ongoing' : 'completed');
                // Artists
                concert.artists = [];
                if (concert.artists && Array.isArray(concert.artists)) {
                    for (const artistId of concert.artists) {
                        const artist = yield artistsCollection.findOne({ _id: artistId });
                        if (artist) {
                            concert.artists.push({
                                artist_id: artist._id,
                                artist_name: artist.artist_name,
                                genre: artist.genre,
                            });
                        }
                    }
                }
            }
            return concerts;
        });
    }
    getStats(organizerId) {
        return __awaiter(this, void 0, void 0, function* () {
            const concertsCollection = yield mongodb_connection_1.mongoManager.getCollection('concerts');
            const ticketsCollection = yield mongodb_connection_1.mongoManager.getCollection('tickets');
            const concerts = yield concertsCollection.find({ organizer_id: organizerId }).toArray();
            const totalConcerts = concerts.length;
            const now = new Date();
            const upcomingConcerts = concerts.filter((c) => new Date(c.concert_date) > now).length;
            const concertIds = concerts.map((c) => c._id);
            const tickets = yield ticketsCollection.find({ concert_id: { $in: concertIds } }).toArray();
            const totalTicketsSold = tickets.length;
            let totalRevenue = 0;
            for (const concert of concerts) {
                for (const zp of (concert.zone_pricing || [])) {
                    totalRevenue += zp.price * tickets.filter((t) => t.concert_id === concert._id && t.zone_name === zp.zone_name).length;
                }
            }
            const averageAttendance = totalConcerts > 0 ? parseFloat((totalTicketsSold / totalConcerts).toFixed(2)) : 0;
            return {
                totalConcerts,
                upcomingConcerts,
                totalTicketsSold,
                totalRevenue,
                averageAttendance,
            };
        });
    }
    getArenas() {
        return __awaiter(this, void 0, void 0, function* () {
            const arenasCollection = yield mongodb_connection_1.mongoManager.getCollection('arenas');
            const arenas = yield arenasCollection.find({}).toArray();
            return arenas.map((arena) => ({
                arena_id: arena._id,
                arena_name: arena.arena_name,
                arena_location: arena.arena_location,
                total_capacity: arena.total_capacity,
                zones: (arena.zones || []).map((zone) => ({
                    zone_name: zone.zone_name,
                    capacity_per_zone: zone.capacity_per_zone,
                })),
            }));
        });
    }
    getArtists() {
        return __awaiter(this, void 0, void 0, function* () {
            const artistsCollection = yield mongodb_connection_1.mongoManager.getCollection('artists');
            const artists = yield artistsCollection.find({}).toArray();
            return artists.map((artist) => ({
                artist_id: artist._id,
                artist_name: artist.artist_name,
                genre: artist.genre,
            }));
        });
    }
    createConcert(concertData) {
        return __awaiter(this, void 0, void 0, function* () {
            const concertsCollection = yield mongodb_connection_1.mongoManager.getCollection('concerts');
            const artistsCollection = yield mongodb_connection_1.mongoManager.getCollection('artists');
            // Generate UUID for _id if not provided
            const concertId = concertData._id || (0, uuid_1.v4)();
            // Prepare artists as embedded objects
            let artists = [];
            if (Array.isArray(concertData.artists) && concertData.artists.length > 0) {
                if (typeof concertData.artists[0] === 'string') {
                    // Array of IDs, fetch full artist objects
                    const artistDocs = yield artistsCollection.find({ _id: { $in: concertData.artists } }).toArray();
                    artists = artistDocs.map(artist => ({
                        artist_id: artist._id,
                        artist_name: artist.artist_name,
                        genre: artist.genre
                    }));
                }
                else if (typeof concertData.artists[0] === 'object') {
                    // Already objects, but ensure correct shape
                    artists = concertData.artists.map((artist) => ({
                        artist_id: artist.artist_id || artist._id,
                        artist_name: artist.artist_name,
                        genre: artist.genre
                    }));
                }
            }
            // Prepare zone_pricing as array of objects with correct types
            let zone_pricing = [];
            if (Array.isArray(concertData.zones)) {
                zone_pricing = concertData.zones.map((zone) => ({
                    zone_name: zone.zone_name,
                    price: typeof zone.price === 'string' ? parseFloat(zone.price) : zone.price
                }));
            }
            else if (Array.isArray(concertData.zone_pricing)) {
                zone_pricing = concertData.zone_pricing.map((zp) => ({
                    zone_name: zp.zone_name,
                    price: typeof zp.price === 'string' ? parseFloat(zp.price) : zp.price
                }));
            }
            // Build the concert document to insert
            const doc = {
                _id: concertId,
                concert_date: new Date(concertData.date || concertData.concert_date),
                time: concertData.time,
                description: concertData.description,
                organizer_id: concertData.organizerId || concertData.organizer_id,
                arena_id: concertData.arenaId || concertData.arena_id,
                artists,
                zone_pricing
            };
            const result = yield concertsCollection.insertOne(doc);
            return Object.assign(Object.assign({}, doc), { _id: result.insertedId });
        });
    }
    getArenasAnalytics(organizerId) {
        return __awaiter(this, void 0, void 0, function* () {
            const concertsCollection = yield mongodb_connection_1.mongoManager.getCollection('concerts');
            const ticketsCollection = yield mongodb_connection_1.mongoManager.getCollection('tickets');
            const arenasCollection = yield mongodb_connection_1.mongoManager.getCollection('arenas');
            // Get all concerts for this organizer
            const concerts = yield concertsCollection.find({ organizer_id: organizerId }).toArray();
            const arenaIds = [...new Set(concerts.map((c) => c.arena_id))];
            const analytics = [];
            for (const arenaId of arenaIds) {
                const arena = yield arenasCollection.findOne({ _id: arenaId });
                if (!arena)
                    continue;
                // Get all zones for this arena
                const zones = (arena.zones || []).map((zone) => ({
                    zone_name: zone.zone_name,
                    capacity_per_zone: zone.capacity_per_zone
                }));
                // For each zone, get tickets sold and revenue for this organizer
                for (const zone of zones) {
                    // Find all concerts by this organizer in this arena and zone
                    const concertIds = concerts.filter((c) => c.arena_id === arenaId).map((c) => c._id);
                    const tickets = yield ticketsCollection.find({ concert_id: { $in: concertIds }, zone_name: zone.zone_name }).toArray();
                    zone.tickets_sold = tickets.length;
                    // Find price from concert's zone_pricing
                    let revenue = 0;
                    for (const c of concerts.filter((c) => c.arena_id === arenaId)) {
                        const zp = (c.zone_pricing || []).find((z) => z.zone_name === zone.zone_name);
                        if (zp) {
                            revenue += (tickets.filter((t) => t.concert_id === c._id).length) * zp.price;
                        }
                    }
                    zone.revenue = revenue;
                }
                analytics.push({
                    arena_id: arena._id,
                    arena_name: arena.arena_name,
                    arena_location: arena.arena_location,
                    total_capacity: arena.total_capacity,
                    zones
                });
            }
            return analytics;
        });
    }
}
exports.MongoOrganizerRepository = MongoOrganizerRepository;
