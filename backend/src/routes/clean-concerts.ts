// src/routes/clean-concerts.ts
// ========== CLEAN CONCERT ROUTES ==========
// API routes for concert operations with consistent DTOs

import { Router } from 'express';
import { CleanConcertController } from '../controllers/clean-concert-controller';

const router = Router();

// GET /api/concerts/upcoming - Must be before /:id route
router.get('/upcoming', CleanConcertController.getUpcomingConcerts);

// GET /api/concerts/organizer/:organizerId - Must be before /:id route  
router.get('/organizer/:organizerId', CleanConcertController.getConcertsByOrganizer);

// GET /api/concerts - Get all concerts with filtering and pagination
router.get('/', CleanConcertController.getConcerts);

// GET /api/concerts/:id - Get specific concert by ID with zone information
router.get('/:id', CleanConcertController.getConcertById);

// GET /api/concerts/:id/zones - Get zones for a specific concert
router.get('/:id/zones', CleanConcertController.getConcertZones);

// GET /api/concerts/:id/zones/:zoneName/availability - Get zone availability
router.get('/:id/zones/:zoneName/availability', CleanConcertController.getZoneAvailability);

export default router; 