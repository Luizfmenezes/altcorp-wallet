# =====================================================
# start-local.ps1 - Inicia o sistema em modo DEV LOCAL
# Uso: .\start-local.ps1
# Acesso: http://192.168.15.5:8080
# =====================================================

Write-Host "`n`u{1F680} Iniciando AltCorp Wallet (modo DEV LOCAL)..." -ForegroundColor Cyan

# Carrega .env.local se existir
if (Test-Path ".env.local") {
    Get-Content ".env.local" | ForEach-Object {
        if ($_ -match "^\s*([^#][^=]*)\s*=\s*(.*)\s*$") {
            [System.Environment]::SetEnvironmentVariable($matches[1].Trim(), $matches[2].Trim(), "Process")
        }
    }
    Write-Host "`u{2705} Usando configurações de .env.local" -ForegroundColor Green
} else {
    Write-Host "`u{26A0}`u{FE0F}  .env.local não encontrado, usando .env padrão" -ForegroundColor Yellow
}

Write-Host "`u{1F528} Construindo e iniciando em modo dev..." -ForegroundColor Yellow
docker compose --profile dev up --build -d --force-recreate

Start-Sleep -Seconds 5
docker compose --profile dev ps

Write-Host ""
Write-Host "`u{2705} Sistema iniciado com sucesso!" -ForegroundColor Green
Write-Host "   Frontend: http://192.168.15.5:8080" -ForegroundColor White
Write-Host "   Backend:  http://192.168.15.5:8000" -ForegroundColor White
Write-Host "   Docs API: http://192.168.15.5:8000/api/docs" -ForegroundColor White
Write-Host ""
Write-Host "   `u{1F4DD} Logs: docker compose --profile dev logs -f" -ForegroundColor Yellow
Write-Host "   `u{1F6D1} Parar: docker compose --profile dev down" -ForegroundColor Yellow
