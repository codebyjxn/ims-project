// src/repositories/factory.ts
// ========== REPOSITORY FACTORY ==========
// This factory switches between PostgreSQL and MongoDB repositories based on migration status

import { migrationStatus } from '../services/migration-status';
import { IRepositoryFactory } from './interfaces';
import { IOrganizerRepository } from './interfaces';
import { PostgresRepositoryFactory } from './postgres';
import { MongoRepositoryFactory } from './mongodb';

export class RepositoryFactory {
  private static postgresFactory: PostgresRepositoryFactory | null = null;
  private static mongoFactory: MongoRepositoryFactory | null = null;

  /**
   * Get the appropriate repository factory based on migration status
   */
  public static getFactory(): IRepositoryFactory & { getOrganizerRepository: () => IOrganizerRepository } {
    const dbType = migrationStatus.getDatabaseType();
    
    if (dbType === 'mongodb') {
      if (!this.mongoFactory) {
        this.mongoFactory = new MongoRepositoryFactory();
      }
      const factory = this.mongoFactory;
      return {
        getUserRepository: () => factory.getUserRepository(),
        getArtistRepository: () => factory.getArtistRepository(),
        getArenaRepository: () => factory.getArenaRepository(),
        getConcertRepository: () => factory.getConcertRepository(),
        getTicketRepository: () => factory.getTicketRepository(),
        getOrganizerRepository: () => factory.getOrganizerRepository(),
      };
    } else {
      if (!this.postgresFactory) {
        this.postgresFactory = new PostgresRepositoryFactory();
      }
      const factory = this.postgresFactory;
      return {
        getUserRepository: () => factory.getUserRepository(),
        getArtistRepository: () => factory.getArtistRepository(),
        getArenaRepository: () => factory.getArenaRepository(),
        getConcertRepository: () => factory.getConcertRepository(),
        getTicketRepository: () => factory.getTicketRepository(),
        getOrganizerRepository: () => factory.getOrganizerRepository(),
      };
    }
  }

  /**
   * Get current database type
   */
  public static getCurrentDatabaseType(): 'postgresql' | 'mongodb' {
    return migrationStatus.getDatabaseType();
  }

  /**
   * Check if system is migrated
   */
  public static isMigrated(): boolean {
    return migrationStatus.isMigrated();
  }
} 