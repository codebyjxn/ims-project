import { Request, Response } from 'express';
import { seedDatabase } from '../scripts/seed-data';
import { migrateToMongoDB } from '../services/migration-service';
import { getPool } from '../lib/postgres';
import { 
  getDatabase,
  getUsersCollection,
  getArtistsCollection,
  getArenasCollection,
  getConcertsCollection,
  getTicketsCollection
} from '../models/mongodb-schemas';
import { migrationStatus } from '../services/migration-status';
import { DatabaseFactory } from '../lib/database-factory';

export class AdminController {
  
  // Seed PostgreSQL with randomized data
  async seedData(req: Request, res: Response): Promise<void> {
    try {
      await seedDatabase();
      res.json({
        message: 'Database seeded successfully',
        database: 'PostgreSQL'
      });
    } catch (error) {
      console.error('Error seeding database:', error);
      res.status(500).json({ 
        error: 'Failed to seed database',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
  
  // Migrate data from PostgreSQL to MongoDB
  async migrateData(req: Request, res: Response): Promise<void> {
    try {
      const result = await migrateToMongoDB();
      res.json({
        message: 'Migration completed successfully',
        result: result
      });
    } catch (error) {
      console.error('Error during migration:', error);
      res.status(500).json({ 
        error: 'Migration failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
  
  // Get database statistics
  async getDatabaseStats(req: Request, res: Response): Promise<void> {
    try {
      // Get current database type and statistics
      const currentDbType = DatabaseFactory.getCurrentDatabaseType();
      const migrationInfo = migrationStatus.getStatus();
      
      // PostgreSQL statistics
      const postgresStats = await this.getPostgreSQLStats();

      // MongoDB statistics
      const mongoDBStats = await this.getMongoDBStats();

      // Current active database statistics
      const activeStats = currentDbType === 'mongodb' ? mongoDBStats : postgresStats;

      res.json({
        currentDatabase: currentDbType,
        migrationStatus: migrationInfo,
        activeStats,
        postgresql: postgresStats,
        mongodb: mongoDBStats,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Error fetching database stats:', error);
      res.status(500).json({ 
        error: 'Failed to fetch database statistics',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
  
  private async getPostgreSQLStats(): Promise<any> {
    try {
      // Tables in order of dependencies
      const tables = [
        'tickets',
        'concert_zone_pricing',
        'concert_features_artists',
        'concerts',
        'zones',
        'arenas',
        'artists',
        'organizers',
        'fans',
        'users'
      ];
      
      const stats: any = {};

      for (const table of tables) {
        const result = await getPool().query(`SELECT COUNT(*) as count FROM ${table}`);
        stats[table] = parseInt(result.rows[0].count);
      }

      // Additional PostgreSQL-specific stats
      const dbSizeResult = await getPool().query(`
        SELECT pg_size_pretty(pg_database_size(current_database())) as db_size
      `);
      stats.database_size = dbSizeResult.rows[0].db_size;

      // Calculate total records
      const totalRecords = Object.values(stats).reduce((sum: number, count) => sum + (count as number), 0);
      
      return { 
        connected: true, 
        totalRecords,
        tables: stats
      };
    } catch (error) {
      console.error('PostgreSQL stats error:', error);
      return { connected: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
  
  private async getMongoDBStats(): Promise<any> {
    try {
      // Use native MongoDB driver operations
      const usersCollection = getUsersCollection();
      const artistsCollection = getArtistsCollection();
      const arenasCollection = getArenasCollection();
      const concertsCollection = getConcertsCollection();
      const ticketsCollection = getTicketsCollection();
      
      const stats = {
        users: await usersCollection.countDocuments(),
        artists: await artistsCollection.countDocuments(),
        arenas: await arenasCollection.countDocuments(),
        concerts: await concertsCollection.countDocuments(),
        tickets: await ticketsCollection.countDocuments()
      };

      // Get database size using native MongoDB commands
      const db = getDatabase();
      const dbStats = await db.stats();
      
      // Calculate total records
      const totalRecords = Object.values(stats).reduce((sum: number, count) => sum + (count as number), 0);
      
      return { 
        connected: true, 
        totalRecords,
        collections: stats,
        database_size: `${Math.round(dbStats.dataSize / 1024 / 1024 * 100) / 100} MB`
      };
    } catch (error) {
      console.error('MongoDB stats error:', error);
      return { connected: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
  
  // Health check for databases
  async healthCheck(req: Request, res: Response): Promise<void> {
    try {
      const results = {
        postgres: { connected: false, error: null as any },
        mongodb: { connected: false, error: null as any },
        timestamp: new Date().toISOString()
      };

      // Test PostgreSQL
      try {
        await getPool().query('SELECT 1');
        results.postgres.connected = true;
      } catch (error) {
        results.postgres.error = error instanceof Error ? error.message : 'Unknown error';
      }

      // Test MongoDB using native driver
      try {
        const db = getDatabase();
        await db.admin().ping();
        results.mongodb.connected = true;
      } catch (error) {
        results.mongodb.error = error instanceof Error ? error.message : 'Unknown error';
      }

      const status = results.postgres.connected && results.mongodb.connected ? 200 : 503;
      res.status(status).json(results);

    } catch (error) {
      res.status(500).json({
        error: 'Health check failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
  
  // Get migration status
  async getMigrationStatus(req: Request, res: Response): Promise<void> {
    try {
      const status = migrationStatus.getStatus();
      const currentDbType = migrationStatus.getDatabaseType();
      
      res.json({
        ...status,
        currentDatabase: currentDbType,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error getting migration status:', error);
      res.status(500).json({ 
        error: 'Failed to get migration status',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Reset migration status (rollback to PostgreSQL)
  async resetMigrationStatus(req: Request, res: Response): Promise<void> {
    try {
      migrationStatus.markNotMigrated();
      
      res.json({
        message: 'Migration status reset successfully',
        currentDatabase: migrationStatus.getDatabaseType(),
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error resetting migration status:', error);
      res.status(500).json({ 
        error: 'Failed to reset migration status',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Clear all data from databases
  async clearData(req: Request, res: Response): Promise<void> {
    try {
      // Clear PostgreSQL - tables in order of dependencies
      const tables = [
        'tickets',
        'concert_zone_pricing',
        'concert_features_artists',
        'concerts',
        'zones',
        'arenas',
        'artists',
        'organizers',
        'fans'
      ];

      // Disable foreign key checks temporarily
      await getPool().query('SET session_replication_role = replica;');
      
      for (const table of tables) {
        try {
          await getPool().query(`TRUNCATE TABLE ${table} RESTART IDENTITY CASCADE`);
        } catch (error) {
          console.log(`Table ${table} might not exist yet, continuing...`);
        }
      }

      // Clear users table but preserve admin user
      await getPool().query(`DELETE FROM users WHERE email != 'admin@concert.com'`);
      
      // Re-enable foreign key checks
      await getPool().query('SET session_replication_role = DEFAULT;');

      // Clear MongoDB using native operations but preserve admin user
      try {
        const usersCollection = getUsersCollection();
        const artistsCollection = getArtistsCollection();
        const arenasCollection = getArenasCollection();
        const concertsCollection = getConcertsCollection();
        const ticketsCollection = getTicketsCollection();
        
        await Promise.all([
          usersCollection.deleteMany({ email: { $ne: 'admin@concert.com' } }), // Preserve admin
          artistsCollection.deleteMany({}),
          arenasCollection.deleteMany({}),
          concertsCollection.deleteMany({}),
          ticketsCollection.deleteMany({})
        ]);
      } catch (mongoError) {
        console.error('MongoDB clear error:', mongoError);
      }

      res.json({
        message: 'All data cleared successfully (admin user preserved)',
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Error clearing data:', error);
      res.status(500).json({
        error: 'Failed to clear data',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
} 