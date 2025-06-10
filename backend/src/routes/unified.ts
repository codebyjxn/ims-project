import express from 'express';
import { UnifiedController } from '../controllers/example-unified-controller';

const router = express.Router();
const unifiedController = new UnifiedController();

// Get database information (shows which DB is active)
router.get('/database-info', async (req, res) => {
  await unifiedController.getDatabaseInfo(req, res);
});

// Get all users from the active database
router.get('/users', async (req, res) => {
  await unifiedController.getAllUsers(req, res);
});

// Get user by ID from the active database
router.get('/users/:id', async (req, res) => {
  await unifiedController.getUserById(req, res);
});

// Get all concerts from the active database
router.get('/concerts', async (req, res) => {
  await unifiedController.getAllConcerts(req, res);
});

// Get all tickets from the active database
router.get('/tickets', async (req, res) => {
  await unifiedController.getAllTickets(req, res);
});

// Get tickets by user ID from the active database
router.get('/tickets/user/:userId', async (req, res) => {
  await unifiedController.getTicketsByUserId(req, res);
});

export default router; 