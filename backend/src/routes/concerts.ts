import { Router } from 'express';
import { 
  getConcerts, 
  getConcertById, 
  getConcertZones, 
  getZoneAvailability,
  getUpcomingConcerts 
} from '../controllers/concert-controller';

const router = Router();

// Get all concerts with filtering and pagination
router.get('/', getConcerts);

// Get upcoming concerts only
router.get('/upcoming', getUpcomingConcerts);

// Get specific concert by ID with zone information
router.get('/:concertId', getConcertById);

// Get zones for a specific concert
router.get('/:concertId/zones', getConcertZones);

// Get availability for a specific zone in a concert
router.get('/:concertId/zones/:zoneId/availability', getZoneAvailability);

export default router; 