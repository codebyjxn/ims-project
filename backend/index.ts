import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { config } from './config';
import { getPool } from './lib/postgres';
import { connectMongoDB, getDatabase, closeMongoDB } from './models/mongodb-schemas';
import { mongoManager } from './lib/mongodb-connection';
import { migrationStatus } from './services/migration-status';
import { createAdminUser } from './scripts/create-admin';
import adminRoutes from './routes/admin';
import authRoutes from './routes/auth';
import cleanConcertRoutes from './routes/clean-concerts';
import cleanTicketRoutes from './routes/clean-ticket-routes';
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
app.use('/api/tickets', cleanTicketRoutes);
app.use('/api/concerts', cleanConcertRoutes);
app.use('/api/referrals', referralRoutes);
app.use('/api/organizer', organizerRoutes);
app.use('/api/analytics', analyticsRoutes);

// Health check endpoint
app.get('/health', async (req, res) => {
  res.json({
    status: 'OK',
    message: 'Server is running',
    endpoints: {
      login: 'POST /api/auth/login',
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
        myTickets: 'GET /api/tickets/my-tickets',
        userTickets: 'GET /api/tickets/user/:userId'
      },
      concerts: {
        upcoming: 'GET /api/concerts/upcoming',
        details: 'GET /api/concerts/:id'
      },
      referrals: {
        validate: 'POST /api/referrals/validate',
        deleteConcert: 'DELETE /api/organizer/concerts/:concertId',
        analytics: 'GET /api/organizer/concerts/:concertId/analytics'
      }
    }
  });
});

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  // ... existing code ...
}); 