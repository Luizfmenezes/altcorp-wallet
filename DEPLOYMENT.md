# 🚀 Deploy para Produção - VM Linux com Nginx Proxy Manager# 🚀 Deployment para Produção - VM Linux com Nginx Proxy Manager# 🚀 Guia de Deployment - AltCorp Wallet



## 📋 Arquitetura



```## 📋 Pré-requisitos## 📋 Pré-requisitos

Internet

    │

    ▼

┌─────────────────────────────────┐- ✅ VM Linux Ubuntu rodando- Docker Engine 20.10+

│    Nginx Proxy Manager          │

│    (HTTPS - porta 443)          │- ✅ Docker e Docker Compose instalados- Docker Compose 2.0+

│    wallet.altcorphub.com        │

└──────────────┬──────────────────┘- ✅ Nginx Proxy Manager configurado- 2GB RAM mínimo

               │

               ▼ HTTP :8080- ✅ Domínio apontando para o IP da VM (ex: `wallet.altcorphub.com` → `192.168.15.5`)- 10GB espaço em disco

┌─────────────────────────────────────────────────┐

│              Docker Network                      │

│  ┌─────────────┐    ┌─────────────┐             │

│  │  Frontend   │───▶│  Backend    │             │---## ⚙️ Configuração Inicial

│  │  (Nginx)    │    │  (FastAPI)  │             │

│  │  :80        │    │  :8000      │             │

│  └─────────────┘    └──────┬──────┘             │

│                            │                     │## 🔧 Passo 1: Preparar Arquivos para Produção### 1. Clone o repositório

│                     ┌──────▼──────┐             │

│                     │  PostgreSQL │             │```bash

│                     │  :5432      │             │

│                     └─────────────┘             │### **1.1 Configure o `.env` na VM:**git clone <seu-repositorio>

└─────────────────────────────────────────────────┘

```cd altcorp-wallet



## 🔧 Passo 1: Preparar VM```bash```



```bashcd /caminho/do/projeto

# Conectar na VM

ssh usuario@seu-servidor### 2. Configure as variáveis de ambiente



# Criar diretório# Edite o .env```bash

mkdir -p /opt/altcorp-wallet

cd /opt/altcorp-walletnano .envcp .env.example .env



# Clonar/copiar o projeto``````

git clone <seu-repositorio> .

# OU

scp -r ./projeto usuario@servidor:/opt/altcorp-wallet

```**Configuração de produção:**Edite o arquivo `.env` e configure:



## 🔧 Passo 2: Configurar Variáveis de Ambiente```bash



```bash# Database Configuration**OBRIGATÓRIO ALTERAR:**

# Copiar exemplo

cp .env.example .envPOSTGRES_USER=walletuser- `POSTGRES_PASSWORD`: Senha forte para o banco de dados



# EditarPOSTGRES_PASSWORD=COLOQUE_SENHA_FORTE_AQUI  # ⚠️ Mude!- `SECRET_KEY`: Chave secreta para JWT (mínimo 32 caracteres)

nano .env

```POSTGRES_DB=altcorp_wallet- `ALLOWED_ORIGINS`: Domínios permitidos (ex: https://seudominio.com)



**Conteúdo do `.env` para produção:**

```env

# Database# Backend Configuration**Gerar SECRET_KEY:**

POSTGRES_USER=walletuser

POSTGRES_PASSWORD=SenhaForte123!@#  # ⚠️ MUDE ISSO!SECRET_KEY=GERE_UM_SECRETKEY_ALEATORIO_64_CHARS  # ⚠️ Mude!```bash

POSTGRES_DB=altcorp_wallet

DEBUG=Falsepython -c "import secrets; print(secrets.token_urlsafe(32))"

# Backend

SECRET_KEY=coloque-uma-chave-aleatoria-de-64-caracteres-aqui  # ⚠️ MUDE!```

DEBUG=False

# API Configuration

# CORS - Adicione seu domínio HTTPS

ALLOWED_ORIGINS=https://wallet.altcorphub.com,http://192.168.15.5:8080API_PORT=8000### 3. Inicie os containers

```

```bash

**Gerar SECRET_KEY seguro:**

```bash# Frontend Configuration# Build e start

python3 -c "import secrets; print(secrets.token_urlsafe(48))"

```FRONTEND_PORT=80docker-compose up -d --build



## 🔧 Passo 3: Build e Start



```bash# CORS Configuration - ADICIONE SEU DOMÍNIO HTTPS# Verificar logs

# Build das imagens (só precisa fazer 1x ou quando mudar código)

docker-compose build --no-cacheALLOWED_ORIGINS=https://wallet.altcorphub.com,http://192.168.15.5:8080docker-compose logs -f



# Iniciar todos os serviços``````

docker-compose up -d



# Ver logs em tempo real

docker-compose logs -f**Gerar SECRET_KEY seguro:**### 4. Criar primeiro usuário admin



# Ver status```bash```bash

docker-compose ps

```python3 -c "import secrets; print(secrets.token_urlsafe(48))"docker exec -it altcorp-wallet-backend python -c "



## 🔧 Passo 4: Criar Usuário Admin```from app.database.session import SessionLocal



```bashfrom app.database.models import User, UserRole

docker exec -it altcorp-wallet-backend python -c "

from app.database.session import SessionLocal### **1.2 Configure o `frontend/.env` para PRODUÇÃO:**from app.core.security import get_password_hash

from app.database.models import User, UserRole

from app.core.security import get_password_hash



db = SessionLocal()```bashdb = SessionLocal()

admin = User(

    username='admin',# Crie/edite o frontend/.envadmin = User(

    hashed_password=get_password_hash('admin123'),  # MUDE A SENHA!

    role=UserRole.ADMINnano frontend/.env    username='admin',

)

db.add(admin)```    name='Administrador',

db.commit()

print('✅ Admin criado: admin/admin123')    hashed_password=get_password_hash('SENHA_SEGURA_AQUI'),

db.close()

"**⚠️ IMPORTANTE: Deixe VAZIO para usar path relativo:**    role=UserRole.ADMIN,

```

```bash    is_active=True,

## 🔧 Passo 5: Configurar Nginx Proxy Manager

# Frontend Environment Variables    onboarding_completed=True

No painel do Nginx Proxy Manager:

# For production, leave empty to use relative paths)

1. **Adicionar Proxy Host:**

   - Domain: `wallet.altcorphub.com`VITE_API_URL=db.add(admin)

   - Scheme: `http`

   - Forward Hostname/IP: `IP_DA_VM` (ex: 192.168.15.5)```db.commit()

   - Forward Port: `8080`

print('Admin criado com sucesso!')

2. **SSL Tab:**

   - Request new SSL Certificate**Ou apague o arquivo completamente:**"

   - ✅ Force SSL

   - ✅ HTTP/2 Support```bash```



3. **Advanced Tab (opcional):**rm frontend/.env

```nginx

proxy_set_header X-Real-IP $remote_addr;```## 🔒 Segurança em Produção

proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;

proxy_set_header X-Forwarded-Proto $scheme;

```

---### Checklist de Segurança

## ✅ Verificar Deploy



```bash

# Testar backend diretamente## 🏗️ Passo 2: Build e Deploy- [ ] `DEBUG=False` no `.env`

curl http://localhost:8080/api/v1/health

- [ ] Senha forte do PostgreSQL

# Testar via domínio (de outra máquina)

curl https://wallet.altcorphub.com/api/v1/health### **2.1 Clone ou atualize o código:**- [ ] SECRET_KEY único e aleatório (32+ caracteres)

```

- [ ] ALLOWED_ORIGINS configurado com seu domínio

## 🔄 Atualizar Sistema

```bash- [ ] Firewall configurado (apenas portas 80/443)

```bash

cd /opt/altcorp-wallet# Se primeira vez:- [ ] SSL/TLS configurado (HTTPS)



# Puxar mudançasgit clone <seu-repo-url>- [ ] Backups automáticos do banco de dados

git pull

cd altcorp-wallet

# Rebuild e restart

docker-compose down### Configurar HTTPS com Nginx/Caddy

docker-compose build --no-cache

docker-compose up -d# Se já tem o projeto:

```

cd altcorp-walletRecomendado usar um reverse proxy (Nginx ou Caddy) na frente da aplicação para:

## 📊 Comandos Úteis

git pull origin main- Terminar SSL/TLS

```bash

# Ver logs do backend```- Rate limiting

docker logs -f altcorp-wallet-backend

- Proteção DDoS básica

# Ver logs do frontend

docker logs -f altcorp-wallet-frontend### **2.2 Pare containers antigos:**



# Acessar banco de dados## 📊 Monitoramento

docker exec -it altcorp-wallet-db psql -U walletuser -d altcorp_wallet

```bash

# Parar tudo

docker-compose downdocker-compose down -v  # -v remove volumes (cuidado com dados!)### Ver logs



# Parar e remover volumes (⚠️ APAGA DADOS!)``````bash

docker-compose down -v

```# Todos os containers



## ❓ Troubleshooting### **2.3 Build sem cache (IMPORTANTE):**docker-compose logs -f



### CORS Error

- Verifique se `ALLOWED_ORIGINS` no `.env` inclui `https://wallet.altcorphub.com`

- Reinicie: `docker-compose restart backend````bash# Apenas backend



### 502 Bad Gateway# Build do frontend sem cache para garantir que usa .env corretodocker-compose logs -f backend

- Verifique se containers estão rodando: `docker-compose ps`

- Verifique logs: `docker-compose logs backend`docker-compose build --no-cache frontend



### Não consegue acessar# Apenas database

- Verifique firewall: porta 8080 deve estar aberta

- `sudo ufw allow 8080`# Build do backend (pode usar cache)docker-compose logs -f database


docker-compose build backend```

```

### Status dos containers

### **2.4 Inicie os containers:**```bash

docker-compose ps

```bash```

# Inicia SOMENTE com docker-compose.yml (SEM docker-compose.dev.yml!)

docker-compose up -d### Uso de recursos

``````bash

docker stats

### **2.5 Verifique status:**```



```bash## 🔄 Atualização

docker-compose ps

``````bash

# Pull das mudanças

**Deve mostrar:**git pull

```

NAME                      STATUS        PORTS# Rebuild e restart

altcorp-wallet-backend    Up (healthy)  (interno)docker-compose down

altcorp-wallet-db         Up (healthy)  5432/tcpdocker-compose up -d --build

altcorp-wallet-frontend   Up            0.0.0.0:8080->80/tcp

```# Verificar logs

docker-compose logs -f backend

---```



## 🔐 Passo 3: Criar Usuário Admin## 💾 Backup



```bash### Backup do banco de dados

# Aguarde 10 segundos para o backend inicializar```bash

sleep 10docker exec altcorp-wallet-db pg_dump -U walletuser altcorp_wallet > backup_$(date +%Y%m%d_%H%M%S).sql

```

# Crie o usuário admin

curl -X POST http://localhost:8000/api/v1/auth/register \### Restaurar backup

  -H "Content-Type: application/json" \```bash

  -d '{docker exec -i altcorp-wallet-db psql -U walletuser altcorp_wallet < backup_YYYYMMDD_HHMMSS.sql

    "username": "admin",```

    "name": "Administrator",

    "password": "SENHA_FORTE_AQUI",## 🐛 Troubleshooting

    "role": "admin"

  }'### Backend não inicia

``````bash

docker-compose logs backend

**⚠️ USE UMA SENHA FORTE! Não use `admin123` em produção!**# Verifique: DATABASE_URL, SECRET_KEY, ALLOWED_ORIGINS

```

---

### Erro de CORS

## 🌐 Passo 4: Configurar Nginx Proxy Manager- Verifique `ALLOWED_ORIGINS` no `.env`

- Deve incluir o domínio completo com protocolo

### **4.1 Criar Proxy Host:**

### Banco de dados não conecta

**Acesse:** `http://SEU_IP:81` (porta padrão do NPM admin)- Verifique se o container do banco está rodando: `docker-compose ps`

- Verifique senha no `.env`

**Proxy Hosts → Add Proxy Host:**

## 📞 Suporte

| Campo | Valor |

|-------|-------|Para problemas, verifique os logs com `docker-compose logs -f`

| **Domain Names** | `wallet.altcorphub.com` |

| **Scheme** | `http` |## 🔐 Primeiro Acesso

| **Forward Hostname/IP** | `192.168.15.5` (ou IP da VM) |

| **Forward Port** | `8080` |1. Acesse: `http://seu-dominio`

| **Cache Assets** | ✅ ON |2. Faça login com as credenciais do admin criado

| **Block Common Exploits** | ✅ ON |3. Vá em "Gerenciamento de Usuários"

| **Websockets Support** | ✅ ON |4. Crie sua conta pessoal com role "Admin"

5. Faça logout e entre com sua nova conta

### **4.2 CRITICAL: Adicionar Custom Locations**6. Delete o usuário admin temporário


**⚠️ SEM ESTAS LOCATIONS, A API NÃO FUNCIONARÁ!**

#### **Custom Location 1: `/api`**

**Tab "Custom Locations" → Add Location:**

| Campo | Valor |
|-------|-------|
| **Define** | `/api` |
| **Scheme** | `http` |
| **Forward Hostname/IP** | `192.168.15.5` |
| **Forward Port** | `8000` |

**Advanced (cole isto):**
```nginx
proxy_http_version 1.1;
proxy_set_header Upgrade $http_upgrade;
proxy_set_header Connection 'upgrade';
proxy_set_header Host $host;
proxy_set_header X-Real-IP $remote_addr;
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
proxy_set_header X-Forwarded-Proto $scheme;
proxy_cache_bypass $http_upgrade;
```

#### **Custom Location 2: `/docs`**

| Campo | Valor |
|-------|-------|
| **Define** | `/docs` |
| **Scheme** | `http` |
| **Forward Hostname/IP** | `192.168.15.5` |
| **Forward Port** | `8000` |

**Advanced:** (mesmo do `/api`)

#### **Custom Location 3: `/openapi.json`**

| Campo | Valor |
|-------|-------|
| **Define** | `/openapi.json` |
| **Scheme** | `http` |
| **Forward Hostname/IP** | `192.168.15.5` |
| **Forward Port** | `8000` |

**Advanced:** (mesmo do `/api`)

### **4.3 Configurar SSL:**

**Tab "SSL":**

| Campo | Valor |
|-------|-------|
| **SSL Certificate** | Request a new SSL Certificate (Let's Encrypt) |
| **Force SSL** | ✅ ON |
| **HTTP/2 Support** | ✅ ON |
| **HSTS Enabled** | ✅ ON |
| **HSTS Subdomains** | ✅ ON (se aplicável) |
| **Email** | seu-email@exemplo.com |
| **Agree to ToS** | ✅ ON |

**Clique em "Save"** e aguarde o certificado ser emitido.

---

## ✅ Passo 5: Verificar Deploy

### **5.1 Teste acesso direto na VM:**

```bash
# Frontend
curl http://localhost:8080

# Backend API
curl http://localhost:8000/docs

# Login API
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"SUA_SENHA"}'
```

### **5.2 Teste via domínio HTTPS:**

```bash
# Frontend
curl https://wallet.altcorphub.com

# Backend API via proxy
curl https://wallet.altcorphub.com/api/v1/auth/login \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"SUA_SENHA"}'
```

### **5.3 Teste no navegador:**

1. Acesse: `https://wallet.altcorphub.com`
2. Deve abrir a tela de login (HTTPS com cadeado verde)
3. Login: `admin` / `SUA_SENHA`
4. Abra **DevTools (F12)** → **Network**
5. Faça login e verifique requisições:
   - Devem ir para: `https://wallet.altcorphub.com/api/v1/*`
   - Status: `200 OK`
   - Sem erros de CORS

---

## 🔒 Passo 6: Segurança Adicional

### **6.1 Firewall (UFW):**

```bash
# Permitir apenas portas necessárias
sudo ufw allow 22/tcp      # SSH
sudo ufw allow 80/tcp      # HTTP (redirect to HTTPS)
sudo ufw allow 443/tcp     # HTTPS
sudo ufw allow 81/tcp      # Nginx Proxy Manager Admin (opcional)

# Bloquear acesso externo às portas internas (RECOMENDADO)
sudo ufw deny from any to any port 8080  # Frontend interno
sudo ufw deny from any to any port 8000  # Backend interno
sudo ufw deny from any to any port 5432  # PostgreSQL interno

# Permitir localhost acessar portas internas
sudo ufw allow from 127.0.0.1 to any port 8080
sudo ufw allow from 127.0.0.1 to any port 8000
sudo ufw allow from 127.0.0.1 to any port 5432

# Ativar firewall
sudo ufw enable
```

### **6.2 Remover exposição de porta do banco (opcional):**

**Edite `docker-compose.yml`:**
```yaml
database:
  # Comente ou remova a linha de ports:
  # ports:
  #   - "5432:5432"
```

```bash
docker-compose up -d
```

### **6.3 Backup do banco:**

```bash
# Criar backup
docker exec altcorp-wallet-db pg_dump -U walletuser altcorp_wallet > backup_$(date +%Y%m%d).sql

# Restaurar backup
cat backup_20260122.sql | docker exec -i altcorp-wallet-db psql -U walletuser altcorp_wallet
```

---

## 📊 Passo 7: Monitoramento

### **7.1 Ver logs:**

```bash
# Todos os serviços
docker-compose logs -f

# Apenas backend
docker logs altcorp-wallet-backend -f --tail 100

# Apenas frontend
docker logs altcorp-wallet-frontend -f --tail 100
```

### **7.2 Status dos containers:**

```bash
# Ver status
docker-compose ps

# Ver recursos usados
docker stats
```

### **7.3 Reiniciar serviços:**

```bash
# Reiniciar tudo
docker-compose restart

# Reiniciar apenas backend (após mudar .env)
docker-compose restart backend

# Rebuild frontend (após mudar código)
docker-compose build --no-cache frontend
docker-compose up -d
```

---

## 🔄 Atualização de Código (Deploy de Nova Versão)

```bash
cd /caminho/do/projeto

# 1. Backup do banco (IMPORTANTE!)
docker exec altcorp-wallet-db pg_dump -U walletuser altcorp_wallet > backup_$(date +%Y%m%d).sql

# 2. Puxar novo código
git pull origin main

# 3. Rebuild (se mudou código frontend/backend)
docker-compose build --no-cache frontend
docker-compose build backend

# 4. Restart com novo código
docker-compose up -d

# 5. Verificar logs
docker-compose logs -f
```

---

## 🚨 Troubleshooting em Produção

### **Erro: CORS bloqueando**

```bash
# Verifique ALLOWED_ORIGINS
cat .env | grep ALLOWED_ORIGINS

# Deve ter: https://wallet.altcorphub.com
# Corrija se necessário e reinicie:
docker-compose restart backend
```

### **Erro: Frontend com URL hardcoded**

```bash
# Verifique se frontend/.env está vazio
cat frontend/.env

# Se tiver URL, apague e rebuild:
rm frontend/.env
docker-compose build --no-cache frontend
docker-compose up -d
```

### **Erro: Nginx Proxy Manager não encaminha API**

Verifique se as **3 Custom Locations** estão configuradas:
- `/api` → `192.168.15.5:8000`
- `/docs` → `192.168.15.5:8000`
- `/openapi.json` → `192.168.15.5:8000`

### **Erro: Containers não iniciam**

```bash
# Veja logs
docker-compose logs

# Recrie tudo
docker-compose down -v
docker-compose up -d
```

---

## ✅ Checklist de Produção

- [ ] `.env` com CORS correto (`https://wallet.altcorphub.com`)
- [ ] `frontend/.env` VAZIO ou inexistente
- [ ] SECRET_KEY forte e aleatório (64+ caracteres)
- [ ] Senha do banco forte
- [ ] DEBUG=False
- [ ] Senha do admin forte (não use `admin123`)
- [ ] Build sem cache: `docker-compose build --no-cache frontend`
- [ ] Nginx Proxy Manager com 3 Custom Locations
- [ ] SSL configurado (Let's Encrypt)
- [ ] Firewall configurado (UFW)
- [ ] Backup do banco configurado
- [ ] Logs monitorados

---

## 📚 Resumo dos Arquivos

| Ambiente | frontend/.env | docker-compose usado | ALLOWED_ORIGINS |
|----------|--------------|---------------------|-----------------|
| **Dev Local** | `VITE_API_URL=http://localhost:8000` | `docker-compose.yml` + `docker-compose.dev.yml` | `http://localhost:8080` |
| **Produção VM** | **VAZIO** ou inexistente | **SOMENTE** `docker-compose.yml` | `https://wallet.altcorphub.com` |

---

## 🎯 Comandos Rápidos para Produção

```bash
# Deploy completo
cd /caminho/do/projeto
git pull
echo "VITE_API_URL=" > frontend/.env  # Ou: rm frontend/.env
docker-compose down
docker-compose build --no-cache frontend
docker-compose up -d
docker-compose logs -f
```

**Pronto! Seu sistema estará rodando em produção com HTTPS! 🚀**
