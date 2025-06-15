import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { config } from './config';
import { getPool } from './lib/postgres';
import { mongoManager } from './lib/mongodb-connection';
import { migrationStatus } from './services/migration-status';
import { createAdminUser } from './scripts/create-admin';
import adminRoutes from './routes/admin';
import authRoutes from './routes/auth';
import concertsRoutes from './routes/concerts';
import ticketsRoutes from './routes/tickets';
import referralRoutes from './routes/referrals';
import organizerRoutes from './routes/organizer';
import analyticsRoutes from './routes/analytics';

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
app.use('/api/tickets', ticketsRoutes);
app.use('/api/concerts', concertsRoutes);
app.use('/api/referrals', referralRoutes);
app.use('/api/organizer', organizerRoutes);
app.use('/api/analytics', analyticsRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'UP', timestamp: new Date().toISOString() });
});

// API routes
app.get('/api', (req, res) => {
  res.json({ 
    message: 'Concert Booking System API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      auth: {
        signup: 'POST /api/auth/signup',
        login: 'POST /api/auth/login'
      },
      admin: {
        seed: 'POST /api/admin/seed',
        migrate: 'POST /api/admin/migrate', 
        health: 'GET /api/admin/health'
      },
      tickets: {
        validatePurchase: 'POST /api/tickets/validate-purchase',
        purchase: 'POST /api/tickets/purchase',
        myTickets: 'GET /api/tickets/my-tickets'
      },
      concerts: {
        upcoming: 'GET /api/concerts/upcoming',
        details: 'GET /api/concerts/:id'
      },
      referrals: {
        validate: 'POST /api/referrals/validate',
        apply: 'POST /api/referrals/apply'
      },
      organizer: {
        concerts: 'GET /api/organizer/concerts/:organizerId',
        stats: 'GET /api/organizer/stats/:organizerId',
        arenas: 'GET /api/organizer/arenas',
        artists: 'GET /api/organizer/artists',
        createConcert: 'POST /api/organizer/concerts',
        concertDetails: 'GET /api/organizer/concerts/:concertId/details',
        updateConcert: 'PUT /api/organizer/concerts/:concertId',
        deleteConcert: 'DELETE /api/organizer/concerts/:concertId',
        analytics: 'GET /api/organizer/concerts/:concertId/analytics'
      },
      analytics: {
        upcomingPerformance: 'GET /api/analytics/upcoming-performance'
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
    await mongoManager.connect();
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
  await mongoManager.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT signal received: closing HTTP server');
  await getPool();
  await mongoManager.close();
  process.exit(0);
});