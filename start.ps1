# AltCorp Wallet - Startup Script
# PowerShell script for Windows

Write-Host "🚀 Iniciando AltCorp Wallet..." -ForegroundColor Green
Write-Host ""

# Check if .env exists
if (!(Test-Path .env)) {
    Write-Host "⚠️  Arquivo .env não encontrado. Copiando de .env.example..." -ForegroundColor Yellow
    Copy-Item .env.example .env
    Write-Host "✅ Arquivo .env criado. Configure-o se necessário." -ForegroundColor Green
    Write-Host ""
}

# Build and start containers
Write-Host "🔨 Construindo e iniciando containers..." -ForegroundColor Cyan
docker-compose up -d --build

# Wait for services to be healthy
Write-Host ""
Write-Host "⏳ Aguardando serviços iniciarem..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Check services status
Write-Host ""
Write-Host "📊 Status dos serviços:" -ForegroundColor Cyan
docker-compose ps

Write-Host ""
Write-Host "✅ AltCorp Wallet está rodando!" -ForegroundColor Green
Write-Host ""
Write-Host "🌐 Acesse:" -ForegroundColor Cyan
Write-Host "   Frontend:  http://localhost" -ForegroundColor White
Write-Host "   Backend:   http://localhost:8000" -ForegroundColor White
Write-Host "   API Docs:  http://localhost:8000/api/docs" -ForegroundColor White
Write-Host ""
Write-Host "📝 Para ver os logs: docker-compose logs -f" -ForegroundColor Yellow
Write-Host "🛑 Para parar: docker-compose down" -ForegroundColor Yellow
