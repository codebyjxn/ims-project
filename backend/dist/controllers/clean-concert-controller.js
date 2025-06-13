"use strict";
// src/controllers/clean-concert-controller.ts
// ========== CLEAN CONCERT CONTROLLER ==========
// Clean API controller for concert operations with consistent DTOs
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
exports.CleanConcertController = void 0;
const concert_service_1 = require("../services/concert-service");
const data_service_1 = require("../services/data-service");
class CleanConcertController {
    /**
     * GET /api/concerts
     * Get all concerts with filtering and pagination
     */
    static getConcerts(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { limit = 20, offset = 0, city, date, genre, organizer } = req.query;
                const concerts = yield concert_service_1.ConcertService.getAllConcerts();
                // Apply filters
                let filteredConcerts = concerts;
                if (city) {
                    filteredConcerts = filteredConcerts.filter(concert => { var _a; return (_a = concert.arena_id) === null || _a === void 0 ? void 0 : _a.toLowerCase().includes(city.toLowerCase()); });
                }
                if (date) {
                    const filterDate = new Date(date);
                    filteredConcerts = filteredConcerts.filter(concert => {
                        const concertDate = new Date(concert.concert_date);
                        return concertDate.toDateString() === filterDate.toDateString();
                    });
                }
                if (genre) {
                    filteredConcerts = filteredConcerts.filter(concert => {
                        return Array.isArray(concert.artists) && concert.artists.some(artist => { var _a; return (_a = artist.genre) === null || _a === void 0 ? void 0 : _a.toLowerCase().includes(genre.toLowerCase()); });
                    });
                }
                if (organizer) {
                    filteredConcerts = filteredConcerts.filter(concert => concert.organizer_id === organizer);
                }
                // Apply pagination
                const startIndex = parseInt(offset);
                const endIndex = startIndex + parseInt(limit);
                const paginatedConcerts = filteredConcerts.slice(startIndex, endIndex);
                res.json({
                    success: true,
                    count: paginatedConcerts.length,
                    total: filteredConcerts.length,
                    concerts: paginatedConcerts,
                    pagination: {
                        limit: parseInt(limit),
                        offset: parseInt(offset),
                        hasMore: endIndex < filteredConcerts.length
                    },
                    database: data_service_1.DataService.getCurrentDatabaseType()
                });
            }
            catch (error) {
                console.error('Error fetching concerts:', error);
                res.status(500).json({
                    error: 'Failed to fetch concerts',
                    details: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        });
    }
    /**
     * GET /api/concerts/:id
     * Get concert details by ID including zone information and availability
     */
    static getConcertById(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { id } = req.params;
                if (!id) {
                    res.status(400).json({ error: 'Concert ID is required' });
                    return;
                }
                // Use ConcertService to get properly mapped data
                const concertWithDetails = yield concert_service_1.ConcertService.getConcertWithArenaDetails(id);
                if (!concertWithDetails) {
                    res.status(404).json({ error: 'Concert not found' });
                    return;
                }
                res.json({
                    success: true,
                    concert: Object.assign(Object.assign({}, concertWithDetails.concert), { arena: Object.assign(Object.assign({}, concertWithDetails.arena), { zones: concertWithDetails.zones }) }),
                    database: data_service_1.DataService.getCurrentDatabaseType()
                });
            }
            catch (error) {
                console.error('Error fetching concert:', error);
                res.status(500).json({
                    error: 'Failed to fetch concert',
                    details: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        });
    }
    /**
     * GET /api/concerts/:id/zones
     * Get zones for a specific concert with availability and pricing
     */
    static getConcertZones(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { id } = req.params;
                if (!id) {
                    res.status(400).json({ error: 'Concert ID is required' });
                    return;
                }
                // Use ConcertService to get properly mapped data
                const concertWithDetails = yield concert_service_1.ConcertService.getConcertWithArenaDetails(id);
                if (!concertWithDetails) {
                    res.status(404).json({ error: 'Concert not found' });
                    return;
                }
                res.json({
                    success: true,
                    concert_id: concertWithDetails.concert.concert_id,
                    arena_id: concertWithDetails.concert.arena_id,
                    zones: concertWithDetails.zones,
                    database: data_service_1.DataService.getCurrentDatabaseType()
                });
            }
            catch (error) {
                console.error('Error fetching concert zones:', error);
                res.status(500).json({
                    error: 'Failed to fetch zones',
                    details: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        });
    }
    /**
     * GET /api/concerts/:id/zones/:zoneName/availability
     * Get real-time availability for a specific zone
     */
    static getZoneAvailability(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { id, zoneName } = req.params;
                if (!id || !zoneName) {
                    res.status(400).json({ error: 'Concert ID and Zone Name are required' });
                    return;
                }
                // Use ConcertService to get properly mapped zone availability
                const availability = yield concert_service_1.ConcertService.getZoneAvailability(id, zoneName);
                if (!availability) {
                    res.status(404).json({ error: 'Concert or zone not found' });
                    return;
                }
                res.json(Object.assign(Object.assign({ success: true }, availability), { database: data_service_1.DataService.getCurrentDatabaseType() }));
            }
            catch (error) {
                console.error('Error fetching zone availability:', error);
                res.status(500).json({
                    error: 'Failed to fetch zone availability',
                    details: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        });
    }
    /**
     * GET /api/concerts/upcoming
     * Get upcoming concerts (future dates only)
     */
    static getUpcomingConcerts(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { limit = 10, genre } = req.query;
                // Use ConcertService to get properly mapped upcoming concerts
                const upcomingConcerts = yield concert_service_1.ConcertService.getUpcomingConcerts(limit ? parseInt(limit) : undefined, genre);
                res.json({
                    success: true,
                    count: upcomingConcerts.length,
                    total: upcomingConcerts.length,
                    concerts: upcomingConcerts,
                    database: data_service_1.DataService.getCurrentDatabaseType()
                });
            }
            catch (error) {
                console.error('Error fetching upcoming concerts:', error);
                res.status(500).json({
                    error: 'Failed to fetch upcoming concerts',
                    details: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        });
    }
    /**
     * GET /api/concerts/organizer/:organizerId
     * Get concerts by organizer ID
     */
    static getConcertsByOrganizer(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { organizerId } = req.params;
                if (!organizerId) {
                    res.status(400).json({ error: 'Organizer ID is required' });
                    return;
                }
                const concerts = yield concert_service_1.ConcertService.getConcertsByOrganizer(organizerId);
                res.json({
                    success: true,
                    count: concerts.length,
                    organizer_id: organizerId,
                    concerts,
                    database: data_service_1.DataService.getCurrentDatabaseType()
                });
            }
            catch (error) {
                console.error('Error fetching organizer concerts:', error);
                res.status(500).json({
                    error: 'Failed to fetch organizer concerts',
                    details: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        });
    }
}
exports.CleanConcertController = CleanConcertController;
