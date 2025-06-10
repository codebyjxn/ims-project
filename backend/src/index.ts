import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { config } from './config';
import pool from './lib/postgres';
import { connectMongoDB, getDatabase, closeMongoDB } from './models/mongodb-schemas';
import adminRoutes from './routes/admin';
import ticketRoutes from './routes/tickets';

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/admin', adminRoutes);
app.use('/api/tickets', ticketRoutes);

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    // Test PostgreSQL connection
    await pool.query('SELECT 1');
    const pgStatus = 'connected';
    
    // Test MongoDB connection
    let mongoStatus = 'disconnected';
    try {
      const db = getDatabase();
      await db.admin().ping();
      mongoStatus = 'connected';
    } catch (mongoError) {
      mongoStatus = 'disconnected';
    }

    res.json({ 
      status: 'OK', 
      timestamp: new Date().toISOString(),
      services: {
        postgres: pgStatus,
        mongodb: mongoStatus
      }
    });
  } catch (error) {
    res.status(503).json({
      status: 'ERROR',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
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
      admin: {
        seed: 'POST /api/admin/seed',
        migrate: 'POST /api/admin/migrate', 
        stats: 'GET /api/admin/stats',
        health: 'GET /api/admin/health',
        clear: 'DELETE /api/admin/clear'
      },
      tickets: {
        purchase: 'POST /api/tickets/purchase',
        userTickets: 'GET /api/tickets/user/:userId',
        concertSummary: 'GET /api/tickets/concert/:concertId/summary'
      }
    }
  });
});

// Test database connection
app.get('/api/test-db', async (req, res) => {
  try {
    // Test PostgreSQL
    const pgResult = await pool.query('SELECT NOW() as postgres_time');
    
    // Test MongoDB using native driver
    let mongoResult = null;
    let mongoError = null;
    try {
      const db = getDatabase();
      await db.admin().ping();
      const serverStatus = await db.admin().serverStatus();
      mongoResult = {
        status: 'connected',
        version: serverStatus.version,
        uptime: serverStatus.uptime
      };
    } catch (error) {
      mongoError = error instanceof Error ? error.message : 'Unknown error';
    }
    
    res.json({
      postgres: {
        status: 'connected',
        time: pgResult.rows[0].postgres_time
      },
      mongodb: mongoResult || {
        status: 'disconnected',
        error: mongoError
      }
    });
  } catch (error) {
    res.status(500).json({
      error: 'Database connection failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Connect to databases
const initializeDatabases = async () => {
  try {
    // Test PostgreSQL connection
    await pool.query('SELECT 1');
    console.log('✅ Successfully connected to PostgreSQL');
  } catch (error) {
    console.error('❌ PostgreSQL connection error:', error);
  }

  try {
    // Connect to MongoDB using native driver
    await connectMongoDB();
    console.log('✅ Successfully connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
  }
};

// Initialize databases
initializeDatabases();

// Start server
const PORT = config.port;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔧 API: http://localhost:${PORT}/api`);
  console.log(`🗄️  Database test: http://localhost:${PORT}/api/test-db`);
  console.log(`🌱 Seed DB: POST http://localhost:${PORT}/api/admin/seed`);
  console.log(`🔄 Migrate: POST http://localhost:${PORT}/api/admin/migrate`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  await closeMongoDB();
  await pool.end();
  process.exit(0);
});