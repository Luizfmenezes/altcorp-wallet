# 🎉 Projeto AltCorp Wallet - Configuração Completa

## ✅ O que foi criado

### 📁 Estrutura de Pastas
```
altcorp-wallet/
├── frontend/          # React + TypeScript + Vite (porta 80)
├── backend/           # Python + FastAPI (porta 8000)
├── database/          # PostgreSQL 16 (porta 5432)
└── Arquivos Docker
```

### 🐳 Arquivos Docker Criados

#### Frontend
- ✅ `frontend/Dockerfile` - Produção (Nginx)
- ✅ `frontend/Dockerfile.dev` - Desenvolvimento (Vite Hot Reload)
- ✅ `frontend/nginx.conf` - Configuração Nginx com proxy reverso
- ✅ `frontend/.dockerignore`

#### Backend
- ✅ `backend/Dockerfile` - Container Python
- ✅ `backend/requirements.txt` - Dependências Python
- ✅ `backend/main.py` - Aplicação FastAPI
- ✅ `backend/app/` - Estrutura completa da API
  - `api/v1/` - Rotas (incomes, expenses, cards, budgets)
  - `core/` - Configurações
  - `database/` - Models SQLAlchemy
  - `schemas/` - Schemas Pydantic
- ✅ `backend/.dockerignore`
- ✅ `backend/.env.example`

#### Database
- ✅ `database/init.sql` - Schema PostgreSQL completo
- ✅ `database/README.md` - Documentação do banco

### 🚀 Arquivos de Orquestração
- ✅ `docker-compose.yml` - Produção
- ✅ `docker-compose.dev.yml` - Desenvolvimento com hot-reload
- ✅ `.env.example` - Template de variáveis
- ✅ `.dockerignore` - Arquivos ignorados

### 📚 Documentação
- ✅ `README.md` - Documentação completa
- ✅ `QUICKSTART.md` - Guia rápido
- ✅ `database/README.md` - Docs do banco

### 🛠️ Scripts Auxiliares
- ✅ `start.sh` - Script Linux/Mac
- ✅ `start.ps1` - Script Windows PowerShell

## 🎯 Funcionalidades Backend Implementadas

### API Endpoints

#### Receitas - `/api/v1/incomes`
- `GET /` - Listar todas
- `GET /{id}` - Buscar por ID
- `POST /` - Criar nova
- `DELETE /{id}` - Remover

#### Despesas - `/api/v1/expenses`
- `GET /` - Listar (com filtros: month, year, category)
- `GET /{id}` - Buscar por ID
- `POST /` - Criar nova
- `PUT /{id}` - Atualizar
- `DELETE /{id}` - Remover

#### Cartões - `/api/v1/cards`
- `GET /` - Listar todos
- `GET /{id}` - Buscar por ID
- `POST /` - Criar novo
- `DELETE /{id}` - Remover
- `GET /{id}/items` - Listar itens da fatura
- `POST /{id}/items` - Adicionar item (suporta parcelamento)
- `PUT /{id}/items/{item_id}` - Atualizar item
- `DELETE /{id}/items/{item_id}` - Remover item

#### Orçamentos - `/api/v1/budgets`
- `GET /` - Listar (com filtros: month, year)
- `POST /` - Criar/atualizar
- `DELETE /{id}` - Remover por ID
- `DELETE /category/{category}` - Remover por categoria

## 🗄️ Banco de Dados PostgreSQL

### Tabelas Criadas
1. **users** - Usuários do sistema
2. **incomes** - Receitas
3. **expenses** - Despesas diretas
4. **cards** - Cartões
5. **invoice_items** - Itens de fatura (com suporte a parcelamento)
6. **budgets** - Orçamentos por categoria

### Usuário Padrão (Dev)
- Email: `admin@altcorp.com`
- Senha: `admin123`

## 🚀 Como Usar

### Opção 1: Script Automático (Recomendado)

**Windows (PowerShell):**
```powershell
.\start.ps1
```

**Linux/Mac:**
```bash
chmod +x start.sh
./start.sh
```

### Opção 2: Manual

```bash
# 1. Copiar variáveis de ambiente
cp .env.example .env

# 2. Iniciar containers
docker-compose up -d --build

# 3. Ver logs
docker-compose logs -f

# 4. Acessar
# Frontend: http://localhost
# Backend: http://localhost:8000
# API Docs: http://localhost:8000/api/docs
```

### Modo Desenvolvimento (Hot Reload)

```bash
# Usar docker-compose.dev.yml
docker-compose -f docker-compose.dev.yml up -d

# Frontend ficará em: http://localhost:5173
# Com hot-reload automático!
```

## 📊 Endpoints Disponíveis

### Saúde dos Serviços
- Frontend: `http://localhost/health`
- Backend: `http://localhost:8000/health`
- Database: Porta 5432

### Documentação API
- Swagger UI: `http://localhost:8000/api/docs`
- ReDoc: `http://localhost:8000/api/redoc`
- OpenAPI JSON: `http://localhost:8000/api/openapi.json`

## 🔧 Comandos Úteis

```bash
# Ver status
docker-compose ps

# Ver logs
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f database

# Parar tudo
docker-compose down

# Reiniciar serviço específico
docker-compose restart backend

# Reconstruir tudo
docker-compose up -d --build

# Limpar tudo (CUIDADO: apaga dados!)
docker-compose down -v

# Acessar PostgreSQL
docker-compose exec database psql -U walletuser -d altcorp_wallet

# Acessar backend shell
docker-compose exec backend bash
```

## 🎨 Features do Frontend

✅ Dashboard com resumo financeiro
✅ Gestão de receitas e despesas
✅ Cartões com faturas e parcelamento
✅ Orçamentos por categoria
✅ Análise mensal completa
✅ Comparativo mensal de gastos
✅ Gastos por cartão (novo!)
✅ Gráficos e estatísticas
✅ Tema claro/escuro
✅ Interface responsiva

## 🔐 Segurança

⚠️ **IMPORTANTE para Produção:**

1. Altere as senhas em `.env`
2. Gere um `SECRET_KEY` forte e aleatório
3. Configure `DEBUG=False` no backend
4. Use HTTPS (certificados SSL)
5. Configure firewall apropriado
6. Use volumes seguros para dados sensíveis

## 📈 Próximos Passos

- [ ] Implementar autenticação JWT completa
- [ ] Adicionar sistema multi-usuário
- [ ] Criar testes automatizados
- [ ] Implementar CI/CD
- [ ] Adicionar monitoramento (Prometheus/Grafana)
- [ ] Deploy em produção (AWS/Azure/GCP)
- [ ] App mobile (React Native)

## 🤝 Tecnologias Utilizadas

### Frontend
- React 18
- TypeScript
- Vite
- TailwindCSS
- shadcn/ui
- Recharts
- Framer Motion

### Backend
- Python 3.11
- FastAPI
- SQLAlchemy
- PostgreSQL
- Pydantic
- Uvicorn

### DevOps
- Docker
- Docker Compose
- Nginx
- PostgreSQL

## 📝 Notas Importantes

1. **Volumes Docker**: Os dados do PostgreSQL são persistidos em volume Docker nomeado
2. **Hot Reload**: Código do backend e frontend tem hot-reload em desenvolvimento
3. **Redes**: Todos os containers estão na mesma rede Docker
4. **CORS**: Backend configurado para aceitar requisições do frontend
5. **Proxy Reverso**: Nginx faz proxy das requisições `/api` para o backend

## ✨ Pronto para Desenvolvimento!

Seu ambiente está 100% configurado e pronto para uso. Todos os serviços estão rodando em containers Docker isolados e orquestrados.

**Acesse agora:**
- 🌐 Frontend: http://localhost
- 🔧 Backend API: http://localhost:8000
- 📖 Docs: http://localhost:8000/api/docs

---

**Desenvolvido com ❤️ usando Docker, Python, React e PostgreSQL**
