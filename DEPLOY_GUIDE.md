# 🚀 Guia Completo de Deploy - AltCorp Wallet

## 📋 Índice
1. [Desenvolvimento](#desenvolvimento)
2. [Produção](#produção)
3. [SSL/HTTPS com Let's Encrypt](#ssl-https)
4. [Troubleshooting](#troubleshooting)

---

## 🔧 Desenvolvimento

### Pré-requisitos
- Docker e Docker Compose instalados
- Portas 80, 5432 e 8000 disponíveis

### Opção 1: Docker Compose Normal

```bash
# 1. Copiar arquivo de ambiente
cp .env.development .env

# 2. Subir containers
docker-compose up -d --build

# 3. Verificar logs
docker-compose logs -f

# 4. Acessar aplicação
# Frontend: http://localhost
# Backend API: http://localhost:8000
# Docs API: http://localhost:8000/api/docs
```

### Opção 2: Docker Compose Dev (com Hot Reload)

```bash
# 1. Copiar arquivo de ambiente
cp .env.development .env

# 2. Subir containers de desenvolvimento
docker-compose -f docker-compose.dev.yml up -d --build

# 3. Verificar logs
docker-compose -f docker-compose.dev.yml logs -f

# 4. Acessar aplicação
# Frontend (Vite): http://localhost:5173
# Backend API: http://localhost:8000
```

### Parar Desenvolvimento

```bash
# Normal
docker-compose down

# Dev
docker-compose -f docker-compose.dev.yml down

# Remover volumes (reset completo)
docker-compose down -v
```

---

## 🌐 Produção

### Pré-requisitos VPS
- VPS Linux (Ubuntu 20.04+ recomendado)
- Docker e Docker Compose instalados
- Domínio configurado: `wallet.altcorphub.com` → IP do servidor
- Portas 80 e 443 abertas no firewall

### Passo 1: Preparar Servidor

```bash
# Conectar ao servidor
ssh user@seu-servidor.com

# Atualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Instalar Docker Compose
sudo apt install docker-compose -y

# Adicionar usuário ao grupo docker (opcional)
sudo usermod -aG docker $USER
```

### Passo 2: Transferir Arquivos

```bash
# No seu computador local, comprimir projeto
tar -czf altcorp-wallet.tar.gz \
  backend/ \
  frontend/ \
  database/ \
  docker-compose.prod.yml \
  .env.production

# Transferir para servidor
scp altcorp-wallet.tar.gz user@seu-servidor.com:~/

# No servidor, descomprimir
cd ~
tar -xzf altcorp-wallet.tar.gz
cd altcorp-wallet
```

### Passo 3: Configurar Variáveis de Ambiente

```bash
# No servidor
cd ~/altcorp-wallet

# Copiar e editar .env de produção
cp .env.production .env

# IMPORTANTE: Editar valores sensíveis
nano .env
```

**Valores OBRIGATÓRIOS para alterar:**

```bash
# Gerar senha forte para o banco
POSTGRES_PASSWORD=SUA_SENHA_FORTE_AQUI

# Gerar SECRET_KEY (execute no servidor):
openssl rand -hex 32

# Copiar resultado para .env:
SECRET_KEY=resultado_do_comando_acima
```

### Passo 4: Deploy SEM SSL (primeiro teste)

```bash
# Subir containers
docker-compose -f docker-compose.prod.yml up -d --build

# Verificar status
docker-compose -f docker-compose.prod.yml ps

# Ver logs
docker-compose -f docker-compose.prod.yml logs -f

# Testar acesso (substitua pelo seu domínio)
curl http://wallet.altcorphub.com/health
```

**Resultado esperado:** `healthy`

### Passo 5: Configurar SSL/HTTPS com Let's Encrypt

```bash
# Instalar Certbot
sudo apt install certbot -y

# Parar containers temporariamente
docker-compose -f docker-compose.prod.yml down

# Obter certificado SSL
sudo certbot certonly --standalone \
  -d wallet.altcorphub.com \
  -d www.wallet.altcorphub.com \
  --email seu-email@example.com \
  --agree-tos \
  --no-eff-email

# Criar diretório para certificados no projeto
mkdir -p ssl

# Copiar certificados
sudo cp /etc/letsencrypt/live/wallet.altcorphub.com/fullchain.pem ssl/
sudo cp /etc/letsencrypt/live/wallet.altcorphub.com/privkey.pem ssl/
sudo chmod 644 ssl/*.pem

# Subir containers com SSL
docker-compose -f docker-compose.prod.yml up -d --build

# Testar HTTPS
curl https://wallet.altcorphub.com/health
```

### Passo 6: Renovação Automática de Certificado

```bash
# Criar script de renovação
sudo nano /usr/local/bin/renew-ssl.sh
```

Conteúdo do script:

```bash
#!/bin/bash
cd /home/user/altcorp-wallet
docker-compose -f docker-compose.prod.yml down
certbot renew --quiet
cp /etc/letsencrypt/live/wallet.altcorphub.com/fullchain.pem ssl/
cp /etc/letsencrypt/live/wallet.altcorphub.com/privkey.pem ssl/
chmod 644 ssl/*.pem
docker-compose -f docker-compose.prod.yml up -d
```

```bash
# Tornar executável
sudo chmod +x /usr/local/bin/renew-ssl.sh

# Adicionar ao cron (executa todo dia às 3h)
sudo crontab -e

# Adicionar linha:
0 3 * * * /usr/local/bin/renew-ssl.sh >> /var/log/ssl-renew.log 2>&1
```

---

## 🔒 SSL/HTTPS Alternativa: Cloudflare

Se estiver usando Cloudflare:

1. **No Cloudflare:**
   - SSL/TLS → Full (strict)
   - Criar Origin Certificate
   - Baixar certificado e chave

2. **No Servidor:**
   ```bash
   mkdir -p ssl
   nano ssl/fullchain.pem  # Colar certificado
   nano ssl/privkey.pem    # Colar chave privada
   chmod 644 ssl/*.pem
   ```

3. **Deploy:**
   ```bash
   docker-compose -f docker-compose.prod.yml up -d --build
   ```

---

## 🔍 Verificação de Produção

### Checklist Pós-Deploy

```bash
# 1. Verificar containers rodando
docker-compose -f docker-compose.prod.yml ps

# Resultado esperado:
# altcorp-wallet-db-prod        Up (healthy)
# altcorp-wallet-backend-prod   Up (healthy)
# altcorp-wallet-frontend-prod  Up

# 2. Verificar logs (sem erros)
docker-compose -f docker-compose.prod.yml logs --tail=50

# 3. Testar endpoints
curl https://wallet.altcorphub.com/health
curl https://wallet.altcorphub.com/api/v1/

# 4. Testar CORS (do navegador)
# Abrir https://wallet.altcorphub.com
# Abrir DevTools > Console
# Tentar fazer login/cadastro
# Não deve ter erros de CORS

# 5. Verificar banco de dados
docker exec altcorp-wallet-db-prod psql -U walletuser -d altcorp_wallet -c "\dt"
```

### Testes Funcionais

1. ✅ **Acesso Frontend:** https://wallet.altcorphub.com
2. ✅ **API Docs:** https://wallet.altcorphub.com/api/docs
3. ✅ **Criar usuário:** Testar registro
4. ✅ **Login:** Testar autenticação
5. ✅ **CRUD:** Criar cartão, despesa, renda
6. ✅ **Persistência:** Recarregar página, dados devem persistir

---

## 🛠️ Comandos Úteis

### Ver Logs

```bash
# Todos os serviços
docker-compose -f docker-compose.prod.yml logs -f

# Apenas backend
docker-compose -f docker-compose.prod.yml logs -f backend

# Apenas frontend
docker-compose -f docker-compose.prod.yml logs -f frontend

# Últimas 100 linhas
docker-compose -f docker-compose.prod.yml logs --tail=100
```

### Restart Serviços

```bash
# Todos
docker-compose -f docker-compose.prod.yml restart

# Apenas backend
docker-compose -f docker-compose.prod.yml restart backend

# Apenas frontend
docker-compose -f docker-compose.prod.yml restart frontend
```

### Backup do Banco

```bash
# Criar backup
docker exec altcorp-wallet-db-prod pg_dump -U walletuser altcorp_wallet > backup_$(date +%Y%m%d).sql

# Restaurar backup
cat backup_20260124.sql | docker exec -i altcorp-wallet-db-prod psql -U walletuser -d altcorp_wallet
```

### Atualizar Aplicação

```bash
# 1. Fazer backup do banco
docker exec altcorp-wallet-db-prod pg_dump -U walletuser altcorp_wallet > backup_$(date +%Y%m%d).sql

# 2. Baixar nova versão (git pull ou novo tar.gz)
git pull  # Se usando git

# 3. Rebuild e restart
docker-compose -f docker-compose.prod.yml up -d --build

# 4. Verificar logs
docker-compose -f docker-compose.prod.yml logs -f
```

---

## 🐛 Troubleshooting

### Problema: CORS Error no Frontend

**Sintoma:** Console mostra `Access to XMLHttpRequest blocked by CORS`

**Solução:**
```bash
# 1. Verificar variável ALLOWED_ORIGINS no .env
cat .env | grep ALLOWED_ORIGINS

# Deve ser:
ALLOWED_ORIGINS=https://wallet.altcorphub.com,https://www.wallet.altcorphub.com

# 2. Restart backend
docker-compose -f docker-compose.prod.yml restart backend

# 3. Limpar cache do navegador
# Ctrl+Shift+Del → Limpar cache
```

### Problema: API retorna 502 Bad Gateway

**Sintoma:** Frontend carrega, mas API não responde

**Solução:**
```bash
# 1. Verificar se backend está rodando
docker-compose -f docker-compose.prod.yml ps backend

# 2. Ver logs do backend
docker-compose -f docker-compose.prod.yml logs backend

# 3. Verificar conexão com banco
docker exec altcorp-wallet-backend-prod env | grep DATABASE_URL

# 4. Restart backend
docker-compose -f docker-compose.prod.yml restart backend
```

### Problema: Certificado SSL inválido

**Sintoma:** Navegador mostra "Não seguro" ou erro de certificado

**Solução:**
```bash
# 1. Verificar certificados
ls -la ssl/

# Deve ter:
# fullchain.pem
# privkey.pem

# 2. Verificar permissões
chmod 644 ssl/*.pem

# 3. Verificar validade
openssl x509 -in ssl/fullchain.pem -text -noout | grep "Not After"

# 4. Se expirado, renovar
sudo certbot renew
cp /etc/letsencrypt/live/wallet.altcorphub.com/*.pem ssl/
docker-compose -f docker-compose.prod.yml restart frontend
```

### Problema: Banco de dados não conecta

**Sintoma:** Backend mostra erro de conexão com PostgreSQL

**Solução:**
```bash
# 1. Verificar se banco está rodando
docker-compose -f docker-compose.prod.yml ps database

# 2. Verificar health check
docker inspect altcorp-wallet-db-prod | grep Health -A 10

# 3. Testar conexão manual
docker exec -it altcorp-wallet-db-prod psql -U walletuser -d altcorp_wallet

# 4. Verificar credenciais no .env
cat .env | grep POSTGRES

# 5. Verificar credenciais no backend
docker exec altcorp-wallet-backend-prod env | grep DATABASE_URL

# 6. Se credenciais estão erradas, corrigir .env e restart
nano .env
docker-compose -f docker-compose.prod.yml restart backend
```

### Problema: Frontend não atualiza após build

**Sintoma:** Mudanças no código não aparecem

**Solução:**
```bash
# 1. Rebuild forçado
docker-compose -f docker-compose.prod.yml build --no-cache frontend

# 2. Restart
docker-compose -f docker-compose.prod.yml up -d frontend

# 3. Limpar cache do navegador
# Ctrl+Shift+Del

# 4. Testar em aba anônima
# Ctrl+Shift+N (Chrome) ou Ctrl+Shift+P (Firefox)
```

---

## 📊 Monitoramento

### Verificar Uso de Recursos

```bash
# CPU e Memória dos containers
docker stats

# Espaço em disco
df -h

# Tamanho do volume do banco
docker system df -v | grep altcorp-wallet
```

### Logs de Acesso do Nginx

```bash
# Acessar container do frontend
docker exec -it altcorp-wallet-frontend-prod sh

# Ver logs de acesso
tail -f /var/log/nginx/access.log

# Ver logs de erro
tail -f /var/log/nginx/error.log
```

---

## 🎯 Resumo Rápido

### Desenvolvimento
```bash
cp .env.development .env
docker-compose up -d --build
# Acesse: http://localhost
```

### Produção (Deploy Completo)
```bash
# No servidor
cp .env.production .env
nano .env  # Alterar POSTGRES_PASSWORD e SECRET_KEY
docker-compose -f docker-compose.prod.yml up -d --build
# Acesse: https://wallet.altcorphub.com
```

---

## 📞 Suporte

Se precisar de ajuda:

1. Verificar logs: `docker-compose logs -f`
2. Consultar esta documentação
3. Verificar issues no GitHub
4. Contatar equipe de desenvolvimento

---

**Data:** 24 de Janeiro de 2026  
**Versão:** 1.0.0  
**Status:** ✅ Produção Ready
