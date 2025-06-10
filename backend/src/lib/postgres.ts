import { Pool, PoolClient } from 'pg';
import { config } from '../config';

let pool: Pool | null = null;

const createPool = (): Pool => {
  return new Pool({
    host: config.postgres.host,
    port: config.postgres.port,
    user: config.postgres.user,
    password: config.postgres.password,
    database: config.postgres.database,
    max: 20, // Maximum number of clients in the pool
    idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
    connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection could not be established
  });
};

export const getPool = (): Pool => {
  if (!pool || pool.ended) {
    pool = createPool();
    
    // Test the connection
    pool.connect((err: Error | undefined, client: PoolClient | undefined, done: (release?: any) => void) => {
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

// Export a default pool instance for backward compatibility
export default getPool(); 