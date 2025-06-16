# ConcertGo

A modern concert booking system that lets fans buy tickets for concerts and organizers manage their events. Built with Node.js, Express, PostgreSQL, MongoDB, and React.

## 🚀 Getting Started

### Prerequisites
- Docker Desktop (Windows/Mac) or Docker Engine (Linux) - [Download here](https://docs.docker.com/get-docker/)
- Git - [Download here](https://git-scm.com/downloads)

### Quick Start (2 steps)

1. **Start the application in production**
   ```bash
   docker-compose -f docker-compose.prod.yml up -d
   ```
2. **Access the application development**
- 🌐 **Frontend**: https://localhost

1. **Start the application in development**
   ```bash
   docker-compose -f docker-compose.dev.yml up -d
   ```
   *This will start all services (frontend, backend, databases) in the background*
*
2. **Access the application development**
   - 🌐 **Frontend**: http://localhost:3000
   - 🔧 **Backend API**: http://localhost:4000
   - 🗄️ **pgAdmin (Database GUI)**: http://localhost:5050

### 🔐 Login Credentials
- **Admin User**:
  - Email: `admin@concert.com`
  - Password: `admin123`
- **Regular Users** (created by seeding):
  - Password: `password123`
---