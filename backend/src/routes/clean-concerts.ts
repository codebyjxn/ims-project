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

// GET /api/concerts/:id - Get specific concert by ID with zone information
router.get('/:id', CleanConcertController.getConcertById);

export default router; 