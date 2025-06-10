# Concert Booking System 🎵

A modern concert booking system that lets fans buy tickets for concerts and organizers manage their events. Built with Node.js, Express, PostgreSQL, MongoDB, and React.

## 🚀 Quick Start Guide

### Prerequisites
- Docker Desktop (Windows/Mac) or Docker Engine (Linux)
- Git

### Step 1: Clone and Setup
```bash
# Clone the repository
git clone <repository-url>
cd concert-booking-system

# Start the development environment
docker-compose -f docker-compose.dev.yml up -d
```

### Step 2: Access the Application
- Frontend: http://localhost:3000
- Backend API: http://localhost:4000
- pgAdmin (Database GUI): http://localhost:5050

### Step 3: Login Credentials
- Admin User:
  - Email: admin@concert.com
  - Password: admin123
- Regular Users (created by seeding):
  - Password: password123

## 🛠️ Development Features

### Database Management
The system uses two databases:
- **PostgreSQL**: Main database for user data, concerts, tickets
- **MongoDB**: Used for analytics and reporting

### Admin Panel Features
1. **Dashboard**: View system status and statistics
2. **Database Management**:
   - Seed sample data (concerts, venues, artists)
   - Migrate data between PostgreSQL and MongoDB
   - Clear all data (with confirmation)
3. **Health Monitoring**: Check service status
4. **Activity Logs**: View system operations

### Development Workflow
1. **Start Development**:
   ```bash
   docker-compose -f docker-compose.dev.yml up -d
   ```

2. **View Logs**:
   ```bash
   docker-compose -f docker-compose.dev.yml logs -f backend
   ```

3. **Stop Services**:
   ```bash
   docker-compose -f docker-compose.dev.yml down
   ```

### Common Tasks

#### Reset Everything
```bash
# Stop all containers
docker-compose -f docker-compose.dev.yml down

# Remove all data (including databases)
docker-compose -f docker-compose.dev.yml down -v

# Start fresh
docker-compose -f docker-compose.dev.yml up -d
```

#### Create Admin User
```bash
docker-compose -f docker-compose.dev.yml exec backend npm run create-admin
```

#### Seed Sample Data
```bash
docker-compose -f docker-compose.dev.yml exec backend npm run seed
```

## 📁 Project Structure
```
concert-booking-system/
├── backend/           # Node.js/Express backend
├── frontend/         # React frontend
├── docker-compose.dev.yml    # Development configuration
└── README.md         # This file
```

## 🔧 Troubleshooting

### Can't Log In?
1. Make sure all containers are running:
   ```bash
   docker-compose -f docker-compose.dev.yml ps
   ```
2. Check backend logs:
   ```bash
   docker-compose -f docker-compose.dev.yml logs backend
   ```
3. Try recreating the admin user:
   ```bash
   docker-compose -f docker-compose.dev.yml exec backend npm run create-admin
   ```

### Database Issues?
1. Check database connections:
   ```bash
   docker-compose -f docker-compose.dev.yml exec postgres pg_isready
   docker-compose -f docker-compose.dev.yml exec mongodb mongosh --eval "db.runCommand({ ping: 1 })"
   ```
2. Reset databases:
   ```bash
   docker-compose -f docker-compose.dev.yml down -v
   docker-compose -f docker-compose.dev.yml up -d
   ```

## 📚 Additional Resources
- [Backend API Documentation](backend/README.md)
- [Frontend Documentation](frontend/README.md)
- [Database Schema](backend/src/db/init/01-init.sql)

## 🤝 Contributing
Feel free to submit issues and pull requests!

## 📝 License
This project is licensed under the MIT License.