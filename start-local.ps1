# =====================================================
# start-local.ps1 - Inicia o sistema em modo LOCAL
# Uso: .\start-local.ps1
# =====================================================

Write-Host "🚀 Iniciando AltCorp Wallet (modo LOCAL)..." -ForegroundColor Cyan

# Carrega .env.local se existir, senão usa .env
if (Test-Path ".env.local") {
    Get-Content ".env.local" | ForEach-Object {
        if ($_ -match "^\s*([^#][^=]*)\s*=\s*(.*)\s*$") {
            [System.Environment]::SetEnvironmentVariable($matches[1].Trim(), $matches[2].Trim(), "Process")
        }
    }
    Write-Host "✅ Usando configurações de .env.local" -ForegroundColor Green
} else {
    Write-Host "⚠️  .env.local não encontrado, usando .env padrão" -ForegroundColor Yellow
}

$viteUrl = $env:VITE_API_URL
if (-not $viteUrl) { $viteUrl = "http://localhost:8000/api/v1" }

Write-Host "📡 VITE_API_URL = $viteUrl" -ForegroundColor Cyan
Write-Host "🔨 Realizando rebuild do frontend sem cache..." -ForegroundColor Yellow

docker compose build --no-cache --build-arg VITE_API_URL=$viteUrl frontend

Write-Host "▶️  Subindo todos os serviços..." -ForegroundColor Yellow
docker compose up -d --force-recreate

Write-Host ""
Write-Host "✅ Sistema iniciado com sucesso!" -ForegroundColor Green
Write-Host "   Frontend: http://localhost:8080" -ForegroundColor White
Write-Host "   Backend:  http://localhost:8000" -ForegroundColor White
Write-Host "   Docs API: http://localhost:8000/api/docs" -ForegroundColor White
Write-Host ""
Write-Host "   Login: admin / Admin123!" -ForegroundColor Yellow
