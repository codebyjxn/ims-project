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

// Get database statistics
router.get('/stats', async (req, res) => {
  await adminController.getDatabaseStats(req, res);
});

// Health check for both databases
router.get('/health', async (req, res) => {
  await adminController.healthCheck(req, res);
});

// Get migration status
router.get('/migration-status', async (req, res) => {
  await adminController.getMigrationStatus(req, res);
});

// Reset migration status (rollback to PostgreSQL)
router.post('/reset-migration', async (req, res) => {
  await adminController.resetMigrationStatus(req, res);
});

// Clear all data from databases (use with caution)
router.delete('/clear', async (req, res) => {
  await adminController.clearData(req, res);
});

export default router; 