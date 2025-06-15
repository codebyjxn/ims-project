import { Request, Response } from 'express';
import { seedDatabase } from '../scripts/seed-data';
import { migrateToMongoDB } from '../services/migration-service';
import { getPool } from '../lib/postgres';
import { 
  getUsersCollection,
  getArtistsCollection,
  getArenasCollection,
  getConcertsCollection,
  getTicketsCollection
} from '../models/mongodb-schemas';
import { migrationStatus } from '../services/migration-status';
import { DatabaseFactory } from '../lib/database-factory';
import { mongoManager } from '../lib/mongodb-connection';

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
      const usersCollection = await getUsersCollection();
      const artistsCollection = await getArtistsCollection();
      const arenasCollection = await getArenasCollection();
      const concertsCollection = await getConcertsCollection();
      const ticketsCollection = await getTicketsCollection();
      const stats = {
        users: await usersCollection.countDocuments(),
        artists: await artistsCollection.countDocuments(),
        arenas: await arenasCollection.countDocuments(),
        concerts: await concertsCollection.countDocuments(),
        tickets: await ticketsCollection.countDocuments()
      };
      // Get database size using native MongoDB commands
      const db = await mongoManager.getDatabase();
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
        const db = await mongoManager.getDatabase();
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
        const usersCollection = await getUsersCollection();
        const artistsCollection = await getArtistsCollection();
        const arenasCollection = await getArenasCollection();
        const concertsCollection = await getConcertsCollection();
        const ticketsCollection = await getTicketsCollection();
        
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

  // Get organizers analytics report based on arena performance
  async getOrganizersAnalytics(req: Request, res: Response): Promise<void> {
    try {
      const currentDb = migrationStatus.getDatabaseType();

      if (currentDb === 'mongodb') {
        // MongoDB implementation
        const organizersAnalytics = await this.getOrganizersAnalyticsFromMongoDB();
        res.json({
          database: 'MongoDB',
          analytics: organizersAnalytics,
          timestamp: new Date().toISOString()
        });
      } else {
        // PostgreSQL implementation  
        const organizersAnalytics = await this.getOrganizersAnalyticsFromPostgreSQL();
        res.json({
          database: 'PostgreSQL',
          analytics: organizersAnalytics,
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Error fetching organizers analytics:', error);
      res.status(500).json({
        error: 'Failed to fetch organizers analytics',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  private async getOrganizersAnalyticsFromPostgreSQL(): Promise<any[]> {
    const query = `
      SELECT 
        o.user_id AS org_id,
        o.organization_name AS org_name,
        o.contact_info AS contact,
        a.arena_name AS arena,
        a.arena_location AS location,
        COUNT(DISTINCT c.concert_id) AS concerts,
        COALESCE(SUM(t.purchase_price), 0) AS revenue,
        COUNT(t.ticket_id) AS tickets,
        COALESCE(AVG(t.purchase_price), 0) AS avg_price,
        COALESCE(MIN(t.purchase_price), 0) AS min_price,
        COALESCE(MAX(t.purchase_price), 0) AS max_price,
        COUNT(DISTINCT t.fan_id) AS unique_fans,
        CASE 
          WHEN COUNT(DISTINCT c.concert_id) > 0 
          THEN CAST(COUNT(t.ticket_id) AS FLOAT) / COUNT(DISTINCT c.concert_id)
          ELSE 0 
        END AS avg_tickets_per_concert
      FROM organizers o
      JOIN concerts c ON o.user_id = c.organizer_id
      JOIN arenas a ON c.arena_id = a.arena_id
      LEFT JOIN tickets t ON c.concert_id = t.concert_id
      GROUP BY o.user_id, o.organization_name, o.contact_info, a.arena_name, a.arena_location
      ORDER BY revenue DESC, concerts DESC
    `;

    const result = await getPool().query(query);
    return result.rows.map(row => ({
      orgId: row.org_id,
      orgName: row.org_name,
      contact: row.contact,
      arena: row.arena,
      location: row.location,
      concerts: parseInt(row.concerts),
      revenue: parseFloat(row.revenue) || 0,
      tickets: parseInt(row.tickets) || 0,
      avgPrice: parseFloat(row.avg_price) || 0,
      minPrice: parseFloat(row.min_price) || 0,
      maxPrice: parseFloat(row.max_price) || 0,
      uniqueFans: parseInt(row.unique_fans) || 0,
      avgTicketsPerConcert: parseFloat(row.avg_tickets_per_concert) || 0
    }));
  }

  private async getOrganizersAnalyticsFromMongoDB(): Promise<any[]> {
    try {
      const usersCollection = await getUsersCollection();
      const concertsCollection = await getConcertsCollection();
      const arenasCollection = await getArenasCollection();
      const ticketsCollection = await getTicketsCollection();

      // Aggregate organizers analytics using MongoDB aggregation pipeline
      const pipeline = [
        // Match only organizer users
        { $match: { user_type: 'organizer' } },
        
        // Lookup concerts for each organizer
        {
          $lookup: {
            from: 'concerts',
            localField: '_id',
            foreignField: 'organizer_id',
            as: 'concerts'
          }
        },
        
        // Unwind concerts to process each concert separately
        { $unwind: { path: '$concerts', preserveNullAndEmptyArrays: true } },
        
        // Lookup arena details for each concert
        {
          $lookup: {
            from: 'arenas',
            localField: 'concerts.arena_id',
            foreignField: '_id',
            as: 'arena_details'
          }
        },
        
        // Unwind arena details
        { $unwind: { path: '$arena_details', preserveNullAndEmptyArrays: true } },
        
        // Lookup tickets for each concert
        {
          $lookup: {
            from: 'tickets',
            localField: 'concerts._id',
            foreignField: 'concert_id',
            as: 'tickets'
          }
        },
        
        // Unwind tickets to calculate metrics
        { $unwind: { path: '$tickets', preserveNullAndEmptyArrays: true } },
        
        // Group by organizer and arena to match the PostgreSQL query structure
        {
          $group: {
            _id: {
              orgId: '$_id',
              orgName: '$organizer_details.organization_name',
              contact: '$organizer_details.contact_info',
              arena: '$arena_details.arena_name',
              location: '$arena_details.arena_location'
            },
            concerts: { $addToSet: '$concerts._id' },
            revenue: { 
              $sum: { 
                $toDouble: { 
                  $ifNull: [
                    { $ifNull: ['$tickets.purchase_price', '$tickets.price'] }, 
                    0
                  ] 
                } 
              } 
            },
            tickets: { $sum: { $cond: [{ $ifNull: ['$tickets._id', false] }, 1, 0] } },
            prices: { 
              $push: { 
                $toDouble: { 
                  $ifNull: [
                    { $ifNull: ['$tickets.purchase_price', '$tickets.price'] }, 
                    null
                  ] 
                } 
              } 
            },
            uniqueFans: { $addToSet: '$tickets.fan_id' }
          }
        },
        
        // Filter out groups with null arena (organizers with no concerts)
        { $match: { '_id.arena': { $ne: null } } },
        
        // Project final analytics structure
        {
          $project: {
            orgId: '$_id.orgId',
            orgName: '$_id.orgName',
            contact: '$_id.contact',
            arena: '$_id.arena',
            location: '$_id.location',
            concerts: { 
              $size: { 
                $filter: { 
                  input: '$concerts', 
                  cond: { $ne: ['$$this', null] } 
                } 
              } 
            },
            revenue: 1,
            tickets: 1,
            avgPrice: {
              $cond: [
                { $gt: ['$tickets', 0] },
                { $divide: ['$revenue', '$tickets'] },
                0
              ]
            },
            minPrice: {
              $cond: [
                { $gt: [{ $size: { $filter: { input: '$prices', cond: { $and: [{ $ne: ['$$this', null] }, { $gt: ['$$this', 0] }] } } } }, 0] },
                { $min: { $filter: { input: '$prices', cond: { $and: [{ $ne: ['$$this', null] }, { $gt: ['$$this', 0] }] } } } },
                0
              ]
            },
            maxPrice: {
              $cond: [
                { $gt: [{ $size: { $filter: { input: '$prices', cond: { $and: [{ $ne: ['$$this', null] }, { $gt: ['$$this', 0] }] } } } }, 0] },
                { $max: { $filter: { input: '$prices', cond: { $and: [{ $ne: ['$$this', null] }, { $gt: ['$$this', 0] }] } } } },
                0
              ]
            },
            uniqueFans: { $size: { $filter: { input: '$uniqueFans', cond: { $ne: ['$$this', null] } } } },
            avgTicketsPerConcert: {
              $cond: [
                { $gt: [{ $size: { $filter: { input: '$concerts', cond: { $ne: ['$$this', null] } } } }, 0] },
                { $divide: ['$tickets', { $size: { $filter: { input: '$concerts', cond: { $ne: ['$$this', null] } } } }] },
                0
              ]
            }
          }
        },
        
        // Sort by revenue descending, then by concerts descending
        { $sort: { revenue: -1, concerts: -1 } }
      ];

      const results = await usersCollection.aggregate(pipeline).toArray();
      
      return results.map(result => ({
        orgId: result.orgId,
        orgName: result.orgName || 'Unknown Organization',
        contact: result.contact || 'No contact info',
        arena: result.arena || 'No arena',
        location: result.location || 'Unknown location',
        concerts: result.concerts || 0,
        revenue: result.revenue || 0,
        tickets: result.tickets || 0,
        avgPrice: result.avgPrice || 0,
        minPrice: result.minPrice || 0,
        maxPrice: result.maxPrice || 0,
        uniqueFans: result.uniqueFans || 0,
        avgTicketsPerConcert: result.avgTicketsPerConcert || 0
      }));
    } catch (error) {
      console.error('MongoDB organizers analytics error:', error);
      throw error;
    }
  }
} 