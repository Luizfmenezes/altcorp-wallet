#!/bin/bash

echo "🚀 Iniciando AltCorp Wallet..."
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "⚠️  Arquivo .env não encontrado. Copiando de .env.example..."
    cp .env.example .env
    echo "✅ Arquivo .env criado. Configure-o se necessário."
    echo ""
fi

# Build and start containers
echo "🔨 Construindo e iniciando containers..."
docker-compose up -d --build

# Wait for services to be healthy
echo ""
echo "⏳ Aguardando serviços iniciarem..."
sleep 10

# Check services status
echo ""
echo "📊 Status dos serviços:"
docker-compose ps

echo ""
echo "✅ AltCorp Wallet está rodando!"
echo ""
echo "🌐 Acesse:"
echo "   Frontend:  http://localhost"
echo "   Backend:   http://localhost:8000"
echo "   API Docs:  http://localhost:8000/api/docs"
echo ""
echo "📝 Para ver os logs: docker-compose logs -f"
echo "🛑 Para parar: docker-compose down"
