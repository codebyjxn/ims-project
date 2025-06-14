"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const organizer_controller_1 = require("../controllers/organizer-controller");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
const organizerController = new organizer_controller_1.OrganizerController();
// Middleware to ensure user is an organizer
const ensureOrganizer = (req, res, next) => {
    const user = req.user;
    if (!user || user.userType !== 'organizer') {
        return res.status(403).json({ error: 'Access denied. Organizer role required.' });
    }
    next();
};
// Apply authentication to all routes
router.use(auth_1.authenticateToken);
// Get organizer's concerts
// GET /api/organizer/concerts/:organizerId
router.get('/concerts/:organizerId', ensureOrganizer, (req, res) => {
    organizerController.getOrganizerConcerts(req, res);
});
// Get organizer statistics  
// GET /api/organizer/stats/:organizerId
router.get('/stats/:organizerId', ensureOrganizer, (req, res) => {
    organizerController.getOrganizerStats(req, res);
});
// Get all arenas
// GET /api/organizer/arenas
router.get('/arenas', ensureOrganizer, (req, res) => {
    organizerController.getArenas(req, res);
});
// Get all artists
// GET /api/organizer/artists
router.get('/artists', ensureOrganizer, (req, res) => {
    organizerController.getArtists(req, res);
});
// Create a new concert
// POST /api/organizer/concerts
router.post('/concerts', ensureOrganizer, (req, res) => {
    // Ensure organizer can only create concerts for themselves
    const user = req.user;
    if (req.body.organizerId && req.body.organizerId !== user.userId) {
        return res.status(403).json({ error: 'Cannot create concerts for other organizers' });
    }
    // Set organizerId to the authenticated user's ID if not provided
    if (!req.body.organizerId) {
        req.body.organizerId = user.userId;
    }
    organizerController.createConcert(req, res);
});
// Get concert details
// GET /api/organizer/concerts/:concertId/details
router.get('/concerts/:concertId/details', ensureOrganizer, (req, res) => {
    organizerController.getConcertDetails(req, res);
});
// Update concert
// PUT /api/organizer/concerts/:concertId
router.put('/concerts/:concertId', ensureOrganizer, (req, res) => {
    organizerController.updateConcert(req, res);
});
// Delete concert
// DELETE /api/organizer/concerts/:concertId  
router.delete('/concerts/:concertId', ensureOrganizer, (req, res) => {
    organizerController.deleteConcert(req, res);
});
// Get concert analytics
// GET /api/organizer/concerts/:concertId/analytics
router.get('/concerts/:concertId/analytics', ensureOrganizer, (req, res) => {
    organizerController.getConcertAnalytics(req, res);
});
exports.default = router;
