# AltCorp Wallet - Local Development Script for Windows# AltCorp Wallet - Startup Script

# Run this script to start development environment# PowerShell script for Windows



Write-Host "🚀 AltCorp Wallet - Starting Development Environment" -ForegroundColor CyanWrite-Host "🚀 Iniciando AltCorp Wallet..." -ForegroundColor Green

Write-Host "=================================================" -ForegroundColor CyanWrite-Host ""

Write-Host ""

# Check if .env exists

# Check if Docker is runningif (!(Test-Path .env)) {

Write-Host "🔍 Checking Docker..." -ForegroundColor Yellow    Write-Host "⚠️  Arquivo .env não encontrado. Copiando de .env.example..." -ForegroundColor Yellow

try {    Copy-Item .env.example .env

    docker ps | Out-Null    Write-Host "✅ Arquivo .env criado. Configure-o se necessário." -ForegroundColor Green

    Write-Host "✅ Docker is running" -ForegroundColor Green    Write-Host ""

} catch {}

    Write-Host "❌ Docker is not running. Please start Docker Desktop." -ForegroundColor Red

    exit 1# Build and start containers

}Write-Host "🔨 Construindo e iniciando containers..." -ForegroundColor Cyan

Write-Host ""docker-compose up -d --build



# Stop existing containers# Wait for services to be healthy

Write-Host "🛑 Stopping existing containers..." -ForegroundColor YellowWrite-Host ""

docker-compose downWrite-Host "⏳ Aguardando serviços iniciarem..." -ForegroundColor Yellow

Write-Host ""Start-Sleep -Seconds 10



# Check if .env exists# Check services status

if (-not (Test-Path ".env")) {Write-Host ""

    Write-Host "⚠️  .env file not found. Creating from .env.example..." -ForegroundColor YellowWrite-Host "📊 Status dos serviços:" -ForegroundColor Cyan

    Copy-Item ".env.example" ".env"docker-compose ps

    Write-Host "✅ .env file created. Please edit it if needed." -ForegroundColor Green

    Write-Host ""Write-Host ""

}Write-Host "✅ AltCorp Wallet está rodando!" -ForegroundColor Green

Write-Host ""

# Create frontend/.env for developmentWrite-Host "🌐 Acesse:" -ForegroundColor Cyan

Write-Host "📝 Configuring frontend for local development..." -ForegroundColor YellowWrite-Host "   Frontend:  http://localhost" -ForegroundColor White

"VITE_API_URL=http://localhost:8000" | Out-File -FilePath "frontend/.env" -Encoding utf8Write-Host "   Backend:   http://localhost:8000" -ForegroundColor White

Write-Host "✅ Frontend configured to use http://localhost:8000" -ForegroundColor GreenWrite-Host "   API Docs:  http://localhost:8000/api/docs" -ForegroundColor White

Write-Host ""Write-Host ""

Write-Host "📝 Para ver os logs: docker-compose logs -f" -ForegroundColor Yellow

# Ask user for modeWrite-Host "🛑 Para parar: docker-compose down" -ForegroundColor Yellow

Write-Host "Choose mode:" -ForegroundColor Cyan
Write-Host "1. Development (exposes all ports, DEBUG=True)" -ForegroundColor White
Write-Host "2. Production (only frontend:8080, DEBUG=False)" -ForegroundColor White
Write-Host ""
$mode = Read-Host "Enter choice (1 or 2)"

if ($mode -eq "1") {
    Write-Host ""
    Write-Host "🔧 Starting in DEVELOPMENT mode..." -ForegroundColor Cyan
    Write-Host ""
    docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d --build
    
    Write-Host ""
    Write-Host "📦 Services starting..." -ForegroundColor Yellow
    Start-Sleep -Seconds 5
    
    Write-Host ""
    Write-Host "✅ Development environment ready!" -ForegroundColor Green
    Write-Host ""
    Write-Host "🌐 Access URLs:" -ForegroundColor Cyan
    Write-Host "   Frontend:  http://localhost:8080" -ForegroundColor White
    Write-Host "   Backend:   http://localhost:8000/docs" -ForegroundColor White
    Write-Host "   Database:  localhost:5432" -ForegroundColor White
    
} else {
    Write-Host ""
    Write-Host "🚀 Starting in PRODUCTION mode..." -ForegroundColor Cyan
    Write-Host ""
    docker-compose up -d --build
    
    Write-Host ""
    Write-Host "📦 Services starting..." -ForegroundColor Yellow
    Start-Sleep -Seconds 5
    
    Write-Host ""
    Write-Host "✅ Production environment ready!" -ForegroundColor Green
    Write-Host ""
    Write-Host "🌐 Access URL:" -ForegroundColor Cyan
    Write-Host "   Frontend: http://localhost:8080" -ForegroundColor White
}

Write-Host ""
Write-Host "🔐 Default credentials:" -ForegroundColor Cyan
Write-Host "   Username: admin" -ForegroundColor White
Write-Host "   Password: admin123" -ForegroundColor White
Write-Host ""

# Wait for services to be healthy
Write-Host "⏳ Waiting for services to be healthy..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Check if admin user exists
Write-Host ""
Write-Host "🔍 Checking if admin user exists..." -ForegroundColor Yellow

try {
    $response = Invoke-RestMethod -Uri "http://localhost:8000/api/v1/auth/login" `
        -Method POST `
        -ContentType "application/json" `
        -Body '{"username":"admin","password":"admin123"}' `
        -ErrorAction Stop
    
    Write-Host "✅ Admin user exists and can login!" -ForegroundColor Green
    
} catch {
    Write-Host "⚠️  Admin user not found. Creating..." -ForegroundColor Yellow
    
    try {
        Start-Sleep -Seconds 3
        $createResponse = Invoke-RestMethod -Uri "http://localhost:8000/api/v1/auth/register" `
            -Method POST `
            -ContentType "application/json" `
            -Body '{"username":"admin","name":"Administrator","password":"admin123","role":"admin"}' `
            -ErrorAction Stop
        
        Write-Host "✅ Admin user created successfully!" -ForegroundColor Green
        
    } catch {
        Write-Host "❌ Failed to create admin user. You may need to create it manually." -ForegroundColor Red
        Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "=================================================" -ForegroundColor Cyan
Write-Host "🎉 Setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📚 Useful commands:" -ForegroundColor Cyan
Write-Host "   View logs:     docker-compose logs -f" -ForegroundColor White
Write-Host "   Stop:          docker-compose down" -ForegroundColor White
Write-Host "   Restart:       docker-compose restart" -ForegroundColor White
Write-Host "   Status:        docker-compose ps" -ForegroundColor White
Write-Host ""
Write-Host "🌐 Open in browser: http://localhost:8080" -ForegroundColor Green
Write-Host "=================================================" -ForegroundColor Cyan
Write-Host ""

# Ask to open browser
$openBrowser = Read-Host "Open http://localhost:8080 in browser? (Y/n)"
if ($openBrowser -ne "n") {
    Start-Process "http://localhost:8080"
}

# Ask to show logs
$showLogs = Read-Host "Show live logs? (Y/n)"
if ($showLogs -ne "n") {
    Write-Host ""
    Write-Host "📋 Showing logs (Press Ctrl+C to exit)..." -ForegroundColor Cyan
    Write-Host ""
    docker-compose logs -f
}
