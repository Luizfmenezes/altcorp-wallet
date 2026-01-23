# 🚀 Guia de Desenvolvimento Local

## 🏠 Testando Localmente (Windows/Mac/Linux)

### **Opção 1: Modo Desenvolvimento (Recomendado)**

Use o `docker-compose.dev.yml` que expõe todas as portas:

```bash
# Para e remove containers
docker-compose down

# Inicia em modo desenvolvimento
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d

# Ou sem detach para ver logs:
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up
```

**Acesse:**
- Frontend: `http://localhost:8080`
- Backend API: `http://localhost:8000/docs`
- PostgreSQL: `localhost:5432`

**Credenciais:**
- Username: `admin`
- Password: `admin123`

---

### **Opção 2: Modo Produção (sem Nginx Proxy Manager)**

Se você quer testar em modo produção mas sem HTTPS:

```bash
docker-compose up -d
```

**Acesse:**
- Frontend: `http://localhost:8080`
- Backend: Apenas interno (não exposto)

⚠️ **Problema:** O frontend buildado pode ter URL hardcoded. Precisa rebuild:

```bash
# Garanta que frontend/.env está vazio
echo "VITE_API_URL=" > frontend/.env

# Rebuild frontend
docker-compose build --no-cache frontend
docker-compose up -d
```

---

## 🔧 Comandos Úteis

### **Ver logs em tempo real:**
```bash
# Todos os serviços
docker-compose logs -f

# Apenas backend
docker-compose logs -f backend

# Apenas frontend
docker-compose logs -f frontend
```

### **Reiniciar um serviço:**
```bash
docker-compose restart backend
docker-compose restart frontend
```

### **Rebuild específico:**
```bash
# Backend
docker-compose build backend

# Frontend (sem cache)
docker-compose build --no-cache frontend
```

### **Entrar no container:**
```bash
# Backend (Python)
docker exec -it altcorp-wallet-backend bash

# Frontend (Nginx)
docker exec -it altcorp-wallet-frontend sh

# Database (PostgreSQL)
docker exec -it altcorp-wallet-db psql -U walletuser -d altcorp_wallet
```

---

## 🐛 Troubleshooting Local

### **Erro: CORS bloqueando requisições**

**Causa:** Backend não tem `localhost:8080` no ALLOWED_ORIGINS

**Solução:**
```bash
# Verifique o .env
cat .env | grep ALLOWED_ORIGINS

# Deve incluir: http://localhost:8080
# Se não tiver, adicione:
# ALLOWED_ORIGINS=http://localhost:8080,http://localhost:3000

# Reinicie backend
docker-compose restart backend
```

### **Erro: Frontend não consegue acessar backend**

**Opção A: Use modo desenvolvimento**
```bash
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d
```

**Opção B: Configure VITE_API_URL**
```bash
# Edite frontend/.env
echo "VITE_API_URL=http://localhost:8000" > frontend/.env

# Rebuild frontend
docker-compose build --no-cache frontend
docker-compose up -d
```

### **Erro: Porta já em uso**

```bash
# Veja o que está usando a porta
# Windows PowerShell:
netstat -ano | findstr :8080
netstat -ano | findstr :8000

# Linux/Mac:
lsof -i :8080
lsof -i :8000

# Mate o processo ou pare o container conflitante
docker ps
docker stop <container_id>
```

### **Erro: Database connection failed**

```bash
# Verifique se o banco está rodando
docker-compose ps

# Se estiver unhealthy, reinicie:
docker-compose restart database

# Veja logs do banco:
docker logs altcorp-wallet-db
```

---

## 🔄 Reset Completo (Limpar tudo)

```bash
# Para e remove containers, volumes e redes
docker-compose down -v

# Remove imagens antigas
docker rmi altcorp-wallet-backend altcorp-wallet-frontend

# Rebuild tudo
docker-compose build --no-cache

# Suba novamente
docker-compose up -d

# Crie usuário admin
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "name": "Administrator",
    "password": "admin123",
    "role": "admin"
  }'
```

---

## 🧪 Testar API Manualmente

### **Login:**
```bash
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

### **Listar usuários (precisa token):**
```bash
TOKEN="seu_token_aqui"

curl -X GET http://localhost:8000/api/v1/users/ \
  -H "Authorization: Bearer $TOKEN"
```

### **Criar novo usuário:**
```bash
TOKEN="seu_token_aqui"

curl -X POST http://localhost:8000/api/v1/users/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "usuario",
    "name": "Usuário Teste",
    "password": "senha123",
    "role": "user"
  }'
```

---

## 📊 Status dos Serviços

```bash
# Ver status de todos os containers
docker-compose ps

# Ver uso de recursos
docker stats

# Ver redes
docker network ls

# Ver volumes
docker volume ls
```

---

## 🎯 Quick Start Local

```bash
# Clone o projeto
git clone <repo-url>
cd altcorp-wallet

# Configure ambiente
cp .env.example .env
# Edite .env se necessário

# Modo desenvolvimento (portas expostas)
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d

# Aguarde containers iniciarem (30 segundos)
sleep 30

# Crie usuário admin
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","name":"Administrator","password":"admin123","role":"admin"}'

# Acesse: http://localhost:8080
# Login: admin / admin123
```

---

## 🔐 Segurança - Desenvolvimento Local

⚠️ **Nunca use estas configurações em produção:**

- `DEBUG=True` expõe informações sensíveis
- Porta 8000 exposta permite acesso direto ao backend
- Porta 5432 exposta permite acesso direto ao banco
- Senha padrão `admin123` é insegura

**Para produção, use:**
- `DEBUG=False`
- Remova exposição de portas backend/database
- Use senhas fortes
- Configure HTTPS com Nginx Proxy Manager
- Ver: `DEPLOYMENT.md`

---

## 📚 Arquivos de Configuração

| Arquivo | Propósito |
|---------|-----------|
| `.env` | Variáveis de ambiente (senhas, secrets, CORS) |
| `frontend/.env` | URL da API para build do frontend |
| `docker-compose.yml` | Configuração de produção |
| `docker-compose.dev.yml` | Override para desenvolvimento |

---

## 💡 Dicas

1. **Use modo dev para desenvolver localmente:**
   ```bash
   docker-compose -f docker-compose.yml -f docker-compose.dev.yml up
   ```

2. **Backend com hot-reload:** Alterações em `backend/` são aplicadas automaticamente

3. **Frontend precisa rebuild:** Alterações em `frontend/` precisam rebuild:
   ```bash
   docker-compose build frontend && docker-compose up -d
   ```

4. **Use .env.local para testes:** Crie um `.env.local` e carregue:
   ```bash
   docker-compose --env-file .env.local up
   ```

5. **Logs coloridos:**
   ```bash
   docker-compose logs -f --tail=100 | grep -E "ERROR|INFO|WARNING"
   ```
