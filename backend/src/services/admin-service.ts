// src/services/admin-service.ts
// ========== ADMIN SERVICE ==========
// Contains business logic for admin operations including seeding and migration

import { RepositoryFactory } from '../repositories/factory';
import { migrationStatus } from './migration-status';

export class AdminService {

  /**
   * Seed database with sample data
   */
  static async seedDatabase(): Promise<{ success: boolean; message: string; seeded_items: any }> {
    try {
      const factory = RepositoryFactory.getFactory();
      const userRepo = factory.getUserRepository();
      const dbType = RepositoryFactory.getCurrentDatabaseType();
      
      const seededItems = {
        fans: 0,
        organizers: 0,
        admin: 0
      };

      // Sample fan data
      const sampleFans = [
        {
          user_id: 'fan-1',
          _id: 'fan-1', // MongoDB compatibility
          email: 'john.doe@example.com',
          user_password: 'hashedpassword123',
          first_name: 'John',
          last_name: 'Doe',
          user_type: 'fan',
          registration_date: new Date(),
          // Fan-specific fields
          username: 'johndoe',
          preferred_genre: 'rock',
          phone_number: '+1234567890',
          referral_code: 'JOHN2024',
          referral_points: 0,
          referral_code_used: false,
          // MongoDB nested structure
          fan_details: {
            username: 'johndoe',
            preferred_genre: 'rock',
            phone_number: '+1234567890',
            referral_code: 'JOHN2024',
            referral_points: 0,
            referral_code_used: false
          }
        },
        {
          user_id: 'fan-2',
          _id: 'fan-2',
          email: 'jane.smith@example.com',
          user_password: 'hashedpassword456',
          first_name: 'Jane',
          last_name: 'Smith',
          user_type: 'fan',
          registration_date: new Date(),
          username: 'janesmith',
          preferred_genre: 'pop',
          phone_number: '+1234567891',
          referral_code: 'JANE2024',
          referral_points: 25,
          referral_code_used: false,
          fan_details: {
            username: 'janesmith',
            preferred_genre: 'pop',
            phone_number: '+1234567891',
            referral_code: 'JANE2024',
            referral_points: 25,
            referral_code_used: false
          }
        }
      ];

      // Sample organizer data
      const sampleOrganizers = [
        {
          user_id: 'org-1',
          _id: 'org-1',
          email: 'events@musicfest.com',
          user_password: 'hashedpassword789',
          first_name: 'Music',
          last_name: 'Festival Inc',
          user_type: 'organizer',
          registration_date: new Date(),
          organization_name: 'Music Festival Inc',
          contact_info: 'events@musicfest.com, +1-800-MUSIC',
          organizer_details: {
            organization_name: 'Music Festival Inc',
            contact_info: 'events@musicfest.com, +1-800-MUSIC'
          }
        }
      ];

      // Sample admin data
      const sampleAdmin = {
        user_id: 'admin-1',
        _id: 'admin-1',
        email: 'admin@concertapp.com',
        user_password: 'hashedadminpassword',
        first_name: 'System',
        last_name: 'Administrator',
        user_type: 'admin',
        registration_date: new Date()
      };

      // Create sample users
      for (const fan of sampleFans) {
        try {
          await userRepo.create(fan);
          seededItems.fans++;
        } catch (error) {
          console.log(`Fan ${fan.email} might already exist, skipping...`);
        }
      }

      for (const organizer of sampleOrganizers) {
        try {
          await userRepo.create(organizer);
          seededItems.organizers++;
        } catch (error) {
          console.log(`Organizer ${organizer.email} might already exist, skipping...`);
        }
      }

      try {
        await userRepo.create(sampleAdmin);
        seededItems.admin++;
      } catch (error) {
        console.log(`Admin ${sampleAdmin.email} might already exist, skipping...`);
      }

      return {
        success: true,
        message: `Database seeded successfully on ${dbType}`,
        seeded_items: seededItems
      };

    } catch (error) {
      throw new Error(`Failed to seed database: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Migrate from PostgreSQL to MongoDB
   */
  static async migrateToMongoDB(): Promise<{ success: boolean; message: string; migrated_items: any }> {
    try {
      // Check if already migrated
      if (migrationStatus.isMigrated()) {
        return {
          success: false,
          message: 'System is already migrated to MongoDB',
          migrated_items: {}
        };
      }

      // Use existing migration service
      const { migrateToMongoDB } = await import('./migration-service');
      
      // This would perform the actual migration
      const migrationResult = await migrateToMongoDB();
      
      return {
        success: true,
        message: 'Migration to MongoDB completed successfully',
        migrated_items: migrationResult
      };

    } catch (error) {
      throw new Error(`Failed to migrate to MongoDB: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get system status and statistics
   */
  static async getSystemStatus(): Promise<{
    database_type: 'postgresql' | 'mongodb';
    is_migrated: boolean;
    statistics: any;
  }> {
    try {
      const dbType = RepositoryFactory.getCurrentDatabaseType();
      const isMigrated = RepositoryFactory.isMigrated();
      
      // Get basic statistics
      const factory = RepositoryFactory.getFactory();
      const userRepo = factory.getUserRepository();
      const ticketRepo = factory.getTicketRepository();
      
      // This is simplified - in a real implementation, you'd have proper counting methods
      const statistics = {
        total_users: 'N/A - counting method not implemented',
        total_tickets: 'N/A - counting method not implemented',
        database_type: dbType,
        migration_status: isMigrated ? 'Migrated to MongoDB' : 'Using PostgreSQL'
      };

      return {
        database_type: dbType,
        is_migrated: isMigrated,
        statistics
      };

    } catch (error) {
      throw new Error(`Failed to get system status: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Reset migration status (for testing purposes)
   */
  static async resetMigrationStatus(): Promise<{ success: boolean; message: string }> {
    try {
      migrationStatus.reset();
      
      return {
        success: true,
        message: 'Migration status reset to PostgreSQL'
      };

    } catch (error) {
      throw new Error(`Failed to reset migration status: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
} 