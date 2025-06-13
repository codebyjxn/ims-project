"use strict";
// src/repositories/factory.ts
// ========== REPOSITORY FACTORY ==========
// This factory switches between PostgreSQL and MongoDB repositories based on migration status
Object.defineProperty(exports, "__esModule", { value: true });
exports.RepositoryFactory = void 0;
const migration_status_1 = require("../services/migration-status");
const postgres_1 = require("./postgres");
const mongodb_1 = require("./mongodb");
class RepositoryFactory {
    /**
     * Get the appropriate repository factory based on migration status
     */
    static getFactory() {
        const dbType = migration_status_1.migrationStatus.getDatabaseType();
        if (dbType === 'mongodb') {
            if (!this.mongoFactory) {
                this.mongoFactory = new mongodb_1.MongoRepositoryFactory();
            }
            return this.mongoFactory;
        }
        else {
            if (!this.postgresFactory) {
                this.postgresFactory = new postgres_1.PostgresRepositoryFactory();
            }
            return this.postgresFactory;
        }
    }
    /**
     * Get current database type
     */
    static getCurrentDatabaseType() {
        return migration_status_1.migrationStatus.getDatabaseType();
    }
    /**
     * Check if system is migrated
     */
    static isMigrated() {
        return migration_status_1.migrationStatus.isMigrated();
    }
}
exports.RepositoryFactory = RepositoryFactory;
RepositoryFactory.postgresFactory = null;
RepositoryFactory.mongoFactory = null;
