"use strict";
// src/routes/clean-concerts.ts
// ========== CLEAN CONCERT ROUTES ==========
// API routes for concert operations with consistent DTOs
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const clean_concert_controller_1 = require("../controllers/clean-concert-controller");
const router = (0, express_1.Router)();
// GET /api/concerts/upcoming - Must be before /:id route
router.get('/upcoming', clean_concert_controller_1.CleanConcertController.getUpcomingConcerts);
// GET /api/concerts/organizer/:organizerId - Must be before /:id route  
router.get('/organizer/:organizerId', clean_concert_controller_1.CleanConcertController.getConcertsByOrganizer);
// GET /api/concerts/:id - Get specific concert by ID with zone information
router.get('/:id', clean_concert_controller_1.CleanConcertController.getConcertById);
exports.default = router;
