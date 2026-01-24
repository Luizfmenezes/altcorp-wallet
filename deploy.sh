#!/bin/bash

# ============================================
# Script de Deploy Automático - AltCorp Wallet
# ============================================

set -e  # Exit on error

echo "========================================"
echo "  AltCorp Wallet - Deploy Script"
echo "========================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Functions
print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
    echo -e "${YELLOW}ℹ️  $1${NC}"
}

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    print_error "Docker não está instalado. Instale primeiro: https://docs.docker.com/get-docker/"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    print_error "Docker Compose não está instalado. Instale primeiro."
    exit 1
fi

print_success "Docker e Docker Compose estão instalados"

# Ask for environment
echo ""
echo "Selecione o ambiente:"
echo "  [1] Desenvolvimento (localhost)"
echo "  [2] Produção (wallet.altcorphub.com)"
echo ""
read -p "Digite 1 ou 2: " env_choice

if [ "$env_choice" = "1" ]; then
    ENV="development"
    COMPOSE_FILE="docker-compose.yml"
    ENV_FILE=".env.development"
    print_info "Ambiente selecionado: DESENVOLVIMENTO"
elif [ "$env_choice" = "2" ]; then
    ENV="production"
    COMPOSE_FILE="docker-compose.prod.yml"
    ENV_FILE=".env.production"
    print_info "Ambiente selecionado: PRODUÇÃO"
else
    print_error "Opção inválida"
    exit 1
fi

# Check if env file exists
if [ ! -f "$ENV_FILE" ]; then
    print_error "Arquivo $ENV_FILE não encontrado!"
    exit 1
fi

# Copy env file
echo ""
print_info "Copiando arquivo de ambiente..."
cp "$ENV_FILE" .env
print_success "Arquivo .env configurado"

# If production, check for SSL certificates
if [ "$ENV" = "production" ]; then
    echo ""
    print_warning "ATENÇÃO: Produção requer certificados SSL!"
    
    if [ ! -d "ssl" ] || [ ! -f "ssl/fullchain.pem" ] || [ ! -f "ssl/privkey.pem" ]; then
        print_warning "Certificados SSL não encontrados em ./ssl/"
        echo ""
        echo "Deseja continuar sem SSL? (apenas para primeiro teste)"
        read -p "Digite 'sim' para continuar ou qualquer outra tecla para cancelar: " continue_without_ssl
        
        if [ "$continue_without_ssl" != "sim" ]; then
            print_info "Deploy cancelado. Configure SSL primeiro."
            echo ""
            echo "Para obter certificados SSL:"
            echo "  sudo certbot certonly --standalone -d wallet.altcorphub.com -d www.wallet.altcorphub.com"
            echo "  mkdir -p ssl"
            echo "  sudo cp /etc/letsencrypt/live/wallet.altcorphub.com/fullchain.pem ssl/"
            echo "  sudo cp /etc/letsencrypt/live/wallet.altcorphub.com/privkey.pem ssl/"
            echo "  sudo chmod 644 ssl/*.pem"
            exit 0
        fi
    else
        print_success "Certificados SSL encontrados"
    fi
fi

# Stop existing containers
echo ""
print_info "Parando containers existentes..."
docker-compose -f "$COMPOSE_FILE" down 2>/dev/null || true
print_success "Containers parados"

# Build and start containers
echo ""
print_info "Construindo e iniciando containers..."
print_warning "Isso pode levar alguns minutos..."
docker-compose -f "$COMPOSE_FILE" up -d --build

if [ $? -eq 0 ]; then
    print_success "Containers iniciados com sucesso!"
else
    print_error "Erro ao iniciar containers"
    exit 1
fi

# Wait for services to be ready
echo ""
print_info "Aguardando serviços iniciarem..."
sleep 10

# Check container status
echo ""
print_info "Verificando status dos containers..."
docker-compose -f "$COMPOSE_FILE" ps

# Health checks
echo ""
print_info "Executando testes de saúde..."

# Check database
DB_CONTAINER=$(docker-compose -f "$COMPOSE_FILE" ps -q database)
if [ ! -z "$DB_CONTAINER" ]; then
    if docker exec "$DB_CONTAINER" pg_isready -U walletuser -d altcorp_wallet &>/dev/null; then
        print_success "Banco de dados: OK"
    else
        print_error "Banco de dados: ERRO"
    fi
else
    print_error "Container do banco não encontrado"
fi

# Check backend
BACKEND_CONTAINER=$(docker-compose -f "$COMPOSE_FILE" ps -q backend)
if [ ! -z "$BACKEND_CONTAINER" ]; then
    if docker exec "$BACKEND_CONTAINER" curl -sf http://localhost:8000/ &>/dev/null; then
        print_success "Backend API: OK"
    else
        print_warning "Backend API: Verificando..."
        sleep 5
        if docker exec "$BACKEND_CONTAINER" curl -sf http://localhost:8000/ &>/dev/null; then
            print_success "Backend API: OK"
        else
            print_error "Backend API: ERRO"
        fi
    fi
else
    print_error "Container do backend não encontrado"
fi

# Check frontend
FRONTEND_CONTAINER=$(docker-compose -f "$COMPOSE_FILE" ps -q frontend)
if [ ! -z "$FRONTEND_CONTAINER" ]; then
    if docker exec "$FRONTEND_CONTAINER" curl -sf http://localhost/health &>/dev/null; then
        print_success "Frontend: OK"
    else
        print_error "Frontend: ERRO"
    fi
else
    print_error "Container do frontend não encontrado"
fi

# Show access URLs
echo ""
echo "========================================"
echo "  ✅ Deploy Concluído!"
echo "========================================"
echo ""

if [ "$ENV" = "development" ]; then
    echo "🌐 Acesse a aplicação:"
    echo "   Frontend: http://localhost"
    echo "   Backend API: http://localhost:8000"
    echo "   API Docs: http://localhost:8000/api/docs"
elif [ "$ENV" = "production" ]; then
    echo "🌐 Acesse a aplicação:"
    if [ -d "ssl" ] && [ -f "ssl/fullchain.pem" ]; then
        echo "   Frontend: https://wallet.altcorphub.com"
        echo "   Backend API: https://wallet.altcorphub.com/api/v1"
        echo "   API Docs: https://wallet.altcorphub.com/api/docs"
    else
        echo "   Frontend: http://wallet.altcorphub.com"
        echo "   Backend API: http://wallet.altcorphub.com/api/v1"
        echo "   API Docs: http://wallet.altcorphub.com/api/docs"
        echo ""
        print_warning "SSL não configurado! Configure certificados para HTTPS."
    fi
fi

echo ""
echo "📊 Ver logs:"
echo "   docker-compose -f $COMPOSE_FILE logs -f"
echo ""
echo "🛑 Parar aplicação:"
echo "   docker-compose -f $COMPOSE_FILE down"
echo ""
echo "🔄 Restart:"
echo "   docker-compose -f $COMPOSE_FILE restart"
echo ""

print_success "Script finalizado!"
