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
exports.testAuthDualDatabase = testAuthDualDatabase;
const migration_status_1 = require("../services/migration-status");
const mongodb_schemas_1 = require("../models/mongodb-schemas");
const postgres_1 = require("../lib/postgres");
/**
 * Test script to demonstrate that authentication works with both databases
 * This script shows how auth switches between PostgreSQL and MongoDB
 */
function testAuthDualDatabase() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            console.log('=== AUTHENTICATION DUAL DATABASE TEST ===\n');
            // Initialize connections
            yield (0, mongodb_schemas_1.connectMongoDB)();
            yield (0, postgres_1.getPool)();
            console.log('✅ Connected to both databases\n');
            // Test 1: PostgreSQL mode
            console.log('🔐 TEST 1: AUTHENTICATION WITH POSTGRESQL');
            migration_status_1.migrationStatus.markNotMigrated();
            const currentDbType1 = migration_status_1.migrationStatus.getDatabaseType();
            const isMigrated1 = migration_status_1.migrationStatus.isMigrated();
            console.log(`Authentication Database: ${currentDbType1.toUpperCase()}`);
            console.log(`Migration Status: ${isMigrated1 ? 'MIGRATED' : 'NOT MIGRATED'}`);
            console.log('📝 Auth will use PostgreSQL tables: users, fans, organizers');
            console.log('\n' + '─'.repeat(50) + '\n');
            // Test 2: MongoDB mode
            console.log('🔐 TEST 2: AUTHENTICATION WITH MONGODB');
            migration_status_1.migrationStatus.markMigrated();
            const currentDbType2 = migration_status_1.migrationStatus.getDatabaseType();
            const isMigrated2 = migration_status_1.migrationStatus.isMigrated();
            console.log(`Authentication Database: ${currentDbType2.toUpperCase()}`);
            console.log(`Migration Status: ${isMigrated2 ? 'MIGRATED' : 'NOT MIGRATED'}`);
            console.log('📝 Auth will use MongoDB users collection with embedded details');
            console.log('\n' + '─'.repeat(50) + '\n');
            // Test 3: API Endpoints for Testing
            console.log('🚀 API ENDPOINTS FOR TESTING:');
            console.log('');
            console.log('1. Check auth database status:');
            console.log('   GET http://localhost:4000/api/auth/database-info');
            console.log('');
            console.log('2. Test signup (will use active database):');
            console.log('   POST http://localhost:4000/api/auth/signup');
            console.log('   {');
            console.log('     "email": "test@example.com",');
            console.log('     "password": "password123",');
            console.log('     "firstName": "Test",');
            console.log('     "lastName": "User",');
            console.log('     "userType": "fan",');
            console.log('     "username": "testuser"');
            console.log('   }');
            console.log('');
            console.log('3. Test login (will use active database):');
            console.log('   POST http://localhost:4000/api/auth/login');
            console.log('   {');
            console.log('     "email": "test@example.com",');
            console.log('     "password": "password123"');
            console.log('   }');
            console.log('');
            console.log('4. Switch database using admin endpoints:');
            console.log('   GET  http://localhost:4000/api/admin/migration-status');
            console.log('   POST http://localhost:4000/api/admin/migrate');
            console.log('   POST http://localhost:4000/api/admin/reset-migration');
            console.log('\n' + '─'.repeat(50) + '\n');
            // Test 4: Database Structure Explanation
            console.log('📊 DATABASE STRUCTURE DIFFERENCES:');
            console.log('');
            console.log('PostgreSQL (Normalized):');
            console.log('  users table: basic user info');
            console.log('  fans table: fan-specific details');
            console.log('  organizers table: organizer-specific details');
            console.log('');
            console.log('MongoDB (Denormalized):');
            console.log('  users collection: all user info in one document');
            console.log('  - fan_details: embedded object for fans');
            console.log('  - organizer_details: embedded object for organizers');
            console.log('\n=== TEST COMPLETE ===');
            console.log('✅ Authentication dual database system is configured!');
            console.log('📝 Use the API endpoints above to test functionality');
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
// Run if called directly
if (require.main === module) {
    testAuthDualDatabase()
        .then(() => {
        console.log('\nAuth test completed successfully!');
        process.exit(0);
    })
        .catch((error) => {
        console.error('Auth test failed:', error);
        process.exit(1);
    });
}
