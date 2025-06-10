# Concert Booking System - Development Environment Startup
# This script starts the React frontend + backend + databases for development

Write-Host "Starting Concert Booking System - Development Environment" -ForegroundColor Cyan
Write-Host "=========================================================" -ForegroundColor Cyan

# Check if Docker is running
Write-Host "Checking Docker status..." -ForegroundColor Yellow
try {
    docker version | Out-Null
    Write-Host "✅ Docker is running" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker is not running. Please start Docker Desktop." -ForegroundColor Red
    exit 1
}

# Stop any existing containers
Write-Host "Stopping existing containers..." -ForegroundColor Yellow
docker-compose -f docker-compose.dev.yml down

# Build and start services
Write-Host "Building and starting development services..." -ForegroundColor Yellow
docker-compose -f docker-compose.dev.yml up --build -d

# Wait for services to be ready
Write-Host "Waiting for services to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 15

# Check service status
Write-Host "Checking service status..." -ForegroundColor Yellow

$services = @("frontend", "backend", "postgres", "mongodb")
$allHealthy = $true

foreach ($service in $services) {
    $status = docker-compose -f docker-compose.dev.yml ps -q $service
    if ($status) {
        Write-Host "✅ $service is running" -ForegroundColor Green
    } else {
        Write-Host "❌ $service is not running" -ForegroundColor Red
        $allHealthy = $false
    }
}

Write-Host ""

if ($allHealthy) {
    Write-Host "🎉 Development environment started successfully!" -ForegroundColor Green
} else {
    Write-Host "⚠️  Some services may have issues. Check the logs below." -ForegroundColor Yellow
}

Write-Host "`nAccess Information:" -ForegroundColor Cyan
Write-Host "===================" -ForegroundColor Cyan
Write-Host "🌐 React Frontend:  http://localhost:3000" -ForegroundColor White
Write-Host "🔧 Backend API:     http://localhost:4000/api" -ForegroundColor White
Write-Host "❤️  Health Check:   http://localhost:4000/health" -ForegroundColor White
Write-Host "🗄️  PostgreSQL:     localhost:5432" -ForegroundColor White
Write-Host "🍃 MongoDB:        localhost:27017" -ForegroundColor White
Write-Host "📊 pgAdmin:        http://localhost:5050" -ForegroundColor White

Write-Host "`nDevelopment Features:" -ForegroundColor Cyan
Write-Host "=====================" -ForegroundColor Cyan
Write-Host "• React hot reloading enabled" -ForegroundColor White
Write-Host "• Backend hot reloading with nodemon" -ForegroundColor White
Write-Host "• Database ports exposed for direct access" -ForegroundColor White
Write-Host "• pgAdmin for database management" -ForegroundColor White
Write-Host "• Source code mounted for live editing" -ForegroundColor White

Write-Host "`nUseful Commands:" -ForegroundColor Cyan
Write-Host "================" -ForegroundColor Cyan
Write-Host "View logs:        docker-compose -f docker-compose.dev.yml logs -f" -ForegroundColor White
Write-Host "Stop services:    docker-compose -f docker-compose.dev.yml down" -ForegroundColor White
Write-Host "Restart:          docker-compose -f docker-compose.dev.yml restart" -ForegroundColor White
Write-Host "Shell into backend: docker-compose -f docker-compose.dev.yml exec backend sh" -ForegroundColor White

Write-Host "`nHappy coding!" -ForegroundColor Magenta 