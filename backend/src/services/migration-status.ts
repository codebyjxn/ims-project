import fs from 'fs';
import path from 'path';
import { config } from '../config';

interface MigrationStatus {
  migrated: boolean;
  migrationDate?: Date;
  version: string;
}

class MigrationStatusManager {
  private statusFile: string;
  private status: MigrationStatus | null = null;

  constructor() {
    this.statusFile = path.resolve(config.migration.statusFile);
    this.loadStatus();
  }

  private loadStatus(): void {
    try {
      if (fs.existsSync(this.statusFile)) {
        const data = fs.readFileSync(this.statusFile, 'utf8');
        this.status = JSON.parse(data);
        
        // Parse date string back to Date object
        if (this.status?.migrationDate) {
          this.status.migrationDate = new Date(this.status.migrationDate);
        }
      } else {
        // Default status if file doesn't exist
        this.status = {
          migrated: false,
          version: '1.0.0'
        };
        this.saveStatus();
      }
    } catch (error) {
      console.error('Error loading migration status:', error);
      // Fallback to default status
      this.status = {
        migrated: false,
        version: '1.0.0'
      };
    }
  }

  private saveStatus(): void {
    try {
      // Ensure directory exists
      const dir = path.dirname(this.statusFile);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      fs.writeFileSync(this.statusFile, JSON.stringify(this.status, null, 2));
    } catch (error) {
      console.error('Error saving migration status:', error);
    }
  }

  /**
   * Check if migration has been completed
   */
  public isMigrated(): boolean {
    // Check environment variable first, then file
    if (config.migration.migrated) {
      return true;
    }
    
    return this.status?.migrated || false;
  }

  /**
   * Mark migration as completed
   */
  public markMigrated(): void {
    this.status = {
      migrated: true,
      migrationDate: new Date(),
      version: '1.0.0'
    };
    this.saveStatus();
    console.log('Migration status marked as completed');
  }

  /**
   * Mark migration as not completed (rollback)
   */
  public markNotMigrated(): void {
    this.status = {
      migrated: false,
      version: '1.0.0'
    };
    this.saveStatus();
    console.log('Migration status marked as not completed');
  }

  /**
   * Get current migration status
   */
  public getStatus(): MigrationStatus {
    return { ...this.status! };
  }

  /**
   * Get database type based on migration status
   */
  public getDatabaseType(): 'postgresql' | 'mongodb' {
    return this.isMigrated() ? 'mongodb' : 'postgresql';
  }

  /**
   * Reset migration status (for testing purposes)
   */
  public reset(): void {
    if (fs.existsSync(this.statusFile)) {
      fs.unlinkSync(this.statusFile);
    }
    this.loadStatus();
  }
}

// Export singleton instance
export const migrationStatus = new MigrationStatusManager();

// Export the class for testing
export { MigrationStatusManager }; 