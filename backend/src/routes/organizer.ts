import express from 'express';
import { OrganizerController } from '../controllers/organizer-controller';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();
const organizerController = new OrganizerController();

const ensureOrganizer = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const user = (req as any).user;
  if (!user || user.userType !== 'organizer') {
    res.status(403).json({ error: 'Access denied. Organizer role required.' });
    return;
  }
  next();
};

router.use(authenticateToken);

// Get organizer's concerts
router.get('/concerts/:organizerId', ensureOrganizer, (req, res) => {
  organizerController.getOrganizerConcerts(req, res);
});

// Get organizer statistics  
router.get('/stats/:organizerId', ensureOrganizer, (req, res) => {
  organizerController.getOrganizerStats(req, res);
});

// Get all arenas
router.get('/arenas', ensureOrganizer, (req, res) => {
  organizerController.getArenas(req, res);
});

// Get available arenas for a specific date
router.get('/arenas/available', ensureOrganizer, (req, res) => {
  organizerController.getAvailableArenas(req, res);
});

// Get all artists
router.get('/artists', ensureOrganizer, (req, res) => {
  organizerController.getArtists(req, res);
});

// Get available artists for a specific date
router.get('/artists/available', ensureOrganizer, (req, res) => {
  organizerController.getAvailableArtists(req, res);
});

// Create a new concert
router.post('/concerts', ensureOrganizer, (req, res) => {

  const user = (req as any).user;
  if (req.body.organizerId && req.body.organizerId !== user.userId) {
    res.status(403).json({ error: 'Cannot create concerts for other organizers' });
    return;
  }

  if (!req.body.organizerId) {
    req.body.organizerId = user.userId;
  }
  organizerController.createConcert(req, res);
});

// Get concert details
router.get('/concerts/:concertId/details', ensureOrganizer, (req, res) => {
  organizerController.getConcertDetails(req, res);
});

// Update concert
router.put('/concerts/:concertId', ensureOrganizer, (req, res) => {
  organizerController.updateConcert(req, res);
});



export default router; 