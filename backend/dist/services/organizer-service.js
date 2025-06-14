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
exports.OrganizerService = void 0;
const factory_1 = require("../repositories/factory");
class OrganizerService {
    static getOrganizerConcerts(organizerId) {
        return __awaiter(this, void 0, void 0, function* () {
            const factory = factory_1.RepositoryFactory.getFactory();
            const organizerRepo = factory.getOrganizerRepository();
            const concerts = yield organizerRepo.findConcertsByOrganizer(organizerId);
            return concerts.map((concert) => ({
                concert_id: concert.concert_id,
                title: concert.title,
                date: concert.date,
                time: concert.time,
                arena: {
                    name: concert.arena_name || (concert.arena && concert.arena.name),
                    location: concert.arena_location || (concert.arena && concert.arena.location),
                    capacity: concert.arena_capacity || (concert.arena && concert.arena.capacity),
                },
                tickets_sold: concert.tickets_sold,
                total_revenue: concert.total_revenue,
                status: concert.status,
                artists: (concert.artists || []).map((artist) => ({
                    artist_id: artist.artist_id || artist._id || '',
                    artist_name: artist.name || artist.artist_name || '',
                    genre: artist.genre || '',
                })),
            }));
        });
    }
    static getOrganizerStats(organizerId) {
        return __awaiter(this, void 0, void 0, function* () {
            const factory = factory_1.RepositoryFactory.getFactory();
            const organizerRepo = factory.getOrganizerRepository();
            const stats = yield organizerRepo.getStats(organizerId);
            return {
                totalConcerts: stats.totalConcerts,
                upcomingConcerts: stats.upcomingConcerts,
                totalTicketsSold: stats.totalTicketsSold,
                totalRevenue: stats.totalRevenue,
                averageAttendance: stats.averageAttendance,
            };
        });
    }
    static getArenas() {
        return __awaiter(this, void 0, void 0, function* () {
            const factory = factory_1.RepositoryFactory.getFactory();
            const organizerRepo = factory.getOrganizerRepository();
            const arenas = yield organizerRepo.getArenas();
            return arenas.map((arena) => ({
                arena_id: arena.arena_id,
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
    static getArtists() {
        return __awaiter(this, void 0, void 0, function* () {
            const factory = factory_1.RepositoryFactory.getFactory();
            const organizerRepo = factory.getOrganizerRepository();
            const artists = yield organizerRepo.getArtists();
            return artists.map((artist) => ({
                artist_id: artist.artist_id || artist._id || '',
                artist_name: artist.artist_name || artist.name || '',
                genre: artist.genre || '',
            }));
        });
    }
    static createConcert(concertData) {
        return __awaiter(this, void 0, void 0, function* () {
            const factory = factory_1.RepositoryFactory.getFactory();
            const organizerRepo = factory.getOrganizerRepository();
            return yield organizerRepo.createConcert(concertData);
        });
    }
    static getArenasAnalytics(organizerId) {
        return __awaiter(this, void 0, void 0, function* () {
            const factory = factory_1.RepositoryFactory.getFactory();
            const organizerRepo = factory.getOrganizerRepository();
            return yield organizerRepo.getArenasAnalytics(organizerId);
        });
    }
}
exports.OrganizerService = OrganizerService;
