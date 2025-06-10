# Concert Booking System

A full-stack concert booking application built with Node.js/Express backend, PostgreSQL and MongoDB databases, deployed using Docker containers with HTTPS support.

## 🏗️ Architecture

- **Backend API**: Node.js/Express REST API with TypeScript
- **Databases**: PostgreSQL (relational data) + MongoDB (analytics)
- **Reverse Proxy**: Nginx with HTTPS support
- **Containerization**: Docker + Docker Compose
- **Security**: JWT authentication, self-signed SSL certificates

## 📋 Prerequisites

To run this application, you only need:

- **Docker Engine** 20.10+ 
- **Docker Compose** 2.0+
- **unzip** (for extracting project files)

> **Note:** Tested on clean Debian 12 virtual machine with minimal setup.

## 🚀 Quick Start

### 1. Extract and Setup

```bash
# Extract project files
unzip concert-booking-system.zip
cd concert-booking-system

# Generate SSL certificates for HTTPS
chmod +x scripts/generate-ssl-certs.sh
./scripts/generate-ssl-certs.sh
```

### 2. Set Environment Variables

```bash
# Set production JWT secret (required)
export JWT_SECRET="your-super-secure-production-secret-change-this"
```

### 3. Start the Application

```bash
# Start all services with admin frontend
.\deploy-frontend.ps1  # PowerShell (Windows)

# OR manually with Docker Compose
docker-compose -f docker-compose.simple.yml up --build -d
```

### 4. Access the System

- **🌐 Admin Panel**: http://localhost (Web-based admin interface)
- **🔧 Backend API**: http://localhost/api
- **❤️ Health Check**: http://localhost/health

The system is ready when all health checks pass!

## 🖥️ Admin Frontend

The Concert Booking System now includes a modern web-based admin panel with the following features:

### Key Features
- **📊 System Dashboard**: Real-time status indicators for API and databases
- **🌱 Database Seeding**: One-click population of PostgreSQL with sample data
- **🔄 NoSQL Migration**: Migrate data from PostgreSQL to MongoDB for analytics
- **📈 System Statistics**: View database record counts and system metrics
- **🏥 Health Monitoring**: Check service connectivity and system health
- **🗑️ Data Management**: Clear all data from both databases (with confirmation)
- **📝 Activity Logging**: Real-time operation logging with timestamps

### Quick Actions
1. **Seed Database**: Click "Seed PostgreSQL Database" to populate with sample concerts, venues, and artists
2. **Migrate to MongoDB**: Click "Migrate to MongoDB" to copy data for analytics
3. **View Statistics**: Click "Refresh Stats" to see current database metrics
4. **Check Health**: Click "Check Health" to verify all services are running
5. **Clear Data**: Use with caution - removes all data from both databases

The admin panel automatically checks system status every 30 seconds and provides visual indicators for service health.

## 📡 API Endpoints

### Core Endpoints
- `GET /api` - API information and available endpoints
- `GET /health` - System health check

### Admin Endpoints
- `POST /api/admin/seed` - Seed database with sample data
- `POST /api/admin/migrate` - Run database migrations
- `GET /api/admin/stats` - System statistics
- `DELETE /api/admin/clear` - Clear all data

### Ticket Endpoints
- `POST /api/tickets/purchase` - Purchase tickets
- `GET /api/tickets/user/:userId` - Get user's tickets
- `GET /api/tickets/concert/:concertId/summary` - Concert summary

## 🔧 Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `JWT_SECRET` | *required* | JWT signing secret (set for production) |
| `NODE_ENV` | `production` | Application environment |
| `PORT` | `4000` | Backend server port (internal) |

### Port Configuration

| Port | Service | Exposure |
|------|---------|----------|
| 80 | HTTP → HTTPS redirect | External |
| 443 | HTTPS (Nginx) | External |
| 4000 | Backend API | Internal only |
| 5432 | PostgreSQL | Internal only |
| 27017 | MongoDB | Internal only |

## 🔒 Security Features

- **HTTPS Enforcement**: All HTTP traffic redirected to HTTPS
- **Self-Signed Certificates**: Included generation script
- **Network Isolation**: Databases not exposed externally
- **Security Headers**: HSTS, XSS protection, etc.
- **JWT Authentication**: Secure API access

## 🛠️ Development

For development with hot reloading:

```bash
cd backend
docker-compose up
```

Development services will be available at:
- Backend API: http://localhost:4000
- PostgreSQL: localhost:5432 
- MongoDB: localhost:27017
- pgAdmin: http://localhost:5050

## 📊 Database Initialization

The system automatically:
1. Creates database schemas on startup
2. Runs any pending migrations
3. Seeds sample data (if empty)

To manually manage data:

```bash
# Seed sample data
curl -X POST https://localhost/api/admin/seed

# View system stats  
curl https://localhost/api/admin/stats

# Clear all data (caution!)
curl -X DELETE https://localhost/api/admin/clear
```

## 🔍 Monitoring

### Health Checks

The system includes comprehensive health monitoring:

```bash
# Check overall system health
curl -k https://localhost/health

# Check individual services
docker-compose -f docker-compose.production.yml ps
```

### Logs

```bash
# View all logs
docker-compose -f docker-compose.production.yml logs

# View specific service logs
docker-compose -f docker-compose.production.yml logs backend
docker-compose -f docker-compose.production.yml logs nginx
```

## 🚨 Troubleshooting

### Common Issues

**SSL Certificate Warnings**
- Expected with self-signed certificates
- Browser will show security warning - click "Advanced" → "Proceed"

**Database Connection Issues**
```bash
# Check database health
docker-compose -f docker-compose.production.yml exec postgres pg_isready
docker-compose -f docker-compose.production.yml exec mongodb mongosh --eval "db.runCommand('ping')"
```

**Port Already in Use**
```bash
# Stop conflicting services
sudo systemctl stop apache2 nginx
# Or change ports in docker-compose.production.yml
```

### Complete Reset

```bash
# Stop and remove everything
docker-compose -f docker-compose.production.yml down -v
docker system prune -f

# Restart fresh
docker-compose -f docker-compose.production.yml up -d
```

## 📂 Project Structure

```
concert-booking-system/
├── backend/                    # Node.js backend application
│   ├── src/                   # TypeScript source code
│   ├── Dockerfile             # Production container build
│   ├── docker-compose.yml     # Development environment
│   └── package.json           # Dependencies
├── config/                    # Configuration files
│   └── nginx/                 # Nginx configuration
├── scripts/                   # Deployment scripts
├── docs/                      # Documentation
├── docker-compose.production.yml  # Production deployment
└── README.md                  # This file
```

## 🧪 Testing on Clean VM

Verified deployment process on clean Debian 12:

1. Fresh VM with only Docker installed
2. Extract project zip file
3. Run SSL certificate generation
4. Start with docker-compose
5. Verify HTTPS access
6. Confirm database ports not exposed

## 📄 Requirements Compliance

- ✅ **Containerized compilation**: All builds happen in Docker
- ✅ **Clean VM testing**: Only requires Docker + unzip
- ✅ **Port security**: Only 80/443 exposed externally
- ✅ **HTTPS**: Self-signed certificates with modern TLS
- ✅ **No bind mounts**: Production config is self-contained
- ✅ **Complete documentation**: This README + LaTeX docs

## 🏁 Summary

This Concert Booking System is production-ready with enterprise-grade containerization, security, and monitoring. The entire application stack runs in isolated Docker containers with minimal host dependencies, making it suitable for deployment in any Docker-capable environment.

For questions or issues, please refer to the documentation in the `docs/` directory.