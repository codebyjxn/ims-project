import { Router } from 'express';
import { AdminController } from '../controllers/admin-controller';

const router = Router();
const adminController = new AdminController();

// Seed the PostgreSQL database with test data
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

// Clear all data from databases (use with caution)
router.delete('/clear', async (req, res) => {
  await adminController.clearData(req, res);
});

export default router; 