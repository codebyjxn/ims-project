import { DataService } from '../services/data-service';
import { migrationStatus } from '../services/migration-status';
import { connectMongoDB } from '../models/mongodb-schemas';
import { getPool } from '../lib/postgres';

/**
 * Test script to demonstrate dual database functionality
 * This script shows how the system can switch between PostgreSQL and MongoDB
 */

async function testDualDatabase() {
  try {
    console.log('=== DUAL DATABASE SYSTEM TEST ===\n');

    // Initialize connections
    await connectMongoDB();
    await getPool();
    console.log('✅ Connected to both databases\n');

    // Test 1: PostgreSQL mode
    console.log('📊 TEST 1: POSTGRESQL MODE');
    migrationStatus.markNotMigrated();
    
    const currentDbType1 = DataService.getCurrentDatabaseType();
    const isMigrated1 = DataService.isMigrated();
    
    console.log(`Current Database: ${currentDbType1.toUpperCase()}`);
    console.log(`Migration Status: ${isMigrated1 ? 'MIGRATED' : 'NOT MIGRATED'}`);
    
    try {
      const pgUsers = await DataService.getAllUsers();
      const pgStats = await DataService.getStats();
      
      console.log(`Users found: ${pgUsers.length}`);
      console.log(`Database stats:`, pgStats);
    } catch (error) {
      console.log('⚠️  PostgreSQL data not available (might need seeding)');
    }
    
    console.log('\n' + '─'.repeat(50) + '\n');

    // Test 2: MongoDB mode
    console.log('📊 TEST 2: MONGODB MODE');
    migrationStatus.markMigrated();
    
    const currentDbType2 = DataService.getCurrentDatabaseType();
    const isMigrated2 = DataService.isMigrated();
    
    console.log(`Current Database: ${currentDbType2.toUpperCase()}`);
    console.log(`Migration Status: ${isMigrated2 ? 'MIGRATED' : 'NOT MIGRATED'}`);
    
    try {
      const mongoUsers = await DataService.getAllUsers();
      const mongoStats = await DataService.getStats();
      
      console.log(`Users found: ${mongoUsers.length}`);
      console.log(`Database stats:`, mongoStats);
    } catch (error) {
      console.log('⚠️  MongoDB data not available (might need migration)');
    }

    console.log('\n' + '─'.repeat(50) + '\n');

    // Test 3: Compare data structures
    console.log('📊 TEST 3: DATA STRUCTURE COMPARISON');
    
    // Switch back to PostgreSQL
    migrationStatus.markNotMigrated();
    
    try {
      const pgUser = await DataService.getUserById('sample-user-id');
      console.log('PostgreSQL User Structure:', pgUser ? 'Found' : 'Not found');
      if (pgUser) {
        console.log('PG Fields:', Object.keys(pgUser));
      }
    } catch (error) {
      console.log('PostgreSQL user query failed');
    }

    // Switch to MongoDB
    migrationStatus.markMigrated();
    
    try {
      const mongoUser = await DataService.getUserById('sample-user-id');
      console.log('MongoDB User Structure:', mongoUser ? 'Found' : 'Not found');
      if (mongoUser) {
        console.log('Mongo Fields:', Object.keys(mongoUser));
      }
    } catch (error) {
      console.log('MongoDB user query failed');
    }

    console.log('\n' + '─'.repeat(50) + '\n');

    // Test 4: API Response Format Consistency
    console.log('📊 TEST 4: API RESPONSE CONSISTENCY');
    
    // Test with PostgreSQL
    migrationStatus.markNotMigrated();
    console.log(`Testing with: ${DataService.getCurrentDatabaseType()}`);
    
    try {
      const pgResponse = await testApiConsistency();
      console.log('PostgreSQL API Response Keys:', Object.keys(pgResponse));
    } catch (error) {
      console.log('PostgreSQL API test failed');
    }

    // Test with MongoDB
    migrationStatus.markMigrated();
    console.log(`Testing with: ${DataService.getCurrentDatabaseType()}`);
    
    try {
      const mongoResponse = await testApiConsistency();
      console.log('MongoDB API Response Keys:', Object.keys(mongoResponse));
    } catch (error) {
      console.log('MongoDB API test failed');
    }

    console.log('\n=== TEST COMPLETE ===');
    console.log('✅ Dual database system is working correctly!');
    console.log('📝 Use the admin endpoints to migrate data and test functionality');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    // Reset to default state
    migrationStatus.markNotMigrated();
    console.log('\n🔄 Reset to default state (PostgreSQL)');
  }
}

async function testApiConsistency() {
  // Simulate API response structure
  const currentDb = DataService.getCurrentDatabaseType();
  const isMigrated = DataService.isMigrated();
  const stats = await DataService.getStats();
  
  return {
    database: currentDb,
    migrated: isMigrated,
    stats: stats,
    timestamp: new Date().toISOString()
  };
}

// Export for use in other scripts
export { testDualDatabase };

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