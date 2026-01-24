# 🚀 Guia Rápido de Início

## Iniciar o Projeto

### Windows (PowerShell)
```powershell
.\start.ps1
```

### Linux/Mac
```bash
chmod +x start.sh
./start.sh
```

### Ou manualmente
```bash
# Copiar arquivo de ambiente
cp .env.example .env

# Iniciar containers
docker-compose up -d --build

# Ver logs
docker-compose logs -f
```

## Acessar a Aplicação

- **Frontend**: http://localhost
- **Backend API**: http://localhost:8000
- **Documentação**: http://localhost:8000/api/docs
- **Banco de Dados**: localhost:5432

## Credenciais Padrão

- **Email**: admin@altcorp.com
- **Senha**: admin123

## Comandos Úteis

```bash
# Ver status
docker-compose ps

# Ver logs
docker-compose logs -f

# Parar serviços
docker-compose down

# Reiniciar
docker-compose restart

# Reconstruir
docker-compose up -d --build

# Limpar tudo (CUIDADO: apaga dados)
docker-compose down -v
```

## Estrutura dos Endpoints

### Receitas
- `GET /api/v1/incomes` - Listar
- `POST /api/v1/incomes` - Criar
- `DELETE /api/v1/incomes/{id}` - Remover

### Despesas
- `GET /api/v1/expenses` - Listar
- `POST /api/v1/expenses` - Criar
- `PUT /api/v1/expenses/{id}` - Atualizar
- `DELETE /api/v1/expenses/{id}` - Remover

### Cartões
- `GET /api/v1/cards` - Listar
- `POST /api/v1/cards` - Criar
- `GET /api/v1/cards/{id}/items` - Itens da fatura
- `POST /api/v1/cards/{id}/items` - Adicionar item

### Orçamentos
- `GET /api/v1/budgets` - Listar
- `POST /api/v1/budgets` - Criar/Atualizar
- `DELETE /api/v1/budgets/{id}` - Remover

## Problemas Comuns

### Porta já em uso
```bash
# Alterar portas no .env
FRONTEND_PORT=8080
API_PORT=8001
```

### Banco não conecta
```bash
# Verificar saúde do banco
docker-compose exec database pg_isready -U walletuser

# Reiniciar banco
docker-compose restart database
```

### Reconstruir do zero
```bash
docker-compose down -v
docker-compose up -d --build
```

## Desenvolvimento

### Backend
```bash
# Acessar container
docker-compose exec backend bash

# Ver logs em tempo real
docker-compose logs -f backend
```

### Frontend
```bash
# Reconstruir apenas frontend
docker-compose up -d --build frontend

# Ver logs
docker-compose logs -f frontend
```

### Database
```bash
# Acessar PostgreSQL
docker-compose exec database psql -U walletuser -d altcorp_wallet

# Backup
docker-compose exec database pg_dump -U walletuser altcorp_wallet > backup.sql
```

## 🎉 Pronto!

Seu ambiente está configurado e rodando. Bom desenvolvimento!
