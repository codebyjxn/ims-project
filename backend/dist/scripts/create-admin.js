"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAdminUser = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const mongodb_schemas_1 = require("../models/mongodb-schemas");
const postgres_1 = require("../lib/postgres");
const migration_status_1 = require("../services/migration-status");
const ADMIN_EMAIL = 'admin@concert.com';
const ADMIN_PASSWORD = 'admin123';
const createAdminUser = (...args_1) => __awaiter(void 0, [...args_1], void 0, function* (verbose = false) {
    try {
        if (verbose) {
            console.log('=== CREATING ADMIN USER ===\n');
        }
        // Check current database type
        const currentDb = migration_status_1.migrationStatus.getDatabaseType();
        if (verbose) {
            console.log(`Current database: ${currentDb}`);
        }
        if (currentDb === 'postgresql') {
            yield createPostgreSQLAdmin(verbose);
        }
        else {
            yield createMongoDBAdmin(verbose);
        }
        if (verbose) {
            console.log('\n✅ Admin user created successfully!');
            console.log('You can now login with:');
            console.log(`Email: ${ADMIN_EMAIL}`);
            console.log(`Password: ${ADMIN_PASSWORD}`);
        }
    }
    catch (error) {
        if (verbose) {
            console.error('❌ Error creating admin user:', error);
        }
        throw error;
    }
});
exports.createAdminUser = createAdminUser;
const createPostgreSQLAdmin = (...args_1) => __awaiter(void 0, [...args_1], void 0, function* (verbose = false) {
    if (verbose) {
        console.log('\n🔧 Creating PostgreSQL admin user...');
    }
    const pool = (0, postgres_1.getPool)();
    // Check if admin user already exists
    const existingUser = yield pool.query('SELECT user_id, email FROM users WHERE email = $1', [ADMIN_EMAIL]);
    if (existingUser.rows.length > 0) {
        if (verbose) {
            console.log('Admin user already exists in PostgreSQL');
        }
        return;
    }
    // Hash the password
    const salt = yield bcryptjs_1.default.genSalt(10);
    const hashedPassword = yield bcryptjs_1.default.hash(ADMIN_PASSWORD, salt);
    // Create new admin user
    const userId = 'admin-' + Date.now();
    yield pool.query('INSERT INTO users (user_id, email, user_password, first_name, last_name, registration_date) VALUES ($1, $2, $3, $4, $5, $6)', [userId, ADMIN_EMAIL, hashedPassword, 'Admin', 'User', new Date()]);
    if (verbose) {
        console.log('✅ Admin user created in PostgreSQL');
    }
});
const createMongoDBAdmin = (...args_1) => __awaiter(void 0, [...args_1], void 0, function* (verbose = false) {
    if (verbose) {
        console.log('\n🔧 Creating MongoDB admin user...');
    }
    yield (0, mongodb_schemas_1.connectMongoDB)(); // Ensures singleton is connected
    const usersCollection = (0, mongodb_schemas_1.getUsersCollection)();
    // Check if admin user already exists
    const existingUser = yield usersCollection.findOne({ email: ADMIN_EMAIL });
    if (existingUser) {
        if (verbose) {
            console.log('Admin user already exists in MongoDB');
        }
        return;
    }
    // Hash the password
    const salt = yield bcryptjs_1.default.genSalt(10);
    const hashedPassword = yield bcryptjs_1.default.hash(ADMIN_PASSWORD, salt);
    // Create new admin user
    const adminUser = {
        _id: 'admin-' + Date.now(),
        email: ADMIN_EMAIL,
        user_password: hashedPassword,
        first_name: 'Admin',
        last_name: 'User',
        registration_date: new Date(),
        user_type: 'admin'
    };
    yield usersCollection.insertOne(adminUser);
    // Keep MongoDB connection open – no closeMongoDB here
    if (verbose) {
        console.log('✅ Admin user created in MongoDB');
    }
});
// Run the function directly
if (require.main === module) {
    (0, exports.createAdminUser)(true) // Enable verbose mode when run directly
        .then(() => {
        console.log('\nAdmin creation completed successfully!');
        process.exit(0);
    })
        .catch((error) => {
        console.error('Admin creation failed:', error);
        process.exit(1);
    });
}
