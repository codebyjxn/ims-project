# Concert Booking System - Backend

## Project Structure

This backend is now self-contained with all Docker configuration, dependencies, and source code in this directory.

```
backend/
├── docker-compose.yml          # Development environment
├── docker-compose.prod.yml     # Production environment  
├── Dockerfile                  # Multi-stage production build
├── Dockerfile.dev             # Development build
├── package.json               # All dependencies
├── src/                       # Source code
└── README.md                  # This file
```

## Quick Start

### Development Environment

```bash
# Navigate to backend directory
cd backend

# Start development environment
docker-compose up

# Or run in background
docker-compose up -d
```

This will start:
- **Backend API**: http://localhost:4000
- **PostgreSQL**: localhost:5432
- **MongoDB**: localhost:27017  
- **pgAdmin**: http://localhost:5050

### Production Environment

```bash
# Navigate to backend directory
cd backend

# Set production JWT secret
export JWT_SECRET="your-super-secure-production-secret"

# Start production environment
docker-compose -f docker-compose.prod.yml up -d
```

## Available Endpoints

### Admin Endpoints
- `POST /api/admin/seed` - Seed database with test data
- `POST /api/admin/migrate` - Migrate PostgreSQL → MongoDB
- `GET /api/admin/stats` - View database statistics
- `GET /api/admin/health` - Health check
- `POST /api/admin/clear` - Clear all data

### User Management
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration

### Tickets
- `POST /api/tickets/purchase` - Purchase tickets
- `GET /api/tickets/user/:userId` - Get user's tickets
- `GET /api/tickets/concert/:concertId/summary` - Concert summary

## Access Levels

1. **Admin** - Database seeding & migration only
2. **Organizers** - Create/manage concerts  
3. **Fans** - Browse concerts & purchase tickets

## Database Access

### pgAdmin
- **URL**: http://localhost:5050
- **Email**: admin@admin.com
- **Password**: admin

**PostgreSQL Connection:**
- **Host**: `postgres`
- **Port**: `5432`
- **Database**: `concert_booking`
- **Username**: `postgres`
- **Password**: `postgres`

## Development

### Local Development (without Docker)
```bash
# Install dependencies
npm install

# Set environment variables
cp .env.example .env

# Start development server
npm run dev
```

### Building for Production
```bash
# Build TypeScript
npm run build

# Start production server
npm start
```

## Environment Variables

```env
NODE_ENV=development
PORT=4000
POSTGRES_HOST=postgres
POSTGRES_PORT=5432
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=concert_booking
MONGODB_URI=mongodb://mongodb:27017/concert_booking
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=24h
``` 