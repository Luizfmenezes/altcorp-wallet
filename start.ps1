# ============================================
# AltCorp Wallet - Start Script (PowerShell)
# ============================================
# Uso:
#   .\start.ps1          → Inicia em modo DEV
#   .\start.ps1 vm       → Inicia em modo VM/LAN
#   .\start.ps1 prod     → Inicia em modo PROD
#   .\start.ps1 stop     → Para todos os containers
#   .\start.ps1 logs     → Mostra logs
# ============================================

param(
    [Parameter(Position=0)]
    [ValidateSet("dev", "vm", "prod", "stop", "logs", "restart", "build")]
    [string]$Mode = "dev"
)

$ErrorActionPreference = "Stop"

# Garante .env existe
if (!(Test-Path .env)) {
    Write-Host "`u{26A0}`u{FE0F}  Arquivo .env não encontrado. Copiando de .env.example..." -ForegroundColor Yellow
    Copy-Item .env.example .env
    Write-Host "`u{2705} Arquivo .env criado. Configure as variáveis antes de continuar." -ForegroundColor Green
}

switch ($Mode) {
    "dev" {
        Write-Host "`n`u{1F680} Iniciando AltCorp Wallet em modo DESENVOLVIMENTO..." -ForegroundColor Cyan
        docker compose --profile dev up --build
        Write-Host "`n`u{1F310} Acesso: http://localhost:8080" -ForegroundColor Green
        Write-Host "`u{1F4CB} API Docs: http://localhost:8000/api/docs" -ForegroundColor Green
    }
    "vm" {
        Write-Host "`n`u{1F680} Iniciando AltCorp Wallet em modo VM/LAN..." -ForegroundColor Cyan
        docker compose --profile vm up --build -d
        Start-Sleep -Seconds 5
        docker compose --profile vm ps
        Write-Host "`n`u{2705} Rodando em background!" -ForegroundColor Green
        Write-Host "`u{1F310} Frontend: http://192.168.15.5:8080" -ForegroundColor Green
        Write-Host "`u{1F4CB} API Docs: http://192.168.15.5:8000/api/docs" -ForegroundColor Green
        Write-Host "`u{1F4DD} Logs: .\start.ps1 logs" -ForegroundColor Yellow
    }
    "prod" {
        Write-Host "`n`u{1F680} Iniciando AltCorp Wallet em modo PRODUÇÃO..." -ForegroundColor Cyan
        docker compose --profile prod up --build -d
        Start-Sleep -Seconds 5
        docker compose --profile prod ps
        Write-Host "`n`u{2705} Rodando em background!" -ForegroundColor Green
        Write-Host "`u{1F310} HTTPS: https://wallet.altcorphub.com" -ForegroundColor Green
        Write-Host "`u{1F310} Local: http://localhost:8080" -ForegroundColor Green
        Write-Host "`u{1F4DD} Logs: .\start.ps1 logs" -ForegroundColor Yellow
    }
    "stop" {
        Write-Host "`u{23F9}`u{FE0F}  Parando todos os containers..." -ForegroundColor Yellow
        docker compose --profile dev --profile vm --profile prod down
        Write-Host "`u{2705} Parado." -ForegroundColor Green
    }
    "logs" {
        docker compose --profile dev --profile vm --profile prod logs -f --tail=100
    }
    "restart" {
        Write-Host "`u{1F504} Reiniciando..." -ForegroundColor Yellow
        docker compose --profile dev --profile vm --profile prod down
        docker compose --profile dev up --build
    }
    "build" {
        Write-Host "`u{1F528} Reconstruindo imagens (sem cache)..." -ForegroundColor Yellow
        docker compose --profile dev --profile vm --profile prod build --no-cache
        Write-Host "`u{2705} Build completo." -ForegroundColor Green
    }
}
