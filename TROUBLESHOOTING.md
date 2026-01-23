# 🔧 Troubleshooting - Erro CORS após Login

## 🐛 Problema Identificado

```
Access to XMLHttpRequest at 'http://localhost/api/v1/users/' 
from origin 'https://localhost' has been blocked by CORS policy
```

**Causa:** O frontend foi buildado com a URL antiga `http://localhost:8000`. Precisa fazer rebuild com path relativo.

---

## ✅ Solução - Execute na VM Linux

### 1. **Pare os containers:**
```bash
cd /caminho/do/seu/projeto
docker-compose down
```

### 2. **Verifique se o arquivo .env está correto:**
```bash
cat .env | grep ALLOWED_ORIGINS
```

**Deve mostrar:**
```
ALLOWED_ORIGINS=https://wallet.altcorphub.com,http://192.168.15.5:8080,http://localhost:8080
```

Se estiver diferente, edite:
```bash
nano .env
# ou
vi .env
```

### 3. **Verifique o frontend/.env:**
```bash
cat frontend/.env
```

**Deve estar assim:**
```properties
# Frontend Environment Variables
VITE_API_URL=
```

**⚠️ IMPORTANTE:** `VITE_API_URL` deve estar vazio ou comentado!

Se não existir o arquivo, crie:
```bash
cat > frontend/.env << 'EOF'
# Frontend Environment Variables
# API Base URL - Leave empty to use relative paths
VITE_API_URL=
EOF
```

### 4. **Rebuild APENAS o frontend (sem cache):**
```bash
docker-compose build --no-cache frontend
```

### 5. **Suba os containers:**
```bash
docker-compose up -d
```

### 6. **Verifique os logs:**
```bash
# Backend
docker logs altcorp-wallet-backend --tail 50

# Frontend
docker logs altcorp-wallet-frontend --tail 20
```

### 7. **Teste a API diretamente:**
```bash
# Teste se o backend responde
curl -X POST http://192.168.15.5:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# Deve retornar um token JWT
```

### 8. **Limpe o cache do navegador:**
No navegador, pressione: **Ctrl + Shift + Del**
- Marque: "Imagens e arquivos em cache"
- Período: "Todo o período"
- Limpar dados

Ou force refresh: **Ctrl + F5**

---

## 🔍 Verificação Final

### **Teste 1: Frontend servindo corretamente**
```bash
curl http://192.168.15.5:8080
```
Deve retornar HTML da aplicação.

### **Teste 2: Backend respondendo**
```bash
curl http://192.168.15.5:8000/api/v1/auth/login -X POST \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```
Deve retornar JSON com `access_token`.

### **Teste 3: HTTPS via Nginx Proxy Manager**
No navegador, acesse:
```
https://wallet.altcorphub.com
```

1. Faça login com `admin` / `admin123`
2. Abra o **DevTools** (F12) → Aba **Network**
3. Verifique se as requisições para `/api/v1/*` estão indo para `https://wallet.altcorphub.com/api/v1/*` (e não `http://localhost`)

---

## ⚙️ Nginx Proxy Manager - Verificação das Custom Locations

**CRÍTICO:** Verifique se as Custom Locations estão configuradas:

### **Proxy Host: wallet.altcorphub.com**

**Details Tab:**
- Scheme: `http`
- Forward Hostname/IP: `192.168.15.5`
- Forward Port: `8080`
- ✅ Block Common Exploits
- ✅ Websockets Support

**Custom Locations Tab:**

#### **Location 1: `/api`**
- **Define:** `/api`
- **Scheme:** `http`
- **Forward Hostname/IP:** `192.168.15.5`
- **Forward Port:** `8000`
- **Advanced:**
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

#### **Location 2: `/docs`**
- **Define:** `/docs`
- **Scheme:** `http`
- **Forward Hostname/IP:** `192.168.15.5`
- **Forward Port:** `8000`
- **Advanced:** (mesmo do `/api`)

#### **Location 3: `/openapi.json`**
- **Define:** `/openapi.json`
- **Scheme:** `http`
- **Forward Hostname/IP:** `192.168.15.5`
- **Forward Port:** `8000`
- **Advanced:** (mesmo do `/api`)

---

## 🚨 Se ainda não funcionar

### **Problema 1: CORS ainda bloqueando**

**Verifique o ALLOWED_ORIGINS no backend:**
```bash
docker exec altcorp-wallet-backend printenv | grep ALLOWED_ORIGINS
```

Deve mostrar:
```
ALLOWED_ORIGINS=https://wallet.altcorphub.com,http://192.168.15.5:8080,http://localhost:8080
```

Se estiver errado, corrija o `.env` e reinicie:
```bash
docker-compose restart backend
```

### **Problema 2: Frontend ainda usa localhost**

**Verifique o build do frontend:**
```bash
docker exec altcorp-wallet-frontend cat /usr/share/nginx/html/assets/*.js | grep -o "http://localhost:8000" | head -5
```

Se retornar algo, significa que o build está com URL hardcoded. Precisa rebuild:
```bash
docker-compose down
docker-compose build --no-cache frontend
docker-compose up -d
```

### **Problema 3: Cache do navegador**

- Use **Modo Anônimo** (Ctrl + Shift + N) para testar
- Ou limpe completamente o cache e cookies do site

---

## 📝 Resumo Rápido

```bash
# Na VM Linux (execute tudo de uma vez):
cd /caminho/do/projeto
docker-compose down
docker-compose build --no-cache frontend
docker-compose up -d
docker-compose logs -f
```

Depois, no navegador:
1. **Ctrl + Shift + Del** → Limpar cache
2. Acesse: `https://wallet.altcorphub.com`
3. Login: `admin` / `admin123`
4. **F12** → Network → Verifique se requisições vão para `https://wallet.altcorphub.com/api/v1/*`

---

## 🎯 Checklist

- [ ] `.env` com `ALLOWED_ORIGINS=https://wallet.altcorphub.com`
- [ ] `frontend/.env` com `VITE_API_URL=` (vazio)
- [ ] Rebuild do frontend sem cache
- [ ] Nginx Proxy Manager com 3 Custom Locations (`/api`, `/docs`, `/openapi.json`)
- [ ] Cache do navegador limpo
- [ ] Teste em modo anônimo

---

**Após executar estes passos, tudo deve funcionar! 🚀**
