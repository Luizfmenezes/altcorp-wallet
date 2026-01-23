# Configuração Nginx Proxy Manager

## Configuração Atual
- **Frontend:** `http://192.168.15.5:8080/` (Docker)
- **Domínio HTTPS:** `https://wallet.altcorphub.com/` (Nginx Proxy Manager)

## Setup no Nginx Proxy Manager

### 1. Proxy Host para Frontend + Backend

**Domain Names:**
```
wallet.altcorphub.com
```

**Scheme:** `http`  
**Forward Hostname/IP:** `192.168.15.5`  
**Forward Port:** `8080`  
**Block Common Exploits:** ✅ ON  
**Websockets Support:** ✅ ON  

**⚠️ IMPORTANTE: Custom Locations para API (OBRIGATÓRIO)**

Você **DEVE** adicionar estas Custom Locations no Nginx Proxy Manager:

**Location 1: `/api`**
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

**Location 2: `/docs`**
- **Define:** `/docs`
- **Scheme:** `http`
- **Forward Hostname/IP:** `192.168.15.5`
- **Forward Port:** `8000`
- **Advanced:**
```nginx
proxy_http_version 1.1;
proxy_set_header Host $host;
proxy_set_header X-Real-IP $remote_addr;
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
proxy_set_header X-Forwarded-Proto $scheme;
```

**Location 3: `/openapi.json`**
- **Define:** `/openapi.json`
- **Scheme:** `http`
- **Forward Hostname/IP:** `192.168.15.5`
- **Forward Port:** `8000`
- **Advanced:**
```nginx
proxy_http_version 1.1;
proxy_set_header Host $host;
proxy_set_header X-Real-IP $remote_addr;
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
proxy_set_header X-Forwarded-Proto $scheme;
```

**❗ Sem estas Custom Locations, o frontend NÃO conseguirá se comunicar com o backend!**

### 2. SSL Certificate
- ✅ Force SSL: ON
- ✅ HTTP/2 Support: ON
- ✅ HSTS Enabled: ON
- ✅ HSTS Subdomains: ON (se aplicável)

### 3. Portas Expostas no Docker

**docker-compose.yml atual:**
```yaml
services:
  frontend:
    ports:
      - "8080:80"    # Frontend acessível em http://192.168.15.5:8080
  
  backend:
    # Sem portas expostas (apenas rede interna)
  
  database:
    ports:
      - "5432:5432"  # PostgreSQL (feche se não precisar acesso externo)
```

### 4. CORS Configurado

**.env atual:**
```bash
ALLOWED_ORIGINS=https://wallet.altcorphub.com,http://192.168.15.5:8080,http://localhost:8080
```

### 5. Teste de Conectividade

**Frontend:**
```bash
curl http://192.168.15.5:8080
```

**Backend API:**
```bash
curl http://192.168.15.5:8000/api/v1/health
```

**HTTPS (via Nginx Proxy Manager):**
```bash
curl https://wallet.altcorphub.com
curl https://wallet.altcorphub.com/api/v1/health
```

## Troubleshooting

### Erro 502 Bad Gateway
1. Verifique se os containers estão rodando: `docker-compose ps`
2. Verifique logs: `docker-compose logs -f`
3. Teste conexão direta: `curl http://192.168.15.5:8080`

### Erro CORS
1. Verifique ALLOWED_ORIGINS no `.env`
2. Reinicie backend: `docker-compose restart backend`
3. Verifique logs: `docker logs altcorp-wallet-backend`

### API não responde
1. Verifique se backend está healthy: `docker-compose ps`
2. Teste direto: `curl http://192.168.15.5:8000/api/v1/health`
3. Verifique Custom Locations no Nginx Proxy Manager

## Segurança

### Firewall (UFW)
```bash
# Permitir apenas portas necessárias
sudo ufw allow 22/tcp      # SSH
sudo ufw allow 80/tcp      # HTTP (Nginx Proxy Manager)
sudo ufw allow 443/tcp     # HTTPS (Nginx Proxy Manager)
sudo ufw allow 81/tcp      # Nginx Proxy Manager Admin

# Bloquear acesso externo às portas internas (opcional)
sudo ufw deny 8080/tcp     # Frontend (apenas local)
sudo ufw deny 8000/tcp     # Backend (apenas local)
sudo ufw deny 5432/tcp     # PostgreSQL (apenas local)

sudo ufw enable
```

### Docker - Remover Exposição de Portas Internas

Se você quiser que **apenas o Nginx Proxy Manager** acesse os containers:

**docker-compose.yml (mais seguro):**
```yaml
services:
  frontend:
    # Remover ports, deixar apenas rede interna
    networks:
      - wallet-network
  
  backend:
    # Já está sem ports expostos
    networks:
      - wallet-network
  
  database:
    # Remover ports se não precisar acesso externo
    networks:
      - wallet-network
```

Neste caso, configure o Nginx Proxy Manager para acessar via nome do container:
- Frontend: `http://altcorp-wallet-frontend:80`
- Backend: `http://altcorp-wallet-backend:8000`

**Nota:** Certifique-se que o Nginx Proxy Manager está na mesma rede Docker (`wallet-network`).
