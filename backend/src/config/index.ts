import dotenv from 'dotenv';
import { Secret } from 'jsonwebtoken';

dotenv.config(); 

export const config = {
    port: process.env.PORT || 4000, 
    nodeEnv: process.env.NODE_ENV || 'development', 
    WHITELIST_ORIGINS: process.env.WHITELIST_ORIGINS?.split(',') || ['http://localhost:3000', 'http://localhost'], 
    
    // PostgreSQL Configuration
    postgres: {
        host: process.env.POSTGRES_HOST || 'localhost',
        port: parseInt(process.env.POSTGRES_PORT || '5432'),
        user: process.env.POSTGRES_USER || 'postgres',
        password: process.env.POSTGRES_PASSWORD || 'postgres',
        database: process.env.POSTGRES_DB || 'concert_booking',
    },

    // MongoDB Configuration
    mongodb: {
        uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/concert_booking',
    },

    // Migration Configuration
    migration: {
        // This flag determines which database to use
        // false = PostgreSQL only, true = MongoDB (after migration)
        migrated: process.env.MIGRATED === 'true' || false,
        statusFile: process.env.MIGRATION_STATUS_FILE || './migration-status.json',
    },

    // JWT Configuration
    jwt: {
        secret: process.env.JWT_SECRET as Secret || 'your-secret-key',
        expiresIn: process.env.JWT_EXPIRES_IN || '24h',
    },
}; 