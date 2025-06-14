import express from 'express';
import { AdminController } from '../controllers/admin-controller';
import { authenticateToken, isAdmin } from '../middleware/auth';

const router = express.Router();
const adminController = new AdminController();

// Apply authentication and admin check to all admin routes
router.use(authenticateToken);
router.use(isAdmin);

// Seed PostgreSQL database
router.post('/seed', async (req, res) => {
  await adminController.seedData(req, res);
});

// Migrate data from PostgreSQL to MongoDB
router.post('/migrate', async (req, res) => {
  await adminController.migrateData(req, res);
});

// Health check for both databases
router.get('/health', async (req, res) => {
  await adminController.healthCheck(req, res);
});

// Get organizers analytics report
router.get('/organizers-analytics', async (req, res) => {
  await adminController.getOrganizersAnalytics(req, res);
});

export default router; 