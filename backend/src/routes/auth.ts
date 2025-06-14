import { Router } from 'express';
import { AuthController } from '../controllers/auth-controller';
import { migrationStatus } from '../services/migration-status';

const router = Router();
const authController = new AuthController();

// Register new user
router.post('/signup', (req, res) => authController.signup(req, res));

// Login existing user
router.post('/login', (req, res) => authController.login(req, res));

export default router; 