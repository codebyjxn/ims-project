// src/controllers/clean-admin-controller.ts
// ========== CLEAN ADMIN CONTROLLER ==========
// Follows pattern: HTTP Request -> Controller -> Service -> Repository -> DB

import { Request, Response } from 'express';
import { AdminService } from '../services/admin-service';

export class CleanAdminController {

  /**
   * Seed database with sample data
   * POST /api/admin/seed
   */
  static async seedDatabase(req: Request, res: Response): Promise<void> {
    try {
      // Verify admin authorization
      if (req.user?.user_type !== 'admin') {
        res.status(403).json({
          success: false,
          error: 'Admin access required'
        });
        return;
      }

      const result = await AdminService.seedDatabase();

      res.status(200).json(result);

    } catch (error) {
      console.error('Error in seedDatabase controller:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to seed database'
      });
    }
  }

  /**
   * Migrate to MongoDB
   * POST /api/admin/migrate
   */
  static async migrateToMongoDB(req: Request, res: Response): Promise<void> {
    try {
      // Verify admin authorization
      if (req.user?.user_type !== 'admin') {
        res.status(403).json({
          success: false,
          error: 'Admin access required'
        });
        return;
      }

      const result = await AdminService.migrateToMongoDB();

      res.status(200).json(result);

    } catch (error) {
      console.error('Error in migrateToMongoDB controller:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to migrate to MongoDB'
      });
    }
  }

  /**
   * Get system status
   * GET /api/admin/status
   */
  static async getSystemStatus(req: Request, res: Response): Promise<void> {
    try {
      // Verify admin authorization
      if (req.user?.user_type !== 'admin') {
        res.status(403).json({
          success: false,
          error: 'Admin access required'
        });
        return;
      }

      const status = await AdminService.getSystemStatus();

      res.json({
        success: true,
        ...status
      });

    } catch (error) {
      console.error('Error in getSystemStatus controller:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get system status'
      });
    }
  }

  /**
   * Reset migration status (for testing)
   * POST /api/admin/reset-migration
   */
  static async resetMigrationStatus(req: Request, res: Response): Promise<void> {
    try {
      // Verify admin authorization
      if (req.user?.user_type !== 'admin') {
        res.status(403).json({
          success: false,
          error: 'Admin access required'
        });
        return;
      }

      const result = await AdminService.resetMigrationStatus();

      res.status(200).json(result);

    } catch (error) {
      console.error('Error in resetMigrationStatus controller:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to reset migration status'
      });
    }
  }
}

// ========== MIDDLEWARE ==========

/**
 * Middleware to ensure user is authenticated as admin
 */
export const requireAdminAuth = (req: Request, res: Response, next: any) => {
  try {
    const user = req.user;
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    if (user.user_type !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
    }

    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Authentication check failed'
    });
  }
}; 