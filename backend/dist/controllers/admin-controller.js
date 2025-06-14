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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminController = void 0;
const seed_data_1 = require("../scripts/seed-data");
const migration_service_1 = require("../services/migration-service");
const postgres_1 = require("../lib/postgres");
const mongodb_schemas_1 = require("../models/mongodb-schemas");
const migration_status_1 = require("../services/migration-status");
const database_factory_1 = require("../lib/database-factory");
class AdminController {
    // Seed PostgreSQL with randomized data
    seedData(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield (0, seed_data_1.seedDatabase)();
                res.json({
                    message: 'Database seeded successfully',
                    database: 'PostgreSQL'
                });
            }
            catch (error) {
                console.error('Error seeding database:', error);
                res.status(500).json({
                    error: 'Failed to seed database',
                    details: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        });
    }
    // Migrate data from PostgreSQL to MongoDB
    migrateData(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const result = yield (0, migration_service_1.migrateToMongoDB)();
                res.json({
                    message: 'Migration completed successfully',
                    result: result
                });
            }
            catch (error) {
                console.error('Error during migration:', error);
                res.status(500).json({
                    error: 'Migration failed',
                    details: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        });
    }
    // Get database statistics
    getDatabaseStats(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Get current database type and statistics
                const currentDbType = database_factory_1.DatabaseFactory.getCurrentDatabaseType();
                const migrationInfo = migration_status_1.migrationStatus.getStatus();
                // PostgreSQL statistics
                const postgresStats = yield this.getPostgreSQLStats();
                // MongoDB statistics
                const mongoDBStats = yield this.getMongoDBStats();
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
            }
            catch (error) {
                console.error('Error fetching database stats:', error);
                res.status(500).json({
                    error: 'Failed to fetch database statistics',
                    details: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        });
    }
    getPostgreSQLStats() {
        return __awaiter(this, void 0, void 0, function* () {
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
                const stats = {};
                for (const table of tables) {
                    const result = yield (0, postgres_1.getPool)().query(`SELECT COUNT(*) as count FROM ${table}`);
                    stats[table] = parseInt(result.rows[0].count);
                }
                // Additional PostgreSQL-specific stats
                const dbSizeResult = yield (0, postgres_1.getPool)().query(`
        SELECT pg_size_pretty(pg_database_size(current_database())) as db_size
      `);
                stats.database_size = dbSizeResult.rows[0].db_size;
                // Calculate total records
                const totalRecords = Object.values(stats).reduce((sum, count) => sum + count, 0);
                return {
                    connected: true,
                    totalRecords,
                    tables: stats
                };
            }
            catch (error) {
                console.error('PostgreSQL stats error:', error);
                return { connected: false, error: error instanceof Error ? error.message : 'Unknown error' };
            }
        });
    }
    getMongoDBStats() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Use native MongoDB driver operations
                const usersCollection = (0, mongodb_schemas_1.getUsersCollection)();
                const artistsCollection = (0, mongodb_schemas_1.getArtistsCollection)();
                const arenasCollection = (0, mongodb_schemas_1.getArenasCollection)();
                const concertsCollection = (0, mongodb_schemas_1.getConcertsCollection)();
                const ticketsCollection = (0, mongodb_schemas_1.getTicketsCollection)();
                const stats = {
                    users: yield usersCollection.countDocuments(),
                    artists: yield artistsCollection.countDocuments(),
                    arenas: yield arenasCollection.countDocuments(),
                    concerts: yield concertsCollection.countDocuments(),
                    tickets: yield ticketsCollection.countDocuments()
                };
                // Get database size using native MongoDB commands
                const db = (0, mongodb_schemas_1.getDatabase)();
                const dbStats = yield db.stats();
                // Calculate total records
                const totalRecords = Object.values(stats).reduce((sum, count) => sum + count, 0);
                return {
                    connected: true,
                    totalRecords,
                    collections: stats,
                    database_size: `${Math.round(dbStats.dataSize / 1024 / 1024 * 100) / 100} MB`
                };
            }
            catch (error) {
                console.error('MongoDB stats error:', error);
                return { connected: false, error: error instanceof Error ? error.message : 'Unknown error' };
            }
        });
    }
    // Health check for databases
    healthCheck(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const results = {
                    postgres: { connected: false, error: null },
                    mongodb: { connected: false, error: null },
                    timestamp: new Date().toISOString()
                };
                // Test PostgreSQL
                try {
                    yield (0, postgres_1.getPool)().query('SELECT 1');
                    results.postgres.connected = true;
                }
                catch (error) {
                    results.postgres.error = error instanceof Error ? error.message : 'Unknown error';
                }
                // Test MongoDB using native driver
                try {
                    const db = (0, mongodb_schemas_1.getDatabase)();
                    yield db.admin().ping();
                    results.mongodb.connected = true;
                }
                catch (error) {
                    results.mongodb.error = error instanceof Error ? error.message : 'Unknown error';
                }
                const status = results.postgres.connected && results.mongodb.connected ? 200 : 503;
                res.status(status).json(results);
            }
            catch (error) {
                res.status(500).json({
                    error: 'Health check failed',
                    details: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        });
    }
    // Get migration status
    getMigrationStatus(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const status = migration_status_1.migrationStatus.getStatus();
                const currentDbType = migration_status_1.migrationStatus.getDatabaseType();
                res.json(Object.assign(Object.assign({}, status), { currentDatabase: currentDbType, timestamp: new Date().toISOString() }));
            }
            catch (error) {
                console.error('Error getting migration status:', error);
                res.status(500).json({
                    error: 'Failed to get migration status',
                    details: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        });
    }
    // Reset migration status (rollback to PostgreSQL)
    resetMigrationStatus(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                migration_status_1.migrationStatus.markNotMigrated();
                res.json({
                    message: 'Migration status reset successfully',
                    currentDatabase: migration_status_1.migrationStatus.getDatabaseType(),
                    timestamp: new Date().toISOString()
                });
            }
            catch (error) {
                console.error('Error resetting migration status:', error);
                res.status(500).json({
                    error: 'Failed to reset migration status',
                    details: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        });
    }
    // Clear all data from databases
    clearData(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
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
                yield (0, postgres_1.getPool)().query('SET session_replication_role = replica;');
                for (const table of tables) {
                    try {
                        yield (0, postgres_1.getPool)().query(`TRUNCATE TABLE ${table} RESTART IDENTITY CASCADE`);
                    }
                    catch (error) {
                        console.log(`Table ${table} might not exist yet, continuing...`);
                    }
                }
                // Clear users table but preserve admin user
                yield (0, postgres_1.getPool)().query(`DELETE FROM users WHERE email != 'admin@concert.com'`);
                // Re-enable foreign key checks
                yield (0, postgres_1.getPool)().query('SET session_replication_role = DEFAULT;');
                // Clear MongoDB using native operations but preserve admin user
                try {
                    const usersCollection = (0, mongodb_schemas_1.getUsersCollection)();
                    const artistsCollection = (0, mongodb_schemas_1.getArtistsCollection)();
                    const arenasCollection = (0, mongodb_schemas_1.getArenasCollection)();
                    const concertsCollection = (0, mongodb_schemas_1.getConcertsCollection)();
                    const ticketsCollection = (0, mongodb_schemas_1.getTicketsCollection)();
                    yield Promise.all([
                        usersCollection.deleteMany({ email: { $ne: 'admin@concert.com' } }), // Preserve admin
                        artistsCollection.deleteMany({}),
                        arenasCollection.deleteMany({}),
                        concertsCollection.deleteMany({}),
                        ticketsCollection.deleteMany({})
                    ]);
                }
                catch (mongoError) {
                    console.error('MongoDB clear error:', mongoError);
                }
                res.json({
                    message: 'All data cleared successfully (admin user preserved)',
                    timestamp: new Date().toISOString()
                });
            }
            catch (error) {
                console.error('Error clearing data:', error);
                res.status(500).json({
                    error: 'Failed to clear data',
                    details: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        });
    }
}
exports.AdminController = AdminController;
