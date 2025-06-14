"use strict";
// src/services/concert-service.ts
// ========== CONCERT SERVICE ==========
// Contains business logic for concert operations with proper DTO mapping
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
exports.ConcertService = void 0;
const factory_1 = require("../repositories/factory");
class ConcertService {
    /**
     * Get concert by ID with proper DTO mapping
     */
    static getConcertById(concertId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const factory = factory_1.RepositoryFactory.getFactory();
                const concertRepo = factory.getConcertRepository();
                const concert = yield concertRepo.findById(concertId);
                if (!concert)
                    return null;
                return this.mapToConcertDTO(concert);
            }
            catch (error) {
                console.error('Error in ConcertService.getConcertById:', error);
                return null;
            }
        });
    }
    /**
     * Get all concerts with proper DTO mapping
     */
    static getAllConcerts() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const factory = factory_1.RepositoryFactory.getFactory();
                const concertRepo = factory.getConcertRepository();
                const concerts = yield concertRepo.findAll();
                return concerts.map(concert => this.mapToConcertDTO(concert));
            }
            catch (error) {
                console.error('Error in ConcertService.getAllConcerts:', error);
                return [];
            }
        });
    }
    /**
     * Get concerts by organizer with proper DTO mapping
     */
    static getConcertsByOrganizer(organizerId) {
        return __awaiter(this, void 0, void 0, function* () {
            const factory = factory_1.RepositoryFactory.getFactory();
            const concertRepo = factory.getConcertRepository();
            const concerts = yield concertRepo.findByOrganizer(organizerId);
            return concerts.map(concert => this.mapToConcertDTO(concert));
        });
    }
    /**
     * Get upcoming concerts with proper DTO mapping and arena details
     */
    static getUpcomingConcerts(limit, genre) {
        return __awaiter(this, void 0, void 0, function* () {
            const factory = factory_1.RepositoryFactory.getFactory();
            const concertRepo = factory.getConcertRepository();
            const arenaRepo = factory.getArenaRepository();
            const allConcerts = yield concertRepo.findAll();
            const now = new Date();
            // Filter for upcoming concerts
            let upcomingConcerts = allConcerts.filter((concert) => {
                const concertDate = new Date(concert.concert_date);
                return concertDate > now;
            });
            // Filter by genre if specified
            if (genre) {
                upcomingConcerts = upcomingConcerts.filter((concert) => {
                    const artists = concert.artists || [];
                    return Array.isArray(artists) && artists.some((artist) => { var _a; return (_a = artist.genre) === null || _a === void 0 ? void 0 : _a.toLowerCase().includes(genre.toLowerCase()); });
                });
            }
            // Sort by date (earliest first)
            upcomingConcerts.sort((a, b) => new Date(a.concert_date).getTime() - new Date(b.concert_date).getTime());
            // Apply limit if specified
            if (limit) {
                upcomingConcerts = upcomingConcerts.slice(0, limit);
            }
            // Map concerts with enhanced data including arena details
            const enhancedConcerts = yield Promise.all(upcomingConcerts.map((concert) => __awaiter(this, void 0, void 0, function* () {
                const concertDTO = this.mapToConcertDTO(concert);
                // Fetch arena details
                let arena = null;
                try {
                    const arenaData = yield arenaRepo.findById(concert.arena_id);
                    if (arenaData) {
                        arena = this.mapToArenaDTO(arenaData);
                    }
                }
                catch (error) {
                    console.warn(`Failed to fetch arena for concert ${concert.concert_id || concert._id}:`, error);
                }
                // Generate concert name from description or use default
                const concert_name = concert.description
                    ? concert.description.split('.')[0].substring(0, 50) + (concert.description.length > 50 ? '...' : '')
                    : `Concert at ${(arena === null || arena === void 0 ? void 0 : arena.arena_name) || 'TBD'}`;
                return Object.assign(Object.assign({}, concertDTO), { concert_name,
                    arena, arena_capacity: arena === null || arena === void 0 ? void 0 : arena.total_capacity });
            })));
            return enhancedConcerts;
        });
    }
    /**
     * Get concert with arena details and zone availability
     */
    static getConcertWithArenaDetails(concertId) {
        return __awaiter(this, void 0, void 0, function* () {
            const factory = factory_1.RepositoryFactory.getFactory();
            const concertRepo = factory.getConcertRepository();
            const arenaRepo = factory.getArenaRepository();
            const ticketRepo = factory.getTicketRepository();
            const concert = yield concertRepo.findById(concertId);
            if (!concert)
                return null;
            const arena = yield arenaRepo.findById(concert.arena_id);
            if (!arena)
                return null;
            const concertDTO = this.mapToConcertDTO(concert);
            const arenaDTO = this.mapToArenaDTO(arena);
            // Get zone availability information
            const zones = yield Promise.all(arenaDTO.zones.map((zone) => __awaiter(this, void 0, void 0, function* () {
                const availableTickets = yield concertRepo.findAvailableTickets(concertId, zone.zone_name);
                const soldTickets = zone.capacity_per_zone - availableTickets;
                const availabilityPercentage = Math.round((availableTickets / zone.capacity_per_zone) * 100);
                // Get pricing for this zone
                const zonePricing = concertDTO.zone_pricing.find(p => p.zone_name === zone.zone_name);
                const price = (zonePricing === null || zonePricing === void 0 ? void 0 : zonePricing.price) || 0;
                return {
                    zone_name: zone.zone_name,
                    capacity_per_zone: zone.capacity_per_zone,
                    price,
                    available_tickets: availableTickets,
                    sold_tickets: soldTickets,
                    availability_percentage: availabilityPercentage
                };
            })));
            return {
                concert: concertDTO,
                arena: arenaDTO,
                zones
            };
        });
    }
    /**
     * Get zone availability for a specific concert and zone
     */
    static getZoneAvailability(concertId, zoneName) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const factory = factory_1.RepositoryFactory.getFactory();
            const concertRepo = factory.getConcertRepository();
            const arenaRepo = factory.getArenaRepository();
            const concert = yield concertRepo.findById(concertId);
            if (!concert)
                return null;
            const arena = yield arenaRepo.findById(concert.arena_id);
            if (!arena)
                return null;
            const zone = (_a = arena.zones) === null || _a === void 0 ? void 0 : _a.find((z) => z.zone_name === zoneName);
            if (!zone)
                return null;
            const availableTickets = yield concertRepo.findAvailableTickets(concertId, zoneName);
            const soldTickets = zone.capacity_per_zone - availableTickets;
            const availabilityPercentage = Math.round((availableTickets / zone.capacity_per_zone) * 100);
            // Get pricing
            const concertDTO = this.mapToConcertDTO(concert);
            const zonePricing = concertDTO.zone_pricing.find(p => p.zone_name === zoneName);
            const price = (zonePricing === null || zonePricing === void 0 ? void 0 : zonePricing.price) || 0;
            return {
                concert_id: concertDTO.concert_id,
                zone_name: zoneName,
                capacity: zone.capacity_per_zone,
                available_tickets: availableTickets,
                sold_tickets: soldTickets,
                availability_percentage: availabilityPercentage,
                price
            };
        });
    }
    // ========== PRIVATE MAPPING METHODS ==========
    /**
     * Map database concert object to ConcertDTO with normalized IDs
     */
    static mapToConcertDTO(concert) {
        return {
            concert_id: concert.concert_id || concert._id, // Normalize ID field
            concert_date: concert.concert_date instanceof Date
                ? concert.concert_date.toISOString()
                : concert.concert_date,
            time: concert.time,
            description: concert.description,
            organizer_id: concert.organizer_id,
            arena_id: concert.arena_id,
            artists: (concert.artists || []).map((artist) => ({
                artist_id: artist.artist_id || artist._id,
                artist_name: artist.artist_name,
                genre: artist.genre
            })),
            zone_pricing: (concert.zone_pricing || []).map((pricing) => ({
                zone_name: pricing.zone_name,
                price: pricing.price
            }))
        };
    }
    /**
     * Map database arena object to ArenaDTO with normalized IDs
     */
    static mapToArenaDTO(arena) {
        return {
            arena_id: arena.arena_id || arena._id, // Normalize ID field
            arena_name: arena.arena_name,
            arena_location: arena.arena_location,
            total_capacity: arena.total_capacity,
            zones: (arena.zones || []).map((zone) => ({
                zone_name: zone.zone_name,
                capacity_per_zone: zone.capacity_per_zone
            }))
        };
    }
}
exports.ConcertService = ConcertService;
