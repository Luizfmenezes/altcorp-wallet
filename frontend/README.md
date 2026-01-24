# Configuração do Frontend - AltCorp Wallet

## 🚀 Ambientes

Este projeto está configurado para funcionar em diferentes ambientes de forma automática:

### 🔧 Desenvolvimento Local (sem Docker)
Quando você roda `npm run dev` ou `bun dev` **fora do Docker**, o sistema:
- **API URL**: `/api/v1` (será redirecionado pelo proxy do Vite para `http://localhost:8000`)
- **Proxy**: Vite redireciona automaticamente `/api/v1` → `http://localhost:8000/api/v1`
- **Logs**: Habilitados no console
- **Hot Reload**: Ativado

**Como rodar localmente:**
```bash
# 1. Certifique-se de que o backend está rodando em http://localhost:8000
cd backend
python -m uvicorn main:app --reload

# 2. Em outro terminal, rode o frontend
cd frontend
npm run dev
# ou: bun dev

# 3. Acesse: http://localhost:8080
```

### 🐳 Desenvolvimento com Docker
Quando você usa `docker-compose up`, o sistema funciona de forma integrada:
- **Frontend**: Conteinerizado com Nginx na porta 8080
- **Backend**: Conteinerizado com FastAPI (interno ao Docker)
- **API URL**: `/api/v1` (relativo)
- **Proxy**: Configurado via `nginx.conf`

**Como rodar com Docker:**
```bash
# Rebuild e restart dos containers
docker-compose up -d --build

# Verificar logs
docker-compose logs -f frontend
docker-compose logs -f backend

# Acesse: http://localhost:8080
```

### 🏭 Produção (HTTPS)
Quando você faz o build com `npm run build` ou `bun build`, o sistema usa `.env.production`:
- **API URL**: `/api/v1` (caminho relativo)
- **Logs**: Desabilitados para segurança
- **Otimizado**: Build minificado

## 📝 Como funciona

### Desenvolvimento Local (sem Docker)
O arquivo `vite.config.ts` contém um **proxy configurado**:
```typescript
proxy: {
  '/api/v1': {
    target: 'http://localhost:8000',
    changeOrigin: true,
  }
}
```

Isso significa que:
- Frontend roda em `http://localhost:8080`
- Requisições para `/api/v1` são redirecionadas para `http://localhost:8000/api/v1`
- Sem problemas de CORS!

### Docker / Produção (HTTPS)
Em produção, o sistema usa **caminhos relativos** (`/api/v1`), o que significa:
- ✅ Se o frontend está em `https://seudominio.com`
- ✅ A API deve estar acessível em `https://seudominio.com/api/v1`
- ✅ Isso funciona perfeitamente com Nginx Proxy Manager ou reverse proxy

**Configuração típica do Nginx:**
```nginx
# Frontend
location / {
    proxy_pass http://frontend:80;
}

# Backend API
location /api/v1 {
    proxy_pass http://backend:8000/api/v1;
}
```

## 🔐 Variáveis de Ambiente

### `.env.development` (para desenvolvimento)
```env
VITE_API_URL=http://localhost:8000/api/v1
```

### `.env.production` (para produção)
```env
VITE_API_URL=/api/v1
```

### `.env.example` (template)
Copie este arquivo e renomeie para `.env.development` ou `.env.production` conforme necessário.

## ⚠️ Importante

1. **Nunca commite arquivos `.env` com credenciais** - eles estão no `.gitignore`
2. **Os arquivos `.env.development` e `.env.production` são commitados** porque contêm apenas configurações padrão
3. **Em produção, certifique-se de que o proxy está configurado corretamente**

## 🐛 Troubleshooting

### Erro: "Network Error" ou "ERR_CONNECTION_REFUSED"

**Em desenvolvimento:**
- Verifique se o backend está rodando: `http://localhost:8000/docs`
- Verifique o arquivo `.env.development`

**Em produção:**
- Verifique se o Nginx/proxy está redirecionando `/api/v1` para o backend
- Verifique os logs do container backend
- Teste diretamente: `curl https://seudominio.com/api/v1/docs`

### Erro: CORS

Se você estiver tendo problemas de CORS:
1. Verifique as configurações de CORS no backend (`backend/app/core/config.py`)
2. Certifique-se de que o domínio do frontend está na lista de origens permitidas

## 📦 Build para Produção

```bash
# Instalar dependências
npm install
# ou
bun install

# Build otimizado
npm run build
# ou
bun run build

# A pasta 'dist' conterá os arquivos prontos para deploy
```

## 🐳 Docker

O Dockerfile já está configurado para usar as variáveis de ambiente corretas:

```bash
# Build com URL customizada (opcional)
docker build --build-arg VITE_API_URL=/api/v1 -t altcorp-wallet-frontend .

# Ou use o docker-compose.yml que já está configurado
docker-compose up -d
```

## 🔍 Verificação

Para verificar qual URL a API está usando, abra o console do navegador em **modo desenvolvimento**:
- Você verá: `API Base URL: http://localhost:8000/api/v1`
- Em produção, essa mensagem NÃO aparecerá (segurança)
