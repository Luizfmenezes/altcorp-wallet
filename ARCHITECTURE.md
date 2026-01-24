# 🏗️ Arquitetura do Sistema AltCorp Wallet

## 📐 Diagrama da Arquitetura

```
┌─────────────────────────────────────────────────────────────────┐
│                         USUÁRIO                                  │
│                     (Navegador Web)                              │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ HTTP (Port 80)
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    FRONTEND CONTAINER                            │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                    NGINX (Port 80)                          │ │
│  │  ┌──────────────────────────────────────────────────────┐  │ │
│  │  │   Static Files (HTML, CSS, JS, Assets)              │  │ │
│  │  │   - React Build (Vite)                               │  │ │
│  │  │   - TailwindCSS                                      │  │ │
│  │  │   - shadcn/ui Components                             │  │ │
│  │  └──────────────────────────────────────────────────────┘  │ │
│  │                                                              │ │
│  │  Proxy: /api/* → http://backend:8000                        │ │
│  └────────────────────────────────────────────────────────────┘ │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ /api/* requests
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    BACKEND CONTAINER                             │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │              FastAPI (Python 3.11) - Port 8000             │ │
│  │  ┌──────────────────────────────────────────────────────┐  │ │
│  │  │  API Routes (/api/v1)                                │  │ │
│  │  │  - /incomes     (Receitas)                           │  │ │
│  │  │  - /expenses    (Despesas)                           │  │ │
│  │  │  - /cards       (Cartões)                            │  │ │
│  │  │  - /budgets     (Orçamentos)                         │  │ │
│  │  └──────────────────────────────────────────────────────┘  │ │
│  │  ┌──────────────────────────────────────────────────────┐  │ │
│  │  │  Business Logic                                      │  │ │
│  │  │  - Validations (Pydantic)                            │  │ │
│  │  │  - Data Processing                                   │  │ │
│  │  │  - Installment Calculations                          │  │ │
│  │  └──────────────────────────────────────────────────────┘  │ │
│  │  ┌──────────────────────────────────────────────────────┐  │ │
│  │  │  Data Access Layer (SQLAlchemy)                      │  │ │
│  │  │  - ORM Models                                        │  │ │
│  │  │  - Database Session Management                       │  │ │
│  │  └──────────────────────────────────────────────────────┘  │ │
│  └────────────────────────────────────────────────────────────┘ │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ PostgreSQL Protocol (Port 5432)
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                   DATABASE CONTAINER                             │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │          PostgreSQL 16 Alpine (Port 5432)                  │ │
│  │  ┌──────────────────────────────────────────────────────┐  │ │
│  │  │  Database: altcorp_wallet                            │  │ │
│  │  │                                                       │  │ │
│  │  │  Tables:                                             │  │ │
│  │  │  - users          (Usuários)                         │  │ │
│  │  │  - incomes        (Receitas)                         │  │ │
│  │  │  - expenses       (Despesas)                         │  │ │
│  │  │  - cards          (Cartões)                          │  │ │
│  │  │  - invoice_items  (Itens de Fatura)                  │  │ │
│  │  │  - budgets        (Orçamentos)                       │  │ │
│  │  │                                                       │  │ │
│  │  │  Indexes, Foreign Keys, Constraints                  │  │ │
│  │  └──────────────────────────────────────────────────────┘  │ │
│  │                                                              │ │
│  │  Volume: postgres_data (Persistência)                       │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    DOCKER NETWORK                                │
│              altcorp-wallet-network (bridge)                     │
│                                                                  │
│  Services comunicam entre si usando nomes de container          │
│  - frontend → backend   (http://backend:8000)                   │
│  - backend → database   (postgresql://database:5432)            │
└─────────────────────────────────────────────────────────────────┘
```

## 🔄 Fluxo de Dados

### 1. Requisição do Usuário
```
Usuário → Navegador → http://localhost/
```

### 2. Frontend Serve Arquivos Estáticos
```
NGINX serve index.html + assets (JS, CSS, imagens)
React App carrega no navegador
```

### 3. Requisição de API
```
React App → fetch('/api/v1/expenses')
         → NGINX (proxy reverso)
         → http://backend:8000/api/v1/expenses
         → FastAPI processa
         → SQLAlchemy consulta database
         → PostgreSQL retorna dados
         → FastAPI formata JSON
         → NGINX repassa resposta
         → React App atualiza UI
```

## 🌐 Endpoints Expostos

| Serviço   | Porta Externa | Porta Interna | Acesso                              |
|-----------|---------------|---------------|-------------------------------------|
| Frontend  | 80            | 80            | http://localhost                    |
| Backend   | 8000          | 8000          | http://localhost:8000               |
| Database  | 5432          | 5432          | localhost:5432 (pgAdmin, clients)   |

## 🔐 Camadas de Segurança

### Frontend
- Validação de formulários
- Sanitização de inputs
- HTTPS em produção
- Headers de segurança (X-Frame-Options, CSP)

### Backend
- Validação com Pydantic
- SQL Injection prevention (SQLAlchemy ORM)
- CORS configurado
- Rate limiting (futuro)
- JWT Authentication (futuro)

### Database
- Usuário com senha
- Conexões autenticadas
- Foreign keys e constraints
- Backup automático (futuro)

## 📦 Dependências Entre Serviços

```
Frontend
   ↓ depends_on
Backend
   ↓ depends_on (health check)
Database
```

### Health Checks
- **Database**: `pg_isready` verifica se PostgreSQL está pronto
- **Backend**: Endpoint `/health` retorna status
- **Frontend**: Endpoint `/health` retorna "healthy"

## 💾 Volumes Persistentes

```
postgres_data: /var/lib/postgresql/data
  ↓
Dados do PostgreSQL persistem após restart
```

## 🔄 Hot Reload (Desenvolvimento)

### Backend
```
./backend (host) → /app (container)
Uvicorn --reload detecta mudanças
```

### Frontend (Dev Mode)
```
./frontend (host) → /app (container)
Vite HMR atualiza automaticamente
```

## 🚀 Stack Tecnológica Completa

### Frontend Stack
```
React 18
  └─ TypeScript
  └─ Vite (Build Tool)
  └─ TailwindCSS (Styling)
  └─ shadcn/ui (Components)
  └─ Recharts (Charts)
  └─ Framer Motion (Animations)
  └─ React Router (Routing)
  └─ Context API (State)
```

### Backend Stack
```
Python 3.11
  └─ FastAPI (Framework)
  └─ Uvicorn (ASGI Server)
  └─ SQLAlchemy (ORM)
  └─ Pydantic (Validation)
  └─ Alembic (Migrations - futuro)
  └─ python-jose (JWT - futuro)
```

### Database Stack
```
PostgreSQL 16
  └─ Alpine Linux (lightweight)
  └─ Persistent Volume
  └─ Init Scripts
```

### DevOps Stack
```
Docker
  └─ Multi-stage builds
  └─ Docker Compose
  └─ Networks
  └─ Volumes
  └─ Health Checks
```

## 📊 Desempenho

### Otimizações Implementadas

1. **Frontend**
   - Build otimizado com Vite
   - Code splitting automático
   - Assets com cache de 1 ano
   - Gzip compression

2. **Backend**
   - Connection pooling (10 conexões)
   - Async/await onde possível
   - Índices no banco de dados

3. **Database**
   - Índices em foreign keys
   - Índices em campos de busca frequente
   - Pool de conexões configurado

## 🔮 Próximas Melhorias na Arquitetura

1. **Redis Cache** - Cache de queries frequentes
2. **Load Balancer** - Múltiplas instâncias do backend
3. **CDN** - Servir assets estáticos
4. **Message Queue** - RabbitMQ/Redis para jobs assíncronos
5. **Monitoring** - Prometheus + Grafana
6. **Logging** - ELK Stack (Elasticsearch, Logstash, Kibana)
7. **CI/CD** - GitHub Actions + Docker Registry
8. **Kubernetes** - Orquestração em produção

---

**Arquitetura atual: Monolítico modularizado pronto para microservices**
