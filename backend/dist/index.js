"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const config_1 = require("./config");
const postgres_1 = require("./lib/postgres");
const mongodb_schemas_1 = require("./models/mongodb-schemas");
const migration_status_1 = require("./services/migration-status");
const create_admin_1 = require("./scripts/create-admin");
const admin_1 = __importDefault(require("./routes/admin"));
const auth_1 = __importDefault(require("./routes/auth"));
const clean_concerts_1 = __importDefault(require("./routes/clean-concerts"));
const clean_ticket_routes_1 = __importDefault(require("./routes/clean-ticket-routes"));
const referrals_1 = __importDefault(require("./routes/referrals"));
const organizer_1 = __importDefault(require("./routes/organizer"));
const analytics_1 = __importDefault(require("./routes/analytics"));
// Load environment variables
dotenv_1.default.config();
// Initialize express app
const app = (0, express_1.default)();
// Middleware
app.use((0, cors_1.default)({
    origin: config_1.config.WHITELIST_ORIGINS,
    credentials: true
}));
app.use(express_1.default.json());
// Routes
app.use('/api/auth', auth_1.default);
app.use('/api/admin', admin_1.default);
app.use('/api/tickets', clean_ticket_routes_1.default);
app.use('/api/concerts', clean_concerts_1.default);
app.use('/api/referrals', referrals_1.default);
app.use('/api/organizer', organizer_1.default);
app.use('/api/analytics', analytics_1.default);
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
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something broke!' });
});
// Start server
const PORT = config_1.config.port;
const startServer = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Connect to MongoDB
        yield (0, mongodb_schemas_1.connectMongoDB)();
        console.log('Connected to MongoDB');
        // Connect to PostgreSQL
        yield (0, postgres_1.getPool)();
        console.log('Connected to PostgreSQL');
        // Display current database configuration
        const currentDbType = migration_status_1.migrationStatus.getDatabaseType();
        const migrationInfo = migration_status_1.migrationStatus.getStatus();
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
            yield (0, create_admin_1.createAdminUser)();
        }
        catch (error) {
            console.warn('Admin user creation failed (may already exist):', error.message);
            // Don't fail startup if admin creation fails - it might already exist
        }
        // Start listening
        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
            console.log(`Active database: ${currentDbType}`);
            console.log('Admin user: admin@concert.com / admin123');
        });
    }
    catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
});
startServer();
// Handle graceful shutdown
process.on('SIGTERM', () => __awaiter(void 0, void 0, void 0, function* () {
    console.log('SIGTERM signal received: closing HTTP server');
    yield (0, postgres_1.getPool)();
    yield (0, mongodb_schemas_1.closeMongoDB)();
    process.exit(0);
}));
process.on('SIGINT', () => __awaiter(void 0, void 0, void 0, function* () {
    console.log('SIGINT signal received: closing HTTP server');
    yield (0, postgres_1.getPool)();
    yield (0, mongodb_schemas_1.closeMongoDB)();
    process.exit(0);
}));
