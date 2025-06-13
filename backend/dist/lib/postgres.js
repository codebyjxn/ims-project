"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPool = void 0;
const pg_1 = require("pg");
const config_1 = require("../config");
let pool = null;
const createPool = () => {
    return new pg_1.Pool({
        host: config_1.config.postgres.host,
        port: config_1.config.postgres.port,
        user: config_1.config.postgres.user,
        password: config_1.config.postgres.password,
        database: config_1.config.postgres.database,
        max: 20, // Maximum number of clients in the pool
        idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
        connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection could not be established
    });
};
const getPool = () => {
    if (!pool || pool.ended) {
        pool = createPool();
        // Test the connection
        pool.connect((err, client, done) => {
            if (err) {
                console.error('Error connecting to PostgreSQL:', err);
                return;
            }
            console.log('Connected to PostgreSQL');
            done();
        });
        // Handle pool errors
        pool.on('error', (err) => {
            console.error('Unexpected error on idle client:', err);
            pool = null; // Force recreation on next call
        });
    }
    return pool;
};
exports.getPool = getPool;
// Export a default pool instance for backward compatibility
exports.default = (0, exports.getPool)();
