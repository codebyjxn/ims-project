// src/routes/clean-admin-routes.ts
// ========== CLEAN ADMIN ROUTES ==========
// Routes for admin operations following the new architecture

import { Router } from 'express';
import { CleanAdminController, requireAdminAuth } from '../controllers/clean-admin-controller';

const router = Router();

// ========== ADMIN ENDPOINTS ==========
// All endpoints require admin authentication

/**
 * Seed database with sample data
 * POST /api/admin/seed
 */
router.post('/seed', requireAdminAuth, CleanAdminController.seedDatabase);

/**
 * Migrate to MongoDB
 * POST /api/admin/migrate
 */
router.post('/migrate', requireAdminAuth, CleanAdminController.migrateToMongoDB);

/**
 * Get system status and statistics
 * GET /api/admin/status
 */
router.get('/status', requireAdminAuth, CleanAdminController.getSystemStatus);

/**
 * Reset migration status (for testing purposes)
 * POST /api/admin/reset-migration
 */
router.post('/reset-migration', requireAdminAuth, CleanAdminController.resetMigrationStatus);

export default router; 