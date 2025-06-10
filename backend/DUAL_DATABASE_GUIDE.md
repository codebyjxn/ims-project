# Dual Database System Guide

## Overview

This concert booking system implements a **dual database architecture** that can work with both **PostgreSQL** and **MongoDB**. The system uses a migration flag to determine which database to use:

- **Before Migration**: System works solely with PostgreSQL
- **After Migration**: System works solely with MongoDB

## How It Works

### 1. Migration Status Management

The system uses a persistent migration status stored in `migration-status.json`:

```json
{
  "migrated": false,
  "migrationDate": "2024-01-15T10:30:00.000Z",
  "version": "1.0.0"
}
```

### 2. Database Factory Pattern

The `DatabaseFactory` class automatically selects the appropriate database adapter based on the migration status:

```typescript
// Automatically returns PostgreSQL or MongoDB adapter
const adapter = DatabaseFactory.getAdapter();
```

### 3. Unified Data Service

The `DataService` provides a unified interface for all database operations:

```typescript
// Works with both PostgreSQL and MongoDB transparently
const users = await DataService.getAllUsers();
const user = await DataService.getUserById(id);
```

## Configuration

### Environment Variables

```env
# Migration status (optional - overrides file-based status)
MIGRATED=false

# Migration status file location
MIGRATION_STATUS_FILE=./migration-status.json

# PostgreSQL Configuration
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=concert_booking

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/concert_booking
```

## API Endpoints

### Admin Endpoints (Migration Management)

```bash
# Get current migration status
GET /api/admin/migration-status

# Migrate data from PostgreSQL to MongoDB
POST /api/admin/migrate

# Reset migration status (rollback to PostgreSQL)
POST /api/admin/reset-migration

# Get database statistics
GET /api/admin/stats
```

### Unified Endpoints (Database-Agnostic)

These endpoints work with whichever database is currently active:

```bash
# Get database information
GET /api/unified/database-info

# Get all users from active database
GET /api/unified/users

# Get user by ID from active database
GET /api/unified/users/:id

# Get all concerts from active database
GET /api/unified/concerts

# Get all tickets from active database
GET /api/unified/tickets

# Get user tickets from active database
GET /api/unified/tickets/user/:userId
```

## Migration Process

### Step 1: Initial State (PostgreSQL Only)

```bash
# System starts with PostgreSQL
# migration-status.json: { "migrated": false }

# All operations use PostgreSQL
curl http://localhost:4000/api/unified/database-info
# Response: { "currentDatabase": "postgresql", "migrated": false }
```

### Step 2: Seed PostgreSQL Data

```bash
# Populate PostgreSQL with sample data
curl -X POST http://localhost:4000/api/admin/seed \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### Step 3: Migrate to MongoDB

```bash
# Migrate all data from PostgreSQL to MongoDB
curl -X POST http://localhost:4000/api/admin/migrate \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"

# This automatically sets migrated=true
```

### Step 4: Verify Migration

```bash
# Check current database status
curl http://localhost:4000/api/unified/database-info
# Response: { "currentDatabase": "mongodb", "migrated": true }

# Verify data in MongoDB
curl http://localhost:4000/api/unified/users
# Returns users from MongoDB
```

### Step 5: Rollback (Optional)

```bash
# Rollback to PostgreSQL
curl -X POST http://localhost:4000/api/admin/reset-migration \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"

# Verify rollback
curl http://localhost:4000/api/unified/database-info
# Response: { "currentDatabase": "postgresql", "migrated": false }
```

## Implementation Details

### Database Adapters

The system includes two adapter implementations:

#### PostgreSQL Adapter
- Uses SQL joins to aggregate related data
- Maintains foreign key relationships
- Returns data in `{ rows: [...] }` format

#### MongoDB Adapter
- Uses embedded documents and denormalized data
- Leverages MongoDB's flexible schema
- Returns data in `{ data: [...] }` format

### Data Transformation

During migration, the system transforms relational data into document format:

**PostgreSQL (Normalized)**:
```sql
users: { user_id, email, password, first_name, last_name }
fans: { user_id, username, preferred_genre, phone_number }
```

**MongoDB (Denormalized)**:
```javascript
{
  _id: "user_id",
  email: "...",
  first_name: "...",
  last_name: "...",
  user_type: "fan",
  fan_details: {
    username: "...",
    preferred_genre: "...",
    phone_number: "..."
  }
}
```

## Development Workflow

### 1. Starting Development

```bash
# Start with PostgreSQL (default)
docker-compose up

# Check active database
curl http://localhost:4000/api/unified/database-info
```

### 2. Testing Migration

```bash
# Seed PostgreSQL
curl -X POST http://localhost:4000/api/admin/seed \
  -H "Authorization: Bearer YOUR_TOKEN"

# Migrate to MongoDB
curl -X POST http://localhost:4000/api/admin/migrate \
  -H "Authorization: Bearer YOUR_TOKEN"

# Test unified endpoints
curl http://localhost:4000/api/unified/users
curl http://localhost:4000/api/unified/concerts
```

### 3. Development with Both Databases

```bash
# Reset to PostgreSQL for testing
curl -X POST http://localhost:4000/api/admin/reset-migration \
  -H "Authorization: Bearer YOUR_TOKEN"

# Re-migrate to test MongoDB features
curl -X POST http://localhost:4000/api/admin/migrate \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Error Handling

The system handles database switching gracefully:

- **Connection Errors**: Both databases remain connected regardless of active status
- **Migration Errors**: Failed migrations don't change the active database
- **Rollback Safety**: Resetting migration status doesn't delete data
- **API Consistency**: All endpoints return database type in response

## Best Practices

### 1. Always Check Database Status

```typescript
// In your controllers
const currentDb = DataService.getCurrentDatabaseType();
const isMigrated = DataService.isMigrated();
```

### 2. Use Unified Data Service

```typescript
// ✅ Good - database agnostic
const users = await DataService.getAllUsers();

// ❌ Avoid - database specific
const result = await getPool().query('SELECT * FROM users');
```

### 3. Handle Both Data Formats

```typescript
// Handle both PostgreSQL and MongoDB response formats
const getData = (result: DatabaseResult) => {
  return result.rows || result.data || [];
};
```

### 4. Include Database Info in Responses

```typescript
res.json({
  database: DataService.getCurrentDatabaseType(),
  migrated: DataService.isMigrated(),
  data: results
});
```

## Testing the System

### Manual Testing

```bash
# 1. Check initial state
curl http://localhost:4000/api/unified/database-info

# 2. Seed and check PostgreSQL
curl -X POST http://localhost:4000/api/admin/seed -H "Authorization: Bearer TOKEN"
curl http://localhost:4000/api/unified/users

# 3. Migrate and check MongoDB
curl -X POST http://localhost:4000/api/admin/migrate -H "Authorization: Bearer TOKEN"
curl http://localhost:4000/api/unified/users

# 4. Compare data consistency
curl http://localhost:4000/api/admin/stats
```

### Automated Testing

The system supports automated testing of both database configurations:

```typescript
// Test with PostgreSQL
migrationStatus.markNotMigrated();
const pgUsers = await DataService.getAllUsers();

// Test with MongoDB
migrationStatus.markMigrated();
const mongoUsers = await DataService.getAllUsers();

// Compare results
expect(pgUsers.length).toBe(mongoUsers.length);
```

## Troubleshooting

### Common Issues

1. **Migration Status File Permission**
   ```bash
   # Ensure write permissions
   chmod 666 migration-status.json
   ```

2. **Database Connection Issues**
   ```bash
   # Check both databases are running
   curl http://localhost:4000/health
   ```

3. **Inconsistent Data After Migration**
   ```bash
   # Clear and re-seed
   curl -X DELETE http://localhost:4000/api/admin/clear -H "Authorization: Bearer TOKEN"
   curl -X POST http://localhost:4000/api/admin/seed -H "Authorization: Bearer TOKEN"
   curl -X POST http://localhost:4000/api/admin/migrate -H "Authorization: Bearer TOKEN"
   ```

### Debug Information

Enable debug logging by checking:

```bash
# Server console shows:
=== DATABASE CONFIGURATION ===
Current Database: POSTGRESQL
Migration Status: NOT MIGRATED
===============================
```

## Conclusion

This dual database system provides:

- ✅ **Seamless switching** between PostgreSQL and MongoDB
- ✅ **Persistent migration status** tracking
- ✅ **Unified API interface** regardless of active database
- ✅ **Easy testing** of both database configurations
- ✅ **Safe rollback** capabilities
- ✅ **Production-ready** error handling 