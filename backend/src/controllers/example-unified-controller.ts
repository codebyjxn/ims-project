import { Request, Response } from 'express';
import { DataService } from '../services/data-service';

/**
 * Example controller that demonstrates unified database access
 * This controller works with both PostgreSQL and MongoDB transparently
 * based on the migration status flag
 */
export class UnifiedController {
  
  /**
   * Get all users - works with both databases
   */
  async getAllUsers(req: Request, res: Response): Promise<void> {
    try {
      const users = await DataService.getAllUsers();
      const currentDb = DataService.getCurrentDatabaseType();
      
      res.json({
        database: currentDb,
        migrated: DataService.isMigrated(),
        count: users.length,
        users: users
      });
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({ 
        error: 'Failed to fetch users',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get user by ID - works with both databases
   */
  async getUserById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const user = await DataService.getUserById(id);
      const currentDb = DataService.getCurrentDatabaseType();
      
      if (!user) {
        res.status(404).json({ 
          error: 'User not found',
          database: currentDb
        });
        return;
      }

      res.json({
        database: currentDb,
        migrated: DataService.isMigrated(),
        user: user
      });
    } catch (error) {
      console.error('Error fetching user:', error);
      res.status(500).json({ 
        error: 'Failed to fetch user',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get all concerts - works with both databases
   */
  async getAllConcerts(req: Request, res: Response): Promise<void> {
    try {
      const concerts = await DataService.getAllConcerts();
      const currentDb = DataService.getCurrentDatabaseType();
      
      res.json({
        database: currentDb,
        migrated: DataService.isMigrated(),
        count: concerts.length,
        concerts: concerts
      });
    } catch (error) {
      console.error('Error fetching concerts:', error);
      res.status(500).json({ 
        error: 'Failed to fetch concerts',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get all tickets - works with both databases
   */
  async getAllTickets(req: Request, res: Response): Promise<void> {
    try {
      const tickets = await DataService.getAllTickets();
      const currentDb = DataService.getCurrentDatabaseType();
      
      res.json({
        database: currentDb,
        migrated: DataService.isMigrated(),
        count: tickets.length,
        tickets: tickets
      });
    } catch (error) {
      console.error('Error fetching tickets:', error);
      res.status(500).json({ 
        error: 'Failed to fetch tickets',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get tickets by user ID - works with both databases
   */
  async getTicketsByUserId(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const tickets = await DataService.getTicketsByUserId(userId);
      const currentDb = DataService.getCurrentDatabaseType();
      
      res.json({
        database: currentDb,
        migrated: DataService.isMigrated(),
        userId: userId,
        count: tickets.length,
        tickets: tickets
      });
    } catch (error) {
      console.error('Error fetching user tickets:', error);
      res.status(500).json({ 
        error: 'Failed to fetch user tickets',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get database info - shows which database is currently active
   */
  async getDatabaseInfo(req: Request, res: Response): Promise<void> {
    try {
      const currentDb = DataService.getCurrentDatabaseType();
      const isMigrated = DataService.isMigrated();
      const stats = await DataService.getStats();
      
      res.json({
        currentDatabase: currentDb,
        migrated: isMigrated,
        stats: stats,
        message: `Currently using ${currentDb.toUpperCase()} database${isMigrated ? ' (migrated)' : ' (original)'}`,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error fetching database info:', error);
      res.status(500).json({ 
        error: 'Failed to fetch database info',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
} 