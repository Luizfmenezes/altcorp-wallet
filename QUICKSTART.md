# 🚀 Quick Start - Configuração para Nginx Proxy Manager# 🚀 Guia Rápido de Início



## ✅ Alterações Realizadas## Iniciar o Projeto



### 1. **Frontend agora roda na porta 8080**### Windows (PowerShell)

```yaml```powershell

# docker-compose.yml.\start.ps1

frontend:```

  ports:

    - "8080:80"### Linux/Mac

``````bash

chmod +x start.sh

### 2. **API usa paths relativos (funciona com Nginx Proxy Manager)**./start.sh

```typescript```

// frontend/src/services/api.ts

const API_BASE_URL = '/api/v1';  // Path relativo!### Ou manualmente

``````bash

# Copiar arquivo de ambiente

### 3. **Caddy removido** (você usa Nginx Proxy Manager)cp .env.example .env



### 4. **CORS configurado para HTTPS**# Iniciar containers

```bashdocker-compose up -d --build

# .env

ALLOWED_ORIGINS=https://wallet.altcorphub.com,http://192.168.15.5:8080,http://localhost:8080# Ver logs

```docker-compose logs -f

```

## ⚡ Próximos Passos na VM Linux

## Acessar a Aplicação

### 1. Atualize os arquivos na VM:

```bash- **Frontend**: http://localhost

cd /caminho/do/seu/projeto- **Backend API**: http://localhost:8000

git pull  # Se usar Git- **Documentação**: http://localhost:8000/api/docs

- **Banco de Dados**: localhost:5432

# OU copie manualmente:

# - docker-compose.yml## Credenciais Padrão

# - .env

# - frontend/src/services/api.ts- **Email**: admin@altcorp.com

# - frontend/.env- **Senha**: admin123

```

## Comandos Úteis

### 2. Rebuild do Frontend (OBRIGATÓRIO):

```bash```bash

docker-compose down# Ver status

docker-compose build --no-cache frontenddocker-compose ps

docker-compose up -d

```# Ver logs

docker-compose logs -f

### 3. Configure o Nginx Proxy Manager:

# Parar serviços

#### **Proxy Host Principal:**docker-compose down

- **Domain:** `wallet.altcorphub.com`

- **Forward:** `http://192.168.15.5:8080`# Reiniciar

- **SSL:** ✅ Force SSL, HTTP/2, HSTSdocker-compose restart



#### **⚠️ Custom Locations (OBRIGATÓRIO):**# Reconstruir

docker-compose up -d --build

**1. Location `/api`**

- Define: `/api`# Limpar tudo (CUIDADO: apaga dados)

- Forward: `http://192.168.15.5:8000`docker-compose down -v

- Advanced:```

```nginx

proxy_http_version 1.1;## Estrutura dos Endpoints

proxy_set_header Upgrade $http_upgrade;

proxy_set_header Connection 'upgrade';### Receitas

proxy_set_header Host $host;- `GET /api/v1/incomes` - Listar

proxy_set_header X-Real-IP $remote_addr;- `POST /api/v1/incomes` - Criar

proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;- `DELETE /api/v1/incomes/{id}` - Remover

proxy_set_header X-Forwarded-Proto $scheme;

proxy_cache_bypass $http_upgrade;### Despesas

```- `GET /api/v1/expenses` - Listar

- `POST /api/v1/expenses` - Criar

**2. Location `/docs`**- `PUT /api/v1/expenses/{id}` - Atualizar

- Define: `/docs`- `DELETE /api/v1/expenses/{id}` - Remover

- Forward: `http://192.168.15.5:8000`

- Advanced:### Cartões

```nginx- `GET /api/v1/cards` - Listar

proxy_http_version 1.1;- `POST /api/v1/cards` - Criar

proxy_set_header Host $host;- `GET /api/v1/cards/{id}/items` - Itens da fatura

proxy_set_header X-Real-IP $remote_addr;- `POST /api/v1/cards/{id}/items` - Adicionar item

proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;

proxy_set_header X-Forwarded-Proto $scheme;### Orçamentos

```- `GET /api/v1/budgets` - Listar

- `POST /api/v1/budgets` - Criar/Atualizar

**3. Location `/openapi.json`**- `DELETE /api/v1/budgets/{id}` - Remover

- Define: `/openapi.json`

- Forward: `http://192.168.15.5:8000`## Problemas Comuns

- Advanced: (mesmo do `/docs`)

### Porta já em uso

### 4. Teste a Configuração:```bash

# Alterar portas no .env

```bashFRONTEND_PORT=8080

# Na VM Linux:API_PORT=8001

docker-compose ps  # Todos devem estar "Up"```



# Frontend acessível:### Banco não conecta

curl http://192.168.15.5:8080```bash

# Verificar saúde do banco

# Backend acessível:docker-compose exec database pg_isready -U walletuser

curl http://192.168.15.5:8000/api/v1/auth/login -X POST \

  -H "Content-Type: application/json" \# Reiniciar banco

  -d '{"username":"admin","password":"admin123"}'docker-compose restart database

```

# HTTPS (após configurar Nginx Proxy Manager):

curl https://wallet.altcorphub.com### Reconstruir do zero

curl https://wallet.altcorphub.com/api/v1/auth/login -X POST \```bash

  -H "Content-Type: application/json" \docker-compose down -v

  -d '{"username":"admin","password":"admin123"}'docker-compose up -d --build

``````



## 🐛 Troubleshooting## Desenvolvimento



### Erro: `ERR_CONNECTION_REFUSED` ou `Network Error`### Backend

```bash

**Causa:** Frontend não consegue acessar backend# Acessar container

docker-compose exec backend bash

**Solução:**

1. ✅ Verifique se as **Custom Locations** estão configuradas no Nginx Proxy Manager# Ver logs em tempo real

2. ✅ Verifique se o backend está rodando: `docker logs altcorp-wallet-backend`docker-compose logs -f backend

3. ✅ Teste direto: `curl http://192.168.15.5:8000/api/v1/auth/login````

4. ✅ Verifique CORS no `.env`: `ALLOWED_ORIGINS=https://wallet.altcorphub.com`

### Frontend

### Erro: `CORS policy` ou `Access-Control-Allow-Origin````bash

# Reconstruir apenas frontend

**Solução:**docker-compose up -d --build frontend

```bash

# Na VM, edite .env:# Ver logs

ALLOWED_ORIGINS=https://wallet.altcorphub.com,http://192.168.15.5:8080docker-compose logs -f frontend

```

# Reinicie backend:

docker-compose restart backend### Database

```bash

# Verifique logs:# Acessar PostgreSQL

docker logs altcorp-wallet-backend -fdocker-compose exec database psql -U walletuser -d altcorp_wallet

```

# Backup

### Erro: `502 Bad Gateway`docker-compose exec database pg_dump -U walletuser altcorp_wallet > backup.sql

```

**Solução:**

```bash## 🎉 Pronto!

# Verifique se os containers estão rodando:

docker-compose psSeu ambiente está configurado e rodando. Bom desenvolvimento!


# Verifique logs:
docker-compose logs -f

# Reinicie tudo:
docker-compose restart
```

## 📚 Documentação Completa

- **[NGINX_PROXY_MANAGER.md](./NGINX_PROXY_MANAGER.md)** - Guia completo de configuração
- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Guia de deployment
- **[README.md](./README.md)** - Visão geral do projeto

## 🔐 Credenciais Padrão

- **Username:** `admin`
- **Password:** `admin123`

**⚠️ IMPORTANTE:** Crie sua própria conta admin e delete a conta padrão após o primeiro login!
