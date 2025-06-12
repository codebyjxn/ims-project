import { migrationStatus } from '../services/migration-status';
import { PostgresAnalyticsRepository } from './postgres/analytics';
import { MongoAnalyticsRepository } from './mongodb/analytics';

interface IAnalyticsRepository {
  getUpcomingConcertsPerformance(): Promise<any[]>;
}

export class AnalyticsRepositoryFactory {
  static async getRepository(): Promise<IAnalyticsRepository> {
    const dbType = migrationStatus.getDatabaseType();
    if (dbType === 'mongodb') {
      return MongoAnalyticsRepository.create();
    }
    return new PostgresAnalyticsRepository();
  }
} 