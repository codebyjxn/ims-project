import bcrypt from 'bcryptjs';
import { connectMongoDB, getUsersCollection, IUser, closeMongoDB } from '../models/mongodb-schemas';
import { getPool } from '../lib/postgres';
import { migrationStatus } from '../services/migration-status';

const ADMIN_EMAIL = 'admin@concert.com';
const ADMIN_PASSWORD = 'admin123';

export const createAdminUser = async (verbose: boolean = false): Promise<void> => {
  try {
    if (verbose) {
      console.log('=== CREATING ADMIN USER ===\n');
    }

    // Check current database type
    const currentDb = migrationStatus.getDatabaseType();
    if (verbose) {
      console.log(`Current database: ${currentDb}`);
    }

    if (currentDb === 'postgresql') {
      await createPostgreSQLAdmin(verbose);
    } else {
      await createMongoDBAdmin(verbose);
    }

    if (verbose) {
      console.log('\n✅ Admin user created successfully!');
      console.log('You can now login with:');
      console.log(`Email: ${ADMIN_EMAIL}`);
      console.log(`Password: ${ADMIN_PASSWORD}`);
    }

  } catch (error) {
    if (verbose) {
      console.error('❌ Error creating admin user:', error);
    }
    throw error;
  }
};

const createPostgreSQLAdmin = async (verbose: boolean = false): Promise<void> => {
  if (verbose) {
    console.log('\n🔧 Creating PostgreSQL admin user...');
  }
  
  const pool = getPool();
  
  // Check if admin user already exists
  const existingUser = await pool.query(
    'SELECT user_id, email FROM users WHERE email = $1',
    [ADMIN_EMAIL]
  );

  if (existingUser.rows.length > 0) {
    if (verbose) {
      console.log('Admin user already exists in PostgreSQL');
    }
    return;
  }

  // Hash the password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, salt);
  
  // Create new admin user
  const userId = 'admin-' + Date.now();
  await pool.query(
    'INSERT INTO users (user_id, email, user_password, first_name, last_name, registration_date) VALUES ($1, $2, $3, $4, $5, $6)',
    [userId, ADMIN_EMAIL, hashedPassword, 'Admin', 'User', new Date()]
  );
  
  if (verbose) {
    console.log('✅ Admin user created in PostgreSQL');
  }
};

const createMongoDBAdmin = async (verbose: boolean = false): Promise<void> => {
  if (verbose) {
    console.log('\n🔧 Creating MongoDB admin user...');
  }
  
  await connectMongoDB();
  const usersCollection = getUsersCollection();
  
  // Check if admin user already exists
  const existingUser = await usersCollection.findOne({ email: ADMIN_EMAIL });

  if (existingUser) {
    if (verbose) {
      console.log('Admin user already exists in MongoDB');
    }
    await closeMongoDB();
    return;
  }

  // Hash the password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, salt);
  
  // Create new admin user
  const adminUser: IUser = {
    _id: 'admin-' + Date.now(),
    email: ADMIN_EMAIL,
    user_password: hashedPassword,
    first_name: 'Admin',
    last_name: 'User',
    registration_date: new Date(),
    user_type: 'admin'
  };
  
  await usersCollection.insertOne(adminUser);
  await closeMongoDB();
  if (verbose) {
    console.log('✅ Admin user created in MongoDB');
  }
};

// Run the function directly
if (require.main === module) {
  createAdminUser(true) // Enable verbose mode when run directly
    .then(() => {
      console.log('\nAdmin creation completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Admin creation failed:', error);
      process.exit(1);
    });
} 