#!/bin/bash
# ============================================
# AltCorp Wallet - Start Script (Bash)
# ============================================
# Uso:
#   ./start.sh          → Inicia em modo DEV
#   ./start.sh vm       → Inicia em modo VM/LAN
#   ./start.sh prod     → Inicia em modo PROD
#   ./start.sh stop     → Para todos os containers
#   ./start.sh logs     → Mostra logs
# ============================================

set -e
MODE="${1:-dev}"

# Garante .env existe
if [ ! -f .env ]; then
    echo "⚠️  .env não encontrado. Copiando de .env.example..."
    cp .env.example .env
    echo "✅ .env criado. Configure antes de continuar."
fi

case "$MODE" in
    dev)
        echo "🚀 Iniciando em modo DESENVOLVIMENTO..."
        echo "🌐 Acesso: http://localhost:8080"
        docker compose --profile dev up --build
        ;;
    vm)
        echo "🚀 Iniciando em modo VM/LAN..."
        docker compose --profile vm up --build -d
        sleep 5
        docker compose --profile vm ps
        echo ""
        echo "✅ Rodando em background!"
        echo "🌐 Frontend: http://192.168.15.5:8080"
        echo "🌐 API Docs: http://192.168.15.5:8000/api/docs"
        echo "📝 Logs: ./start.sh logs"
        ;;
    prod)
        echo "🚀 Iniciando em modo PRODUÇÃO..."
        docker compose --profile prod up --build -d
        sleep 5
        docker compose --profile prod ps
        echo ""
        echo "✅ Rodando em background!"
        echo "🌐 HTTPS: https://wallet.altcorphub.com"
        echo "🌐 Local: http://192.168.15.5:8080"
        echo "📝 Logs: ./start.sh logs"
        ;;
    stop)
        echo "⏹️  Parando containers..."
        docker compose --profile dev --profile vm --profile prod down
        echo "✅ Parado."
        ;;
    logs)
        docker compose --profile dev --profile vm --profile prod logs -f --tail=100
        ;;
    restart)
        echo "🔄 Reiniciando..."
        docker compose --profile dev --profile vm --profile prod down
        docker compose --profile dev up --build
        ;;
    build)
        echo "🔨 Reconstruindo (sem cache)..."
        docker compose --profile dev --profile vm --profile prod build --no-cache
        echo "✅ Build completo."
        ;;
    ssl)
        echo "🔐 Gerando certificados SSL com Let's Encrypt..."
        docker compose --profile prod up -d frontend-prod
        docker run --rm \
            -v altcorp-wallet-ssl-certs:/etc/letsencrypt \
            -v altcorp-wallet-certbot-www:/var/www/certbot \
            certbot/certbot certonly \
            --webroot -w /var/www/certbot \
            -d wallet.altcorphub.com \
            --email admin@altcorphub.com \
            --agree-tos --no-eff-email
        echo "✅ Certificados gerados! Reiniciando nginx..."
        docker compose --profile prod restart frontend-prod
        ;;
    *)
        echo "Uso: $0 {dev|vm|prod|stop|logs|restart|build|ssl}"
        exit 1
        ;;
esac
