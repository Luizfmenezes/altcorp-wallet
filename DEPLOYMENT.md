# 🚀 Guia de Deployment - AltCorp Wallet

## 📋 Pré-requisitos

- Docker Engine 20.10+
- Docker Compose 2.0+
- 2GB RAM mínimo
- 10GB espaço em disco

## ⚙️ Configuração Inicial

### 1. Clone o repositório
```bash
git clone <seu-repositorio>
cd altcorp-wallet
```

### 2. Configure as variáveis de ambiente
```bash
cp .env.example .env
```

Edite o arquivo `.env` e configure:

**OBRIGATÓRIO ALTERAR:**
- `POSTGRES_PASSWORD`: Senha forte para o banco de dados
- `SECRET_KEY`: Chave secreta para JWT (mínimo 32 caracteres)
- `ALLOWED_ORIGINS`: Domínios permitidos (ex: https://seudominio.com)

**Gerar SECRET_KEY:**
```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

### 3. Inicie os containers
```bash
# Build e start
docker-compose up -d --build

# Verificar logs
docker-compose logs -f
```

### 4. Criar primeiro usuário admin
```bash
docker exec -it altcorp-wallet-backend python -c "
from app.database.session import SessionLocal
from app.database.models import User, UserRole
from app.core.security import get_password_hash

db = SessionLocal()
admin = User(
    username='admin',
    name='Administrador',
    hashed_password=get_password_hash('SENHA_SEGURA_AQUI'),
    role=UserRole.ADMIN,
    is_active=True,
    onboarding_completed=True
)
db.add(admin)
db.commit()
print('Admin criado com sucesso!')
"
```

## 🔒 Segurança em Produção

### Checklist de Segurança

- [ ] `DEBUG=False` no `.env`
- [ ] Senha forte do PostgreSQL
- [ ] SECRET_KEY único e aleatório (32+ caracteres)
- [ ] ALLOWED_ORIGINS configurado com seu domínio
- [ ] Firewall configurado (apenas portas 80/443)
- [ ] SSL/TLS configurado (HTTPS)
- [ ] Backups automáticos do banco de dados

### Configurar HTTPS com Nginx/Caddy

Recomendado usar um reverse proxy (Nginx ou Caddy) na frente da aplicação para:
- Terminar SSL/TLS
- Rate limiting
- Proteção DDoS básica

## 📊 Monitoramento

### Ver logs
```bash
# Todos os containers
docker-compose logs -f

# Apenas backend
docker-compose logs -f backend

# Apenas database
docker-compose logs -f database
```

### Status dos containers
```bash
docker-compose ps
```

### Uso de recursos
```bash
docker stats
```

## 🔄 Atualização

```bash
# Pull das mudanças
git pull

# Rebuild e restart
docker-compose down
docker-compose up -d --build

# Verificar logs
docker-compose logs -f backend
```

## 💾 Backup

### Backup do banco de dados
```bash
docker exec altcorp-wallet-db pg_dump -U walletuser altcorp_wallet > backup_$(date +%Y%m%d_%H%M%S).sql
```

### Restaurar backup
```bash
docker exec -i altcorp-wallet-db psql -U walletuser altcorp_wallet < backup_YYYYMMDD_HHMMSS.sql
```

## 🐛 Troubleshooting

### Backend não inicia
```bash
docker-compose logs backend
# Verifique: DATABASE_URL, SECRET_KEY, ALLOWED_ORIGINS
```

### Erro de CORS
- Verifique `ALLOWED_ORIGINS` no `.env`
- Deve incluir o domínio completo com protocolo

### Banco de dados não conecta
- Verifique se o container do banco está rodando: `docker-compose ps`
- Verifique senha no `.env`

## 📞 Suporte

Para problemas, verifique os logs com `docker-compose logs -f`

## 🔐 Primeiro Acesso

1. Acesse: `http://seu-dominio`
2. Faça login com as credenciais do admin criado
3. Vá em "Gerenciamento de Usuários"
4. Crie sua conta pessoal com role "Admin"
5. Faça logout e entre com sua nova conta
6. Delete o usuário admin temporário
