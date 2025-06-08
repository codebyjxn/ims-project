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

## Running with Docker Compose

### Development Mode

To run the application in development mode with hot reloading:

```bash
# Start all services in development mode
docker-compose up

# Or run in background
docker-compose up -d
```

This will start:
- **Backend API**: http://localhost:4000
- **PostgreSQL**: localhost:5432
- **MongoDB**: localhost:27017
- **pgAdmin**: http://localhost:5050

### Production Mode

To run the application in production mode:

```bash
# Set production JWT secret
export JWT_SECRET="your-super-secure-production-secret"

# Start all services in production mode
docker-compose -f docker-compose.prod.yml up -d
```

### Environment Variables

The application uses the following environment variables:

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

For development, these are set in the `docker-compose.yml` file. For production, create a `.env` file with these variables, especially setting a secure `JWT_SECRET`.

### Database Access

#### pgAdmin
- **URL**: http://localhost:5050
- **Email**: admin@admin.com
- **Password**: admin

**PostgreSQL Connection:**
- **Host**: `postgres`
- **Port**: `5432`
- **Database**: `concert_booking`
- **Username**: `postgres`
- **Password**: `postgres`

### Stopping the Services

To stop all services:
```bash
# Stop services
docker-compose down

# Stop services and remove volumes
docker-compose down -v
```

## Available Endpoints

### Admin Endpoints
- `