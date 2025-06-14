# Clean API Architecture

This document describes the new clean API architecture implemented for the concert booking system that supports both PostgreSQL and MongoDB databases.

## Architecture Overview

The system follows a clean architecture pattern:

```
HTTP Request → API Controller → Service (business logic) → Repository (Postgres or Mongo) → DB
                ↑
            DTOs used consistently
```

## Key Components

### 1. DTOs (Data Transfer Objects) 
**Location:** `src/dto/index.ts`

- Define consistent API response format
- Include validation logic
- Support for ticket purchasing with referral codes

**Key DTOs:**
- `TicketPurchaseRequestDTO` - Request format for ticket purchases
- `TicketPurchaseResponseDTO` - Response format with pricing details
- `ReferralValidationResult` - Referral code validation result

### 2. Repository Layer
**Location:** `src/repositories/`

**Interfaces:** `src/repositories/interfaces.ts`
- `IUserRepository` - User data access
- `ITicketRepository` - Ticket data access  
- `IRepositoryFactory` - Factory for creating repositories

**Implementations:**
- `src/repositories/postgres/index.ts` - PostgreSQL implementation
- `src/repositories/mongodb/index.ts` - MongoDB implementation
- `src/repositories/factory.ts` - Database switcher based on migration status

### 3. Service Layer
**Location:** `src/services/`

**TicketService** (`src/services/ticket-service.ts`)
- **Business Logic:** Ticket purchasing with referral system
- **Referral Rules:**
  - First-time referral code users get 10% discount
  - Users can only use one referral code ever
  - Cannot use your own referral code
  - Referrers get 5 points per ticket sold

**AdminService** (`src/services/admin-service.ts`)  
- Database seeding functionality
- Migration to MongoDB
- System status and statistics

### 4. Controller Layer
**Location:** `src/controllers/`

**CleanTicketController** (`src/controllers/clean-ticket-controller.ts`)
- `POST /api/tickets/purchase` - Purchase tickets with referral support
- `GET /api/tickets/my-tickets` - Get user's tickets
- `POST /api/tickets/validate-purchase` - Validate purchase without buying

**CleanAdminController** (`src/controllers/clean-admin-controller.ts`)
- `POST /api/admin/seed` - Seed database with sample data
- `POST /api/admin/migrate` - Migrate to MongoDB  
- `GET /api/admin/status` - Get system status
- `POST /api/admin/reset-migration` - Reset migration status

### 5. Routes
**Location:** `src/routes/`

- `src/routes/clean-ticket-routes.ts` - Ticket endpoints with proper middleware
- `src/routes/clean-admin-routes.ts` - Admin endpoints with admin-only access

## Database Abstraction

The system automatically switches between PostgreSQL and MongoDB based on migration status:

### Before Migration (PostgreSQL)
- Uses normalized relational structure
- Separate tables for users, fans, organizers, tickets
- Foreign key relationships

### After Migration (MongoDB)  
- Uses denormalized document structure
- Embedded fan/organizer details in user documents
- Duplicated data for better query performance

### Migration Process

1. **Admin logs in** and calls `POST /api/admin/migrate`
2. System migrates all data from PostgreSQL to MongoDB
3. Migration status is updated
4. All subsequent API calls use MongoDB repositories
5. API responses remain identical regardless of database

## Ticket Purchase Use Case

### Business Logic Implementation

1. **User Authentication** - Must be logged in as a fan
2. **Concert & Zone Validation** - Concert exists and zone is available  
3. **Ticket Availability** - Check remaining capacity
4. **Referral Code Processing:**
   - Validate referral code exists
   - Check user hasn't used referral before
   - Apply 10% discount if valid
   - Award points to referrer
5. **Ticket Creation** - Create tickets with purchase details
6. **Response** - Return tickets with pricing breakdown

### Example API Call

```bash
POST /api/tickets/purchase
Authorization: Bearer <fan-token>
{
  "concert_id": "concert-123",
  "zone_name": "VIP",
  "quantity": 2,
  "referral_code": "JOHN2024"
}
```

### Example Response

```json
{
  "success": true,
  "tickets": [
    {
      "ticket_id": "ticket-456",
      "fan_id": "fan-789",
      "concert_id": "concert-123",
      "zone_name": "VIP",
      "price": 50.00,
      "referral_code_used": true,
      "purchase_date": "2024-12-01T10:30:00Z"
    }
  ],
  "total_amount": 90.00,
  "discount_applied": 10.00,
  "discount_percentage": 10,
  "database_type": "postgresql",
  "message": "Successfully purchased 2 ticket(s) for Holiday Concert"
}
```

## Admin Functionality

### Database Seeding

Creates sample users:
- 2 fan accounts with referral codes
- 1 organizer account  
- 1 admin account

### Migration

- Migrates all data from PostgreSQL to MongoDB
- Maintains data integrity and relationships
- Updates system to use MongoDB for all operations

## Security & Authorization

### Middleware
- `requireFanAuth` - Ensures user is authenticated as fan
- `requireAdminAuth` - Ensures user is authenticated as admin
- `requireAdminOrOrganizerAuth` - Allows admin or organizer access

### Access Control
- Fans can only purchase tickets and view their own tickets
- Admins can seed database, migrate, and view system status
- All endpoints require proper authentication

## Database Compatibility

The same API endpoints work identically with both databases:

### PostgreSQL Structure
```sql
-- Normalized tables
users → fans/organizers (1:1)
concerts → concert_features_artists (1:N)
concerts → concert_zone_pricing (1:N)
tickets → concerts/users (N:1)
```

### MongoDB Structure  
```javascript
// Denormalized documents
{
  _id: "user-123",
  user_type: "fan",
  fan_details: { username, referral_code, ... },
  // Embedded fan information
}

{
  _id: "ticket-456", 
  concert_date: "2024-12-25",
  fan_username: "johndoe",
  // Denormalized for faster queries
}
```

## Benefits of This Architecture

1. **Database Agnostic** - Same API works with both PostgreSQL and MongoDB
2. **Clean Separation** - Business logic separate from data access
3. **Testable** - Each layer can be unit tested independently
4. **Maintainable** - Clear responsibility separation
5. **Extensible** - Easy to add new features or databases
6. **Consistent** - DTOs ensure consistent API responses

## Future Enhancements

- Add more repository implementations (e.g., Redis, DynamoDB)
- Implement caching layer between service and repository
- Add event sourcing for audit trail
- Implement saga pattern for complex transactions
- Add comprehensive validation using DTOValidators 