import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { config } from './config';
import { getPool } from './lib/postgres';
import { connectMongoDB, getDatabase, closeMongoDB } from './models/mongodb-schemas';
import { migrationStatus } from './services/migration-status';
import { createAdminUser } from './scripts/create-admin';
import adminRoutes from './routes/admin';
import ticketRoutes from './routes/tickets';
import authRoutes from './routes/auth';
import unifiedRoutes from './routes/unified';
import concertRoutes from './routes/concerts';
import referralRoutes from './routes/referrals';

// Load environment variables
dotenv.config();

// Initialize express app
const app = express();

// Middleware
app.use(cors({
  origin: config.WHITELIST_ORIGINS,
  credentials: true
}));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/concerts', concertRoutes);
app.use('/api/referrals', referralRoutes);
app.use('/api/unified', unifiedRoutes); // Database-agnostic routes

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    const health = {
      status: 'OK',
      timestamp: new Date().toISOString(),
      currentDatabase: migrationStatus.getDatabaseType(),
      migrated: migrationStatus.isMigrated(),
      services: {
        postgres: 'disconnected',
        mongodb: 'disconnected'
      }
    };

    // Test PostgreSQL connection
    try {
      await getPool().query('SELECT 1');
      health.services.postgres = 'connected';
    } catch (error) {
      health.services.postgres = 'disconnected';
    }

    // Test MongoDB connection
    try {
      const db = getDatabase();
      await db.admin().ping();
      health.services.mongodb = 'connected';
    } catch (error) {
      health.services.mongodb = 'disconnected';
    }

    // Set overall status
    if (health.services.postgres === 'connected' && health.services.mongodb === 'connected') {
      health.status = 'OK';
      res.status(200).json(health);
    } else {
      health.status = 'DEGRADED';
      res.status(503).json(health);
    }
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      timestamp: new Date().toISOString(),
      error: 'Health check failed'
    });
  }
});

// API routes
app.get('/api', (req, res) => {
  res.json({ 
    message: 'Concert Booking System API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      auth: {
        databaseInfo: 'GET /api/auth/database-info',
        signup: 'POST /api/auth/signup',
        login: 'POST /api/auth/login'
      },
      admin: {
        seed: 'POST /api/admin/seed',
        migrate: 'POST /api/admin/migrate', 
        stats: 'GET /api/admin/stats',
        health: 'GET /api/admin/health',
        clear: 'DELETE /api/admin/clear'
      },
      tickets: {
        validatePurchase: 'POST /api/tickets/validate-purchase',
        purchase: 'POST /api/tickets/purchase',
        userTickets: 'GET /api/tickets/user/:userId',
        concertSummary: 'GET /api/tickets/concert/:concertId/summary'
      },
      concerts: {
        browse: 'GET /api/concerts',
        upcoming: 'GET /api/concerts/upcoming',
        details: 'GET /api/concerts/:concertId',
        zones: 'GET /api/concerts/:concertId/zones',
        zoneAvailability: 'GET /api/concerts/:concertId/zones/:zoneId/availability'
      },
      referrals: {
        validate: 'POST /api/referrals/validate',
        apply: 'POST /api/referrals/apply',
        stats: 'GET /api/referrals/stats/:fanId',
        myReferrals: 'GET /api/referrals/my-referrals/:fanId',
        awardPoints: 'POST /api/referrals/award-points',
        convertPoints: 'POST /api/referrals/convert-points'
      },
      unified: {
        databaseInfo: 'GET /api/unified/database-info',
        users: 'GET /api/unified/users',
        user: 'GET /api/unified/users/:id',
        concerts: 'GET /api/unified/concerts',
        tickets: 'GET /api/unified/tickets',
        userTickets: 'GET /api/unified/tickets/user/:userId'
      }
    }
  });
});

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something broke!' });
});

// Start server
const PORT = config.port;

const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectMongoDB();
    console.log('Connected to MongoDB');

    // Connect to PostgreSQL
    await getPool();
    console.log('Connected to PostgreSQL');

    // Display current database configuration
    const currentDbType = migrationStatus.getDatabaseType();
    const migrationInfo = migrationStatus.getStatus();
    
    console.log('\n=== DATABASE CONFIGURATION ===');
    console.log(`Current Database: ${currentDbType.toUpperCase()}`);
    console.log(`Migration Status: ${migrationInfo.migrated ? 'COMPLETED' : 'NOT MIGRATED'}`);
    if (migrationInfo.migrationDate) {
      console.log(`Migration Date: ${migrationInfo.migrationDate}`);
    }
    console.log('===============================\n');

    // Create admin user if it doesn't exist
    try {
      console.log('Ensuring admin user exists...');
      await createAdminUser();
    } catch (error) {
      console.warn('Admin user creation failed (may already exist):', (error as Error).message);
      // Don't fail startup if admin creation fails - it might already exist
    }

    // Start listening
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      console.log(`Active database: ${currentDbType}`);
      console.log('Admin user: admin@concert.com / admin123');
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM signal received: closing HTTP server');
  await getPool();
  await closeMongoDB();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT signal received: closing HTTP server');
  await getPool();
  await closeMongoDB();
  process.exit(0);
});