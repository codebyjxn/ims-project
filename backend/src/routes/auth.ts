import { Router } from 'express';
import { AuthController } from '../controllers/auth-controller';
import { migrationStatus } from '../services/migration-status';

const router = Router();
const authController = new AuthController();

// Get auth database info
router.get('/database-info', (req, res) => {
  const currentDb = migrationStatus.getDatabaseType();
  const isMigrated = migrationStatus.isMigrated();
  
  res.json({
    message: 'Authentication database information',
    currentDatabase: currentDb,
    migrated: isMigrated,
    description: `Auth system is currently using ${currentDb.toUpperCase()} database`,
    timestamp: new Date().toISOString()
  });
});

// Register new user
router.post('/signup', (req, res) => authController.signup(req, res));

// Login existing user
router.post('/login', (req, res) => authController.login(req, res));

export default router; 