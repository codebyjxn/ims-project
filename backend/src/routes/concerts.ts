// src/routes/clean-concerts.ts
// ========== CLEAN CONCERT ROUTES ==========
// API routes for concert operations with consistent DTOs

import { Router } from 'express';
import { ConcertController } from '../controllers/concert-controller';

const router = Router();

// GET /api/concerts - Get all concerts with filtering and pagination
router.get('/', ConcertController.getConcerts);

// GET /api/concerts/upcoming - Must be before /:id route
router.get('/upcoming', ConcertController.getUpcomingConcerts);

// GET /api/concerts/organizer/:organizerId - Must be before /:id route  
router.get('/organizer/:organizerId', ConcertController.getConcertsByOrganizer);

// GET /api/concerts/:id - Get specific concert by ID with zone information
router.get('/:id', ConcertController.getConcertById);

export default router; 