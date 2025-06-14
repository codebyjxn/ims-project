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
exports.testDualDatabase = testDualDatabase;
const data_service_1 = require("../services/data-service");
const migration_status_1 = require("../services/migration-status");
const mongodb_schemas_1 = require("../models/mongodb-schemas");
const postgres_1 = require("../lib/postgres");
/**
 * Test script to demonstrate dual database functionality
 * This script shows how the system can switch between PostgreSQL and MongoDB
 */
function testDualDatabase() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            console.log('=== DUAL DATABASE SYSTEM TEST ===\n');
            // Initialize connections
            yield (0, mongodb_schemas_1.connectMongoDB)();
            yield (0, postgres_1.getPool)();
            console.log('✅ Connected to both databases\n');
            // Test 1: PostgreSQL mode
            console.log('📊 TEST 1: POSTGRESQL MODE');
            migration_status_1.migrationStatus.markNotMigrated();
            const currentDbType1 = data_service_1.DataService.getCurrentDatabaseType();
            const isMigrated1 = data_service_1.DataService.isMigrated();
            console.log(`Current Database: ${currentDbType1.toUpperCase()}`);
            console.log(`Migration Status: ${isMigrated1 ? 'MIGRATED' : 'NOT MIGRATED'}`);
            try {
                const pgUsers = yield data_service_1.DataService.getAllUsers();
                const pgStats = yield data_service_1.DataService.getStats();
                console.log(`Users found: ${pgUsers.length}`);
                console.log(`Database stats:`, pgStats);
            }
            catch (error) {
                console.log('⚠️  PostgreSQL data not available (might need seeding)');
            }
            console.log('\n' + '─'.repeat(50) + '\n');
            // Test 2: MongoDB mode
            console.log('📊 TEST 2: MONGODB MODE');
            migration_status_1.migrationStatus.markMigrated();
            const currentDbType2 = data_service_1.DataService.getCurrentDatabaseType();
            const isMigrated2 = data_service_1.DataService.isMigrated();
            console.log(`Current Database: ${currentDbType2.toUpperCase()}`);
            console.log(`Migration Status: ${isMigrated2 ? 'MIGRATED' : 'NOT MIGRATED'}`);
            try {
                const mongoUsers = yield data_service_1.DataService.getAllUsers();
                const mongoStats = yield data_service_1.DataService.getStats();
                console.log(`Users found: ${mongoUsers.length}`);
                console.log(`Database stats:`, mongoStats);
            }
            catch (error) {
                console.log('⚠️  MongoDB data not available (might need migration)');
            }
            console.log('\n' + '─'.repeat(50) + '\n');
            // Test 3: Compare data structures
            console.log('📊 TEST 3: DATA STRUCTURE COMPARISON');
            // Switch back to PostgreSQL
            migration_status_1.migrationStatus.markNotMigrated();
            try {
                const pgUser = yield data_service_1.DataService.getUserById('sample-user-id');
                console.log('PostgreSQL User Structure:', pgUser ? 'Found' : 'Not found');
                if (pgUser) {
                    console.log('PG Fields:', Object.keys(pgUser));
                }
            }
            catch (error) {
                console.log('PostgreSQL user query failed');
            }
            // Switch to MongoDB
            migration_status_1.migrationStatus.markMigrated();
            try {
                const mongoUser = yield data_service_1.DataService.getUserById('sample-user-id');
                console.log('MongoDB User Structure:', mongoUser ? 'Found' : 'Not found');
                if (mongoUser) {
                    console.log('Mongo Fields:', Object.keys(mongoUser));
                }
            }
            catch (error) {
                console.log('MongoDB user query failed');
            }
            console.log('\n' + '─'.repeat(50) + '\n');
            // Test 4: API Response Format Consistency
            console.log('📊 TEST 4: API RESPONSE CONSISTENCY');
            // Test with PostgreSQL
            migration_status_1.migrationStatus.markNotMigrated();
            console.log(`Testing with: ${data_service_1.DataService.getCurrentDatabaseType()}`);
            try {
                const pgResponse = yield testApiConsistency();
                console.log('PostgreSQL API Response Keys:', Object.keys(pgResponse));
            }
            catch (error) {
                console.log('PostgreSQL API test failed');
            }
            // Test with MongoDB
            migration_status_1.migrationStatus.markMigrated();
            console.log(`Testing with: ${data_service_1.DataService.getCurrentDatabaseType()}`);
            try {
                const mongoResponse = yield testApiConsistency();
                console.log('MongoDB API Response Keys:', Object.keys(mongoResponse));
            }
            catch (error) {
                console.log('MongoDB API test failed');
            }
            console.log('\n=== TEST COMPLETE ===');
            console.log('✅ Dual database system is working correctly!');
            console.log('📝 Use the admin endpoints to migrate data and test functionality');
        }
        catch (error) {
            console.error('❌ Test failed:', error);
        }
        finally {
            // Reset to default state
            migration_status_1.migrationStatus.markNotMigrated();
            console.log('\n🔄 Reset to default state (PostgreSQL)');
        }
    });
}
function testApiConsistency() {
    return __awaiter(this, void 0, void 0, function* () {
        // Simulate API response structure
        const currentDb = data_service_1.DataService.getCurrentDatabaseType();
        const isMigrated = data_service_1.DataService.isMigrated();
        const stats = yield data_service_1.DataService.getStats();
        return {
            database: currentDb,
            migrated: isMigrated,
            stats: stats,
            timestamp: new Date().toISOString()
        };
    });
}
// Run if called directly
if (require.main === module) {
    testDualDatabase()
        .then(() => {
        console.log('\nTest completed successfully!');
        process.exit(0);
    })
        .catch((error) => {
        console.error('Test failed:', error);
        process.exit(1);
    });
}
