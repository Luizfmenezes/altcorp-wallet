# ============================================
# Script de Deploy Automático - AltCorp Wallet
# PowerShell Version
# ============================================

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  AltCorp Wallet - Deploy Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Functions
function Print-Success {
    param($Message)
    Write-Host "✅ $Message" -ForegroundColor Green
}

function Print-Error {
    param($Message)
    Write-Host "❌ $Message" -ForegroundColor Red
}

function Print-Warning {
    param($Message)
    Write-Host "⚠️  $Message" -ForegroundColor Yellow
}

function Print-Info {
    param($Message)
    Write-Host "ℹ️  $Message" -ForegroundColor Yellow
}

# Check if Docker is installed
try {
    docker --version | Out-Null
    Print-Success "Docker está instalado"
} catch {
    Print-Error "Docker não está instalado. Instale primeiro: https://docs.docker.com/get-docker/"
    exit 1
}

try {
    docker-compose --version | Out-Null
    Print-Success "Docker Compose está instalado"
} catch {
    Print-Error "Docker Compose não está instalado"
    exit 1
}

# Ask for environment
Write-Host ""
Write-Host "Selecione o ambiente:" -ForegroundColor Yellow
Write-Host "  [1] Desenvolvimento (localhost)" -ForegroundColor White
Write-Host "  [2] Produção (wallet.altcorphub.com)" -ForegroundColor White
Write-Host ""
$envChoice = Read-Host "Digite 1 ou 2"

if ($envChoice -eq "1") {
    $ENV = "development"
    $COMPOSE_FILE = "docker-compose.yml"
    $ENV_FILE = ".env.development"
    Print-Info "Ambiente selecionado: DESENVOLVIMENTO"
} elseif ($envChoice -eq "2") {
    $ENV = "production"
    $COMPOSE_FILE = "docker-compose.prod.yml"
    $ENV_FILE = ".env.production"
    Print-Info "Ambiente selecionado: PRODUÇÃO"
} else {
    Print-Error "Opção inválida"
    exit 1
}

# Check if env file exists
if (-not (Test-Path $ENV_FILE)) {
    Print-Error "Arquivo $ENV_FILE não encontrado!"
    exit 1
}

# Copy env file
Write-Host ""
Print-Info "Copiando arquivo de ambiente..."
Copy-Item $ENV_FILE .env -Force
Print-Success "Arquivo .env configurado"

# If production, check for SSL certificates
if ($ENV -eq "production") {
    Write-Host ""
    Print-Warning "ATENÇÃO: Produção requer certificados SSL!"
    
    if (-not (Test-Path "ssl") -or -not (Test-Path "ssl/fullchain.pem") -or -not (Test-Path "ssl/privkey.pem")) {
        Print-Warning "Certificados SSL não encontrados em .\ssl\"
        Write-Host ""
        Write-Host "Deseja continuar sem SSL? (apenas para primeiro teste)" -ForegroundColor Yellow
        $continueWithoutSsl = Read-Host "Digite 'sim' para continuar ou qualquer outra tecla para cancelar"
        
        if ($continueWithoutSsl -ne "sim") {
            Print-Info "Deploy cancelado. Configure SSL primeiro."
            Write-Host ""
            Write-Host "Para obter certificados SSL no Linux:" -ForegroundColor Yellow
            Write-Host "  sudo certbot certonly --standalone -d wallet.altcorphub.com -d www.wallet.altcorphub.com"
            Write-Host "  mkdir -p ssl"
            Write-Host "  sudo cp /etc/letsencrypt/live/wallet.altcorphub.com/fullchain.pem ssl/"
            Write-Host "  sudo cp /etc/letsencrypt/live/wallet.altcorphub.com/privkey.pem ssl/"
            Write-Host "  sudo chmod 644 ssl/*.pem"
            exit 0
        }
    } else {
        Print-Success "Certificados SSL encontrados"
    }
}

# Stop existing containers
Write-Host ""
Print-Info "Parando containers existentes..."
try {
    docker-compose -f $COMPOSE_FILE down 2>$null
} catch {
    # Ignore if containers don't exist
}
Print-Success "Containers parados"

# Build and start containers
Write-Host ""
Print-Info "Construindo e iniciando containers..."
Print-Warning "Isso pode levar alguns minutos..."

try {
    docker-compose -f $COMPOSE_FILE up -d --build
    Print-Success "Containers iniciados com sucesso!"
} catch {
    Print-Error "Erro ao iniciar containers"
    exit 1
}

# Wait for services to be ready
Write-Host ""
Print-Info "Aguardando serviços iniciarem..."
Start-Sleep -Seconds 10

# Check container status
Write-Host ""
Print-Info "Verificando status dos containers..."
docker-compose -f $COMPOSE_FILE ps

# Health checks
Write-Host ""
Print-Info "Executando testes de saúde..."

# Check database
$dbContainer = docker-compose -f $COMPOSE_FILE ps -q database
if ($dbContainer) {
    try {
        docker exec $dbContainer pg_isready -U walletuser -d altcorp_wallet 2>$null | Out-Null
        Print-Success "Banco de dados: OK"
    } catch {
        Print-Error "Banco de dados: ERRO"
    }
} else {
    Print-Error "Container do banco não encontrado"
}

# Check backend
$backendContainer = docker-compose -f $COMPOSE_FILE ps -q backend
if ($backendContainer) {
    try {
        docker exec $backendContainer curl -sf http://localhost:8000/ 2>$null | Out-Null
        Print-Success "Backend API: OK"
    } catch {
        Print-Warning "Backend API: Verificando..."
        Start-Sleep -Seconds 5
        try {
            docker exec $backendContainer curl -sf http://localhost:8000/ 2>$null | Out-Null
            Print-Success "Backend API: OK"
        } catch {
            Print-Error "Backend API: ERRO"
        }
    }
} else {
    Print-Error "Container do backend não encontrado"
}

# Check frontend
$frontendContainer = docker-compose -f $COMPOSE_FILE ps -q frontend
if ($frontendContainer) {
    try {
        docker exec $frontendContainer curl -sf http://localhost/health 2>$null | Out-Null
        Print-Success "Frontend: OK"
    } catch {
        Print-Error "Frontend: ERRO"
    }
} else {
    Print-Error "Container do frontend não encontrado"
}

# Show access URLs
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  ✅ Deploy Concluído!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

if ($ENV -eq "development") {
    Write-Host "🌐 Acesse a aplicação:" -ForegroundColor Cyan
    Write-Host "   Frontend: http://localhost" -ForegroundColor White
    Write-Host "   Backend API: http://localhost:8000" -ForegroundColor White
    Write-Host "   API Docs: http://localhost:8000/api/docs" -ForegroundColor White
} elseif ($ENV -eq "production") {
    Write-Host "🌐 Acesse a aplicação:" -ForegroundColor Cyan
    if ((Test-Path "ssl") -and (Test-Path "ssl/fullchain.pem")) {
        Write-Host "   Frontend: https://wallet.altcorphub.com" -ForegroundColor White
        Write-Host "   Backend API: https://wallet.altcorphub.com/api/v1" -ForegroundColor White
        Write-Host "   API Docs: https://wallet.altcorphub.com/api/docs" -ForegroundColor White
    } else {
        Write-Host "   Frontend: http://wallet.altcorphub.com" -ForegroundColor White
        Write-Host "   Backend API: http://wallet.altcorphub.com/api/v1" -ForegroundColor White
        Write-Host "   API Docs: http://wallet.altcorphub.com/api/docs" -ForegroundColor White
        Write-Host ""
        Print-Warning "SSL não configurado! Configure certificados para HTTPS."
    }
}

Write-Host ""
Write-Host "📊 Ver logs:" -ForegroundColor Cyan
Write-Host "   docker-compose -f $COMPOSE_FILE logs -f" -ForegroundColor White
Write-Host ""
Write-Host "🛑 Parar aplicação:" -ForegroundColor Cyan
Write-Host "   docker-compose -f $COMPOSE_FILE down" -ForegroundColor White
Write-Host ""
Write-Host "🔄 Restart:" -ForegroundColor Cyan
Write-Host "   docker-compose -f $COMPOSE_FILE restart" -ForegroundColor White
Write-Host ""

Print-Success "Script finalizado!"
