# AltCorp Wallet 💰

Sistema profissional de gerenciamento financeiro pessoal com autenticação JWT e gestão de usuários.

## 🏗️ Arquitetura

- **Frontend**: React + TypeScript + Vite + TailwindCSS + shadcn/ui
- **Backend**: Python + FastAPI + SQLAlchemy + JWT Auth
- **Database**: PostgreSQL 16

Arquitetura em containers Docker com orquestração via Docker Compose.

## ✨ Funcionalidades

- � Autenticação JWT com roles (Admin/User/Temp)
- 👥 Gestão completa de usuários
- 💰 Controle de receitas (fixas e extras)
- 💸 Registro de despesas
- 💳 Gerenciamento de cartões
- 📊 Orçamentos mensais
- 📈 Análises e gráficos
- 🌓 Tema claro/escuro
- 📱 Totalmente responsivo

## 📋 Pré-requisitos

- Docker Engine 20.10+
- Docker Compose 2.0+
- Git

## 🚀 Instalação e Deployment

Ver guia completo em [DEPLOYMENT.md](./DEPLOYMENT.md)

### Quick Start (Produção)

```bash
# 1. Clone o repositório
git clone <repository-url>
cd altcorp-wallet

# 2. Configure variáveis de ambiente
cp .env.example .env
# Edite .env com suas configurações

# 3. Inicie os containers
docker-compose up -d --build

# 4. Acesse http://localhost
```

```bash
# Copie o arquivo de exemplo
cp .env.example .env

# Edite o arquivo .env com suas configurações (opcional)
# Valores padrão já estão configurados para desenvolvimento
```

### 3. Inicie os containers

```bash
# Construir e iniciar todos os serviços
docker-compose up -d --build

# Ou apenas iniciar (sem rebuild)
docker-compose up -d
```

### 4. Acesse a aplicação

- **Frontend**: http://localhost
- **Backend API**: http://localhost:8000
- **Documentação API**: http://localhost:8000/api/docs
- **Database**: localhost:5432

## 📦 Estrutura do Projeto

```
altcorp-wallet/
├── frontend/                 # Aplicação React
│   ├── src/
│   │   ├── components/      # Componentes React
│   │   ├── contexts/        # Context API
│   │   ├── hooks/           # Custom Hooks
│   │   ├── pages/           # Páginas
│   │   └── lib/             # Utilitários
│   ├── Dockerfile
│   └── nginx.conf
├── backend/                  # API FastAPI
│   ├── app/
│   │   ├── api/v1/          # Endpoints da API
│   │   ├── core/            # Configurações
│   │   ├── database/        # Models e sessão DB
│   │   └── schemas/         # Schemas Pydantic
│   ├── main.py
│   ├── requirements.txt
│   └── Dockerfile
├── database/                 # Scripts PostgreSQL
│   ├── init.sql
│   └── README.md
└── docker-compose.yml        # Orquestração
```

## 🎯 Funcionalidades

### Implementadas

✅ Gerenciamento de receitas (fixas e extras)
✅ Controle de despesas diretas
✅ Gestão de cartões de crédito/débito
✅ Lançamentos em cartões com parcelamento
✅ Definição de orçamentos por categoria
✅ Análise mensal completa
✅ Comparativo de gastos (mês atual vs anterior)
✅ Gastos por cartão com comparativo mensal
✅ Visualização de saldo e balanço
✅ Gráficos e estatísticas
✅ Tema claro/escuro
✅ Interface responsiva

### Backend API Endpoints

#### Receitas (`/api/v1/incomes`)
- `GET /` - Listar todas as receitas
- `GET /{id}` - Buscar receita por ID
- `POST /` - Criar nova receita
- `DELETE /{id}` - Remover receita

#### Despesas (`/api/v1/expenses`)
- `GET /` - Listar despesas (com filtros)
- `GET /{id}` - Buscar despesa por ID
- `POST /` - Criar nova despesa
- `PUT /{id}` - Atualizar despesa
- `DELETE /{id}` - Remover despesa

#### Cartões (`/api/v1/cards`)
- `GET /` - Listar cartões
- `GET /{id}` - Buscar cartão por ID
- `POST /` - Criar novo cartão
- `DELETE /{id}` - Remover cartão
- `GET /{id}/items` - Listar itens da fatura
- `POST /{id}/items` - Adicionar item (com parcelamento)
- `PUT /{id}/items/{item_id}` - Atualizar item
- `DELETE /{id}/items/{item_id}` - Remover item

#### Orçamentos (`/api/v1/budgets`)
- `GET /` - Listar orçamentos
- `POST /` - Criar/atualizar orçamento
- `DELETE /{id}` - Remover orçamento
- `DELETE /category/{category}` - Remover por categoria

## 🛠️ Comandos Úteis

### Docker Compose

```bash
# Iniciar serviços
docker-compose up -d

# Parar serviços
docker-compose down

# Ver logs
docker-compose logs -f

# Ver logs de um serviço específico
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f database

# Reconstruir imagens
docker-compose build

# Reiniciar um serviço
docker-compose restart backend

# Acessar shell do container
docker-compose exec backend bash
docker-compose exec database psql -U walletuser -d altcorp_wallet

# Remover volumes (CUIDADO: apaga dados)
docker-compose down -v
```

### Backend Development

```bash
# Acessar container do backend
docker-compose exec backend bash

# Instalar nova dependência
pip install <package>
pip freeze > requirements.txt

# Executar migrações (quando implementadas)
alembic upgrade head
```

### Database

```bash
# Acessar PostgreSQL
docker-compose exec database psql -U walletuser -d altcorp_wallet

# Backup do banco
docker-compose exec database pg_dump -U walletuser altcorp_wallet > backup.sql

# Restaurar backup
docker-compose exec -T database psql -U walletuser -d altcorp_wallet < backup.sql
```

## 🔐 Segurança

### Usuário Padrão (Desenvolvimento)

- **Email**: admin@altcorp.com
- **Senha**: admin123

⚠️ **IMPORTANTE**: Altere as credenciais padrão em produção!

### Variáveis de Ambiente

Nunca commite o arquivo `.env` com credenciais reais. Use `.env.example` como template.

## 🧪 Testes

```bash
# Backend tests (quando implementados)
docker-compose exec backend pytest

# Frontend tests
docker-compose exec frontend npm test
```

## 📈 Próximas Funcionalidades

- [ ] Autenticação e autorização JWT
- [ ] Multi-usuário
- [ ] Exportar relatórios em PDF
- [ ] Importar extratos CSV
- [ ] Notificações de orçamento
- [ ] Metas financeiras
- [ ] Investimentos
- [ ] Relatórios personalizados
- [ ] App mobile

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📝 Licença

Este projeto está sob a licença MIT.

## 👥 Autores

- **Seu Nome** - *Desenvolvimento inicial*

## 🙏 Agradecimentos

- shadcn/ui pelos componentes
- FastAPI pela excelente framework
- PostgreSQL pelo banco robusto
- Docker pela containerização

---

**Desenvolvido com ❤️ para facilitar sua vida financeira**
